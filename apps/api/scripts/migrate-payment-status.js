// backend/scripts/migrate-payment-status.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migratePaymentStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');

    // Đếm số đơn hàng cần migrate
    const count = await ordersCollection.countDocuments({ 
      isPaid: { $exists: true } 
    });
    
    console.log(`📊 Found ${count} orders to migrate`);

    if (count === 0) {
      console.log('✅ No orders to migrate');
      process.exit(0);
    }

    // Update tất cả đơn hàng
    const result = await ordersCollection.updateMany(
      { isPaid: { $exists: true } },
      [
        {
          $set: {
            paymentStatus: {
              $cond: {
                if: { $eq: ['$isPaid', true] },
                then: 'paid',
                else: 'unpaid'
              }
            }
          }
        },
        {
          $unset: 'isPaid' // Xóa field cũ
        }
      ]
    );

    console.log(`✅ Migrated ${result.modifiedCount} orders`);
    console.log('🎉 Migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migratePaymentStatus();

// Chạy: node backend/scripts/migrate-payment-status.js