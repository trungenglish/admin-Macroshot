# NutriPal Admin

Admin dashboard cho ứng dụng NutriPal - Hệ thống quản lý dinh dưỡng thông minh.

## 📋 Mô tả

NutriPal Admin là giao diện quản trị cho phép quản lý người dùng, thực phẩm, phân tích dữ liệu và các tính năng khác của hệ sinh thái NutriPal.

## 🛠️ Công nghệ sử dụng

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite 7** - Build tool & dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **React Avatar** - Avatar component
- **pnpm** - Package manager

## 📦 Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0

## 🚀 Cài đặt

### 1. Cài đặt pnpm (nếu chưa có)

```bash
npm install -g pnpm
```

Hoặc trên macOS/Linux:
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 2. Clone repository và di chuyển vào thư mục

```bash
cd nutripal-admin
```

### 3. Cài đặt dependencies

```bash
pnpm install
```

## 🏃 Chạy dự án

### Development mode

Chạy dev server với Hot Module Replacement (HMR):

```bash
pnpm dev
```

Dự án sẽ chạy tại: `http://localhost:5173`

### Build cho production

Tạo build tối ưu cho production:

```bash
pnpm build
```

Output sẽ được tạo trong thư mục `dist/`

### Preview production build

Xem preview của production build:

```bash
pnpm preview
```

### Lint code

Kiểm tra lỗi code:

```bash
pnpm lint
```

## 📁 Cấu trúc thư mục

```
nutripal-admin/
├── public/                 # Static files
├── src/
│   ├── assets/            # Assets (images, icons, logo)
│   │   └── Logo.tsx
│   ├── components/        # React components
│   │   ├── ui/           # UI components (buttons, dropdown, sidebar, etc.)
│   │   ├── AppSidebar.tsx
│   │   ├── UserMenu.tsx
│   │   └── ThemeProvider.tsx
│   ├── constants/        # Constants và configuration
│   │   └── index.ts
│   ├── hooks/            # Custom React hooks
│   │   └── use-mobile.ts
│   ├── lib/              # Utility functions
│   │   └── utils.ts
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json         # TypeScript config
└── vite.config.ts        # Vite config
```

## 📝 Scripts có sẵn

| Script | Mô tả |
|--------|-------|
| `pnpm dev` | Chạy development server |
| `pnpm build` | Build cho production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Chạy ESLint để kiểm tra code |

## 🔧 Cấu hình

### Path Alias

Dự án sử dụng path alias `@` để tham chiếu đến thư mục `src/`:

```typescript
import { Button } from '@/components/ui/button'
import { APP_SIDEBAR } from '@/constants'
```

### Environment Variables

Tạo file `.env` trong thư mục root nếu cần cấu hình biến môi trường:

```env
VITE_API_URL=http://localhost:3000/api
```

## 🐛 Troubleshooting

### Lỗi port đã được sử dụng

Nếu port 5173 đã được sử dụng, Vite sẽ tự động tìm port khác hoặc bạn có thể chỉ định port:

```bash
pnpm dev -- --port 3000
```

### Lỗi khi cài đặt dependencies

Xóa `node_modules` và `pnpm-lock.yaml`, sau đó cài lại:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📚 Tài liệu tham khảo

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [TypeScript](https://www.typescriptlang.org)

## 👥 Phát triển

Dự án này là phần của hệ sinh thái NutriPal. Xem thêm:

- [NutriPal Mobile App](../nutripal/) - Ứng dụng mobile Flutter

## 📄 License

Private project - All rights reserved
