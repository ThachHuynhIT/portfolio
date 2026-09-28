# 🚀 Hướng Dẫn Triển Khai (Deployment Guide)

Tài liệu này hướng dẫn cách build, kiểm thử và deploy ứng dụng Portfolio lên các nền tảng phổ biến như Vercel, Netlify, Docker và VPS.

---

## 1. Yêu Cầu Môi Trường (System Requirements)

- **Node.js**: Phiên bản `>= 18.17.0` (Khuyến nghị sử dụng LTS Node 20+).
- **Package Manager**: `npm` (hoặc `pnpm`, `yarn`, `bun`). Lưu ý: `package-lock.json` đang bị `.gitignore` nên clone mới không có lockfile — dùng `npm install` thay cho `npm ci`.
- **PostgreSQL** (VD: Neon) — mọi trang nội dung đọc từ DB, kể cả lúc build.
- **Biến môi trường**: xem [`.env.example`](../.env.example) (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_PASSWORD`, `CLOUDINARY_*`, `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL`, `NEXT_PUBLIC_TIENLEN_SERVER_URL`). `npm install` tự chạy `prisma generate` (postinstall).

---

## 2. Kiểm Thử Trước Khi Triển Khai (Pre-deployment Verification)

Trước khi đẩy code lên môi trường Production, hãy chạy các lệnh sau để đảm bảo không có lỗi cú pháp hoặc TypeScript:

```bash
# 1. Kiểm tra linter (ESLint) và type
npm run lint
npx tsc --noEmit -p .

# 2. Tạo bản build Production (cần DATABASE_URL trỏ tới DB có dữ liệu)
npm run build

# 3. Chạy thử bản build production trên máy local
npm run start
```

Mở trình duyệt tại `http://localhost:3000` để xác nhận các trang hoạt động: `/`, `/blog`, `/projects`, `/photography`, `/music`, `/couple`, `/contra`, `/tools/json-validator`, `/admin` (đăng nhập), `/games` và sảnh từng game `/tien-len`, `/meo-no`, `/co-ty-phu`, `/splendor`, `/bang` (cần be_game đang chạy — xem mục 3.1).

---

## 3. Triển Khai Lên Vercel (Khuyến Nghị Hàng Đầu)

Vì dự án được xây dựng bằng Next.js 14, **Vercel** là nền tảng tối ưu nhất (Zero Configuration):

1. Đẩy mã nguồn lên kho lưu trữ GitHub / GitLab / Bitbucket.
2. Truy cập [vercel.com](https://vercel.com) và chọn **Add New Project**.
3. Import repository của bạn.
4. Vercel sẽ tự động nhận diện cấu hình:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
5. Trước khi deploy, vào *Settings → Environment Variables* và thêm toàn bộ biến trong `.env.example` (giá trị thật).
6. Nhấn **Deploy**. Sau khoảng 1–2 phút, trang web của bạn sẽ hoạt động với HTTPS và CDN toàn cầu.

Nội dung (dự án, ảnh, blog, couple...) được sửa qua `/admin` và lưu vào Postgres, nên không cần ghi file trên server — phù hợp với filesystem chỉ-đọc của Vercel.

---

### 3.1. Game Online (`/games`, `/tien-len`, `/meo-no`, `/co-ty-phu`, `/splendor`, `/bang`)

Portfolio chỉ chứa **giao diện** của các game (`src/app/<game>`, `src/components/{games,tienlen,meono,typhu,splendor,bang}`) cùng bản sao luật/dữ liệu + protocol trong `src/lib/<game>` để kiểm tra nước đi phía client. Toàn bộ backend (phòng chơi, WebSocket, Redis) của **cả 5 game** nằm ở repo riêng **[be_game](https://github.com/ThachHuynhIT/be_game)** và được deploy thành một project Vercel khác. Cách deploy xem README của repo đó.

Sau khi deploy be_game, vào project portfolio trên Vercel → *Settings → Environment Variables* và thêm:
```
NEXT_PUBLIC_TIENLEN_SERVER_URL=https://<be_game>.vercel.app
```
rồi redeploy. Biến này được gắn vào lúc build và dùng chung cho mọi game (Tiến Lên: `/api/ws`, `/api/rooms`, `/api/leaderboard`; game khác: `/api/<meono|typhu|splendor|bang>/ws|rooms|leaderboard`). Nếu be_game đặt `ALLOWED_ORIGIN`, nhớ thêm domain của portfolio vào đó.

Khi chạy local: chạy `npm run dev` trong be_game (cổng 4000) và `npm run dev` trong portfolio. Nếu không đặt biến thì client mặc định kết nối tới `http://localhost:4000`.

Ảnh lá bài tùy chọn của Mèo Nổ / Đấu Súng phải được sinh trước khi commit (`npm run art:meono`, `npm run art:bang`) vì thư mục ảnh nguồn `art/` bị gitignore; build không tự chạy script này.

## 4. Triển Khai Bằng Docker

Nếu bạn muốn deploy ứng dụng lên VPS hoặc Kubernetes:

### 4.1. Tạo file `Dockerfile`
Tạo file `Dockerfile` tại thư mục gốc của dự án:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# package-lock.json đang bị gitignore: dùng npm ci nếu có lockfile, không thì npm install.
# postinstall chạy `prisma generate`, nên cần schema + prisma.config.ts ở bước này.
COPY package.json package-lock.json* prisma.config.ts ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Build đọc DB (generateStaticParams, metadata) và nhúng URL backend game
ARG DATABASE_URL
ARG NEXT_PUBLIC_TIENLEN_SERVER_URL
ENV DATABASE_URL=$DATABASE_URL NEXT_PUBLIC_TIENLEN_SERVER_URL=$NEXT_PUBLIC_TIENLEN_SERVER_URL
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
```

### 4.2. Build và chạy Docker Container
```bash
# Build image
docker build -t my-portfolio:latest \
  --build-arg DATABASE_URL="postgresql://..." \
  --build-arg NEXT_PUBLIC_TIENLEN_SERVER_URL="https://<be_game>.vercel.app" .

# Run container (biến runtime lấy từ file env, theo mẫu .env.example)
docker run -p 3000:3000 -d --env-file .env.production --name portfolio-app my-portfolio:latest
```

---

## 5. Triển Khai Lên VPS Với PM2 & Nginx

Nếu sử dụng máy chủ Ubuntu / Debian:

1. **Clone repository và cài đặt dependencies**:
   ```bash
   git clone https://github.com/yourusername/portfolio.git /var/www/portfolio
   cd /var/www/portfolio
   cp .env.example .env.local   # rồi điền giá trị thật
   npm install                  # package-lock.json không được commit
   npm run build
   ```

2. **Cài đặt và khởi chạy với PM2**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "portfolio" -- start
   pm2 save
   pm2 startup
   ```

3. **Cấu hình Nginx Reverse Proxy**:
   ```nginx
   server {
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Cài đặt SSL miễn phí với Certbot**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 6. Danh Mục Kiểm Tra SEO & Tối Ưu Hóa (Checklist)

- [ ] Cập nhật tên, tiêu đề, mô tả, URL site và ảnh OG (`ogImage`) ở `/admin/site-config` — `src/app/layout.tsx` dựng metadata (OpenGraph, Twitter Cards) từ các giá trị này qua `src/lib/seo.ts`.
- [ ] Thay `src/app/favicon.ico` bằng icon của bạn.
- [ ] Đặt link CV (`resumeUrl`) ở `/admin/site-config` — nút xem CV ở Hero chỉ hiện khi có giá trị này.
- [ ] Kiểm tra tính tương thích trên thiết bị di động và tablet.
