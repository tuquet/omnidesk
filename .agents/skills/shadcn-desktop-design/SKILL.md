---
name: shadcn-desktop-design
description: Áp dụng các tiêu chuẩn thiết kế High-Density (Mật độ cao) / Compact UI dành riêng cho Desktop App khi sử dụng Shadcn UI.
---

# Hướng Dẫn Thiết Kế Giao Diện Desktop (High-Density UI) với Shadcn

Khi bạn (AI Agent) được yêu cầu tạo mới hoặc chỉnh sửa các giao diện UI sử dụng Shadcn trong dự án OmniDesk, bạn **BẮT BUỘC** phải tuân thủ các quy tắc thiết kế dạng "Compact/High-Density" dành cho ứng dụng Desktop (tương tự như VS Code, Notion, Figma). Tuyệt đối không thiết kế theo dạng Mobile-first thưa thớt.

## 1. Ưu Tiên Kích Thước Nhỏ (Compact Size)
- Luôn sử dụng biến thể `size="sm"` cho các components hỗ trợ (ví dụ: `<Button size="sm">`).
- Đối với Input, Select, Command, hoặc các phần tử nhập liệu: Cố định chiều cao nhỏ lại bằng class `h-8` (thay vì h-10 mặc định) và cỡ chữ `text-xs` hoặc `text-sm`.
- Icon mặc định nên có kích thước `w-4 h-4` hoặc `w-3.5 h-3.5`. Không dùng icon quá lớn.

## 2. Tiết Kiệm Khoảng Trống (Padding & Margin)
- Sử dụng các khoảng đệm hẹp hơn. Thay vì `p-4` hay `p-6` (web-style), hãy cân nhắc `p-2`, `p-3`, `px-3 py-1.5`.
- Khoảng cách giữa các phần tử (gap) nên giữ ở mức `gap-1`, `gap-2`. Tránh dùng `gap-4` trở lên trừ khi thực sự phân tách các khu vực lớn.

## 3. Kiến Trúc Cuộn Trang Cục Bộ (Local ScrollArea)
- Tránh việc cuộn toàn bộ màn hình (window scroll) giống trình duyệt web.
- Giao diện Desktop cần cố định thanh Header/TitleBar và Sidebar. Các khu vực nội dung dài (như danh sách items, bảng dữ liệu, logs) **phải được bọc trong component `<ScrollArea>`** của Shadcn để chỉ cuộn cục bộ trong khu vực đó.

## 4. Bố Cục Có Thể Kéo Thả (Resizable Layouts)
- Các cấu trúc chia cột ngang/dọc (như Sidebar bên trái, Editor ở giữa, Property Panel bên phải) nên tận dụng tối đa component **`Resizable`** (`react-resizable-panels` thông qua Shadcn). 
- Điều này cho phép người dùng tùy chỉnh không gian làm việc như một phần mềm Native chuyên nghiệp.

## 5. Typography (Phông Chữ)
- Hạn chế sử dụng thẻ tiêu đề quá to (`text-3xl`, `text-4xl`). Header của các Panel thường chỉ dùng `text-sm font-semibold` hoặc `text-base font-medium`.
- Sử dụng màu chữ `text-muted-foreground` cho các dòng mô tả phụ để giảm nhiễu thông tin (noise).

## Quy trình làm việc:
Trước khi xuất ra đoạn code React/Tailwind, hãy tự đánh giá lại: *"Giao diện này khi hiển thị trên màn hình máy tính có bị quá thưa thớt và lãng phí không gian không? Các nút bấm có bị to bè như web trên điện thoại không?"* Nếu có, hãy thu nhỏ và siết chặt layout lại theo các quy tắc trên.
