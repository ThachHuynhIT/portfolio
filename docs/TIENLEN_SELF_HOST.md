# 🃏 Tự host Tiến Lên Miền Nam trên máy của bạn

Hướng dẫn chạy **web và server game trên chính máy bạn**, rồi mở port để bạn bè vào chơi qua mạng LAN hoặc internet.

```
Bạn bè ──▶ http://<IP>:3000/tien-len          (web Next.js)
           ws://<IP>:3000/api/tienlen/ws      (WebSocket game, cùng cổng, trang web tự kết nối)
```

Chỉ cần mở **1 cổng TCP: `3000`**. Web và game chạy chung một tiến trình. Phòng chơi được lưu trong RAM, trừ khi bạn đặt `REDIS_URL`.

---

## 1. Yêu cầu

- Node.js **20 trở lên**. Kiểm tra bằng `node -v`.
- Đã cài thư viện, chỉ cần làm một lần:
  ```bash
  npm install
  npm install --prefix game-server
  ```
- File `.env` có `DATABASE_URL`. Các trang khác của portfolio cần nó khi build; riêng game không dùng DB.

---

## 2. Chạy server

Chạy ở thư mục gốc repo:

```bash
npm run tienlen:host
```

| Lệnh | Tác dụng |
|---|---|
| `npm run tienlen:host` | Build web nếu chưa có bản build, rồi chạy web + game trên `:3000` |
| `npm run tienlen:host -- --build` | **Build lại** web. Dùng sau khi bạn sửa code |
| `npm run tienlen:host -- --dev` | Chạy `next dev`, không cần build, nhưng lần tải đầu chậm |

Khi chạy thành công, terminal in ra:

```
============================================================
  Tiến Lên đang chạy trên máy bạn (1 cổng: 3000)
  Trên máy này:       http://localhost:3000/tien-len
  Mạng Wi-Fi: http://192.168.1.11:3000/tien-len
  Qua internet:       http://<IP-public-của-bạn>:3000/tien-len  (forward TCP 3000 trên router)
  Nhấn Ctrl+C để tắt.
============================================================
```

Nhấn **Ctrl+C** để tắt cả web lẫn server game.

> Muốn thử một mình: mở nhiều tab trình duyệt, mỗi tab là một người chơi riêng.

---

## 3. Chơi trong cùng mạng wifi/LAN

Trường hợp này **không cần forward port**. Bạn bè kết nối cùng wifi, rồi mở địa chỉ dạng
`http://192.168.x.x:3000/tien-len` (dòng "Cùng mạng wifi/LAN" trong terminal).

Script có thể in ra nhiều IP. Hãy chọn IP thuộc card **Wi-Fi hoặc Ethernet**, thường có dạng `192.168.x.x` hoặc `10.x.x.x`. Bỏ qua:
- `169.254.x.x`: IP tự gán khi card mạng không nhận được địa chỉ.
- `192.168.56.x`: card ảo của VirtualBox.

Muốn biết IP nào thuộc card nào:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, IPAddress
```

---

## 4. Chơi qua internet (forward port)

### Bước 1: Đặt IP cố định cho máy trong mạng nhà

Router có thể cấp IP LAN khác cho máy sau mỗi lần khởi động, làm rule forward bị trỏ sai. Có 2 cách giữ IP cố định:
- **Khuyên dùng:** vào trang quản trị router, tìm mục **DHCP Reservation / Address Reservation / Static Lease**, rồi gán cố định IP hiện tại (ví dụ `192.168.1.11`) cho địa chỉ MAC của máy.
- Hoặc đặt IP tĩnh trong Windows: *Settings → Network → Wi-Fi → Hardware properties → IP assignment → Manual*.

Xem địa chỉ MAC của máy:
```powershell
Get-NetAdapter | Select-Object Name, MacAddress, Status
```

### Bước 2: Mở port trên router

1. Vào trang quản trị router, thường là `http://192.168.1.1` hoặc `http://192.168.0.1`. Tài khoản mặc định thường in ở mặt dưới router.
2. Tìm mục **Port Forwarding**. Tuỳ router, mục này có thể tên là *NAT*, *Virtual Server* hoặc *Advanced → NAT Forwarding*.
3. Tạo **1 rule**:

   | Tên | Giao thức | Port ngoài (External) | IP trong (Internal IP) | Port trong (Internal) |
   |---|---|---|---|---|
   | tienlen | TCP | 3000 | 192.168.1.11 | 3000 |

4. Lưu lại. Một số router cần khởi động lại mới áp dụng.

> Router của nhà mạng như VNPT, Viettel, FPT thường để mục này trong **Advanced / Nâng cao → NAT → Port Forwarding** hoặc **Virtual Server**.

### Bước 3: Mở firewall Windows

Nếu lúc chạy Node lần đầu Windows hỏi *"Allow access"* và bạn đã bấm **Allow** thì bỏ qua bước này. Nếu chưa, mở **PowerShell bằng quyền Administrator** và chạy:

```powershell
New-NetFirewallRule -DisplayName "TienLen 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

Khi không cần nữa, xoá rule này:
```powershell
Remove-NetFirewallRule -DisplayName "TienLen 3000"
```

### Bước 4: Lấy IP public và gửi link

- Tra IP public: mở https://ifconfig.me hoặc tìm "what is my ip" trên Google.
- Gửi link cho bạn bè: `http://<IP-public>:3000/tien-len`
- Tạo phòng xong, bấm **"Chép link mời"** để lấy link vào thẳng phòng: `http://<IP-public>:3000/tien-len/ABCDE`.

> Tự mở link bằng IP public từ mạng nhà bạn có thể không vào được, vì nhiều router không hỗ trợ *NAT loopback*. Trên máy bạn, cứ dùng `localhost`. Để kiểm tra, nhờ bạn bè mở thử, hoặc dùng 4G trên điện thoại.

### Bước 5: Kiểm tra port đã mở chưa

Trong lúc server đang chạy, vào https://www.yougetsignal.com/tools/open-ports/ hoặc https://canyouseeme.org và kiểm tra port `3000`. Kết quả phải báo **Open**.

---

## 5. Khi forward port không có tác dụng (CGNAT)

Nhiều nhà mạng ở Việt Nam dùng **CGNAT**: mạng nhà bạn không có IP public riêng, nên forward port không có tác dụng.

**Cách nhận biết:** so sánh **WAN IP** trong trang quản trị router với IP trên https://ifconfig.me.
- Hai IP giống nhau: bạn có IP public, forward port sẽ hoạt động.
- Hai IP khác nhau, hoặc WAN IP có dạng `100.64.x.x`–`100.127.x.x` hay `10.x.x.x`: mạng đang bị CGNAT.

**Cách xử lý:**
1. **Gọi tổng đài nhà mạng** xin **IP public** hoặc yêu cầu "tắt CGNAT". Một số nhà mạng làm miễn phí.
2. **Dùng tunnel Cloudflare** (miễn phí, không cần tài khoản, không cần mở port):
   ```bash
   npm --prefix game-server run share
   ```
   Terminal sẽ in ra một link `https://....trycloudflare.com/tien-len`, gửi link đó cho bạn bè. Link đổi mỗi lần chạy.
3. **Dùng VPN LAN ảo** như Tailscale, Radmin VPN hoặc ZeroTier. Mọi người cài cùng một ứng dụng và vào chung một mạng. Sau đó chơi như trong mạng LAN, bằng IP mà ứng dụng VPN cấp cho máy bạn (ví dụ `http://26.x.x.x:3000/tien-len` với Radmin, hoặc `http://100.x.x.x:3000/tien-len` với Tailscale).

---

## 6. Xử lý sự cố

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| Trang báo **"Không kết nối được máy chủ game"** | Router, proxy hoặc phần mềm diệt virus đang chặn WebSocket. Thử lại bằng 4G hoặc bằng `npm --prefix game-server run share`. Nếu bạn đặt `NEXT_PUBLIC_TIENLEN_SERVER_URL` thì kiểm tra lại giá trị đó. |
| Bạn bè không vào được trang | Kiểm tra port 3000 bằng canyouseeme.org. Kiểm tra mạng có bị CGNAT không (mục 5), và server trên máy bạn còn chạy không. |
| `EADDRINUSE: port 3000` | Có chương trình khác đang dùng cổng này. Tắt nó đi, hoặc đổi cổng: `set PORT=3001` rồi forward cổng mới. |
| Sửa code mà trang không đổi | Cần build lại: `npm run tienlen:host -- --build`. |
| Mất phòng sau khi tắt/bật lại server | Đây là hành vi bình thường: phòng chỉ lưu trong RAM, restart là mất hết. |
| Đang chơi bị văng | Mở lại đúng link phòng trong **cùng tab**. Server giữ chỗ ngồi 60 giây sau khi mất kết nối. |
| IP public đổi sau khi khởi động lại modem | Nhà mạng thường cấp IP động. Tra lại IP public rồi gửi link mới, hoặc dùng dịch vụ DDNS miễn phí như DuckDNS hay No-IP. |

---

## 7. Lưu ý bảo mật

- Mở port là cho **bất kỳ ai trên internet** truy cập vào 2 cổng này. Chỉ để server chạy khi đang chơi, chơi xong thì **Ctrl+C**.
- Trang `/admin` của portfolio cũng truy cập được qua cổng 3000. Hãy chắc chắn `ADMIN_PASSWORD` trong `.env` **không phải mật khẩu mặc định**.
- Kết nối đang dùng **http**, không mã hoá. Như vậy là ổn cho game bài giữa bạn bè, nhưng đừng nhập thông tin nhạy cảm qua đây.
- Không chơi nữa thì nên xoá các rule forward trên router.

---

## 8. Cấu hình tuỳ chọn

| Biến môi trường | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `3000` | Cổng web + game khi chạy `tienlen:host` |
| `HOST` | `0.0.0.0` | Địa chỉ lắng nghe. Đặt `127.0.0.1` nếu chỉ muốn chơi trên máy này |
| `REDIS_URL` | _(trống)_ | Lưu phòng trong Redis thay vì RAM, để phòng không mất khi restart |
| `NEXT_PUBLIC_TIENLEN_SERVER_URL` | _(trống)_ | Trỏ trang web tới server game ở origin khác. Áp dụng lúc build |
| `ALLOWED_ORIGIN` | `*` khi tự host | Giới hạn trang web nào được kết nối WebSocket, ví dụ `http://1.2.3.4:3000` |
