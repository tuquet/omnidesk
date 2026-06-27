# 🚀 OmniDesk E2E & Browser Manager - Development Roadmap

Roadmap này định hướng phát triển **OmniDesk E2E**, một ứng dụng Tauri v2 đóng vai trò là một trình quản lý đa Profile (Multi-profile Browser Manager) và là trung tâm điều khiển (Orchestrator) các kịch bản kiểm thử E2E tự động, tập trung mạnh vào hiệu năng Local và khả năng Bypass Anti-bot.

---

## 📍 Giai đoạn 1: Browser Profile & Local Data Management (MVP Foundation)

_Mục tiêu: Quản lý hàng loạt các Profile trình duyệt độc lập và cấu hình khởi chạy an toàn (Anti-detect)._

- [ ] **Quản lý Cấu hình Profile (Local SQLite)**
  - Quản lý danh sách Browser Profiles. Mỗi profile lưu thông tin cấu hình: Tên, Proxy, User-Agent riêng biệt.
- [ ] **Lưu trữ dữ liệu Local-First (AppData)**
  - Tách bạch hoàn toàn dữ liệu thật của từng trình duyệt (Cookies, Cache, History, LocalStorage) vào thư mục nội bộ (User Data Dir) thay vì đồng bộ thời gian thực lên mây để đảm bảo hiệu năng và tốc độ tốt nhất.
- [ ] **Tự động tiêm Extension (Auto-Inject)**
  - Tự động mount (tiêm) Automa Extension vào mỗi profile trình duyệt được sinh ra.
- [ ] **Khởi chạy Anti-detect Command Line**
  - Khởi chạy các trình duyệt (Chrome, Edge, Firefox) bằng CLI (qua `--remote-debugging-port`) thay vì Webdriver, nhằm vượt qua các hệ thống Anti-bot (như Cloudflare) dễ dàng.

---

## 📍 Giai đoạn 2: Automa Bridge & Test Execution (MVP Core)

_Mục tiêu: Đóng vai trò là E2E Orchestrator, điều khiển các trình duyệt thực thi Kịch bản (Workflow) mà không cần can thiệp thủ công._

- [ ] **Rust Local API & WebSocket (Cổng 1421)**
  - Xây dựng cầu nối giao tiếp 2 chiều giữa **Tauri Desktop App** và **Automa Extension** chạy ngầm trong trình duyệt.
- [ ] **Quản lý Danh sách Test Cases / Workflows**
  - Xây dựng giao diện Desktop liệt kê các Kịch bản kiểm thử (Test Suites) từ Automa. Người dùng chỉ cần thiết kế kịch bản trực tiếp từ UI của Extension một lần.
- [ ] **Thực thi lệnh & Theo dõi Logs (Execution & Tracing)**
  - Người dùng bấm "Run" từ Desktop, hệ thống gửi lệnh qua API kích hoạt Automa Extension thực thi tự động.
  - Ghi nhận Logs thời gian thực (Success/Fail/Error) từ Extension trả về Desktop App và lưu xuống SQLite.

---

## 📍 Giai đoạn 3: Cloud Sync & Team Collaboration

_Mục tiêu: Mở rộng khả năng sao lưu và chia sẻ kịch bản giữa nhiều người dùng._

- [ ] **Tài khoản & Phân quyền Supabase (Auth)**
  - Tích hợp đăng nhập an toàn bằng OAuth/Email.
- [ ] **Đồng bộ Profile (Backup/Sync)**
  - Nén (zip) cấu hình Profile và dữ liệu Browser (tùy chọn) thành một cục (bundle) và đẩy lên **Supabase Storage** khi người dùng có nhu cầu lưu trữ.
- [ ] **Đồng bộ Workflows (Cloud Workflows)**
  - Backup các JSON Workflows của Automa lên Supabase Database để làm kho Kịch bản chung (Centralized Repository) cho team QA.

---

## 📍 Giai đoạn 4: Kernel App & Phân phối (Bản mở rộng tương lai)

_Mục tiêu: Xây dựng nền tảng mở (Marketplace), thương mại hóa các ứng dụng nội bộ._

- [ ] **Kernel App Dynamic Loading**
  - Modular hóa ứng dụng, hỗ trợ tải các phần mềm dưới dạng Module rời rạc vào "Vỏ nhân" OmniDesk.
- [ ] **Supabase RBAC & Admin Core**
  - Phân quyền theo Role (Admin, Editor, Viewer). Quản trị phiên bản (Updater), cấp phát License cho các ứng dụng.
- [ ] **Workflow Marketplace**
  - Chợ mua bán / chia sẻ các Kịch bản (Workflows) cao cấp chuyên ngành (Premium workflows).

---

### 💡 Tóm tắt User Journey (Cho bản MVP)

1. **Thiết lập**: Người dùng tạo một (hoặc nhiều) Browser Profile từ giao diện Desktop App và gán Proxy/User-Agent riêng biệt.
2. **Khởi chạy**: Người dùng bấm "Open", Desktop App kích hoạt Chrome mở theo User Data Dir tách biệt.
3. **Thiết kế Kịch bản (1 lần)**: Người dùng dùng Automa Extension (đã cài sẵn) trong trình duyệt để kéo-thả kịch bản E2E Test.
4. **Chạy Tự Động**: Đóng trình duyệt. Từ giao diện Desktop, chọn Test Suite và ấn "Execute". Desktop App tự động mở trình duyệt và ngầm ra lệnh cho Automa chạy bài Test, thu nhận kết quả Report trả về giao diện quản lý.
