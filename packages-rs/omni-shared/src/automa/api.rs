use axum::response::{Html, IntoResponse};

/// A shared bridge endpoint for launching the Automa Extension.
/// The extension's background script intercepts this URL and connects back to the websocket
/// using the port from the URL.
#[utoipa::path(
    get,
    path = "/api/automa/bridge",
    responses(
        (status = 200, description = "Returns an HTML page that triggers the extension")
    ),
    params(
        ("run_id" = String, Query, description = "Run ID to execute"),
        ("profile_id" = Option<String>, Query, description = "Profile ID")
    ),
    tag = "automa"
)]
pub async fn bridge_html() -> impl IntoResponse {
    let extension_id = std::env::var("AUTOMA_EXTENSION_ID")
        .unwrap_or_else(|_| "ddnmmgebginepgdimcjpdgnefdbocjpl".to_string());
    
    // In Edge unpacked extensions use `extension://` instead of `chrome-extension://`
    let extension_scheme = std::env::var("AUTOMA_EXTENSION_SCHEME")
        .unwrap_or_else(|_| "chrome-extension".to_string());

    let html = format!(
        r#"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Omni Extension Bridge</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #0f172a;
            color: #f8fafc;
        }}
        .container {{
            text-align: center;
            padding: 2rem;
            background-color: #1e293b;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            max-width: 400px;
        }}
        h1 {{ margin-top: 0; color: #38bdf8; }}
        p {{ color: #cbd5e1; margin-bottom: 2rem; }}
        .loader {{
            border: 4px solid #334155;
            border-top: 4px solid #38bdf8;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }}
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Omni Extension Bridge</h1>
        <p>This page is used to trigger Omni Extension locally. You can close this tab if it doesn't close automatically.</p>
        <div class="loader"></div>
    </div>
    <script>
        const EXTENSION_ID = "{extension_id}";
        const EXTENSION_SCHEME = "{extension_scheme}";
        
        // Extract params
        const urlParams = new URLSearchParams(window.location.search);
        const runId = urlParams.get('run_id');
        const profileId = urlParams.get('profile_id');
        const port = window.location.port || '80';

        // Construct the Chrome extension bridge URL
        const extensionUrl = `${{EXTENSION_SCHEME}}://${{EXTENSION_ID}}/bridge.html?run_id=${{runId}}&profile_id=${{profileId}}&port=${{port}}`;

        // Redirect immediately
        window.location.href = extensionUrl;

        // Fallback message if redirect fails (e.g. extension not installed)
        setTimeout(() => {{
            document.querySelector('p').innerHTML = 'It seems the Omni Extension is not responding.<br>Please ensure it is installed and enabled in this browser.<br><br><i>Check AUTOMA_EXTENSION_ID if using Edge.</i>';
            document.querySelector('.loader').style.display = 'none';
        }}, 3000);
    </script>
</body>
</html>
"#,
        extension_id = extension_id,
        extension_scheme = extension_scheme
    );

    Html(html)
}
