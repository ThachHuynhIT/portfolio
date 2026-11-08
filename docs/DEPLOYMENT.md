# 🚀 Hướng Dẫn Triển Khai (Deployment Guide)

Tài liệu này hướng dẫn cách build, kiểm thử và deploy ứng dụng Portfolio lên các nền tảng phổ biến như Vercel, Netlify, Docker và VPS.

---

## 1. Yêu Cầu Môi Trường (System Requirements)

- **Node.js**: Phiên bản `>= 18.17.0` (Khuyến nghị sử dụng LTS Node 20+).
- **Package Manager**: `npm` (hoặc `pnpm`, `yarn`, `bun`). `package-lock.json` được commit — dùng `npm ci` để cài đúng phiên bản.
- **PostgreSQL** (VD: Neon) — mọi trang nội dung đọc từ DB, kể cả lúc build.
- **Biến môi trường**: xem [`.env.example`](../.env.example) (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_PASSWORD_SCRYPT`, `CLOUDINARY_*`, `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL`). `npm install` tự chạy `prisma generate` (postinstall).

### 1.1. Mật khẩu admin (`ADMIN_PASSWORD_SCRYPT`)

Trang `/admin/login` gửi mật khẩu dạng thường qua HTTPS (`POST /api/admin/auth` với body `{ "password": "..." }`); server so khớp bằng Node `crypto.scrypt` + `timingSafeEqual` (`src/lib/admin-password.ts`). Payload cũ `{ "passwordHash": ... }` (SHA-256 phía client) bị từ chối với 400, và **không còn fallback sang `ADMIN_PASSWORD`**.

- **Định dạng**: `scrypt$<salt 16 byte, hex>$<key 64 byte, hex>`, tham số `N=16384, r=8, p=1`.
- **Fail closed**: thiếu biến hoặc sai định dạng thì mọi lần đăng nhập đều thất bại (server log một dòng cảnh báo, không in giá trị).
- Hash chỉ đặt vào env local (`.env.local`) hoặc env của deployment, **không bao giờ commit vào repo**.

**Cách tạo (khuyến nghị)** — script đọc mật khẩu từ prompt ẩn/stdin hoặc biến `PORTFOLIO_PASSWORD_ONCE`, không bao giờ nhận qua tham số dòng lệnh, và chỉ in ra hash:

```bash
node scripts/hash-admin-password.mjs
```

**Cách thay thế** — lệnh một lần trong PowerShell, nhập mật khẩu ẩn, không để mật khẩu trong history:

```powershell
$credential = Get-Credential -UserName admin -Message 'Mat khau admin de tao scrypt hash'
$env:PORTFOLIO_PASSWORD_ONCE = $credential.GetNetworkCredential().Password
node -e 'const {randomBytes,scrypt}=require("node:crypto");const salt=randomBytes(16);scrypt(process.env.PORTFOLIO_PASSWORD_ONCE,salt,64,{N:16384,r:8,p:1},(err,key)=>{if(err)throw err;console.log(["scrypt",salt.toString("hex"),key.toString("hex")].join("$"));});'
Remove-Item Env:PORTFOLIO_PASSWORD_ONCE
```

**Thứ tự rollout (quan trọng)** — vì không có fallback, deploy code mới trước khi có biến sẽ khoá đăng nhập admin:

1. Tạo hash bằng một trong hai cách trên.
2. Trên Vercel (*Settings → Environment Variables*), thêm `ADMIN_PASSWORD_SCRYPT` cho các môi trường cần thiết **trước khi** deploy code mới.
3. Deploy, rồi kiểm tra đăng nhập `/admin` bằng mật khẩu.
4. Sau khi đăng nhập thành công, xoá `ADMIN_PASSWORD` khỏi Vercel (biến này không còn được đọc).

Rollback: nếu cần quay về bản cũ, khôi phục `ADMIN_PASSWORD` trên Vercel trước khi redeploy bản cũ.

**Lưu ý khi đặt biến**:

- `ADMIN_PASSWORD_SCRYPT` phải là **hash** (`scrypt$…$…`), không phải mật khẩu thường. Đặt mật khẩu thường vào đây thì mọi lần đăng nhập đều bị từ chối và server log `ADMIN_PASSWORD_SCRYPT is missing or malformed`.
- Trong `.env` / `.env.local`, Next.js mở rộng `$tên` thành biến môi trường, nên phải escape: `ADMIN_PASSWORD_SCRYPT=scrypt\$<salt>\$<key>`. Trên Vercel dán nguyên `scrypt$<salt>$<key>`, không có `\`.
- Không đặt mật khẩu thật hay hash vào `.env.example` (file này được commit).
- Chọn mật khẩu mới, dài và chưa từng xuất hiện ở bất kỳ đâu trong repo (repo là public).

**Giới hạn đã biết (chấp nhận ở quy mô hiện tại)**:

- **Rate limiter theo từng instance**: giới hạn 5 lần sai / 15 phút / IP nằm trong bộ nhớ của process (`src/lib/rate-limit.ts`). Trên Vercel serverless, mỗi instance có bộ đếm riêng và bộ đếm mất khi cold start, nên số lần thử không được cộng dồn giữa các instance.
- **Không revoke session phía server trước khi hết hạn**: session là cookie `admin_session` ký HMAC bằng `AUTH_SECRET`, hiệu lực 24 giờ, không lưu phía server. Đăng xuất chỉ xoá cookie trên trình duyệt; một token đã bị sao chép vẫn dùng được tới khi hết hạn. Cách duy nhất để vô hiệu hoá mọi session ngay lập tức là đổi `AUTH_SECRET`.

### 1.2. Content Security Policy (`next.config.js`)

- **Enforcing**: chỉ `Content-Security-Policy: frame-ancestors 'none'` (+ `X-Frame-Options: DENY`) — site không thể bị nhúng vào trang khác. Không chặn CV iframe hay media bên trong site.
- **Report-only**: policy đầy đủ (`Content-Security-Policy-Report-Only`) gồm `script-src 'self'` + sha256 của `THEME_INIT_SCRIPT`. Đổi script này thì `src/lib/security-headers.test.ts` báo hash mới cần cập nhật.
- **Giới hạn đã biết**: hash chỉ bao phủ script theme. Next 15 App Router còn chèn inline script RSC/hydration không có nonce, nên trình duyệt báo vi phạm report-only trên mọi trang (đo 11/2026: ~20 thông báo trên `/`). Promote sang enforcing sẽ làm hỏng trang nếu không chuyển sang nonce + render động — trade-off đã chốt là giữ static rendering, CSP đầy đủ ở report-only.

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

Mở trình duyệt tại `http://localhost:3000` để xác nhận các trang hoạt động: `/`, `/blog`, `/projects`, `/photography`, `/music`, `/couple`, `/tools/json-validator`, `/admin` (đăng nhập).

---

## 3. Triển Khai Lên Vercel (Khuyến Nghị Hàng Đầu)

Vì dự án được xây dựng bằng Next.js 15, **Vercel** là nền tảng tối ưu nhất (Zero Configuration):

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

# package-lock.json được commit: npm ci cài đúng phiên bản.
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
# Build đọc DB (generateStaticParams, metadata)
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
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
  --build-arg DATABASE_URL="postgresql://..." .

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
