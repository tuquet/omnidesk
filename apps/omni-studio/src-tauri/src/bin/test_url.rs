use sqlx::sqlite::SqliteConnectOptions;
use std::str::FromStr;

fn main() {
    let db_url = "sqlite://C:/Users/Admin/AppData/Local/com.omnidesk.dev/omnidesk.db?mode=rwc";
    println!("db_url: {}", db_url);

    match SqliteConnectOptions::from_str(db_url) {
        Ok(opts) => println!("Parsed OK: {:?}", opts),
        Err(e) => println!("Parsed Err: {}", e),
    }
}
