use sysinfo::System;
use std::sync::{Mutex, OnceLock};

static SYS: OnceLock<Mutex<System>> = OnceLock::new();

fn get_sys() -> &'static Mutex<System> {
    SYS.get_or_init(|| Mutex::new(System::new_all()))
}

#[derive(Clone, serde::Serialize)]
pub struct HardwareUsage {
    pub cpu_percent: f32,
    pub used_memory_kb: u64,
    pub total_memory_kb: u64,
}

#[tauri::command]
pub fn get_hardware_usage() -> Result<HardwareUsage, String> {
    let mut sys = get_sys().lock().map_err(|_| "Failed to lock system info".to_string())?;
    sys.refresh_cpu_all();
    sys.refresh_memory();
    
    let cpu_percent = sys.global_cpu_usage();
    let used_memory_kb = sys.used_memory();
    let total_memory_kb = sys.total_memory();
    
    Ok(HardwareUsage {
        cpu_percent,
        used_memory_kb,
        total_memory_kb,
    })
}

pub fn init_monitor(app: tauri::AppHandle) {
    use tauri::Emitter;
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_secs(2));
            if let Ok(mut sys) = get_sys().lock() {
                sys.refresh_cpu_all();
                sys.refresh_memory();
                
                let usage = HardwareUsage {
                    cpu_percent: sys.global_cpu_usage(),
                    used_memory_kb: sys.used_memory(),
                    total_memory_kb: sys.total_memory(),
                };
                
                let _ = app.emit("hardware_usage_update", usage);
            }
        }
    });
}
