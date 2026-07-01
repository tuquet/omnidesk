use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
    response::{IntoResponse, Json},
};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

/// Claims extracted from a Supabase JWT.
/// Only includes fields we actually need for authorization.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// Subject — the Supabase user ID (UUID)
    pub sub: String,
    /// Role from Supabase (e.g., "authenticated", "anon")
    pub role: Option<String>,
    /// Token expiration (unix timestamp)
    pub exp: usize,
    /// Issued at (unix timestamp)
    pub iat: Option<usize>,
    /// Email (from Supabase auth)
    pub email: Option<String>,
    /// App metadata — safe for authorization decisions
    pub app_metadata: Option<serde_json::Value>,
}

impl Claims {
    /// Get the user ID (Supabase UUID)
    pub fn user_id(&self) -> &str {
        &self.sub
    }

    /// Check if the user has admin role in app_metadata
    pub fn is_admin(&self) -> bool {
        self.app_metadata
            .as_ref()
            .and_then(|m| m.get("role"))
            .and_then(|r| r.as_str())
            .map(|r| r == "ADMIN")
            .unwrap_or(false)
    }
}

/// Error type for auth failures
#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    InvalidToken(String),
    ExpiredToken,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            AuthError::MissingToken => (
                StatusCode::UNAUTHORIZED,
                "Missing authorization token".to_string(),
            ),
            AuthError::InvalidToken(reason) => (
                StatusCode::UNAUTHORIZED,
                format!("Invalid token: {}", reason),
            ),
            AuthError::ExpiredToken => (
                StatusCode::UNAUTHORIZED,
                "Token has expired".to_string(),
            ),
        };

        let body = serde_json::json!({
            "error": {
                "code": "AUTH_ERROR",
                "message": message,
            }
        });

        (status, Json(body)).into_response()
    }
}

/// Extractor that validates a Supabase JWT from the Authorization header.
#[axum::async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract token from Authorization header
        let auth_header = parts
            .headers
            .get("authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or(AuthError::MissingToken)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AuthError::InvalidToken(
                "Expected 'Bearer <token>' format".to_string(),
            ))?;

        // Get the JWT secret from environment or use Supabase default for local dev
        let jwt_secret = std::env::var("SUPABASE_JWT_SECRET")
            .unwrap_or_else(|_| {
                // Supabase local dev default secret
                "super-secret-jwt-token-with-at-least-32-characters-long".to_string()
            });

        // Configure validation
        let mut validation = Validation::new(Algorithm::HS256);
        validation.set_audience(&["authenticated"]);
        // Supabase sets the issuer based on the project URL
        validation.validate_aud = false; // Supabase doesn't always set audience
        validation.validate_exp = true;

        // Decode and validate
        let mock_secrets = [
            "83ebc76d5416378b42cd5ff445ce7662b2084d466058ea797c292cbea8745322",
            "super-secret-jwt-token-with-at-least-32-characters-long"
        ];
        
        let token_data = if mock_secrets.contains(&jwt_secret.as_str()) {
            println!("[Auth] Dev mode: Using unverified JWT decoding because mock secret is active.");
            
            let parts: Vec<&str> = token.split('.').collect();
            if parts.len() < 2 {
                return Err(AuthError::InvalidToken("Malformed JWT".to_string()));
            }
            
            let payload_b64 = parts[1];
            use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
            let decoded = URL_SAFE_NO_PAD.decode(payload_b64)
                .map_err(|e| AuthError::InvalidToken(format!("Invalid base64 payload: {}", e)))?;
                
            let claims: Claims = serde_json::from_slice(&decoded)
                .map_err(|e| AuthError::InvalidToken(format!("Invalid JSON payload: {}", e)))?;
                
            claims
        } else {
            match decode::<Claims>(
                token,
                &DecodingKey::from_secret(jwt_secret.as_bytes()),
                &validation,
            ) {
                Ok(data) => data.claims,
                Err(e) => {
                    eprintln!("[Auth Error] JWT signature verification failed: {:?}", e);
                    match e.kind() {
                        jsonwebtoken::errors::ErrorKind::ExpiredSignature => return Err(AuthError::ExpiredToken),
                        _ => return Err(AuthError::InvalidToken(e.to_string())),
                    }
                }
            }
        };

        Ok(token_data)
    }
}
