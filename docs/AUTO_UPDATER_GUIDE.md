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

Chúc bạn code UI Updater thật ngầu! 🚀
