import Product  from '../models/Product.js';
import Category from '../models/Category.js'; // must be imported so Mongoose registers the schema before populate() runs

const SORT_MAP = {
  price_asc:  { price: 1 },
  price_desc: { price: -1 },
  rating:     { ratings: -1 },
  newest:     { createdAt: -1 },
  relevance:  { isFeatured: -1, ratings: -1 },
};

function buildQuery(q, minPrice, maxPrice) {
  const query   = {};
  const trimmed = (q || '').trim();

  if (trimmed) {
    query.$or = [
      { name:        { $regex: trimmed, $options: 'i' } },
      { brand:       { $regex: trimmed, $options: 'i' } },
      { description: { $regex: trimmed, $options: 'i' } },
    ];
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  return query;
}

// GET /api/products/search?q=&page=1&limit=20&sort=relevance&minPrice=&maxPrice=
export async function searchProducts(req, res) {
  try {
    const { q = '', page = 1, limit = 20, sort = 'relevance', minPrice, maxPrice } = req.query;
    const query   = buildQuery(q, minPrice, maxPrice);
    const sortObj = SORT_MAP[sort] || SORT_MAP.relevance;
    const skip    = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .select('name price mrp images brand ratings numReviews stock isFeatured')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/products/suggestions?q=   (top 5 lightweight hits for live dropdown)
export async function getSuggestions(req, res) {
  try {
    const trimmed = (req.query.q || '').trim();
    if (!trimmed) return res.json({ suggestions: [] });

    const products = await Product.find({
      $or: [
        { name:  { $regex: trimmed, $options: 'i' } },
        { brand: { $regex: trimmed, $options: 'i' } },
      ],
    })
      .select('name brand price images ratings')
      .limit(5)
      .lean();

    res.json({ suggestions: products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
