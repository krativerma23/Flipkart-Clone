import Cart from '../models/Cart.js';

// Strip legacy items that were saved with the old schema (product ObjectId only, no productId/name/price)
function validItems(items) {
  return items.filter(i => i.productId && i.name && i.price != null);
}

// GET /api/cart
export async function getCart(req, res) {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    res.json({ items: cart ? validItems(cart.items) : [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/cart/add
export async function addToCart(req, res) {
  try {
    const { productId, name, price, mrp, image, quantity = 1 } = req.body;

    if (!productId || !name || price == null) {
      return res.status(400).json({ message: 'productId, name, and price are required' });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Drop legacy items that lack the new fields before operating
    cart.items = validItems(cart.items);

    const idx = cart.items.findIndex(i => i.productId === String(productId));
    if (idx >= 0) {
      cart.items[idx].quantity += quantity;
    } else {
      cart.items.push({ productId: String(productId), name, price, mrp, image, quantity });
    }

    await cart.save();
    res.json({ items: cart.items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// PUT /api/cart/update
export async function updateCartItem(req, res) {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity == null) {
      return res.status(400).json({ message: 'productId and quantity are required' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = validItems(cart.items);

    const idx = cart.items.findIndex(i => i.productId === String(productId));
    if (idx < 0) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }

    await cart.save();
    res.json({ items: cart.items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE /api/cart/remove/:productId
export async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = validItems(cart.items).filter(i => i.productId !== String(productId));
    await cart.save();
    res.json({ items: cart.items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
