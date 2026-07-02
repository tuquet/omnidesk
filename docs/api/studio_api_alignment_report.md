# Omni Studio: UI to API Alignment Matrix

Bảng dưới đây quy hoạch chi tiết sự liên kết giữa các màn hình giao diện (UI Routes) của **Omni Studio** với các hành động của người dùng (Actions) và các API Endpoints tương ứng chịu trách nhiệm xử lý logic.

| Màn hình (Route URL) | Thành phần UI / Feature | Hành động (Action) | API Endpoint tương ứng | App xử lý API (Port) |
| :--- | :--- | :--- | :--- | :--- |
| **`/`**<br/>*(My Workflows)* | **Workflow List**<br/>(Bảng bên phải) | Lấy danh sách workflow | `GET /api/automa/workflows` | Studio (1422) |
| | | Tạo mới workflow | `POST /api/automa/workflows` | Studio (1422) |
| | | Cập nhật tên/mô tả workflow | `PUT /api/automa/workflows/:id` | Studio (1422) |
| | | Xóa workflow | `DELETE /api/automa/workflows/:id` | Studio (1422) |
| | | Export workflow | Tích hợp trong logic Frontend | Frontend |
| | **Folder Panel**<br/>(Cột bên trái) | Lấy danh sách thư mục | `GET /api/automa/folders` | Studio (1422) |
| | | Tạo thư mục mới | `POST /api/automa/folders` | Studio (1422) |
| | | Đổi tên thư mục | `PUT /api/automa/folders/:id` | Studio (1422) |
| | | Xóa thư mục | `DELETE /api/automa/folders/:id` | Studio (1422) |
| | | Chuyển WF vào Folder | `PUT /api/automa/workflows/:id` (cập nhật `folder_id`) | Studio (1422) |
| **`/schedules`**<br/>*(Schedules)* | **Schedules Table** | Lấy danh sách lịch chạy | `GET /api/automa/schedules` | Studio (1422) |
| | | Bật/tắt lịch chạy (Toggle) | `POST /api/automa/schedules/:id/toggle` | Studio (1422) |
| | | Xóa lịch chạy | `DELETE /api/automa/schedules/:id` | Studio (1422) |
| | **Tạo/Sửa Schedule Modal** | Lưu lịch chạy mới (chứa Cron) | `POST /api/automa/schedules` | Studio (1422) |
| | | Cập nhật lịch chạy hiện tại | `PUT /api/automa/schedules/:id` | Studio (1422) |
| | | Dropdown chọn Workflow | `GET /api/automa/workflows` | Studio (1422) |
| | | Dropdown chọn Profile | `GET /api/browser-profiles` | Profile (1421) |
| **`/active-runs`**<br/>*(Active Runs)* | **Monitoring Table** | Lấy danh sách job ĐANG CHẠY | `GET /api/engine/runs` (Lọc status: RUNNING) | Engine (1423) |
| | | Auto-refresh (Ping liên tục 5s) | `GET /api/engine/runs` | Engine (1423) |
| | | Hủy/Dừng tiến trình (Stop) | *Cần bổ sung API:* `POST /api/engine/runs/:id/stop` | Engine (1423) |
| **`/history`**<br/>*(Run History)* | **History Table** | Lấy lịch sử (COMPLETED, FAILED) | `GET /api/engine/runs` (Lọc & Sort theo thời gian) | Engine (1423) |
| | | Xem Log chi tiết của 1 Run | `GET /api/engine/logs?run_id=:id` | Engine (1423) |
| **`App Shell`**<br/>*(Sidebar)* | **Engine Status Indicator** | Ping kiểm tra kết nối với Engine | `GET /api/engine/runs` (Dùng như Healthcheck) | Engine (1423) |

---

### Phân tích Backend Gap (Dựa trên bảng trên)
Đối với **Omni Studio**, các tính năng UI đã được phủ tương đối tốt bởi API, tuy nhiên vẫn còn một vài endpoint (hoặc logic filter) cần bổ sung bên phía Engine để tối ưu hóa thay vì xử lý toàn bộ trên Frontend:

1. **API Dừng tiến trình (`Stop Run`)**: Hiện tại giao diện Active Runs có nút "Stop" nhưng Engine Backend (1423) chưa có handler để bắt tín hiệu force-kill một background worker đang chạy.
2. **API Filter Runs theo Status**: Giao diện Active Runs và Run History đang gọi chung endpoint `GET /api/engine/runs` để lấy tất cả về rồi lọc bằng mảng array trên JavaScript. Backend Engine nên hỗ trợ param `?status=running` để giảm tải băng thông.
