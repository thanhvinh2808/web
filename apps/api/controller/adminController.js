import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// 🔔 Create Notification (Helper for internal use)
export const createNotification = async (type, message, referenceId, referenceModel) => {
  try {
    const notification = await Notification.create({
      type,
      message,
      referenceId,
      referenceModel
    });

    // Realtime Socket emit
    if (global.io) {
      global.io.to('admin').emit('newNotification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

// 🔔 Get Notifications
export const getNotifications = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔔 Mark Notification as Read
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔔 Mark All as Read
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📊 Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders,
      newUsersThisMonth
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email'),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        newUsersThisMonth,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê: ' + error.message
    });
  }
};

// 👥 Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách users: ' + error.message
    });
  }
};

// 🔄 Update User Role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật role thành công',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật role: ' + error.message
    });
  }
};

// 🗑️ Delete User
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Xóa user thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa user: ' + error.message
    });
  }
};

// 📦 Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    
    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách orders: ' + error.message
    });
  }
};

// 🔄 Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status không hợp lệ'
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật order: ' + error.message
    });
  }
};
// 🔑 Reset User Password
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    console.log('🔑 Reset password request for user:', userId);

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password phải có ít nhất 6 ký tự'
      });
    }

    // Hash password mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    const user = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }

    console.log('✅ Password reset thành công cho:', user.email);

    res.json({
      success: true,
      message: 'Reset password thành công',
      data: user
    });
  } catch (error) {
    console.error('❌ Error reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi reset password: ' + error.message
    });
  }
};

// 🔍 Global Search
export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: { products: [], users: [], orders: [] }
      });
    }

    const searchRegex = new RegExp(q, 'i');
    
    // Xây dựng query cho Order
    const orderQuery = {
      $or: [
        { 'customerInfo.fullName': { $regex: searchRegex } }
      ]
    };

    // Chỉ tìm theo ID nếu q là ObjectId hợp lệ
    if (mongoose.Types.ObjectId.isValid(q)) {
       orderQuery.$or.push({ _id: q });
    }

    const [products, users, orders] = await Promise.all([
      // Tìm sản phẩm
      Product.find({ 
        name: { $regex: searchRegex } 
      }).select('name image price slug categorySlug').limit(5),

      // Tìm user
      User.find({
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } }
        ]
      }).select('name email role').limit(5),

      // Tìm đơn hàng
      Order.find(orderQuery).select('_id totalAmount status userId createdAt customerInfo').limit(5)
    ]);

    res.json({
      success: true,
      data: { products, users, orders }
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tìm kiếm: ' + error.message
    });
  }
};

// 💰 Get Revenue Stats (Advanced)
export const getRevenueStats = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    // Default: Last 7 days if not provided
    if (!startDate || !endDate) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6); // 7 days inclusive
      
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Calculate All-time Revenue
    const totalRevenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalAllTime = totalRevenueResult[0]?.total || 0;

    // 2. Calculate Revenue in Range (Group by Date)
    const revenueByDate = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['delivered', 'completed'] },
          createdAt: { $gte: start, $lte: end }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Fill missing dates with 0
    const filledData = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = revenueByDate.find(item => item._id === dateStr);

      if (existingData) {
        filledData.push({
          name: dateStr.split('-').reverse().slice(0, 2).join('/'), // DD/MM
          fullDate: dateStr,
          total: existingData.total,
          orders: existingData.count
        });
      } else {
        filledData.push({
          name: dateStr.split('-').reverse().slice(0, 2).join('/'), // DD/MM
          fullDate: dateStr,
          total: 0,
          orders: 0
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 4. Calculate total for the selected range
    const totalInRange = filledData.reduce((acc, cur) => acc + cur.total, 0);

    res.json({
      success: true,
      data: {
        totalAllTime,
        totalInRange,
        chartData: filledData,
        range: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi thống kê doanh thu: ' + error.message
    });
  }
};