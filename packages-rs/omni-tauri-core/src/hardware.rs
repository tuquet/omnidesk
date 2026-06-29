use sysinfo::{System, SystemExt, CpuExt};
use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref SYS: Mutex<System> = Mutex::new(System::new_all());
}

#[derive(serde::Serialize)]
pub struct HardwareUsage {
    pub cpu_percent: f32,
    pub used_memory_kb: u64,
    pub total_memory_kb: u64,
}

#[tauri::command]
pub fn get_hardware_usage() -> Result<HardwareUsage, String> {
    let mut sys = SYS.lock().map_err(|_| "Failed to lock system info".to_string())?;
    sys.refresh_cpu();
    sys.refresh_memory();
    
    let cpu_percent = sys.global_cpu_info().cpu_usage();
    let used_memory_kb = sys.used_memory();
    let total_memory_kb = sys.total_memory();
    
    Ok(HardwareUsage {
        cpu_percent,
        used_memory_kb,
        total_memory_kb,
    })
}
