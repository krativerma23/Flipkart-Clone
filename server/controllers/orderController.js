import Order   from '../models/Order.js';
import Cart    from '../models/Cart.js';
import Product from '../models/Product.js';

const MONGO_ID = /^[0-9a-fA-F]{24}$/;

// ── POST /api/orders/place ────────────────────────────────────────────────────
export async function placeOrder(req, res) {
  try {
    const { shippingAddress, paymentMethod = 'cod' } = req.body;

    // Validate address fields
    const required = ['fullName', 'phone', 'street', 'city', 'state', 'pincode'];
    const missing  = required.filter(f => !shippingAddress?.[f]?.trim());
    if (missing.length) {
      return res.status(400).json({ message: `Missing address fields: ${missing.join(', ')}` });
    }

    // Load & validate cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart?.items?.length) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const validItems = cart.items.filter(i => i.productId && i.name && i.price != null);
    if (!validItems.length) {
      return res.status(400).json({ message: 'Cart contains no valid items' });
    }

    // Stock check for MongoDB products
    for (const item of validItems) {
      if (MONGO_ID.test(item.productId)) {
        const product = await Product.findById(item.productId).select('name stock');
        if (product && product.stock < item.quantity) {
          return res.status(400).json({
            message: `"${item.name}" only has ${product.stock} unit(s) left in stock`,
          });
        }
      }
    }

    const total = validItems.reduce((s, i) => s + i.price * i.quantity, 0);

    // Create order
    const order = await Order.create({
      user:  req.user._id,
      items: validItems.map(i => ({
        product:   MONGO_ID.test(i.productId) ? i.productId : undefined,
        productId: i.productId,
        name:      i.name,
        price:     i.price,
        mrp:       i.mrp,
        quantity:  i.quantity,
        image:     i.image,
      })),
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone:    shippingAddress.phone.trim(),
        street:   shippingAddress.street.trim(),
        city:     shippingAddress.city.trim(),
        state:    shippingAddress.state.trim(),
        pincode:  shippingAddress.pincode.trim(),
      },
      paymentMethod,
      paymentStatus: 'pending',
      total,
    });

    // Deduct stock for MongoDB products
    await Promise.all(
      validItems
        .filter(i => MONGO_ID.test(i.productId))
        .map(i => Product.findByIdAndUpdate(i.productId, { $inc: { stock: -i.quantity } }))
    );

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ── GET /api/orders/my-orders ─────────────────────────────────────────────────
export async function getMyOrders(req, res) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
export async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // Users can only see their own orders
    if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorised to view this order' });
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
