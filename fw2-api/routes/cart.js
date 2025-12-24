import { Router } from 'express';
const router = Router();

// Database giả lập
let carts = {};

// Lấy giỏ hàng
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const cart = carts[userId] || [];
  res.json(cart);
});

// Thêm sản phẩm vào giỏ
router.post('/:userId', (req, res) => {
  const { userId } = req.params;
  const { productId, quantity } = req.body;

  if (!carts[userId]) {
    carts[userId] = [];
  }

  const existingItem = carts[userId].find(item => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[userId].push({ productId, quantity });
  }

  res.json({ message: 'Đã thêm vào giỏ hàng', cart: carts[userId] });
});

// Cập nhật số lượng
router.put('/:userId/:productId', (req, res) => {
  const { userId, productId } = req.params;
  const { quantity } = req.body;

  if (!carts[userId]) {
    return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
  }

  const item = carts[userId].find(item => item.productId === parseInt(productId));

  if (!item) {
    return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng' });
  }

  item.quantity = quantity;
  res.json({ message: 'Đã cập nhật', cart: carts[userId] });
});

// Xóa sản phẩm khỏi giỏ
router.delete('/:userId/:productId', (req, res) => {
  const { userId, productId } = req.params;

  if (!carts[userId]) {
    return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
  }

  carts[userId] = carts[userId].filter(item => item.productId !== parseInt(productId));
  res.json({ message: 'Đã xóa khỏi giỏ hàng', cart: carts[userId] });
});

// Xóa toàn bộ giỏ hàng
router.delete('/:userId', (req, res) => {
  const { userId } = req.params;
  carts[userId] = [];
  res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
});

export default router;