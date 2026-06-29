# Hướng Dẫn Sử Dụng Tính Năng Auto-Updater

Tài liệu này hướng dẫn bạn cách thức hoạt động của hệ thống **Tauri Auto-Updater** và cách dùng thử (test) giao diện cập nhật ngay trên môi trường Local Development (Dev Server) mà không cần phải thực sự tạo Release trên GitHub.

---

## 1. Cơ Chế Hoạt Động Của Updater

### Flow trên Môi Trường Thực Tế (Production)
1. GitHub Actions (CI/CD) tự động biên dịch App, ký số (sign) file `.zip` bằng Private Key (`TAURI_PRIVATE_KEY`).
2. Tự động sinh ra file `latest.json` (chứa phiên bản mới nhất, chữ ký và URL tải file) đính kèm vào mục **GitHub Releases**.
3. Người dùng mở app -> App tải file `latest.json` từ GitHub.
4. Nếu phiên bản trên `latest.json` **lớn hơn** phiên bản hiện tại, App hiện bảng thông báo (UI Popup).
5. Người dùng bấm "Cập nhật" -> App tự động tải file zip, giải mã, cài đè lên phiên bản cũ và khởi động lại (`relaunch()`).

### Flow trên Môi Trường Local (Mock Server)
Mỗi App (`omni-engine`, `omni-studio`, `omni-profile`) đều được cấu hình 2 endpoint (URL) cập nhật trong file `tauri.conf.json`:
1. Môi trường Dev (Ví dụ: `http://127.0.0.1:1423/updates/latest.json`)
2. Môi trường Prod (Ví dụ: `https://github.com/.../latest.json`)

Khi chạy môi trường Dev, thay vì chờ đợi tải file từ GitHub, Backend Rust sẽ tự động kích hoạt một **API Giả Lập** trả về version luôn là `0.1.1` (luôn lớn hơn phiên bản bạn đang dev). Nhờ đó bảng thông báo Update sẽ xuất hiện **ngay lập tức**!

---

## 2. Hướng Dẫn "Chơi" Với Auto Updater Ở Local

Bạn có thể chỉnh sửa giao diện của bảng Update tuỳ ý và test nó ngay lập tức.

### Bước 1: Mở Server 
Truy cập vào ứng dụng bạn muốn test, ví dụ:
```bash
# Chọn 1 trong 3 ứng dụng
pnpm --filter @omnidesk/omni-engine dev
# HOẶC
pnpm --filter @omnidesk/omni-studio dev
```

### Bước 2: Tận hưởng kết quả
App sẽ khởi động lên. Khoảng 3 giây sau, **Mock Server** ở backend sẽ đánh lừa Frontend rằng có bản cập nhật `0.1.1`. Một cửa sổ thông báo Update đẹp mắt sẽ trượt từ dưới lên ở góc phải màn hình!

### Bước 3: Tuỳ biến Giao diện Update (UI/UX)
Bảng thông báo Update là một React Component hoàn toàn có thể tái sử dụng.
- File mã nguồn: `packages/features/src/updater/AutoUpdater.tsx`
- Công nghệ: React, TailwindCSS, Lucide Icons, `@tauri-apps/plugin-updater`.

Bạn có thể sửa màu sắc, thêm hiệu ứng pháo hoa, đổi layout thoả thích ở file `AutoUpdater.tsx`. Ngay khi bạn lưu file (Ctrl+S), Vite HMR sẽ hot-reload và bảng thông báo sẽ tự động làm mới giao diện ngay trong app Tauri.

---

## 3. Câu Hỏi Thường Gặp (FAQ)

**Q: Tại sao tôi bấm nút "Cập nhật và Khởi động lại" trên môi trường Dev lại báo lỗi?**
> A: Hoàn toàn bình thường! Vì đây là môi trường giả lập (Mock Server), đường link tải file `.zip` là link ảo (`http://127.0.0.1:1424/downloads/update.zip`). Do đó app không tải được file zip. Mục đích của Mock Server chỉ là để test **Hiển thị Giao Diện (UI)**. Để test luồng tải xuống thực tế, bạn cần build app thật.

**Q: Làm sao để thay đổi nội dung Changelog (Ghi chú phiên bản) lúc hiển thị ở local?**
> A: Bạn mở file `src-tauri/src/api/mod.rs` của từng app tương ứng, tìm đến hàm `latest_update()` và sửa nội dung `"notes": "Test update from Dev Server"`. Bảng thông báo sẽ hiển thị y hệt những gì bạn viết!

**Q: Private Key và Public Key được cấu hình ra sao?**
> A: Public key đã được lưu sẵn trong `tauri.conf.json` ở trường `"pubkey"`. Còn Private Key bắt buộc chỉ được lưu ở **GitHub Secrets** (tab Actions) với biến tên `TAURI_PRIVATE_KEY`. Tuyệt đối không lưu Private Key vào trong mã nguồn.

**Q: Làm sao 1 repository (Monorepo) tạo ra nhiều file `.exe` cho nhiều app, mà lúc bật từng app lên nó lại biết chính xác cần download file `.exe` của app nào?**
> A: Đây là một câu hỏi về kiến trúc rất hay!
> Nếu dùng link `/releases/latest/...` mặc định của GitHub thì sẽ bị lỗi "App A tải nhầm App B" (vì GitHub chỉ tính 1 bản release được tạo gần nhất là "latest" chung cho cả Repo).
> Do đó, trong môi trường thật (Production), endpoint ở `tauri.conf.json` sẽ không trỏ thẳng vào GitHub, mà sẽ trỏ vào một **Update Server** (VD: Supabase Edge Functions, Cloudflare Worker hoặc API Gateway).
> 
> Cơ chế phân luồng diễn ra tự động như sau:
> 1. Khi bạn mở app **Omni Engine**, Tauri Updater sẽ gửi request lên Update Server. Trong request này, Tauri đã tự động nhúng header `User-Agent` chứa định danh của app (VD: `omni-engine/0.1.0 (windows/x86_64)`).
> 2. **Update Server** đọc header `User-Agent`, ngay lập tức biết được request này đến từ app `omni-engine` và hệ điều hành `windows`.
> 3. Update Server sẽ dùng API của GitHub để tìm đúng Tag release gần nhất có tiền tố `@omnidesk/omni-engine@...`, rồi trả về nội dung file `latest.json` của riêng app đó.
> 
> Nhờ cơ chế **"Định tuyến thông minh bằng User-Agent"** này, dù bạn có 100 app chung 1 repository và dùng chung 1 đường link API cập nhật, chúng sẽ không bao giờ tải nhầm file cài đặt của nhau!

Chúc bạn code UI Updater thật ngầu! 🚀
