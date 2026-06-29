# Quy trình Báo cáo Cập nhật & Phát hành (Changesets Workflow)

Dự án OmniDesk sử dụng hệ thống **Changesets** kết hợp với **GitHub Actions** để tự động hóa hoàn toàn quy trình đóng gói, quản lý phiên bản (Versioning), sinh Changelog và phát hành file cài đặt (`.exe`).

Tài liệu này hướng dẫn các Lập trình viên (Dev) và Quản lý Sản phẩm (PO) phối hợp nhịp nhàng trong quá trình Release.

---

## 1. Dành Cho Lập Trình Viên (Dev)

Khi bạn hoàn thành xong một tính năng (Feature) hoặc sửa xong một lỗi (Bugfix) trên nhánh làm việc của mình, **bắt buộc** phải tạo một tệp Changeset để hệ thống ghi nhận.

### Bước 1: Khởi tạo Changeset
Mở Terminal ở thư mục gốc của dự án và chạy:
```bash
pnpm changeset
```

### Bước 2: Trả lời câu hỏi của hệ thống
Hệ thống sẽ hỏi bạn 3 câu hỏi rất thân thiện:
1. **Bạn muốn cập nhật package/app nào?** (Dùng phím cách `Space` để chọn ứng dụng bạn vừa sửa, ví dụ: `@omnidesk/omni-engine`). Nhấn `Enter` để đi tiếp.
2. **Mức độ nâng cấp là gì?**
   - Lỗi nhỏ (Bugfix) -> Bấm enter bỏ qua `major` và `minor`, gõ tên app vào ô `patch`.
   - Chức năng mới (Feature) -> Chọn `minor`.
   - Đột phá lớn (Breaking Change) -> Chọn `major`.
3. **Nội dung cập nhật (Changelog) là gì?** Gõ một câu ngắn gọn, súc tích (VD: *"Thêm giao diện Auto-Updater thông minh và cấu hình Edge Function"*).

### Bước 3: Commit
Sau khi hoàn tất, hệ thống sẽ sinh ra một file Markdown ngẫu nhiên trong thư mục `.changeset/`. Hãy `git add` và `git commit` file này cùng với code của bạn rồi đẩy lên nhánh `main`.

---

## 2. Dành Cho Quản Lý Sản Phẩm (PO / Team Lead)

Bạn không cần động vào Code! Nhiệm vụ của bạn là duyệt phiên bản trên GitHub.

### Bước 1: Theo dõi "Version Packages"
Mỗi khi Lập trình viên đẩy file changeset lên nhánh `main`, con Bot của GitHub sẽ tự động gom tất cả các tệp changeset đó lại và tạo ra một **Pull Request (PR)** có tên là: `chore(release): version packages`.

### Bước 2: Duyệt và Merge (Release)
1. Bạn mở Pull Request đó lên, Github Bot sẽ liệt kê rõ ràng: *Sắp tới app nào sẽ lên phiên bản mấy? Nội dung Changelog viết có chuẩn ngôn từ sản phẩm không?*
2. Nếu ưng ý, bạn chỉ việc bấm nút **Merge Pull Request**.

### Bước 3: Đợi GitHub làm nốt phần việc còn lại
Ngay khi PR được Merge:
- GitHub Bot tự động xóa các file changeset cũ.
- Tự động đổi version trong `package.json` và `tauri.conf.json`.
- Bắn các Tag phiên bản (VD: `@omnidesk/omni-engine@0.1.1`) lên repository.
- Kích hoạt hệ thống máy chủ biên dịch **Build Tauri Apps** (mất khoảng 5-10 phút).
- Tự tạo Release và đính kèm file cài đặt (`.exe`, `.zip`) cùng file cấu hình cập nhật `latest.json`.
- **Update Server (Supabase Edge Function)** sẽ quét thấy file mới và tự động phân phát Popup Update xuống cho toàn bộ khách hàng đang sử dụng.

---

> **Lưu ý:** Tuyệt đối không được chỉnh sửa version trong `package.json` bằng tay. Mọi thứ phải tuân thủ qua lệnh `pnpm changeset`.
