# BỘ QUY CHUẨN CODE (CODING CONVENTIONS) & STYLE GUIDE

Tài liệu này là "kim chỉ nam" cho mọi Developer tham gia vào dự án. Mục tiêu tối thượng là: **Code không chỉ để chạy, code là để duy trì và mở rộng trong 5 năm tới.** 

Chúng ta nói "KHÔNG" với các giải pháp "mì ăn liền" (quick fixes), "hardcode", và cấu trúc lộn xộn.

---

## 1. Kiến trúc Hệ thống (Feature-Based & Monorepo)

Trong môi trường Enterprise, sự tách biệt rõ ràng là yếu tố sống còn. Chúng ta sử dụng cấu trúc **Feature-Based Architecture**.

- **Gom nhóm theo Feature:** Mọi logic, UI, API, Hooks liên quan đến một tính năng cụ thể PHẢI được đặt chung trong một thư mục tại `apps/web/src/features/[feature-name]/`.
- **Cấu trúc Thư mục Feature Chuẩn:**
  ```text
  features/[feature-name]/
  ├── api/         # Các hàm gọi server, react-query hooks, mock data, zod schema.
  ├── components/  # Chỉ chứa UI components liên quan đến feature này.
  ├── config/      # Constants, interfaces, types nội bộ của feature.
  ├── stores/      # (Tuỳ chọn) @tanstack/store hoặc các local state stores.
  ├── index.tsx    # Nơi export DUY NHẤT (Public API) của feature.
  ```
- **Kỷ luật Import Cắt Lớp:**
  - Tuyệt đối **KHÔNG** import trực tiếp một file con từ một Feature khác. (VD: Cấm `import X from '@/features/auth/components/button'`).
  - Mọi giao tiếp giữa các Feature phải đi qua `index.tsx` (VD: `import { X } from '@/features/auth'`).

---

## 2. Kỷ luật Thép về Type Safety (TypeScript)

Dự án này dị ứng với `any`. TypeScript phải được tận dụng tối đa để bắt lỗi ngay từ lúc gõ phím.

- **No `any` Policy:** Tuyệt đối không dùng `any`. Sử dụng `unknown` nếu thực sự chưa rõ type, và phải ép kiểu (type casting) thông qua Type Guard.
- **Zod Validation:** Mọi dữ liệu trả về từ API Backend hoặc Mock Data phức tạp ĐỀU PHẢI có Schema Validate bằng thư viện `zod` để bảo vệ App không bị crash.
- **Tách biệt Type & Code:**
  - Sử dụng `import type` để tối ưu hóa quá trình build.
  - Export Interface rõ ràng cho mọi Component (`[ComponentName]Props`).

---

## 3. Nguyên Tắc SOLID & Làm Sạch "Code Smells"

- **Không Magic Constants (Hardcode):** 
  - Không viết trực tiếp các mảng cấu hình (như mảng `columns` của Table, menu navigation, danh sách lựa chọn) bên trong file Component (UI).
  - Phải tách các dữ liệu này ra `config/constants.ts` hoặc `api/mock-*.ts`.
- **Single Responsibility Principle (SRP):** 
  - UI Component chỉ có một nhiệm vụ: Nhận Props và Render HTML.
  - Component không được chứa logic sinh mock data, không chứa vòng lặp xử lý logic phức tạp. Hãy đẩy logic đó ra Hooks hoặc Helper Functions.
- **File Size Constraint:** 
  - Nếu một file Component vượt quá 300 dòng, ĐÓ LÀ DẤU HIỆU CẦN REFACTOR. Hãy xem xét tách thành các Sub-components nhỏ hơn.

---

## 4. Quản lý State & Data Flow (Trạng thái và Luồng dữ liệu)

Luôn phân biệt rạch ròi giữa **Server State** và **Client State**:

- **Server State (Dữ liệu từ Backend/Database):**
  - **BẮT BUỘC** sử dụng `TanStack Query` (React Query) để quản lý.
  - Tận dụng triệt để cơ chế `isLoading`, `isError`, và caching tự động.
  - **CẤM** sử dụng pattern `useEffect` + `useState` thủ công để fetch data.
- **Client State (Trạng thái UI toàn cục):**
  - Sử dụng `@tanstack/store` (Theme, Trạng thái Sidebar, User Session). Tích hợp hoàn hảo với hệ sinh thái TanStack.
  - Component State thông thường (`useState`) chỉ dùng cho những trạng thái đóng/mở Modal, Input text nội bộ trong chính Component đó.
- **Compound Components Pattern:**
  - Khi xây dựng các Component phức tạp (Table, Select, Modal), hãy sử dụng Compound Pattern để tránh hiện tượng "Prop Drilling" (truyền prop qua quá nhiều tầng).

---

## 5. Tiêu chuẩn Thẩm mỹ & UI/UX

Giao diện Enterprise không có nghĩa là nhàm chán.

- **Thẩm mỹ (Aesthetics):** Sử dụng các gam màu hiện đại, Dark Mode sắc nét, Glassmorphism (nếu phù hợp). Không dùng màu gốc (plain red/blue/green) mà phải dùng biến màu chuẩn từ Design System (Tailwind CSS).
- **Thư viện UI:** Chúng ta sử dụng `shadcn/ui` kết hợp `Tailwind CSS 4.0`.
- **Tương tác:** Mọi nút bấm, link đều phải có hover effect (`hover:bg-muted`, v.v.).

---

## 6. Kiểm soát Chất lượng (Quality Control)

- **Linter & Formatter:** 
  - **Prettier** là chân lý về format. Không cãi nhau về dấu phẩy cuối dòng (trailing comma) hay nháy đơn/nháy kép. Cứ lưu file là Prettier tự sửa.
  - **ESLint** (strict mode) sẽ chém thẳng tay các lỗi vi phạm rules (`exhaustive-deps`, biến không sử dụng).
- **Husky & Lint-Staged:** 
  - Git Pre-commit Hook sẽ chạy Lint & Typecheck trước khi cho phép tạo Commit. Lỗi Type là KHÔNG ĐƯỢC COMMIT!
- **Kiểm tra trước khi PR/Merge:**
  - Luôn tự chạy `npm run typecheck` ở local trước khi tạo Pull Request.

---
*“Write code as if the next person to maintain it is a homicidal maniac who knows where you live.”*
