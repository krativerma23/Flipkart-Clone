import express from 'express';
import { searchProducts, getSuggestions } from '../controllers/productController.js';

const router = express.Router();

router.get('/search',      searchProducts);
router.get('/suggestions', getSuggestions);

export default router;
