import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Helper: Tạo Supabase client với Service Role (bypass RLS) */
function createServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

/** Helper: Tạo Supabase client từ JWT token của user (respect RLS) */
function createUserClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: authHeader } },
    }
  );
}

/** Helper: Lấy user từ Authorization header */
async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { user: null, client: null };

  const client = createUserClient(authHeader);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) return { user: null, client: null };
  return { user, client };
}

/** Helper: Parse pathname bỏ prefix function */
function getPath(url: URL): string {
  // Edge Function nhận URL dạng: /automa-api/me/workflows/host
  // Cần lấy: /me/workflows/host
  const fullPath = url.pathname;
  const funcPrefix = "/automa-api";
  return fullPath.startsWith(funcPrefix)
    ? fullPath.substring(funcPrefix.length) || "/"
    : fullPath;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = getPath(url);

    // ═══════════════════════════════════════════════════════
    // GET /me — Trả profile user
    // ═══════════════════════════════════════════════════════
    if (req.method === "GET" && path === "/me") {
      const { user } = await getUser(req);
      if (!user) {
        return jsonResponse({ message: "Unauthorized" }, 401);
      }

      // Lấy thêm profile từ bảng profiles (nếu có)
      const serviceClient = createServiceClient();
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("display_name, avatar_url, role")
        .eq("id", user.id)
        .single();

      return jsonResponse({
        id: user.id,
        email: user.email,
        username: profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0],
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        teams: [], // Phase 3 sẽ bổ sung
      });
    }

    // ═══════════════════════════════════════════════════════
    // GET /me/refresh-auth-session — Refresh JWT
    // ═══════════════════════════════════════════════════════
    if (req.method === "GET" && path === "/me/refresh-auth-session") {
      const refreshToken = url.searchParams.get("token");
      if (!refreshToken) {
        return jsonResponse({ message: "Missing refresh token" }, 400);
      }

      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );

      const { data, error } = await anonClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        return jsonResponse({ message: error?.message || "Refresh failed" }, 401);
      }

      return jsonResponse({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.session.user,
      });
    }

    // ═══════════════════════════════════════════════════════
    // POST /me/workflows/host — Publisher đẩy workflow lên
    // ═══════════════════════════════════════════════════════
    if (req.method === "POST" && path === "/me/workflows/host") {
      const { user } = await getUser(req);
      if (!user) {
        return jsonResponse({ message: "Unauthorized" }, 401);
      }

      const body = await req.json();
      const serviceClient = createServiceClient();

      // Kiểm tra nếu workflow đã host rồi → update
      if (body.hostId) {
        const { data: existing } = await serviceClient
          .from("hosted_workflows")
          .select("id")
          .eq("host_id", body.hostId)
          .eq("user_id", user.id)
          .single();

        if (existing) {
          // Update workflow đã tồn tại
          const { error } = await serviceClient
            .from("hosted_workflows")
            .update({
              name: body.name || "Untitled",
              description: body.description || "",
              drawflow: body.drawflow || {},
              table_data: body.table || [],
              global_data: body.globalData || {},
              settings: body.settings || {},
              version: body.version || "1",
            })
            .eq("id", existing.id);

          if (error) {
            return jsonResponse({ message: error.message }, 500);
          }

          return jsonResponse({ hostId: body.hostId });
        }
      }

      // Tạo mới hosted workflow
      const { data: inserted, error } = await serviceClient
        .from("hosted_workflows")
        .insert({
          user_id: user.id,
          name: body.name || "Untitled",
          description: body.description || "",
          drawflow: body.drawflow || {},
          table_data: body.table || [],
          global_data: body.globalData || {},
          settings: body.settings || {},
          version: body.version || "1",
        })
        .select("host_id")
        .single();

      if (error) {
        return jsonResponse({ message: error.message }, 500);
      }

      return jsonResponse({ hostId: inserted.host_id });
    }

    // ═══════════════════════════════════════════════════════
    // DELETE /me/workflows?id=X&type=host — Xoá hosted workflow
    // ═══════════════════════════════════════════════════════
    if (req.method === "DELETE" && path === "/me/workflows") {
      const { user } = await getUser(req);
      if (!user) {
        return jsonResponse({ message: "Unauthorized" }, 401);
      }

      const workflowId = url.searchParams.get("id");
      const type = url.searchParams.get("type");

      if (type === "host" && workflowId) {
        const serviceClient = createServiceClient();
        const { error } = await serviceClient
          .from("hosted_workflows")
          .delete()
          .eq("host_id", workflowId)
          .eq("user_id", user.id);

        if (error) {
          return jsonResponse({ message: error.message }, 500);
        }

        return jsonResponse({ message: "Deleted" });
      }

      return jsonResponse({ message: "Missing id or type param" }, 400);
    }

    // ═══════════════════════════════════════════════════════
    // POST /workflows/hosted — Consumer fetch workflow(s)
    // ═══════════════════════════════════════════════════════
    if (req.method === "POST" && path === "/workflows/hosted") {
      const body = await req.json();
      const serviceClient = createServiceClient();

      // Case 1: Fetch 1 workflow bằng hostId
      if (body.hostId) {
        const hostIdStr = typeof body.hostId === "string" ? body.hostId.trim() : String(body.hostId);

        // Thử tìm trong DB trước
        const { data: dbWorkflow } = await serviceClient
          .from("hosted_workflows")
          .select("*")
          .eq("host_id", hostIdStr)
          .single();

        if (dbWorkflow) {
          return jsonResponse({
            hostId: dbWorkflow.host_id,
            name: dbWorkflow.name,
            description: dbWorkflow.description,
            drawflow: dbWorkflow.drawflow,
            table: dbWorkflow.table_data,
            globalData: dbWorkflow.global_data,
            settings: dbWorkflow.settings,
            version: dbWorkflow.version,
            createdAt: dbWorkflow.created_at,
            updatedAt: dbWorkflow.updated_at,
          });
        }

        // Fallback: Tìm trong Storage (tương thích ngược với cơ chế S3 cũ)
        const anonClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );
        const { data: fileData, error: fileError } = await anonClient.storage
          .from("automa-workflows")
          .download(hostIdStr);

        if (fileError || !fileData) {
          return jsonResponse(
            { message: "Workflow not found" },
            404
          );
        }

        const workflowJson = JSON.parse(await fileData.text());
        if (typeof workflowJson.drawflow === "string") {
          try { workflowJson.drawflow = JSON.parse(workflowJson.drawflow); } catch (_e) { /* ignore */ }
        }
        if (typeof workflowJson.globalData === "string") {
          try { workflowJson.globalData = JSON.parse(workflowJson.globalData); } catch (_e) { /* ignore */ }
        }

        return jsonResponse(workflowJson);
      }

      // Case 2: Batch refresh nhiều workflows (auto-sync)
      if (body.hosts && Array.isArray(body.hosts)) {
        const results = [];

        for (const item of body.hosts) {
          const hostIdStr = typeof item === "string" ? item : String(item.hostId || "");
          const fileName = hostIdStr.trim();

          // Thử DB trước
          const { data: dbWorkflow } = await serviceClient
            .from("hosted_workflows")
            .select("*")
            .eq("host_id", fileName)
            .single();

          if (dbWorkflow) {
            results.push({
              hostId: dbWorkflow.host_id,
              status: "updated",
              data: {
                hostId: dbWorkflow.host_id,
                name: dbWorkflow.name,
                description: dbWorkflow.description,
                drawflow: dbWorkflow.drawflow,
                table: dbWorkflow.table_data,
                globalData: dbWorkflow.global_data,
                settings: dbWorkflow.settings,
                version: dbWorkflow.version,
                updatedAt: dbWorkflow.updated_at,
              },
            });
            continue;
          }

          // Fallback Storage
          const anonClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
          );
          const { data: fileData, error: fileError } = await anonClient.storage
            .from("automa-workflows")
            .download(fileName);

          if (fileError || !fileData) {
            results.push({ hostId: hostIdStr, status: "deleted" });
          } else {
            const workflowJson = JSON.parse(await fileData.text());
            if (typeof workflowJson.drawflow === "string") {
              try { workflowJson.drawflow = JSON.parse(workflowJson.drawflow); } catch (_e) { /* ignore */ }
            }
            if (typeof workflowJson.globalData === "string") {
              try { workflowJson.globalData = JSON.parse(workflowJson.globalData); } catch (_e) { /* ignore */ }
            }
            results.push({ hostId: hostIdStr, status: "updated", data: workflowJson });
          }
        }

        return jsonResponse(results);
      }

      return jsonResponse({ message: "Missing hostId or hosts" }, 400);
    }

    // ═══════════════════════════════════════════════════════
    // GET /download-latest — Tải extension bản mới nhất
    // ═══════════════════════════════════════════════════════
    if (req.method === "GET" && path === "/download-latest") {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );

      const { data, error } = await anonClient.storage
        .from("automa-workflows")
        .list();

      if (error || !data) {
        return jsonResponse({ message: "Storage error" }, 500);
      }

      const zipFiles = data.filter(
        (f) => f.name.startsWith("automa-chrome-") && f.name.endsWith(".zip")
      );
      if (zipFiles.length === 0) {
        return jsonResponse({ message: "No versions found" }, 404);
      }

      zipFiles.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const latestFile = zipFiles[0].name;
      const { data: publicUrlData } = anonClient.storage
        .from("automa-workflows")
        .getPublicUrl(latestFile);

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: publicUrlData.publicUrl },
      });
    }

    // ═══════════════════════════════════════════════════════
    // Fallback — Catch-all
    // ═══════════════════════════════════════════════════════
    return jsonResponse({ message: "Automa API OK", path });

  } catch (e) {
    return jsonResponse({ message: e.message }, 500);
  }
});

/** Helper: JSON response with CORS */
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
