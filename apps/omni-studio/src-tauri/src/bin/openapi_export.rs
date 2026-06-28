use omnidesk_lib::api::ApiDoc;
use utoipa::OpenApi;
use std::fs;

fn main() {
    let doc = ApiDoc::openapi();
    let json = doc.to_pretty_json().expect("Failed to serialize OpenAPI spec");
    let path = std::env::current_dir().unwrap().join("../../openapi.json");
    fs::write(&path, json).expect("Failed to write openapi.json");
    println!("Exported to {:?}", path);
}
