# Hướng Dẫn Thay Đổi Nhận Diện Thương Hiệu & Giao Diện (Rebranding & Styling Guide)

Tài liệu này hướng dẫn cách thay đổi toàn bộ nhận diện thương hiệu (Tên ứng dụng, Logo) và màu sắc chủ đạo (Shadcn/Tailwind) trong hệ sinh thái OmniDesk (bao gồm Omni Profile, Omni Studio, Omni Engine, và Web Portal).

---

## 1. Thay Đổi Màu Sắc Thương Hiệu (Shadcn/Tailwind)

Hệ thống sử dụng **Tailwind CSS v4** và các biến CSS custom properties được cấu hình riêng biệt cho từng ứng dụng. Để đổi màu chủ đạo (Primary color), bạn cần thay đổi các biến CSS tương ứng.

### Nơi chỉnh sửa:
Mỗi ứng dụng có một file cấu hình CSS toàn cục tại đường dẫn `apps/<app-name>/src/app/globals.css`:
- **Omni Profile**: [apps/omni-profile/src/app/globals.css](file:///C:/Repository/omnidesk/apps/omni-profile/src/app/globals.css) (Mặc định: Violet `#7c3aed`)
- **Omni Studio**: [apps/omni-studio/src/app/globals.css](file:///C:/Repository/omnidesk/apps/omni-studio/src/app/globals.css) (Mặc định: Cyan `#0891b2`)
- **Omni Engine**: [apps/omni-engine/src/app/globals.css](file:///C:/Repository/omnidesk/apps/omni-engine/src/app/globals.css) (Mặc định: Amber `#d97706`)
- **Web Portal**: [apps/web-portal/src/app/globals.css](file:///C:/Repository/omnidesk/apps/web-portal/src/app/globals.css) (Mặc định: Green `#22c55e`)

### Cách chỉnh sửa:
Mở file `globals.css` của ứng dụng muốn đổi màu và tìm đến khối định nghĩa màu sắc ở chế độ sáng (Light Mode) và tối (Dark Mode):

```css
@theme {
  /* ... */
}

:root {
  /* ── Chế độ Sáng (Light Mode) ── */
  --primary: #0891b2;            /* Thay đổi mã màu Primary tại đây */
  --primary-foreground: #ffffff; /* Màu chữ hiển thị trên nền Primary */
  /* ... */
}

.dark {
  /* ── Chế độ Tối (Dark Mode) ── */
  --primary: #22d3ee;            /* Thay đổi mã màu Primary ở Dark mode tại đây */
  --primary-foreground: #0f172a;
  /* ... */
}
```

---

## 2. Thay Đổi Logo & Tên Hiển Thị Cửa Sổ (Title Bar)

### Phân tích Component Title Bar:
Bạn đã đề cập đến đoạn mã HTML hiển thị logo và tên ứng dụng ở giữa thanh tiêu đề:
```html
<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 pointer-events-none hidden md:flex">
  <img alt="Omni Studio Logo" class="h-4 w-4" src="/logo.png">
  <span class="text-xs font-bold tracking-tight text-foreground">Omni Studio</span>
</div>
```

Đoạn HTML này được sinh ra từ component dùng chung **TitleBar** tại [packages/core/src/components/title-bar.tsx](file:///C:/Repository/omnidesk/packages/core/src/components/title-bar.tsx#L241-L251):
```tsx
{/* ── Center Section: Logo & App Name ── */}
<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 pointer-events-none hidden md:flex">
  <img
    src={config.logoSrc || '/logo-gold.svg'}
    alt={`${config.appName || 'OmniDesk'} Logo`}
    className="h-4 w-4"
  />
  <span className="text-xs font-bold tracking-tight text-foreground">
    {config.appName || 'OmniDesk'}
  </span>
</div>
```

### Cách thay đổi:
Bạn **không cần** sửa trực tiếp component dùng chung `title-bar.tsx`. Thay vào đó, hãy cập nhật cấu hình đầu vào (Config Provider) của từng ứng dụng cụ thể:

#### Bước A: Cập nhật file Config của App
Ví dụ đối với **Omni Studio**, hãy mở file [apps/omni-studio/src/config/app.ts](file:///C:/Repository/omnidesk/apps/omni-studio/src/config/app.ts):
```typescript
// Chỉnh sửa tên ứng dụng hiển thị và đường dẫn ảnh logo
export const APP_NAME = 'Tên Ứng Dụng Mới';
export const LOGO_SRC = '/logo-moi.png'; // Đường dẫn tương đối từ thư mục public/
```

#### Bước B: Thay thế file logo vật lý
Đặt file logo mới của bạn vào thư mục `public/` của ứng dụng:
- Ví dụ: Thêm ảnh `logo-moi.png` vào thư mục [apps/omni-studio/public/](file:///C:/Repository/omnidesk/apps/omni-studio/public/).

---

## 3. Quy Trình Các Bước Đổi Logo Hệ Thống (Mọi Nơi)

Để thay thế hoàn toàn Logo cũ bằng Logo mới trên toàn bộ ứng dụng (từ thanh Taskbar, Installer, Icon Desktop cho đến hiển thị trong UI):

1. **Sinh bộ Icon cài đặt (Tauri CLI)**:
   Chuẩn bị file ảnh gốc `logo_goc.png` (512x512px) và chạy lệnh:
   ```bash
   pnpm --filter <app-package-name> tauri icon path/to/logo_goc.png
   ```
   *(Ví dụ: `pnpm --filter @omnidesk/omni-studio tauri icon assets/logo_goc.png`)*

2. **Cập nhật File `tauri.conf.json`**:
   Đổi `productName`, `identifier`, `windows[0].title` và các tùy chọn build của ứng dụng trong file `tauri.conf.json` của app đó.

3. **Cập nhật File `index.html` của App**:
   Đổi thẻ `<title>` và các thẻ meta SEO liên quan (như `og:title`, đường dẫn icon `favicon.svg`, `logo.png`).

4. **Thay thế file Logo hiển thị**:
   Đặt logo mới vào thư mục `public/` của app và cập nhật file `src/config/app.ts` như hướng dẫn ở Mục 2.
