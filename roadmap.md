# 🚀 Automa Kernel App - Development Roadmap

Roadmap này định hướng phát triển hệ sinh thái **Automa Desktop Kernel**, một ứng dụng Tauri v2 đóng vai trò là "vỏ nhân" (kernel) để quản lý, phân phối và thực thi các workflow tự động hóa trình duyệt, kết hợp với hệ thống phân quyền (RBAC) chặt chẽ từ Supabase.

---

## 📍 Giai đoạn 1: Foundation & Supabase RBAC (Core Security)

_Mục tiêu: Xây dựng nền tảng vững chắc cho tài khoản, phân quyền và bảo mật lõi._

- [ ] **Supabase Auth & Custom Claims**
  - Tích hợp đăng nhập OAuth / Email an toàn qua giao diện Native Browser (Deeplink `omnidesk://`).
  - Thiết lập Custom Claims trên Supabase để gán role (`admin`, `user`).
- [ ] **RBAC (Role-Based Access Control)**
  - **Admin Only**: Phân quyền truy cập các "Tính năng cốt lõi" (Core Features) như Quản lý người dùng, Đăng tải ứng dụng/workflow lên Marketplace, Quản lý cấu hình hệ thống.
  - **User**: Quyền tải Kernel App, đăng nhập để truy cập marketplace và tải Automa.
- [ ] **Row Level Security (RLS)**
  - Viết các RLS policy trên Supabase PostgreSQL để đảm bảo dữ liệu (workflows, logs, apps) được bảo vệ tuyệt đối theo role.

---

## 📍 Giai đoạn 2: The Kernel Desktop App (Vỏ nhân Tauri)

_Mục tiêu: Hoàn thiện "Kernel App" có khả năng tải và chạy các module con (Apps)._

- [ ] **Hoàn thiện Rust API Gateway**
  - Tối ưu hóa API Gateway (Axum) chạy trên cổng nội bộ `1421` để giao tiếp giữa Web View và Local System.
- [ ] **Marketplace & App Installer (Local-first)**
  - Hoàn thiện luồng: Users kéo ứng dụng (ví dụ: Automa) từ Supabase Marketplace về Kernel.
  - Tải và giải nén các module tĩnh của app vào thư mục hệ thống (AppData) một cách an toàn.
- [ ] **Custom Storage Configurations**
  - Cho phép người dùng tùy chỉnh thư mục lưu trữ dữ liệu (Database, App Modules, Logs) trên ổ cứng cục bộ.

---

## 📍 Giai đoạn 3: Automa Desktop Integration (Trái tim tự động hóa)

_Mục tiêu: Biến Automa thành một ứng dụng Native Desktop chạy bên trong Kernel._

- [ ] **Tích hợp Automa Dashboard**
  - Nhúng Automa Dashboard (React/Vue) vào nền tảng của Kernel, giao tiếp với Local SQLite thay vì IndexedDB truyền thống của trình duyệt.
- [ ] **The E2E Orchestrator (Trình điều khiển trình duyệt)**
  - Phát triển module Orchestrator (Node.js/Playwright hoặc Rust webdriver) đi kèm Kernel.
  - Cho phép Kernel App mở các trình duyệt (Chrome, Edge, Firefox) với profile độc lập để chạy workflow.
- [ ] **Automa Extension Bridge**
  - Cấu hình cầu nối (WebSocket / API Gateway) để Automa Extension (cài trong trình duyệt mục tiêu) có thể nhận lệnh trực tiếp từ Kernel App.

---

## 📍 Giai đoạn 4: Workflow Execution & Management

_Mục tiêu: Khởi chạy và quản lý luồng công việc từ Desktop._

- [ ] **Local Workflow Execution**
  - Người dùng kích hoạt Workflow từ giao diện Kernel. Kernel gọi Orchestrator khởi chạy trình duyệt -> truyền lệnh cho Extension thực thi.
- [ ] **Workflow Sync & Cloud Backup (Supabase 2-way sync)**
  - Đồng bộ hóa định kỳ các Workflow của người dùng lên Supabase Storage/Database.
  - Đảm bảo Local-First: Có mạng hay không, workflow vẫn chạy bình thường.
- [ ] **Logs & Tracing**
  - Ghi nhận lại lịch sử chạy, lỗi, và kết quả của từng workflow vào Local SQLite, sync lên Supabase khi cần.

---

## 📍 Giai đoạn 5: Admin Core Features & Monetization (Mở rộng)

_Mục tiêu: Cung cấp tính năng quản trị cấp cao và thương mại hóa._

- [ ] **Admin Control Panel**
  - Giao diện riêng cho Role `admin` để quản lý version của Kernel, đẩy bản cập nhật (OTA) qua Tauri Updater.
- [ ] **Premium Workflows Marketplace**
  - Cho phép Admin bán hoặc cấp quyền truy cập các workflow độc quyền (Premium Workflows) cho user cụ thể.
- [ ] **Telemetry & Analytics**
  - Thu thập ẩn danh trạng thái hệ thống, tỷ lệ lỗi workflow (Admin only dashboard) để cải thiện sản phẩm.

---

### 💡 Tóm tắt User Journey

1. **Admin** thiết lập hệ thống, phân quyền, và đưa module `Automa` lên Marketplace.
2. **Người dùng** truy cập website, tải **Kernel App** về máy.
3. Người dùng đăng nhập Kernel App, hệ thống xác thực RBAC qua Supabase.
4. Từ Marketplace của Kernel, người dùng click cài đặt **Automa**.
5. Người dùng thiết kế Workflow trên Dashboard, bấm "Chạy".
6. Kernel App tự động mở trình duyệt, kết nối Extension và thực thi các hành động trên website một cách hoàn toàn tự động.
