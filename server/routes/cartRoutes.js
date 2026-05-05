import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/',                    getCart);
router.post('/add',                addToCart);
router.put('/update',              updateCartItem);
router.delete('/remove/:productId', removeFromCart);

export default router;
