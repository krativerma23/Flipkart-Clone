import express  from 'express';
import cors     from 'cors';
import dotenv   from 'dotenv';
import path     from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';
import { connectDB }     from './config/db.js';
import { errorHandler }  from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

import authRoutes     from './routes/authRoutes.js';
import productRoutes  from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes     from './routes/cartRoutes.js';
import orderRoutes    from './routes/orderRoutes.js';
import userRoutes     from './routes/userRoutes.js';
import reviewRoutes   from './routes/reviewRoutes.js';
import adminRoutes    from './routes/adminRoutes.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Serve uploaded product images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/admin',     adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
