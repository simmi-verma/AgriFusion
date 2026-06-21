const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/farmmarketplace';

mongoose.connect(mongoUrl)
  .then(() => {
    console.log("🌱 Connected to MongoDB for seeding products");
    seedData();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

async function seedData() {
  try {
    // 1. Create a dummy farmer if none exists
    const farmerEmail = 'farmer@agrifusion.com';
    let farmer = await User.findOne({ email: farmerEmail });
    if (!farmer) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      farmer = new User({
        name: 'Farmer Ramesh',
        email: farmerEmail,
        password: hashedPassword,
        role: 'farmer',
        isVerifiedFarmer: true,
        location: {
          city: 'Karnal',
          state: 'Haryana',
          country: 'India',
          pincode: '132001'
        }
      });
      await farmer.save();
      console.log('✅ Created dummy farmer: farmer@agrifusion.com / password123');
    }

    // 2. Check and seed products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const products = [
        {
          title: 'Organic Basmati Rice',
          description: 'Aged long-grain aromatic Basmati rice cultivated using fully organic methods in Haryana. Pesticide-free, excellent aroma and texture.',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600',
          currentMarketPrice: 110,
          sellingPrice: 85,
          tags: ['Organic', 'Grains', 'Rabi', 'Fresh Produce'],
          createdBy: farmer._id
        },
        {
          title: 'Fresh Red Tomatoes',
          description: 'Plump, juicy field-ripened red tomatoes. Handpicked daily and delivered directly from the farm to preserve flavor and shelf life.',
          imageUrl: 'https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=600',
          currentMarketPrice: 40,
          sellingPrice: 25,
          tags: ['Vegetables', 'Fresh Produce', 'Kharif'],
          createdBy: farmer._id
        },
        {
          title: 'Premium Wheat Grains',
          description: 'High-gluten Sharbati variety wheat grains, cleaned and filtered. Perfect for making soft chapatis and traditional breads.',
          imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=600',
          currentMarketPrice: 35,
          sellingPrice: 28,
          tags: ['Grains', 'Rabi', 'Fresh Produce'],
          createdBy: farmer._id
        },
        {
          title: 'Organic Russet Potatoes',
          description: 'Rich-flavored russet potatoes grown in mineral-rich soil. Ideal for baking, mashing, and cooking traditional Indian dishes.',
          imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=600',
          currentMarketPrice: 25,
          sellingPrice: 18,
          tags: ['Vegetables', 'Fresh Produce', 'Rabi'],
          createdBy: farmer._id
        }
      ];

      await Product.insertMany(products);
      console.log(' Successfully seeded 4 crops in the marketplace.');
    } else {
      console.log('Products already exist in database. Seeding skipped.');
    }
  } catch (err) {
    console.error('Seeding failed:', err);
  }
  process.exit();
}
