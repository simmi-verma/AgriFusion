const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const registerValidators = [
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').trim(),
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('role').isIn(['farmer', 'customer']).withMessage('Role must be farmer or customer'),
  body('city').optional().trim().escape(),
  body('state').optional().trim().escape(),
  body('country').optional().trim().escape(),
  body('pincode').optional().trim().escape()
];

const loginValidators = [
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required').trim()
];

const productValidators = [
  body('title').notEmpty().withMessage('Product title is required').trim().escape(),
  body('description').notEmpty().withMessage('Product description is required').trim().escape(),
  body('imageUrl').isURL().withMessage('Provide a valid image URL'),
  body('currentMarketPrice').isNumeric().withMessage('Market price must be a number'),
  body('sellingPrice').isNumeric().withMessage('Selling price must be a number')
];

module.exports = {
  handleValidationErrors,
  registerValidators,
  loginValidators,
  productValidators
};
