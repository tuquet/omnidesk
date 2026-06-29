# Tài Liệu Đặc Tả Tính Năng Auto-Updater (PO Perspective)

**Dự án:** OmniDesk Ecosystem (Monorepo)
**Vai trò tài liệu:** Product Owner (PO) / Quản lý Sản phẩm

Tính năng Tự động Cập nhật (Auto-Updater) không chỉ đơn thuần là một công cụ tải file, mà là **trái tim của trải nghiệm người dùng xuyên suốt (Seamless UX)**. Đối với một hệ sinh thái sản phẩm B2B doanh nghiệp lớn như OmniDesk—nơi chúng ta đóng gói nhiều ứng dụng độc lập (Omni Engine, Omni Studio, Omni Profile) vào cùng một Monorepo—việc nâng cấp kiến trúc cập nhật đòi hỏi sự tinh tế để đảm bảo tính mở rộng, tính bảo mật và giảm thiểu ma sát cho khách hàng.

Dưới đây là bức tranh toàn cảnh về cách chúng ta đã thiết kế và triển khai hệ thống này.

---

## 1. Tầm Nhìn & Vấn Đề (The "Why")

### Nỗi Đau Của Kiến Trúc Monorepo Cũ

Khi chúng ta gộp nhiều ứng dụng vào một GitHub Repository duy nhất, GitHub chỉ lưu trữ một trạng thái `latest` (Mới nhất) cho toàn bộ Repo.
Nếu chúng ta dùng giải pháp mặc định của Tauri trỏ thẳng về GitHub (`/releases/latest`), một lỗi chí mạng về mặt sản phẩm sẽ xảy ra: **Khách hàng đang dùng Omni Engine nhưng lại bị tải nhầm bản cập nhật của Omni Profile** (do Omni Profile vừa được release sau cùng). Điều này phá hủy hoàn toàn trải nghiệm khách hàng và tính toàn vẹn của sản phẩm.

### Tầm Nhìn Sản Phẩm

Chúng ta cần một "Người phân luồng giao thông" (Traffic Router) thông minh, đứng giữa người dùng và kho lưu trữ. Hệ thống này phải:

1. **Hoàn toàn ẩn danh với người dùng:** Không yêu cầu người dùng phải tự chọn file tải về.
2. **Định tuyến chính xác 100%:** App nào hỏi thì trả về đúng file cập nhật của app đó.
3. **Mượt mà trong khâu phát triển:** Lập trình viên phải có môi trường test UI/UX cập nhật nhanh chóng mà không cần đợi quy trình Build & Release mất hàng chục phút.

---

## 2. Giải Pháp Kiến Trúc (The "How")

Để hiện thực hóa tầm nhìn trên, chúng ta đã thiết kế hệ thống bao gồm 2 thành phần lõi:

### A. Môi Trường Thực Tế (Production): Supabase Edge Function Router

Thay vì trỏ trực tiếp về GitHub, tất cả các app của OmniDesk đều trỏ về một **Update Server** tập trung được xây dựng trên **Supabase Edge Functions** (`tauri-updater`).

**Luồng hoạt động (Mượt mà & Tự động):**

1. **Nhận diện danh tính:** Khi khách hàng mở app, app sẽ ngầm gửi một tín hiệu (Request) lên Update Server kèm theo "Căn cước công dân" (`User-Agent`, ví dụ: `omni-engine/0.1.0 (windows/x86_64)`).
2. **Sàng lọc dữ liệu:** Update Server (đóng vai trò người phân luồng) đọc được tên App, lập tức gọi API của GitHub để tìm đúng Tag phiên bản gần nhất dành riêng cho app đó (ví dụ `@omnidesk/omni-engine@0.1.0`).
3. **Quyết định thông minh:**
   - Nếu phiên bản trên Cloud lớn hơn máy khách hàng: Trả về link tải an toàn, App sẽ hiển thị Popup siêu đẹp mắt.
   - Nếu đã là bản mới nhất: Server âm thầm trả về `204 No Content`, người dùng tiếp tục làm việc mà không hề bị làm phiền.

### B. Môi Trường Phát Triển (Local Dev): Mock Server API

Đối với đội ngũ UI/UX và Developer, chúng ta không thể chờ 20 phút CI/CD chỉ để test một dòng CSS trên cái bảng thông báo Update.
Do đó, chúng ta đã tích hợp sẵn một **Mock Server** (API Giả lập) trực tiếp vào thư mục Rust (`src-tauri/src/api/mod.rs`) của từng app.

- Khi dev chạy app ở Local (VD: `pnpm dev`), app sẽ ưu tiên gọi API giả lập ở `localhost:142X`.
- API này luôn "nói dối" rằng có bản cập nhật `0.1.1` mới nhất.
- Ngay lập tức, bảng UI thông báo cập nhật sẽ hiện ra. Lập trình viên có thể tha hồ tùy biến CSS, layout v.v. với tính năng Hot-Reload (Vite HMR) ngay lập tức mà không cần kết nối Internet.

---

## 3. Quy Trình Vận Hành Dành Cho Đội Ngũ (Team Workflow)

### Dành Cho Lập Trình Viên (Dev / UI / UX)

- **Để thiết kế giao diện:** Sửa file `packages/features/src/updater/AutoUpdater.tsx`.
- **Để test giao diện:** Chạy `pnpm --filter @omnidesk/omni-engine dev` (hoặc studio, profile). Bảng update sẽ hiện ra sau 3 giây.
- **Để sửa nội dung Changelog lúc test:** Mở `src-tauri/src/api/mod.rs` của app tương ứng và sửa chuỗi JSON trong hàm `latest_update()`.

### Dành Cho DevOps / Quản Lý Hệ Thống

- **Quản lý Private Key:** File `updater.key` CHỈ được cấp phát 1 lần và cấu hình vào mục **Secrets** trên GitHub Actions (`TAURI_PRIVATE_KEY`). Tuyệt đối không lưu vào mã nguồn.
- **Cập nhật Edge Function:** Khi có sửa đổi logic trên Update Server (file `index.ts`), kỹ sư chỉ cần chạy 1 lệnh duy nhất để đưa lên Cloud:
  ```bash
  supabase functions deploy tauri-updater --no-verify-jwt
  ```
  _(Lưu ý: Flag `--no-verify-jwt` cực kỳ quan trọng để mở quyền truy cập Public, vì khách hàng khi mở app chưa hề đăng nhập tài khoản)_.

---

## 4. Tổng Kết

Với kiến trúc **Supabase Edge Function Router** kết hợp **Mock Server Local**, chúng ta đã giải quyết triệt để rào cản chí mạng của Monorepo. Đội ngũ giờ đây có thể scale hệ thống lên hàng chục app khác nhau mà vẫn đảm bảo tính độc lập tuyệt đối khi Release, đồng thời mang lại một trải nghiệm cập nhật hoàn toàn "vô hình" (invisible), an toàn và mượt mà cho khách hàng B2B của chúng ta. 🚀
