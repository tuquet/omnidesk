# Omni Profile: UI to API Alignment Matrix

Bảng dưới đây quy hoạch chi tiết sự liên kết giữa các màn hình giao diện (UI Routes) của **Omni Profile** với các hành động của người dùng (Actions) và các API Endpoints tương ứng chịu trách nhiệm xử lý logic.

> **Lưu ý vai trò**: Omni Profile (Port 1421) đóng vai trò là Guardian, độc lập quản lý vòng đời của các trình duyệt web (Chromium) cô lập (Fingerprint, Proxy, Cookie), không quan tâm đến workflow hay logic automation.

| Màn hình (Route URL) | Thành phần UI / Feature | Hành động (Action) | API Endpoint tương ứng | App xử lý API (Port) |
| :--- | :--- | :--- | :--- | :--- |
| **`/`**<br/>*(Browser Profiles)* | **Profiles Table** | Lấy danh sách profiles | `GET /api/browser-profiles` | Profile (1421) |
| | | Tạo mới profile | `POST /api/browser-profiles` | Profile (1421) |
| | | Sửa thông tin profile | `PUT /api/browser-profiles/:id` | Profile (1421) |
| | | Xóa profile | `DELETE /api/browser-profiles/:id` | Profile (1421) |
| | | Mở trình duyệt (Launch) | `POST /api/browser-profiles/:id/launch` | Profile (1421) |
| | | Tắt trình duyệt (Stop) | `POST /api/browser-profiles/:id/stop` | Profile (1421) |
| | | Tắt tất cả (Kill All) | `POST /api/browser-profiles/kill-all` | Profile (1421) |
| **`/proxies`**<br/>*(Proxies - Stub)* | **Proxies Table** | Lấy danh sách proxies | *Cần bổ sung API:* `GET /api/proxies` | Profile (1421) |
| | | Tạo/Sửa/Xóa proxy | *Cần bổ sung API:* `POST/PUT/DELETE /api/proxies` | Profile (1421) |
| **`/tags`**<br/>*(Tags - Stub)* | **Tags Table** | Lấy danh sách tags/groups | *Cần bổ sung API:* `GET /api/groups` | Profile (1421) |
| | | Tạo/Sửa/Xóa tag | *Cần bổ sung API:* `POST/PUT/DELETE /api/groups` | Profile (1421) |
| **`/settings`**<br/>*(Settings)* | **Browser Engine Config** | Lưu cấu hình đường dẫn Chromium | Tauri Store (`plugin:store`) hoặc Config DB | (Tauri IPC) |
| | **Storage Config** | Lưu đường dẫn thư mục chứa user-data | Tauri Store (`plugin:store`) hoặc Config DB | (Tauri IPC) |

---

### Phân tích Backend Gap (Profile)
1. **API Proxies & Tags/Groups**: Mặc dù cấu trúc cơ sở dữ liệu (Database Schema) đã có các bảng dành cho `proxies` và `groups` (nằm trong `packages-rs/omni-shared/src/db/migrations`), Backend của Omni Profile vẫn chưa cung cấp các endpoint API (như `/api/proxies` hay `/api/groups`) để Frontend có thể thực hiện CRUD. Cần bổ sung các handler này trước khi triển khai UI Tier 2 cho Profile (như đã quy hoạch là sẽ làm sau).
2. **Cấu hình Settings**: Việc lưu cấu hình Chromium path và Storage path hiện đang ưu tiên sử dụng `tauri-plugin-store`. Cần đảm bảo backend khi gọi hàm `launch` sẽ đọc đúng từ store cấu hình này thay vì dùng hardcode mặc định.
