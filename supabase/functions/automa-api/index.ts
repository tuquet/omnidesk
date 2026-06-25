import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Bỏ qua CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Móc bắt endpoint POST /workflows/hosted của Automa
    if (req.method === "POST" && url.pathname.endsWith("/workflows/hosted")) {
      const body = await req.json();

      // Khởi tạo Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Trường hợp 1: Fetch 1 workflow (Khi user add Hosted Workflow)
      if (body.hostId) {
        const fileName = body.hostId.trim();
        const { data, error } = await supabase.storage
          .from("automa-workflows")
          .download(fileName);

        if (error || !data) {
          return new Response(
            JSON.stringify({ message: "Workflow not found on Supabase Storage", data: error }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const workflowJson = JSON.parse(await data.text());
        return new Response(JSON.stringify(workflowJson), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Trường hợp 2: Refresh nhiều workflow (Khi Automa auto-sync)
      if (body.hosts && Array.isArray(body.hosts)) {
        const results = [];

        for (const hostId of body.hosts) {
          const fileName = hostId.trim();
          const { data, error } = await supabase.storage
            .from("automa-workflows")
            .download(fileName);

          if (error || !data) {
            results.push({ hostId, status: "deleted" });
          } else {
            const workflowJson = JSON.parse(await data.text());
            results.push({ hostId, status: "updated", data: workflowJson });
          }
        }

        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Các request khác trả về OK để Automa không báo lỗi
    return new Response(JSON.stringify({ message: "Automa Mock API OK" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
