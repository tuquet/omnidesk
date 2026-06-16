# Technical Roadmap & Feature Backlog: Application Virtualization & Sandbox Engine

Tài liệu này phác họa **Bản đồ tư duy (Mindmap)** và **Lộ trình phát triển (Roadmap/Backlog)** cho hệ thống ảo hóa và cô lập ứng dụng (Application Virtualization & Sandbox Engine) của OmniDesk, phục vụ việc phân phối, vận hành và quản lý các plugin/app bên thứ ba một cách an toàn và tối ưu.

---

## 1. Bản đồ Tư duy Hệ thống (Virtualization Engine Mindmap)

```mermaid
mindmap
  root((OmniDesk Virtualization Engine))
    sec["Cô lập & Bảo mật (Isolation & Security)"]
      sec_fs["Cô lập File System"]
        sec_fs_app["Sandbox AppData"]
        sec_fs_path["Chặn Path Traversal"]
      sec_st["Cô lập Storage"]
        sec_st_local["Cô lập LocalStorage / Cookies"]
        sec_st_db["IndexedDB phân vùng"]
      sec_csp["Chính sách CSP"]
        sec_csp_attr["Iframe Sandbox Attribute"]
        sec_csp_script["Chặn Script độc hại"]
      sec_sign["Ký số Package (Code Signing)"]
        sec_sign_hash["Verify Hash SHA-256"]
        sec_sign_pki["Ký số PKI khóa công khai"]
    ipc["Giao tiếp & Tích hợp (IPC & Integration Bridge)"]
      ipc_sdk["OmniBridge JS SDK"]
        ipc_sdk_cmd["Gọi Tauri Native Commands"]
        ipc_sdk_notif["Đăng ký Notifications"]
      ipc_auth["Quản lý Auth"]
        ipc_auth_tok["Token Proxying (JWT sharing)"]
        ipc_auth_rbac["RBAC UI Wrapper"]
      ipc_ai["AI & MCP Integration"]
        ipc_ai_mcp["Sandbox MCP Tools"]
        ipc_ai_ctx["AI Agent Context Sharing"]
    life["Quản lý Vòng đời (Lifecycle Management)"]
      life_pkg["Quản lý Gói (Package Manager)"]
        life_pkg_para["Tải luồng song song (S3)"]
        life_pkg_mem["Giải nén In-Memory"]
      life_upd["Cập nhật Động (Hot-Reload)"]
        life_upd_bg["Background Update"]
        life_upd_silent["Silent Install / Rollback"]
      life_clean["Dọn dẹp Tài nguyên"]
        life_clean_evict["Cache eviction"]
        life_clean_mig["State migration khi nâng cấp"]
    dist["Phân phối & Vận hành (Enterprise Distribution)"]
      dist_store["Private Store (B2B Tenant)"]
        dist_store_ent["Store riêng của doanh nghiệp"]
        dist_store_s3["Tự deploy S3 riêng"]
      dist_perf["Chỉ số Performance"]
        dist_perf_res["Giới hạn CPU / RAM Iframe"]
        dist_perf_lazy["Lazy loading Iframe"]
```

---

## 2. Lộ trình Phát triển & Feature Backlog (Roadmap)

Lộ trình được chia làm 4 giai đoạn phát triển từ Cơ bản đến Chuẩn Enterprise B2B SaaS.

```mermaid
gantt
    title Lộ trình Phát triển Sandbox Virtualization Engine
    dateFormat  YYYY-MM-DD
    section Phase 1: Core Lifecycle
    "Install and Uninstall ZIP"     :done,    des1, 2026-06-11, 2026-06-14
    "S3 Storage and Versioning"     :done,    des2, 2026-06-15, 2026-06-15
    section Phase 2: Security & Isolation
    "Iframe Partitioned Storage"    :active,  des3, 2026-06-16, 5d
    "Package Integrity Verification" :        des4, after des3, 5d
    section Phase 3: IPC Bridge SDK
    "OmniBridge SDK postMessage"     :        des5, after des4, 7d
    "Auth Token Proxying"           :          des6, after des5, 4d
    section Phase 4: AI & MCP
    "MCP Tool Sandbox Registration"  :         des7, after des6, 7d
```

---

## 3. Backlog Feature Chi tiết (User Stories & Tasks)

### Phase 1: Core Lifecycle & Cloud Sync (Hoàn thành)

> [!NOTE]
> Giai đoạn này tập trung vào luồng cài đặt vật lý, phân phối qua đám mây và quản lý phiên bản SQLite cục bộ.

- **[x] VM-101: Local Zip Sandbox Installer**
  - _Mô tả_: Người dùng có thể nhấn Install để giải nén tệp zip ứng dụng vào thư mục cô lập trong AppData và gỡ cài đặt an toàn.
- **[x] VM-102: Supabase S3 Storage Distribution**
  - _Mô tả_: Đưa tệp zip lên Supabase S3. Client tải trực tiếp và giải nén in-memory để tối ưu hóa ghi đĩa.
- **[x] VM-103: Version Checker & Update Trigger**
  - _Mô tả_: So sánh `current_version` (Supabase REST API) với `installed_version` (local SQLite) để hiển thị nút **UPDATE** trên UI.

---

### Phase 2: Cô lập & Bảo mật (Security & Isolation) — _Đang thực hiện_

> [!WARNING]
> Mục tiêu là đảm bảo mã nguồn của bên thứ ba chạy trong Sandbox không thể tấn công host, không thể đọc trộm dữ liệu của app khác và không thể truy cập file system ngoài phạm vi sandbox.

#### [ ] VM-201: Phân vùng dữ liệu duyệt web (Storage Partitioning)

- **Mô tả**: Khi chạy nhiều app khác nhau (ví dụ: `nhaatelier-tattoo` và một app `financial-tracker`), `localStorage`, `sessionStorage` và `cookies` của chúng không được phép dùng chung.
- **Giải pháp**:
  - Sử dụng thẻ `<iframe>` với các thuộc tính sandbox nghiêm ngặt: `sandbox="allow-scripts allow-forms allow-popups"`.
  - Cấu hình phân vùng origin/domain động hoặc sử dụng subdomain ảo (ví dụ: `wordpress-sync.apps.localhost`) thay vì phục vụ chung đường dẫn `localhost:1421/apps/*` để trình duyệt tự động cô lập storage.

#### [ ] VM-202: Ký số và Xác thực tính toàn vẹn (Package Integrity & Code Signing)

- **Mô tả**: Ngăn chặn tấn công Man-in-the-Middle (MitM) chỉnh sửa tệp ZIP trên S3 hoặc đường truyền.
- **Giải pháp**:
  - Khi deploy, tạo mã hash SHA-256 của file zip và lưu vào database `app_versions.package_hash`.
  - Khi client tải zip về, tính toán lại hash SHA-256 cục bộ và đối chiếu với hash từ database trước khi giải nén. Nếu sai lệch, hủy cài đặt lập tức.
  - _Enterprise Option_: Sử dụng chữ ký số PKI (cặp khóa công/tư) để ký số tệp zip khi deploy.

---

### Phase 3: OmniBridge IPC SDK (Giao tiếp an toàn với Máy chủ)

> [!IMPORTANT]
> Các ứng dụng trong sandbox cần gọi các hàm hệ thống (như hiển thị thông báo, mở file picker, lưu cấu hình) hoặc lấy thông tin đăng nhập của user hiện tại mà không được vi phạm bảo mật.

#### [ ] VM-301: OmniBridge JS SDK (Iframe postMessage API)

- **Mô tả**: Cung cấp một thư viện Javascript mỏng (`@omnidesk/bridge-sdk`) cho các ứng dụng nhúng sử dụng.
- **Giải pháp**:
  - Giao tiếp qua `window.parent.postMessage` sử dụng giao thức JSON-RPC 2.0.
  - Host (OmniDesk) lắng nghe sự kiện, xác thực origin của iframe gửi tới, sau đó thực thi Tauri native command tương ứng và trả lại kết quả qua `iframe.contentWindow.postMessage`.
  - _Các APIs cung cấp_: `showNotification()`, `openFileDialog()`, `writeConfig()`, `getSystemTheme()`.

#### [ ] VM-302: Auth Token Proxying

- **Mô tả**: Hỗ trợ ứng dụng sandbox tự động gọi API của riêng nó (hoặc API của OmniDesk) bằng cách kế thừa phiên đăng nhập của người dùng.
- **Giải pháp**:
  - App sandbox gửi request qua OmniBridge: `OmniBridge.getAccessToken()`.
  - OmniDesk verify quyền truy cập của app, lấy JWT token hiện tại của user và trả về cho app nhúng.

---

### Phase 4: Trợ lý AI & MCP Sandbox Integration (AI-Ready Sandbox)

> [!TIP]
> Tích hợp sandbox với AI Assistant của OmniDesk, cho phép AI đọc hiểu dữ liệu của app sandbox và ra lệnh cho app thực hiện công việc thay cho user.

#### [ ] VM-401: MCP Tools Sandbox Registration

- **Mô tả**: Ứng dụng ảo hóa có thể cung cấp các "Tools" và "Resources" cho AI Assistant thông qua giao thức Model Context Protocol (MCP).
- **Giải pháp**:
  - App sandbox khai báo một file cấu hình `mcp-manifest.json` trong gói zip.
  - Khi cài đặt app, OmniDesk đọc file này và tự động đăng ký các tools (ví dụ: tool `sync_wordpress_content`) vào MCP Gateway của host.
  - Khi AI Assistant gọi tool này, host sẽ chuyển tiếp (dispatch) action tới Iframe của app thông qua OmniBridge để xử lý.
