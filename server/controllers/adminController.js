import Product  from '../models/Product.js';
import Category from '../models/Category.js';
import Order    from '../models/Order.js';
import User     from '../models/User.js';

// GET /api/admin/stats
export async function getDashboardStats(req, res) {
  try {
    const [products, orders, users, revenueAgg] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);
    res.json({ products, orders, users, revenue: revenueAgg[0]?.total ?? 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/admin/categories
export async function getCategories(req, res) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/admin/products?q=&page=1&limit=20
export async function getAllProducts(req, res) {
  try {
    const { q = '', page = 1, limit = 20 } = req.query;
    const filter = q.trim()
      ? { $or: [
          { name:  { $regex: q.trim(), $options: 'i' } },
          { brand: { $regex: q.trim(), $options: 'i' } },
        ]}
      : {};

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/admin/products/:id
export async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/admin/products  (multipart/form-data)
export async function createProduct(req, res) {
  try {
    const { name, description, price, mrp, category, brand, stock, isFeatured } = req.body;

    if (!name?.trim() || !price || !mrp || !category) {
      return res.status(400).json({ message: 'Name, price, MRP, and category are required' });
    }

    // Prefer uploaded files; fall back to URL strings in body
    const imgArr = resolveImages(req.files, req.body.images);

    const product = await Product.create({
      name:        name.trim(),
      description: description?.trim() || '',
      price:       Number(price),
      mrp:         Number(mrp),
      images:      imgArr,
      category,
      brand:       brand?.trim() || '',
      stock:       Number(stock) || 0,
      isFeatured:  parseBool(isFeatured),
    });

    await product.populate('category', 'name slug');
    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// PUT /api/admin/products/:id  (multipart/form-data)
export async function updateProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, price, mrp, category, brand, stock, isFeatured, existingImages } = req.body;

    if (name        !== undefined) product.name        = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (price       !== undefined) product.price       = Number(price);
    if (mrp         !== undefined) product.mrp         = Number(mrp);
    if (category    !== undefined) product.category    = category;
    if (brand       !== undefined) product.brand       = brand.trim();
    if (stock       !== undefined) product.stock       = Number(stock);
    if (isFeatured  !== undefined) product.isFeatured  = parseBool(isFeatured);

    // Image update logic:
    // 1. New files uploaded → replace entirely
    // 2. No new files but existingImages sent → use those (keeps previously uploaded files)
    // 3. Neither → leave images unchanged
    if (req.files?.length) {
      product.images = req.files.map(f => `/uploads/products/${f.filename}`);
    } else if (existingImages !== undefined) {
      try {
        const kept = JSON.parse(existingImages);
        if (Array.isArray(kept)) product.images = kept;
      } catch { /* leave unchanged */ }
    }

    await product.save();
    await product.populate('category', 'name slug');
    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE /api/admin/products/:id
export async function deleteProduct(req, res) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Build image array: uploaded files take priority over URL strings
function resolveImages(files, urlsFromBody) {
  if (files?.length) {
    return files.map(f => `/uploads/products/${f.filename}`);
  }
  if (!urlsFromBody) return [];
  if (Array.isArray(urlsFromBody)) return urlsFromBody.map(s => s.trim()).filter(Boolean);
  return urlsFromBody.split('\n').map(s => s.trim()).filter(Boolean);
}

// FormData sends booleans as strings; handle both
function parseBool(v) {
  if (v === true  || v === 'true')  return true;
  if (v === false || v === 'false') return false;
  return Boolean(v);
}
