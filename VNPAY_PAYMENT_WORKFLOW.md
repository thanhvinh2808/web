# Workflow thanh toán VNPay

Tài liệu mô tả luồng (workflow) tích hợp thanh toán VNPay trong dự án FootMark.

---

## Tổng quan

- **Frontend:** Next.js (`apps/web`)
- **Backend:** Express API (`apps/api`)
- **Cổng thanh toán:** VNPay Sandbox / Production
- **Luồng:** Tạo đơn → Redirect sang VNPay → Khách thanh toán → IPN (server) + Return URL (user) → Cập nhật đơn & hiển thị kết quả

---

## Sơ đồ luồng (sequence)

```
┌──────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│ User │     │ Frontend │     │ Backend │     │  VNPay   │
└──┬───┘     └────┬─────┘     └────┬────┘     └────┬─────┘
   │              │                │               │
   │ 1. Chọn VNPay, bấm Đặt hàng   │               │
   │─────────────>│                │               │
   │              │ 2. POST /api/orders            │
   │              │    (paymentMethod: vnpay)      │
   │              │───────────────>│               │
   │              │                │ 3. Tạo đơn    │
   │              │                │    (pending,  │
   │              │                │     unpaid)   │
   │              │                │ 4. Build      │
   │              │                │    paymentUrl │
   │              │ 5. { order, paymentUrl }       │
   │              │<───────────────│               │
   │ 6. Redirect to paymentUrl     │               │
   │<─────────────│                │               │
   │ 7. Mở trang VNPay             │               │
   │──────────────────────────────────────────────>│
   │              │                │               │
   │ 8. Nhập thẻ / QR, xác nhận    │               │
   │──────────────────────────────────────────────>│
   │              │                │ 9. IPN GET    │
   │              │                │    /api/vnpay/ipn?...
   │              │                │<──────────────│
   │              │                │ 10. Verify    │
   │              │                │     checksum, │
   │              │                │     update    │
   │              │                │     order paid│
   │              │                │ 11. IpnSuccess│
   │              │                │──────────────>│
   │              │                │               │
   │ 12. Redirect to vnp_ReturnUrl │               │
   │<──────────────────────────────────────────────│
   │ 13. GET /payment/vnpay-return?vnp_xxx=...     │
   │─────────────>│                │               │
   │              │ 14. GET /api/vnpay/return?     │
   │              │     (verify query params)      │
   │              │───────────────>│               │
   │              │ 15. JSON result                │
   │              │<───────────────│               │
   │ 16. Hiển thị Thành công / Thất bại            │
   │<─────────────│                │               │
```

---

## Các bước chi tiết

### 1. Checkout – User chọn VNPay và đặt hàng

- **Trang:** `apps/web/app/checkout/page.tsx`
- User chọn phương thức **Thanh toán VNPay**, điền thông tin, bấm **Thanh toán qua VNPay**.
- Frontend gửi `POST /api/orders` với `paymentMethod: 'vnpay'` và dữ liệu đơn (items, customerInfo, totalAmount, ...).

### 2. Backend tạo đơn và trả payment URL

- **File:** `apps/api/controller/orderController.js` (hàm `createOrder`)
- Backend:
  - Xác minh giá, trừ kho, tạo đơn với `status: 'pending'`, `paymentStatus: 'unpaid'`.
  - Nếu `paymentMethod === 'vnpay'` và VNPay đã cấu hình:
    - Gọi `getVnpay().buildPaymentUrl(...)` với:
      - `vnp_Amount`: tổng tiền đơn
      - `vnp_TxnRef`: `{orderNumber}-{timestamp}` (để sau này map lại đơn)
      - `vnp_ReturnUrl`: `VNPAY_RETURN_URL` (ví dụ `http://localhost:3000/payment/vnpay-return`)
      - Các tham số khác (IP, OrderInfo, Locale, ...)
    - Trả về `{ success, order, paymentUrl }`.
- Frontend nhận `paymentUrl` → `window.location.href = paymentUrl` để chuyển sang trang VNPay.

### 3. User thanh toán trên VNPay

- User vào trang VNPay (sandbox hoặc production), chọn ngân hàng / thẻ, nhập thông tin và xác nhận.
- VNPay xử lý giao dịch (thành công hoặc thất bại).

### 4. IPN (Instant Payment Notification) – Nguồn xác nhận chính

- **Endpoint:** `GET /api/vnpay/ipn` (không dùng Authorization).
- **Gọi bởi:** Server VNPay (server-to-server), sau khi giao dịch kết thúc.
- **File:** `apps/api/controller/vnpayController.js` → `handleIpn`.
- Luồng:
  1. Verify checksum từ query (bảo mật).
  2. Nếu `!verify.isSuccess` → trả response lỗi theo chuẩn VNPay.
  3. Từ `vnp_TxnRef` lấy `orderNumber` (phần trước dấu `-` cuối).
  4. Tìm đơn theo `orderNumber`, kiểm tra `vnp_Amount === order.totalAmount`, không cho trùng giao dịch (đã paid thì trả InpOrderAlreadyConfirmed).
  5. Cập nhật đơn: `paymentStatus: 'paid'`, `isPaid: true`, `paidAt`, `vnpayTransactionId`; nếu đang `pending` thì set `status: 'processing'`.
  6. Emit Socket.io `orderStatusUpdated` cho user và admin.
  7. Trả response chuẩn VNPay (ví dụ `IpnSuccess`).

**Lưu ý:** IPN là nguồn tin chính để cập nhật “đã thanh toán”. Return URL chỉ dùng để hiển thị cho user.

### 5. Return URL – User quay lại website

- **Trang:** `apps/web/app/payment/vnpay-return/page.tsx`
- VNPay redirect user về `VNPAY_RETURN_URL` kèm query (vnp_TxnRef, vnp_ResponseCode, vnp_Amount, ...).
- Trang này gọi `GET /api/vnpay/return?{query}` để backend verify query và trả JSON (success, message, orderNumber, orderId, amount, transactionNo, bankCode, payDate).
- Frontend dựa vào kết quả để hiển thị **Thanh toán thành công** hoặc **Thanh toán thất bại**, và link “Xem đơn hàng” / “Thử lại”.

### 6. Backend verify Return URL

- **Endpoint:** `GET /api/vnpay/return`
- **File:** `apps/api/controller/vnpayController.js` → `handleReturn`
- Chỉ verify checksum và trả dữ liệu cho giao diện; **không** cập nhật đơn ở đây (đơn đã được cập nhật ở bước IPN).

---

## Cấu hình môi trường

Trong `.env` (root hoặc `apps/api`):

| Biến | Ý nghĩa |
|------|--------|
| `VNPAY_TMN_CODE` | Mã terminal (vnp_TmnCode) từ VNPay |
| `VNPAY_SECURE_SECRET` | Chuỗi bí mật tạo/verify checksum (vnp_HashSecret) |
| `VNPAY_RETURN_URL` | URL user được redirect về sau khi thanh toán (ví dụ `http://localhost:3000/payment/vnpay-return`) |

IPN URL (VNPay gọi về) phải cấu hình trên cổng VNPay (SIT Testing / Merchant Admin), ví dụ:

- Local: dùng ngrok, ví dụ `https://xxx.ngrok-free.app/api/vnpay/ipn`
- Production: `https://yourdomain.com/api/vnpay/ipn`

---

## Các file liên quan

| Vai trò | File / Route |
|--------|------------------|
| Cấu hình VNPay | `apps/api/config/vnpay.js` |
| Tạo đơn + build payment URL | `apps/api/controller/orderController.js` |
| IPN, Return, CreatePaymentUrl | `apps/api/controller/vnpayController.js` |
| Route VNPay | `apps/api/routes/vnpay.js` → mount `/api/vnpay` |
| Checkout (chọn VNPay, redirect) | `apps/web/app/checkout/page.tsx` |
| Trang kết quả sau thanh toán | `apps/web/app/payment/vnpay-return/page.tsx` |
| Order success (hiển thị VNPay) | `apps/web/app/order-success/page.tsx` |
| Model Order (vnpay, vnpayTransactionId) | `apps/api/models/Order.js` |

---

## Thẻ test (Sandbox)

- **Ngân hàng:** NCB  
- **Số thẻ:** 9704198526191432198  
- **Tên:** NGUYEN VAN A  
- **Ngày:** 07/15  
- **OTP:** 123456  

---

## Lưu ý bảo mật

- **IPN** verify checksum trước khi cập nhật đơn; so khớp `vnp_Amount` với `order.totalAmount`; tránh cập nhật trùng khi đơn đã paid.
- **VNPAY_SECURE_SECRET** không gửi ra frontend, chỉ dùng ở backend.
- Return URL chỉ dùng để hiển thị; quyết định “đã thanh toán” dựa trên IPN.
