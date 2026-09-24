# 🚀 Hướng Dẫn Triển Khai (Deployment Guide)

Tài liệu này hướng dẫn cách build, kiểm thử và deploy ứng dụng Portfolio lên các nền tảng phổ biến như Vercel, Netlify, Docker và VPS.

---

## 1. Yêu Cầu Môi Trường (System Requirements)

- **Node.js**: Phiên bản `>= 18.17.0` (Khuyến nghị sử dụng LTS Node 20+).
- **Package Manager**: `npm` (hoặc `pnpm`, `yarn`, `bun`).

---

## 2. Kiểm Thử Trước Khi Triển Khai (Pre-deployment Verification)

Trước khi đẩy code lên môi trường Production, hãy chạy các lệnh sau để đảm bảo không có lỗi cú pháp hoặc TypeScript:

```bash
# 1. Kiểm tra linter (ESLint)
npm run lint

# 2. Tạo bản build Production để kiểm tra Type checking và biên dịch MDX
npm run build

# 3. Chạy thử bản build production trên máy local
npm run start
```

Mở trình duyệt tại `http://localhost:3000` để xác nhận tất cả các trang (`/`, `/blog`, `/contra`, `/tools/json-validator`, `/couple`) hoạt động trơn tru.

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
5. Nhấn **Deploy**. Sau khoảng 1–2 phút, trang web của bạn sẽ hoạt động với HTTPS và CDN toàn cầu.

---

### 3.1. Game Tiến Lên (`/tien-len`) trên Vercel

Game dùng **WebSocket trên Vercel Functions** (Beta), qua route `src/app/api/tienlen/ws/route.ts`. Luật chơi nằm trong `src/lib/tienlen/`, còn trạng thái phòng lưu trong **Redis**. Redis là bắt buộc: các người chơi trong cùng một phòng có thể kết nối vào những instance khác nhau.

**Cấu hình một lần:**
1. **Redis:** vào Vercel → *Storage / Marketplace* → thêm **Upstash for Redis** (gói Free là đủ) và gắn vào project `portfolio`. Chọn region **Singapore** cho gần function. Vercel sẽ tự thêm biến `REDIS_URL` (hoặc `KV_URL`); code đọc được cả hai tên.
2. **Region:** `vercel.json` đã đặt `"regions": ["sin1"]`. Function chạy ở Singapore nên độ trễ từ Việt Nam thấp hơn nhiều so với `iad1` (Mỹ).
3. **Fluid compute** phải bật: vào *Settings → Functions*. Project tạo từ 23/04/2025 trở đi được bật sẵn.
4. Redeploy.

**Giới hạn cần biết:**
- Một kết nối WebSocket chỉ sống bằng thời gian tối đa của function: gói Hobby là **300 giây**. Khoảng 25 giây trước hạn, server gửi `reconnect`; client mở kết nối mới rồi mới đóng kết nối cũ, nên người chơi không bị văng.
- Chưa gắn Redis thì server log lỗi `REDIS_URL is not set`, và phòng chỉ hoạt động khi mọi người tình cờ rơi vào cùng một instance.
- Khi chạy local với `next dev` thì endpoint WebSocket không hoạt động. Hãy dùng chế độ tự host (bên dưới), hoặc `vc dev` (Vercel CLI ≥ 54.14.2).

**Tự host trên máy của bạn** (web và game dùng chung **một cổng 3000**): xem [`TIENLEN_SELF_HOST.md`](./TIENLEN_SELF_HOST.md).
```bash
npm run tienlen:host              # build nếu chưa có, chạy trên 0.0.0.0:3000
npm run tienlen:host -- --build   # build lại sau khi sửa code
npm test                          # test luật chơi + hub (vitest)
```

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

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
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
docker build -t my-portfolio:latest .

# Run container
docker run -p 3000:3000 -d --name portfolio-app my-portfolio:latest
```

---

## 5. Triển Khai Lên VPS Với PM2 & Nginx

Nếu sử dụng máy chủ Ubuntu / Debian:

1. **Clone repository và cài đặt dependencies**:
   ```bash
   git clone https://github.com/yourusername/portfolio.git /var/www/portfolio
   cd /var/www/portfolio
   npm ci
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

- [ ] Cập nhật tiêu đề và mô tả trong `src/lib/constants.ts` (`siteConfig`).
- [ ] Cập nhật metadata trong `src/app/layout.tsx` (OpenGraph, Twitter Cards, keywords).
- [ ] Thay thế ảnh `public/og.jpg` và `public/favicon.ico` bằng hình ảnh thương hiệu cá nhân của bạn.
- [ ] Kiểm tra file `public/resume.pdf` đã sẵn sàng để tải về.
- [ ] Kiểm tra tính tương thích trên thiết bị di động và tablet.
