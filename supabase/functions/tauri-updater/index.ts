function gt(latest: string, current: string) {
  const l = latest.replace(/[^0-9.]/g, '').split('.').map(Number);
  const c = current.replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const vL = l[i] || 0;
    const vC = c[i] || 0;
    if (vL > vC) return true;
    if (vL < vC) return false;
  }
  return false;
}

const GITHUB_REPO = "tuquet/omnidesk";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, user-agent, x-tauri-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Parse User-Agent (e.g., "omni-engine/0.1.0 (windows/x86_64)")
    // or sometimes Tauri sends specific headers in v2, but User-Agent is standard
    const userAgent = req.headers.get("user-agent") || "";
    
    // Fallback headers Tauri might use (x-tauri-version etc)
    // We'll rely on User-Agent matching: "<app-name>/<version> (<os>/<arch>)"
    const match = userAgent.match(/^([a-z0-9\-]+)\/([0-9\.]+)/i);
    
    if (!match) {
      console.error("Invalid or missing User-Agent:", userAgent);
      return new Response(
        JSON.stringify({ error: "Invalid or missing User-Agent format." }), 
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const appName = match[1]; // e.g. "omni-engine"
    const currentVersion = match[2]; // e.g. "0.1.0"

    console.log(`Checking updates for App: ${appName}, Current Version: ${currentVersion}`);

    // 3. Fetch Releases from GitHub
    // Need a Personal Access Token (GITHUB_TOKEN) if repo is private, 
    // but if it's public we don't strictly need it. Adding it prevents rate limits.
    const ghToken = Deno.env.get("GITHUB_TOKEN");
    const headers: HeadersInit = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Supabase-Tauri-Updater",
    };
    if (ghToken) {
      headers["Authorization"] = `Bearer ${ghToken}`;
    }

    const response = await fetch(GITHUB_API_URL, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
    }

    const releases = await response.json();

    // 4. Find the latest release matching the app's tag (e.g., @omnidesk/omni-engine@...)
    const prefix = `@omnidesk/${appName}@`;
    
    const latestRelease = releases.find((r: any) => 
      r.tag_name.startsWith(prefix) && !r.draft && !r.prerelease
    );

    if (!latestRelease) {
      console.log(`No releases found matching prefix: ${prefix}`);
      // Tauri updater expects 204 No Content when there's no update
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const latestVersion = latestRelease.tag_name.replace(prefix, ""); // Extract "0.1.0"
    
    // 5. Compare Semver
    let hasUpdate = false;
    try {
      hasUpdate = gt(latestVersion, currentVersion);
    } catch (e) {
      console.error("Error parsing semver:", e);
      // fallback basic string comparison if semver fails
      hasUpdate = latestVersion !== currentVersion;
    }

    if (!hasUpdate) {
      console.log(`App is up to date (Current: ${currentVersion}, Latest: ${latestVersion})`);
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 6. Find `latest.json` asset inside this release
    const latestJsonAsset = latestRelease.assets.find((a: any) => a.name === "latest.json");
    if (!latestJsonAsset) {
      console.error(`Release ${latestRelease.tag_name} does not have a latest.json asset`);
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    console.log(`Update available! Redirecting to: ${latestJsonAsset.browser_download_url}`);

    // 7. Fetch the JSON and return it, OR redirect. 
    // Redirecting is safest since the Tauri client will fetch the JSON from GitHub directly.
    return new Response(null, { 
      status: 302, 
      headers: { 
        ...corsHeaders,
        "Location": latestJsonAsset.browser_download_url 
      } 
    });

  } catch (error: any) {
    console.error("Updater Server Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
  }
});
