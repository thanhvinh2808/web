# Hướng dẫn Cài đặt cho Thành viên mới (TechStore)

Để chạy dự án trơn tru và không bị lỗi đăng nhập, hãy làm theo các bước sau:

## 1. Cấu hình Môi trường (.env)

Bạn cần tạo 2 file cấu hình.

### Backend (Tại thư mục `apps/api/`)
Tạo file `.env` và copy nội dung sau:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/techstore
JWT_SECRET=techstore_secret_2024
JWT_EXPIRE=30d
COOKIE_EXPIRE=30
# Nếu dùng tính năng gửi mail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=
SMTP_PASSWORD=
CLIENT_URL=http://localhost:3000
```

### Frontend (Tại thư mục `apps/web/`)
Tạo file `.env.local` và copy nội dung sau:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 2. Cài đặt và Chạy

Mở Terminal tại thư mục gốc của dự án:

1.  **Cài đặt thư viện:**
    ```bash
    npm install
    ```

2.  **Tạo tài khoản Admin (QUAN TRỌNG):**
    Bước này giúp tạo sẵn một tài khoản để bạn đăng nhập ngay, tránh lỗi DB trống.
    ```bash
    cd apps/api
    npm run create:admin
    ```
    👉 **Tài khoản mặc định:** `admin@gmail.com` / `123456`

3.  **Chạy dự án:**
    Quay lại thư mục gốc và chạy:
    ```bash
    npm run dev
    ```

## 3. Nếu vẫn bị lỗi Login?

Nếu bấm Login mà bị chuyển trang lung tung:
1. Vào trang Login: `http://localhost:3000/login`
2. Tìm dòng chữ đỏ nhỏ ở dưới cùng: **"Gặp lỗi đăng nhập? Xóa cache"**.
3. Bấm vào đó để reset trình duyệt.
4. Đăng nhập lại với tài khoản Admin ở trên.
