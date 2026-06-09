pub mod issues;

use axum::Router;
use sqlx::SqlitePool;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use tokio::net::TcpListener;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
}

#[derive(OpenApi)]
#[openapi(
    paths(
        issues::list_issues,
        issues::create_issue,
    ),
    components(
        schemas(crate::models::issue::Issue, crate::models::issue::CreateIssueDto)
    ),
    tags(
        (name = "issues", description = "Bug Issues management API")
    )
)]
pub struct ApiDoc;

pub async fn serve(pool: SqlitePool, port: u16) {
    let state = AppState { db: pool };

    let app = Router::new()
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .nest("/api/issues", issues::router())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", port);
    let listener = match TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Failed to bind Axum server on port {}: {}", port, e);
            return;
        }
    };
    
    println!("API Server and Swagger UI running on http://{}/swagger-ui", addr);
    
    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("Axum server error: {}", e);
    }
}
