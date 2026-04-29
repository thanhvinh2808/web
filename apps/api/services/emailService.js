// backend/services/emailService.js
import nodemailer from 'nodemailer';

// Hàm tạo transporter để đảm bảo lấy đúng process.env mới nhất
const getTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// ✅ Gửi email khi có đơn hàng mới
export const sendNewOrderEmail = async (order) => {
  try {
    const transporter = getTransporter();
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = order.shippingFee || 0;
    const discountAmount = order.discountAmount || 0;
    
    // Ở Việt Nam, giá bán lẻ thường ĐÃ BAO GỒM VAT 10%. 
    // Chúng ta hiển thị VAT để minh bạch nhưng KHÔNG cộng thêm vào tổng tiền.
    const vatAmount = Math.round(subtotal * 0.1); 

    const itemsList = order.items
      .map(item => {
        const variantText = (item.variant?.name || item.variantName) ? `<br/><small style="color: #666;">Phân loại: ${item.variant?.name || item.variantOption || item.variantName}</small>` : '';
        return `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">
              <strong>${item.productName}</strong>${variantText}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${item.price.toLocaleString('vi-VN')}đ</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
          </tr>
        `;
      })
      .join('');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #0070f3; border-bottom: 2px solid #0070f3; padding-bottom: 10px; text-align: center;">
          🛒 XÁC NHẬN ĐƠN HÀNG MỚI (ADMIN)
        </h2>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Thông tin khách hàng:</h3>
          <p style="margin: 5px 0;"><strong>Họ tên:</strong> ${order.customerInfo.fullName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${order.customerInfo.email}</p>
          <p style="margin: 5px 0;"><strong>Số điện thoại:</strong> ${order.customerInfo.phone}</p>
          <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${order.customerInfo.address}</p>
          ${order.customerInfo.notes ? `<p style="margin: 5px 0;"><strong>Ghi chú:</strong> ${order.customerInfo.notes}</p>` : ''}
        </div>

        <h3 style="color: #333;">Chi tiết sản phẩm:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
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

        <div style="text-align: right; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          <p style="margin: 5px 0;"><strong>Tạm tính:</strong> ${subtotal.toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0; font-size: 11px; color: #999;">(Trong đó VAT 10% ước tính: ${vatAmount.toLocaleString('vi-VN')}đ)</p>
          <p style="margin: 5px 0;"><strong>Phí vận chuyển:</strong> +${shippingFee.toLocaleString('vi-VN')}đ</p>
          ${discountAmount > 0 ? `<p style="margin: 5px 0; color: #dc3545;"><strong>Giảm giá:</strong> -${discountAmount.toLocaleString('vi-VN')}đ</p>` : ''}
          <p style="font-size: 18px; margin-top: 10px; color: #333;"><strong>TỔNG CỘNG:</strong> <span style="color: #0070f3; font-size: 24px; font-weight: bold;">${order.totalAmount.toLocaleString('vi-VN')}đ</span></p>
        </div>

        <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; font-size: 13px; color: #666;">
          <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> ${order.orderNumber || order._id}</p>
          <p style="margin: 5px 0;"><strong>Phương thức thanh toán:</strong> ${order.paymentMethod.toUpperCase()}</p>
          <p style="margin: 5px 0;"><strong>Thời gian đặt:</strong> ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} FootMark. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"FootMark" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🛒 Đơn hàng mới #${(order.orderNumber || order._id.toString()).slice(-6).toUpperCase()} - ${order.customerInfo.fullName}`,
      html: emailContent,
    });

    console.log('✅ Email đơn hàng đã được gửi tới admin');
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email đơn hàng:', error);
    return { success: false, error: error.message };
  }
};

// ✅ Gửi email xác nhận đơn hàng cho KHÁCH HÀNG
export const sendUserOrderConfirmation = async (order) => {
  try {
    const transporter = getTransporter();
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = order.shippingFee || 0;
    const discountAmount = order.discountAmount || 0;

    const itemsList = order.items
      .map(item => {
        const variantText = (item.variantName || item.variant?.name) ? `<br/><small style="color: #666;">Size/Màu: ${item.variantOption || item.variant?.options?.[0]?.name || item.variantName || item.variant?.name}</small>` : '';
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <div style="font-weight: bold; color: #333;">${item.productName}</div>
              ${variantText}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString('vi-VN')}đ</td>
          </tr>
        `;
      })
      .join('');

    const emailContent = `
      <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 1px solid #eee; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
        <div style="background-color: #000; padding: 40px 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; letter-spacing: 8px; font-style: italic; font-weight: 900; font-size: 28px;">FOOTMARK.</h1>
          <p style="color: #00e5ff; margin: 10px 0 0 0; text-transform: uppercase; font-size: 10px; letter-spacing: 3px; font-weight: bold;">Cảm ơn bạn đã đặt hàng!</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333; font-size: 20px; margin-top: 0;">Xin chào ${order.customerInfo.fullName},</h2>
          <p style="color: #666; line-height: 1.6;">Đơn hàng của bạn đã được tiếp nhận và đang trong quá trình xử lý. Chúng tôi sẽ thông báo cho bạn ngay khi đơn hàng được gửi đi.</p>
          
          <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <table style="width: 100%; font-size: 14px; color: #444;">
              <tr>
                <td style="padding-bottom: 10px;"><strong>Mã đơn hàng:</strong></td>
                <td style="padding-bottom: 10px; text-align: right; color: #0070f3; font-weight: bold;">#${(order.orderNumber || order._id.toString()).slice(-6).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 10px;"><strong>Ngày đặt:</strong></td>
                <td style="padding-bottom: 10px; text-align: right;">${new Date(order.createdAt).toLocaleString('vi-VN')}</td>
              </tr>
              <tr>
                <td><strong>Trạng thái:</strong></td>
                <td style="text-align: right;"><span style="background-color: #fff3cd; color: #856404; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">Chờ xác nhận</span></td>
              </tr>
            </table>
          </div>

          <h3 style="color: #333; font-size: 16px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">Chi tiết sản phẩm</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                <th style="padding: 10px; text-align: left; font-weight: normal;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center; font-weight: normal;">SL</th>
                <th style="padding: 10px; text-align: right; font-weight: normal;">Giá</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <div style="background-color: #fcfcfc; padding: 20px; border-radius: 10px;">
            <table style="width: 100%; color: #666; font-size: 14px;">
              <tr>
                <td style="padding-bottom: 8px;">Tạm tính</td>
                <td style="text-align: right; padding-bottom: 8px;">${subtotal.toLocaleString('vi-VN')}đ</td>
              </tr>
              ${discountAmount > 0 ? `
              <tr>
                <td style="padding-bottom: 8px; color: #dc3545;">Giảm giá</td>
                <td style="text-align: right; padding-bottom: 8px; color: #dc3545;">-${discountAmount.toLocaleString('vi-VN')}đ</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding-bottom: 8px;">Phí vận chuyển</td>
                <td style="text-align: right; padding-bottom: 8px;">${shippingFee > 0 ? shippingFee.toLocaleString('vi-VN') + 'đ' : 'Miễn phí'}</td>
              </tr>
              <tr style="font-size: 18px; color: #000; font-weight: bold;">
                <td style="padding-top: 15px; border-top: 1px solid #eee;">Tổng thanh toán</td>
                <td style="text-align: right; padding-top: 15px; border-top: 1px solid #eee; color: #0070f3;">${order.totalAmount.toLocaleString('vi-VN')}đ</td>
              </tr>
            </table>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #999; text-align: right;">(Giá đã bao gồm thuế VAT)</p>
          </div>

          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 25px;">
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <div style="flex: 1;">
                <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #999; text-transform: uppercase;">Địa chỉ giao hàng</h4>
                <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.5;">
                  <strong>${order.customerInfo.fullName}</strong><br/>
                  ${order.customerInfo.phone}<br/>
                  ${order.customerInfo.address}
                </p>
              </div>
              <div style="flex: 1; text-align: right;">
                <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #999; text-transform: uppercase;">Thanh toán</h4>
                <p style="margin: 0; font-size: 14px; color: #333;">${order.paymentMethod.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" style="display: inline-block; background-color: #000; color: #fff; padding: 15px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">THEO DÕI ĐƠN HÀNG</a>
          </div>
        </div>

        <div style="background-color: #fafafa; padding: 30px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0 0 10px 0;">Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ hotline hoặc trả lời email này.</p>
          <p style="margin: 0;">© ${new Date().getFullYear()} FootMark. Authentic Sneakers & Streetwear.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"FootMark" <${process.env.ADMIN_EMAIL}>`,
      to: order.customerInfo.email,
      subject: `👟 Xác nhận đơn hàng #${(order.orderNumber || order._id.toString()).slice(-6).toUpperCase()} tại FootMark`,
      html: emailContent,
    });

    console.log(`✅ Email xác nhận đã được gửi tới khách hàng: ${order.customerInfo.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email xác nhận cho khách hàng:', error);
    return { success: false, error: error.message };
  }
};

// ✅ Gửi email khi có liên hệ mới
export const sendNewContactEmail = async (contact) => {
  try {
    const transporter = getTransporter();
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
      from: `"FootMark" <${process.env.ADMIN_EMAIL}>`,
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
    const transporter = getTransporter();
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0070f3;">Xin chào ${customerName},</h2>
        
        <p>Cảm ơn bạn đã liên hệ với FootMark. Đây là phản hồi từ chúng tôi:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="white-space: pre-wrap; line-height: 1.6;">${replyMessage}</p>
        </div>

        <p>Nếu bạn có thêm câu hỏi, vui lòng liên hệ lại với chúng tôi.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          <strong>FootMark</strong><br>
          Email: ${process.env.ADMIN_EMAIL}<br>
          © ${new Date().getFullYear()} FootMark. All rights reserved.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"FootMark Support" <${process.env.ADMIN_EMAIL}>`,
      to: customerEmail,
      subject: 'Phản hồi từ FootMark',
      html: emailContent,
    });

    console.log(`✅ Email phản hồi đã được gửi tới ${customerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email phản hồi:', error);
    return { success: false, error: error.message };
  }
};

// ✅ Gửi email cập nhật trạng thái Trade-In
export const sendTradeInUpdateEmail = async (tradeIn, replyMessage) => {
  try {
    const transporter = getTransporter();
    const customerEmail = tradeIn.userId?.email;
    const customerName = tradeIn.userId?.name || tradeIn.contactInfo?.name || 'Khách hàng';

    if (!customerEmail) {
        throw new Error('Không tìm thấy email khách hàng');
    }

    const statusColor = {
        'approved': '#28a745',
        'rejected': '#dc3545',
        'evaluating': '#ffc107',
        'completed': '#007bff'
    }[tradeIn.status] || '#6c757d';

    const statusText = {
        'approved': 'ĐÃ ĐỊNH GIÁ / CHẤP NHẬN',
        'rejected': 'TỪ CHỐI',
        'evaluating': 'ĐANG ĐỊNH GIÁ',
        'completed': 'HOÀN TẤT'
    }[tradeIn.status] || tradeIn.status.toUpperCase();

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: black; padding: 20px; text-align: center;">
             <h2 style="color: white; margin: 0; font-style: italic;">FOOTMARK TRADE-IN</h2>
        </div>
        
        <div style="padding: 30px;">
            <h3 style="margin-top: 0;">Xin chào ${customerName},</h3>
            <p>Yêu cầu thu cũ đổi mới cho sản phẩm <strong>${tradeIn.productName}</strong> của bạn đã được cập nhật trạng thái:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="background-color: ${statusColor}; color: white; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 16px;">
                    ${statusText}
                </span>
            </div>
            ${tradeIn.finalPrice > 0 ? `
            <div style="background-color: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; color: #666; font-size: 14px;">Giá thu mua đề xuất:</p>
                <p style="margin: 5px 0 0 0; color: #0070f3; font-size: 28px; font-weight: bold;">
                    ${tradeIn.finalPrice.toLocaleString('vi-VN')}đ
                </p>
            </div>
            ` : ''}
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                <p style="margin: 0; font-weight: bold; color: #856404;">Phản hồi từ chuyên gia:</p>
                <p style="margin: 5px 0 0 0; color: #856404;">${replyMessage || tradeIn.adminNote || 'Chúng tôi đang xử lý yêu cầu của bạn.'}</p>
            </div>
            <p>Vui lòng truy cập website hoặc liên hệ hotline để biết thêm chi tiết về quy trình giao dịch tiếp theo.</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>Đây là email tự động, vui lòng không trả lời trực tiếp email này.</p>
            <p>© 2026 FootMark - Authentic Sneakers & Streetwear</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"FootMark Trade-In" <${process.env.ADMIN_EMAIL}>`,
      to: customerEmail,
      subject: `[Cập Nhật Trade-In] ${tradeIn.productName} - ${statusText}`,
      html: emailContent,
    });

    console.log(`✅ Email Trade-In đã được gửi tới ${customerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email Trade-In:', error);
    return { success: false, error: error.message };
  }
};

// ✅ Gửi email OTP Quên mật khẩu
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = getTransporter();
    const emailContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background-color: #000; padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0; letter-spacing: 5px; font-style: italic; font-weight: 900;">FOOTMARK.</h1>
          <p style="color: #aaa; margin: 10px 0 0 0; text-transform: uppercase; font-size: 10px; letter-spacing: 2px;">Authentic Sneakers & Streetwear</p>
        </div>
        
        <div style="padding: 40px 30px; text-align: center; background-color: #fff;">
          <h2 style="color: #333; margin-top: 0; font-size: 24px; font-weight: 800; text-transform: uppercase;">Xác thực tài khoản</h2>
          <p style="color: #666; font-size: 15px; line-height: 1.6;">Chào bạn, chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản FootMark của bạn. Vui lòng sử dụng mã OTP bên dưới để tiếp tục:</p>
          <div style="margin: 35px 0; padding: 20px; background-color: #f8f9fa; border: 2px dashed #ddd; border-radius: 8px;">
            <span style="font-family: monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #000; display: block;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 13px;">Mã này có hiệu lực trong vòng <strong>60 phút</strong>.</p>
          <p style="color: #ee4d2d; font-size: 12px; margin-top: 25px; font-weight: 600;">⚠️ Tuyệt đối không chia sẻ mã này với bất kỳ ai để bảo mật tài khoản.</p>
        </div>
        
        <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #bbb; font-size: 11px; margin: 0;">Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ.</p>
          <p style="color: #bbb; font-size: 11px; margin: 5px 0 0 0;">© 2026 FootMark Team. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"FootMark Security" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: `[FootMark] Mã xác thực OTP: ${otp}`,
      html: emailContent,
    });

    console.log(`✅ OTP email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

export default { 
  sendNewOrderEmail, 
  sendUserOrderConfirmation,
  sendNewContactEmail, 
  sendReplyEmail,
  sendTradeInUpdateEmail,
  sendOTPEmail
};
