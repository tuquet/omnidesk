# API Reference

The Axum backend starts automatically when the Tauri desktop app runs. By default it listens on port **8080**.

## Endpoints

### `GET /health`

Returns the health status of the backend service.

**Response:**

```json
{
  "status": "ok",
  "service": "omnidesk-backend"
}
```

### `GET /ping`

Simple connectivity check.

**Response:**

```
pong
```

## OpenAPI Documentation

Interactive API documentation is available at:

```
http://localhost:8080/scalar
```

This is powered by [Scalar](https://github.com/scalar/scalar) and auto-generated from the Rust source using [utoipa](https://github.com/juhaku/utoipa).

## Adding New Endpoints

1. Define your handler in `apps/desktop/src-tauri/src/api/mod.rs`.
2. Add a `#[utoipa::path]` annotation for OpenAPI documentation.
3. Register the route in the `Router`.

```rust
#[utoipa::path(get, path = "/your-route", responses((status = 200, description = "OK")))]
async fn your_handler() -> impl IntoResponse {
    Json(serde_json::json!({ "message": "hello" }))
}
```
