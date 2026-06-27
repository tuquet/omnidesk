# 🚀 OmniDesk E2E & Browser Manager - Development Roadmap

Roadmap này định hướng phát triển **OmniDesk E2E**, một ứng dụng Tauri v2 đóng vai trò là trình quản lý đa Profile (Multi-profile Browser Manager) và máy chủ cung cấp kịch bản (Workflow Host). Hệ thống đi theo kiến trúc "Stateless Workflow Orchestrator", tận dụng tối đa hệ thống File System và tính năng Hosted Workflow của Automa.

---

## 📍 Giai đoạn 1: Browser Profiles Database & Anti-detect Launch (MVP Foundation)

_Mục tiêu: Xây dựng nền tảng quản lý Profile trình duyệt độc lập và an toàn._

- [ ] **Khởi tạo Local SQLite Database (Chỉ dành cho Profile)**
  - Bảng `browser_profiles`: Lưu cấu hình (Tên, Proxy, User-Agent, Data Dir). Không dùng SQLite cho Workflows.
- [ ] **Quản lý Browser Profiles & UI**
  - Xây dựng UI (React) CRUD Profiles.
  - Tách bạch dữ liệu thật của trình duyệt (Cookies, Cache, History) vào thư mục `AppData` riêng biệt theo từng Profile.
- [ ] **Khởi chạy Anti-detect & Tự động tiêm Extension**
  - Mở Chrome/Edge bằng CLI (`--remote-debugging-port` & `--user-data-dir`) để bypass anti-bot.
  - Tự động mount (tiêm) Automa Extension vào mỗi profile.

---

## 📍 Giai đoạn 2: Stateless Workflow Host & Execution (MVP Core)

_Mục tiêu: Đóng vai trò là Local Server cung cấp kịch bản cho Extension Automa, không can thiệp lưu trữ._

- [ ] **File-System Workflow Manager**
  - Desktop App quét thư mục vật lý (vd: `Workflows/Project_A`) để hiển thị danh sách các file `.json` của Automa. Mỗi thư mục là một Project, mỗi file là một Test Case.
- [ ] **Hosted Workflow API (Rust Web Server)**
  - Chạy Local Web Server ở cổng `1421`.
  - Cung cấp API endpoint (`/api/workflows/{project}/{file.json}`) để Automa Extension có thể điền URL vào tính năng "Add Hosted Workflow" và tự động tải kịch bản.
- [ ] **Execution Trigger (Tùy chọn nâng cao)**
  - Xây dựng cơ chế WebSocket/API để Desktop App có thể bấm nút "Run" trên UI và ra lệnh cho Extension tự động chạy Hosted Workflow tương ứng.

---

## 📍 Giai đoạn 3: Cloud Sync & Team Collaboration

_Mục tiêu: Sao lưu và chia sẻ trong team QA (Dựa trên File System)._

- [ ] **Tài khoản & Phân quyền Supabase (Auth)**
  - Đăng nhập an toàn bằng OAuth/Email.
- [ ] **Git/Cloud Sync cho Workflows**
  - Do các kịch bản lưu hoàn toàn dưới dạng file `.json`, có thể tích hợp cơ chế Sync đơn giản lên Supabase Storage hoặc cho phép người dùng dùng Git để quản lý phiên bản Test Case.
- [ ] **Đồng bộ Browser Profiles (Storage Backup)**
  - Nén (zip) cấu hình Profile và dữ liệu cục bộ, tải lên Supabase Storage.

---

## 📍 Giai đoạn 4: Kernel App & Phân phối (Bản mở rộng tương lai)

_Mục tiêu: Đóng gói thành nền tảng mở (Marketplace), thương mại hóa._

- [ ] **Kernel App Dynamic Loading**
  - Modular hóa ứng dụng, hỗ trợ tải các phần mềm dưới dạng Module rời rạc vào "Vỏ nhân" OmniDesk.
- [ ] **Supabase RBAC & Admin Core**
  - Phân quyền theo Role (Admin, Editor, Viewer). Quản trị phiên bản (Updater), cấp phát License.
- [ ] **Premium Workflow Marketplace**
  - Chợ chia sẻ hoặc bán các Test Cases/Workflows `.json` chuyên ngành.
