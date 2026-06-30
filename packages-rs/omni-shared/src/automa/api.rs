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
    let html = r#"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Omni Extension Bridge</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f3f4f6;
            color: #1f2937;
        }
        .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            max-width: 400px;
        }
        h1 { margin-top: 0; font-size: 1.5rem; }
        p { color: #4b5563; margin-bottom: 1.5rem; }
        .loader {
            border: 3px solid #f3f3f3;
            border-radius: 50%;
            border-top: 3px solid #3b82f6;
            width: 24px;
            height: 24px;
            -webkit-animation: spin 1s linear infinite; /* Safari */
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Omni Extension Bridge</h1>
        <p>This page is used to trigger Omni Extension locally. You can close this tab if it doesn't close automatically.</p>
        <div class="loader"></div>
    </div>
    <script>
        // The extension intercepts this page via tabs.onUpdated.
        // If it reaches here and stays open, the extension might not be installed or enabled.
        setTimeout(() => {
            document.querySelector('p').innerHTML = 'It seems the Omni Extension is not responding.<br>Please ensure it is installed and enabled in this browser.';
            document.querySelector('.loader').style.display = 'none';
        }, 3000);
    </script>
</body>
</html>
"#;

    Html(html)
}
