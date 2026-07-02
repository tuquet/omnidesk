pub mod constants;
pub mod system;
pub mod window;
pub mod hardware;
pub mod network;
pub mod fs;

pub fn generate_handlers() -> impl Fn(tauri::ipc::Invoke) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        system::open_app_folder,
        system::open_folder,
        system::get_app_version,
        window::toggle_always_on_top,
        window::flash_taskbar,
        hardware::get_hardware_usage,
        network::check_real_network,
        fs::reveal_in_explorer
    ]
}
