const router = require('express').Router();
const Product = require('../models/Product');
const verifyToken = require('../middleware/verifyToken');
const { productValidators, handleValidationErrors } = require('../validators');
const { isOwnerOrAdmin } = require('../utils/authorize');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('createdBy', 'name email role location');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a product (Farmer only)
router.post('/', verifyToken(['farmer']), productValidators, handleValidationErrors, async (req, res) => {
  try {
    const { title, description, imageUrl, currentMarketPrice, sellingPrice, tags } = req.body;
    const newProduct = new Product({
      title,
      description,
      imageUrl,
      currentMarketPrice: Number(currentMarketPrice),
      sellingPrice: Number(sellingPrice),
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.user.id
    });
    await newProduct.save();
    
    const populated = await Product.findById(newProduct._id).populate('createdBy', 'name email role location');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit a product (Farmer and Admin)
router.put('/:id', verifyToken(['farmer', 'admin']), productValidators, handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (!isOwnerOrAdmin(product.createdBy, req.user)) {
      return res.status(403).json({ error: 'Unauthorized to edit this product' });
    }
    
    Object.assign(product, req.body);
    await product.save();
    
    const populated = await Product.findById(product._id).populate('createdBy', 'name email role location');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product (Farmer and Admin)
router.delete('/:id', verifyToken(['farmer', 'admin']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (!isOwnerOrAdmin(product.createdBy, req.user)) {
      return res.status(403).json({ error: 'Unauthorized to delete this product' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
