# Local Fonts Directory

Để đảm bảo font chữ luôn tải được khi mạng lag (không phụ thuộc vào Google Fonts/CDN), bạn có thể tải các file font về máy tính và bỏ vào thư mục này.

## Cách sử dụng:

1.  Tải file font định dạng `.woff2` (định dạng tối ưu nhất cho web).
2.  Bỏ file vào thư mục `apps/web/public/fonts/`.
3.  Cấu hình trong `apps/web/app/layout.tsx` bằng `next/font/local`.

Ví dụ: nếu bạn có font `FootMark-Bold.woff2`, bạn có thể import và sử dụng trong project.

*Lưu ý: Hiện tại project đang dùng `next/font/google`. Next.js đã tự động tải (download) và tự lưu trữ (self-hosting) các font này tại thời điểm build, nên chúng cũng hoạt động tốt khi mạng lag.*
