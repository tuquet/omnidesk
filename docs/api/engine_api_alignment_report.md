# Omni Engine: UI to API Alignment Matrix

Bảng dưới đây quy hoạch chi tiết sự liên kết giữa các màn hình giao diện (UI Routes) của **Omni Engine** với các hành động của người dùng (Actions) và các API Endpoints tương ứng chịu trách nhiệm xử lý logic. 

> **Lưu ý vai trò**: Omni Engine (Port 1423) đóng vai trò là Commander/Orchestrator, không chứa UI định nghĩa Workflow hay Lên lịch, mà chỉ dùng để giám sát và cấu hình runtime.

| Màn hình (Route URL) | Thành phần UI / Feature | Hành động (Action) | API Endpoint tương ứng | App xử lý API (Port) |
| :--- | :--- | :--- | :--- | :--- |
| **`/`**<br/>*(Dashboard)* | **Tab: Quick Run** | Dropdown chọn Workflow | `GET /api/automa/workflows` | Studio (1422) |
| | | Dropdown chọn Profile | `GET /api/browser-profiles` | Profile (1421) |
| | | Bấm nút "Run Workflow Now" | `POST /api/engine/runs` | Engine (1423) |
| | **Tab: Monitor** | Thống kê số lượng Jobs | `GET /api/engine/runs` | Engine (1423) |
| | | Lấy danh sách Recent Runs | `GET /api/engine/runs` | Engine (1423) |
| | | Auto-refresh 10s | `GET /api/engine/runs` | Engine (1423) |
| **`/system-logs`**<br/>*(System Logs)* | **Log Terminal Viewer** | Stream Real-time Events | Tauri Event: `log://log` | (Tauri IPC) |
| | | Lấy lịch sử log từ Database | `GET /api/engine/logs` | Engine (1423) |
| | | Clear UI logs | Tích hợp trong logic Frontend | Frontend |
| **`/settings`**<br/>*(Engine Settings)* | **Cloud Sync Config** | Lưu thông tin Supabase (URL, Key) | Tauri Store (`plugin:store`) | (Tauri IPC) |
| | | Lấy trạng thái Sync Queue | *Cần bổ sung API:* `GET /api/engine/sync/status` | Engine (1423) |
| | | Nút "Force Sync Now" | *Cần bổ sung API:* `POST /api/engine/sync/force` | Engine (1423) |
| | **Hardware Config** | Lưu cấu hình Max Concurrency & Polling | Tauri Store (`plugin:store`) | (Tauri IPC) |

---

### Phân tích Backend Gap (Engine)
1. **API Cloud Sync Status & Action**: Hiện tại trên giao diện `/settings` của Engine có hiển thị Queue Status (số lượng item pending) và nút "Force Sync". Tuy nhiên, Backend của Engine chưa có module API `sync.rs` để cung cấp thông tin này ra cho UI. Frontend đang tạm thời dùng dữ liệu Mock. Cần xây dựng Router `/api/engine/sync/*`.
2. **System Logs API**: Engine backend đã có `GET /api/engine/logs` nhưng cần đảm bảo luồng đẩy dữ liệu real-time thông qua Tauri Event `log://log` hoạt động trơn tru từ hệ thống logger của Rust.
