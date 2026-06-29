---
title: OmniDesk Architecture Overview
type: documentation
status: active
tags: [presale, architecture, engine, profile, studio, automa]
---

# Kiến trúc Nền tảng OmniDesk

Tài liệu này mô tả chi tiết về kiến trúc **Local-First** và luồng tương tác nghiệp vụ giữa các phân hệ cốt lõi của hệ sinh thái **OmniDesk**. Hệ thống được thiết kế nhằm tối ưu hóa trải nghiệm người dùng, đồng bộ dữ liệu theo thời gian thực và đảm bảo tiêu chuẩn bảo mật khắt khe nhất dành cho môi trường doanh nghiệp.

## 1. Tổng quan các Phân hệ Cốt lõi (Core Components)

| Phân hệ                            | Vai trò & Chức năng                                                                                                                                                                                           | Công nghệ nền tảng                 |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------- |
| **Automa (Extension Designer)**    | Đóng vai trò là **Công cụ Thiết kế (Workflow Designer)** và thực thi trực tiếp bên trong trình duyệt. Cho phép thao tác kéo-thả trực quan, lưu trữ tạm thời tại IndexedDB và báo cáo Logs khi chạy.           | Browser Extension (MV3), IndexedDB |
| **Omni Studio (Dashboard)**        | Đóng vai trò là **Bảng Điều khiển (UI Dashboard)** và là **Nguồn dữ liệu gốc (Source of Truth)** tại máy trạm. Quản lý tập trung toàn bộ dữ liệu kịch bản tại cơ sở dữ liệu SQLite cục bộ, hiển thị thống kê. | React, Tauri, Rust, SQLite         |
| **Omni Profile (Browser Manager)** | Quản lý môi trường trình duyệt cách ly độc lập (Anti-detect browser). Đảm nhiệm việc tự động cài đặt Extension vào trình duyệt và cấp mới dữ liệu từ SQLite.                                                  | Tauri, Rust Backend, Playwright    |
| **Omni Engine (Orchestrator)**     | Đóng vai trò là **Nhạc trưởng điều phối (Execution Orchestrator)**. Quản lý việc đặt lịch (cronjob), điều phối API mở trình duyệt, kích hoạt Automa, thu thập và phân tích Logs các phiên chạy tự động.       | Rust Backend (Axum / Actix)        |
| **Supabase Cloud**                 | Cơ sở dữ liệu đám mây trung tâm phục vụ việc lưu trữ, chia sẻ và phân phối kịch bản (Marketplace). Quản lý hệ thống phân quyền và vai trò người dùng.                                                         | PostgreSQL, Edge Functions         |

### Danh mục API Khả dụng (OpenAPI & Scalar UI)

Để đảm bảo tính minh bạch và khả năng tích hợp linh hoạt cho đối tác, nền tảng OmniDesk cung cấp tài liệu API chuẩn OpenAPI cùng giao diện thử nghiệm Scalar UI tại các cổng (ports) độc lập:

- **Omni Profile API (Cổng 1421):** [http://localhost:1421/scalar](http://localhost:1421/scalar) (API quản lý trình duyệt)
- **Omni Engine API (Cổng 1422):** [http://localhost:1422/scalar](http://localhost:1422/scalar) (API điều phối, thu thập Logs, Schedule)
- **Omni Studio API (Cổng 1423):** [http://localhost:1423/scalar](http://localhost:1423/scalar) (API quản lý Workflow & Database)

---

## 2. Luồng Vận hành Nghiệp vụ (Business Logic Flow)

### 2.1. Luồng Thiết kế & Quản lý Kịch bản (Design & Sync Flow)

Kiến trúc **Local-First** của OmniDesk xử lý toàn bộ vòng đời của một kịch bản tự động hóa thông qua các bước khép kín:

1. **Thiết kế Kịch bản (Automa Extension):** Người dùng thao tác trên trình duyệt, sử dụng giao diện kéo-thả chuyên nghiệp của Automa để xây dựng luồng tự động hóa. Dữ liệu ban đầu được ghi nhận tại IndexedDB của Extension.
2. **Đồng bộ Dữ liệu (Automa -> Local SQLite):** Mã nguồn của Automa được tinh chỉnh để tự động giao tiếp qua giao thức API với backend. Dữ liệu được mã hóa và lưu trữ an toàn tại SQLite của ứng dụng Desktop.
3. **Đồng nhất Môi trường (SQLite -> Đa Trình duyệt):** Mỗi khi hệ thống khởi tạo một Profile trình duyệt mới, Automa tại Profile đó sẽ tự động truy xuất kịch bản mới nhất từ SQLite, đảm bảo tính đồng nhất trên hàng ngàn Profile.

### 2.2. Luồng Điều phối & Thực thi Tự động hóa (Execution Orchestration Flow)

**Omni Engine** đóng vai trò là "Nhạc trưởng" điều phối hoạt động giữa Omni Studio, Omni Profile và Automa. Việc chạy tự động một lệnh/kịch bản diễn ra như sau:

1. **Giao diện Thiết lập Chiến dịch (Omni Studio):** Trên giao diện Dashboard, người dùng cấu hình một chiến dịch bao gồm:
   - **Lên lịch trình (Schedule):** Chạy 1 lần (Run once) hoặc chạy định kỳ (Recurring/Cron).
   - **Chỉ định Trình duyệt:** Chọn 1 hoặc nhiều Profile Browser cùng lúc.
   - **Chỉ định Kịch bản:** Chọn 1 Workflow cụ thể để thực thi.
2. **Lệnh Thực thi (Studio -> Engine):** Khi người dùng nhấn nút **Run**, Omni Studio gửi toàn bộ payload cấu hình chiến dịch qua API cho Omni Engine (`Cổng 1422`).
3. **Điều phối Môi trường (Engine -> Profile):** Dựa trên lịch trình, Omni Engine tự động gọi các API của Omni Profile (`Cổng 1421`) để ra lệnh khởi chạy (launch) các cấu hình trình duyệt đã chọn.
4. **Thu thập Logs (Automa -> Engine):** Ngay khi trình duyệt mở, Automa được kích hoạt và bắt đầu chạy Workflow. Xuyên suốt quá trình chạy, Automa liên tục bắn Logs (trạng thái, lỗi) về cổng thu thập của Omni Engine.
5. **Phân tích & Thống kê (Engine -> Studio):** Omni Engine tổng hợp các phiên chạy (Sessions), phân tích kết quả và cung cấp dữ liệu (API) để Omni Studio hiển thị thành biểu đồ, bảng báo cáo phân tích trực quan cho người dùng.

---

## 3. Sơ đồ Kiến trúc Hệ thống

### Biểu đồ Tuần tự Thực thi (Execution Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Khách hàng
    participant Studio as Omni Studio (Giao diện)
    participant Engine as Omni Engine (Điều phối)
    participant Profile as Omni Profile (Quản lý Trình duyệt)
    participant Automa as Automa Extension (Thực thi)

    User->>Studio: Chọn [Schedule], [Nhiều Profiles], [Workflow]
    User->>Studio: Click "Run"
    Studio->>Engine: Gửi lệnh thực thi chiến dịch qua API (1422)

    loop Theo lịch trình (Cron / Run once)
        Engine->>Profile: Gọi API (1421) yêu cầu khởi động các Profile Browser đã chọn
        Profile-->>Engine: Xác nhận trình duyệt đã mở thành công

        Note over Engine, Automa: Automa tự động kích hoạt Workflow khi Browser mở

        loop Quá trình chạy (Execution)
            Automa->>Engine: Bắn Real-time Logs (tiến trình, dữ liệu, lỗi)
        end
        Automa->>Engine: Báo cáo kết thúc phiên chạy (Session End)
    end

    Engine->>Engine: Phân tích & Tổng hợp dữ liệu Sessions
    Studio->>Engine: Lấy dữ liệu báo cáo thống kê
    Engine-->>Studio: Trả về kết quả phân tích
    Studio-->>User: Hiển thị giao diện báo cáo (Dashboards & Logs)
```

---

## 4. Lợi thế Cạnh tranh (Unique Selling Points)

- **Kiến trúc Micro-App Rõ ràng:** Việc chia tách Omni Studio (UI), Omni Engine (Điều phối) và Omni Profile (Quản lý Trình duyệt) thành các dịch vụ độc lập giúp hệ thống chịu tải tốt, dễ dàng nâng cấp hoặc tích hợp API bên thứ 3.
- **Tối ưu hóa Chi phí (Cost Optimization):** Việc tích hợp sâu công cụ thiết kế của Automa giúp nền tảng cắt giảm đáng kể chi phí phát triển giao diện UI Workflow.
- **Trải nghiệm Local-First Xuyên suốt:** Mọi thao tác vận hành, lưu trữ dữ liệu và xử lý Logs nặng nề đều được giải quyết tức thời tại máy trạm cục bộ (SQLite). Hệ thống loại bỏ hoàn toàn độ trễ mạng internet.
- **Thống kê Thời gian thực:** Omni Engine đóng vai trò "cái phễu" hứng toàn bộ thông tin từ các tiến trình trình duyệt, mang đến cho người quản lý một cái nhìn tổng thể và tức thời về mọi chiến dịch tự động hóa.

---

## 5. Lộ trình Phát triển (Roadmap)

Để hiện thực hóa tầm nhìn chiến lược, OmniDesk thiết lập lộ trình phát triển được bóc tách rõ ràng qua 4 giai đoạn, tương ứng với việc hoàn thiện 4 phân hệ/dịch vụ (services) cốt lõi của nền tảng:

### Giai đoạn 1: Nền tảng Cách ly & Thiết kế (Omni Profile + Automa Extension)

_Mục tiêu: Đảm bảo môi trường thực thi độc lập và công cụ thiết kế trực quan._

- [x] **Omni Profile**: Xây dựng Core quản lý và khởi tạo hàng ngàn môi trường trình duyệt cách ly (Anti-detect browser).
- [x] **Automa**: Tích hợp trực tiếp Extension thiết kế Workflow (kéo-thả) vào các profile.
- [x] **Local DB**: Khởi tạo SQLite làm Nguồn dữ liệu gốc (Source of Truth) lưu trữ tạm thời các kịch bản.

### Giai đoạn 2: Quản trị Trung tâm (Omni Studio)

_Mục tiêu: Quản lý toàn diện vòng đời của kịch bản và dữ liệu người dùng tại máy trạm._

- [ ] **Omni Studio (UI)**: Xây dựng Dashboard Desktop App cho phép người dùng quản lý (CRUD) hàng loạt kịch bản, phân loại theo thư mục và môi trường.
- [ ] **Sync Protocol**: Tự động hóa luồng đồng bộ: Kịch bản được lưu ở Studio (SQLite) sẽ tự động được tải xuống extension Automa mỗi khi mở Profile mới.
- [ ] Xây dựng cơ chế xuất/nhập (Import/Export) dữ liệu kịch bản an toàn.

### Giai đoạn 3: Trình điều phối Thực thi & Phân tích (Omni Engine)

_Mục tiêu: Tự động hóa toàn trình, điều phối diện rộng và thu thập dữ liệu (Logs)._

- [ ] **Orchestration UI (Studio)**: Giao diện cho phép chọn 1 Workflow, gắn vào 1 hoặc nhiều Profiles, thiết lập lịch chạy (Run Once/Cronjob).
- [ ] **Omni Engine (Orchestrator)**: Đóng vai trò nhạc trưởng, nhận lệnh "Run" từ Studio, tự động gọi API của Profile để mở trình duyệt tương ứng.
- [ ] **Log Collection**: Automa trong trình duyệt tự động thực thi kịch bản và bắn Real-time Logs (Lỗi, Tiến trình) về Engine.
- [ ] **Analytics Dashboard**: Omni Engine phân tích các phiên chạy (Sessions) và đẩy dữ liệu lên Studio để hiển thị biểu đồ báo cáo.

### Giai đoạn 4: Hệ sinh thái Đám mây & AI (Supabase Cloud & AI Agent)

_Mục tiêu: Thương mại hóa, phân quyền và tự động hóa không chạm (Zero-Code)._

- [ ] **Cloud Marketplace**: Tích hợp Supabase Auth, cho phép người dùng "Upload to Cloud" kịch bản lên máy chủ trung tâm kèm theo quyền sở hữu (`author_id`).
- [ ] Phân phối và thương mại hóa kịch bản giữa các người dùng hoặc đội nhóm.
- [ ] **AI-Driven**: Tích hợp AI Agent, cho phép người dùng nhập yêu cầu bằng ngôn ngữ tự nhiên (Prompt) để hệ thống tự động sinh ra các khối lệnh (blocks) Workflow trong Automa.
