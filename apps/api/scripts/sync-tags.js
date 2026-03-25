import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: false });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing in .env');
  process.exit(1);
}

const syncTags = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected.');

    console.log('🔄 Fetching all products...');
    const products = await Product.find({});
    console.log(`📊 Found ${products.length} products.`);

    let updatedCount = 0;
    
    console.log('🚀 Starting tag synchronization...');
    for (const product of products) {
      // Just saving the product will trigger the 'pre-save' hook we just added
      // which contains the auto-tagging logic.
      await product.save();
      updatedCount++;
      process.stdout.write(`\r✅ Processed: ${updatedCount}/${products.length}`);
    }

    console.log('\n\n✨ Synchronization Complete!');
    console.log('📝 Logic Applied:');
    console.log('   - Condition "100%", "New" -> Tag ["new"]');
    console.log('   - Others -> Tag ["2hand"]');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
};

syncTags();
