// backend/services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Tạo transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ✅ Gửi email khi có đơn hàng mới
export const sendNewOrderEmail = async (order) => {
  try {
    const itemsList = order.items
      .map(item => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${item.price.toLocaleString('vi-VN')}đ</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
        </tr>
      `)
      .join('');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0070f3; border-bottom: 2px solid #0070f3; padding-bottom: 10px;">
          🛒 ĐơN HÀNG MỚI
        </h2>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Thông tin khách hàng:</h3>
          <p><strong>Họ tên:</strong> ${order.customerInfo.fullName}</p>
          <p><strong>Email:</strong> ${order.customerInfo.email}</p>
          <p><strong>Số điện thoại:</strong> ${order.customerInfo.phone}</p>
          <p><strong>Địa chỉ:</strong> ${order.customerInfo.address}</p>
        </div>

        <h3>Chi tiết đơn hàng:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #0070f3; color: white;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Sản phẩm</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">SL</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Đơn giá</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <p style="font-size: 18px;"><strong>Tổng cộng:</strong> <span style="color: #0070f3; font-size: 24px;">${order.totalAmount.toLocaleString('vi-VN')}đ</span></p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px;">
          <p style="margin: 0;"><strong>Ghi chú:</strong> ${order.customerInfo.notes || 'Không có'}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <p><strong>Mã đơn hàng:</strong> ${order._id}</p>
          <p><strong>Thời gian:</strong> ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          <p><strong>Trạng thái:</strong> <span style="color: #ffc107; font-weight: bold;">Chờ xử lý</span></p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"TechStore" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🛒 Đơn hàng mới #${order._id.toString().slice(-6)} - ${order.customerInfo.fullName}`,
      html: emailContent,
    });

    console.log('✅ Email đơn hàng đã được gửi tới admin');
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email đơn hàng:', error);
    return { success: false, error: error.message };
  }
};

// ✅ Gửi email khi có liên hệ mới
export const sendNewContactEmail = async (contact) => {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0070f3; border-bottom: 2px solid #0070f3; padding-bottom: 10px;">
          📧 LIÊN HỆ MỚI
        </h2>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Thông tin người gửi:</h3>
          <p><strong>Họ tên:</strong> ${contact.fullname}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Thời gian:</strong> ${new Date(contact.createdAt).toLocaleString('vi-VN')}</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="margin-top: 0;">Nội dung:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${contact.message}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #0070f3;">
          <p style="margin: 0;"><strong>Trạng thái:</strong> Chờ phản hồi</p>
          <p style="margin: 5px 0 0 0;"><strong>ID:</strong> ${contact._id}</p>
        </div>

        <div style="margin-top: 20px; text-align: center;">
          <a href="mailto:${contact.email}" style="display: inline-block; padding: 12px 30px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
            Trả lời ngay
          </a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"TechStore" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📧 Liên hệ mới từ ${contact.fullname}`,
      html: emailContent,
    });

    console.log('✅ Email liên hệ đã được gửi tới admin');
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email liên hệ:', error);
    return { success: false, error: error.message };
  }
};

// ✅ Gửi email phản hồi cho khách hàng
export const sendReplyEmail = async (customerEmail, customerName, replyMessage) => {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0070f3;">Xin chào ${customerName},</h2>
        
        <p>Cảm ơn bạn đã liên hệ với TechStore. Đây là phản hồi từ chúng tôi:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="white-space: pre-wrap; line-height: 1.6;">${replyMessage}</p>
        </div>

        <p>Nếu bạn có thêm câu hỏi, vui lòng liên hệ lại với chúng tôi.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          <strong>TechStore</strong><br>
          Email: ${process.env.ADMIN_EMAIL}<br>
          © ${new Date().getFullYear()} TechStore. All rights reserved.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"TechStore Support" <${process.env.ADMIN_EMAIL}>`,
      to: customerEmail,
      subject: 'Phản hồi từ TechStore',
      html: emailContent,
    });

    console.log(`✅ Email phản hồi đã được gửi tới ${customerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email phản hồi:', error);
    return { success: false, error: error.message };
  }
};

export default { 
  sendNewOrderEmail, 
  sendNewContactEmail, 
  sendReplyEmail 
};