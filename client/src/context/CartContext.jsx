/* eslint-disable */
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const CART_KEY = 'shopkart_cart';
const API      = '/api';

function getLocalCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts,  setToasts]  = useState([]);

  const syncedUserRef = useRef(null);

  // On mount (before auth resolves) seed from localStorage
  useEffect(() => {
    setItems(getLocalCart());
  }, []);

  // React to auth state changes
  useEffect(() => {
    if (authLoading) return;

    if (user && syncedUserRef.current !== user._id) {
      syncedUserRef.current = user._id;
      syncCartToDb(user._id);
    }

    if (!user && syncedUserRef.current !== null) {
      syncedUserRef.current = null;
      setItems(getLocalCart());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function syncCartToDb() {
    const localItems = getLocalCart();

    // Push each local item to DB (server merges quantities)
    for (const item of localItems) {
      try {
        await fetch(`${API}/cart/add`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body:    JSON.stringify(item),
        });
      } catch {}
    }

    localStorage.removeItem(CART_KEY);

    // Fetch canonical DB cart
    try {
      const res  = await fetch(`${API}/cart`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
    } catch {}
  }

  // ── Toast helpers ────────────────────────────────────────────────────────────

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Cart operations ──────────────────────────────────────────────────────────

  const addToCart = useCallback(async (product, qty = 1) => {
    const item = {
      productId: String(product.id ?? product._id ?? product.productId),
      name:      product.name,
      price:     product.price,
      mrp:       product.mrp ?? product.price,
      image:     product.image ?? (product.images?.[0] || ''),
      quantity:  qty,
    };

    if (user) {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/cart/add`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body:    JSON.stringify(item),
        });
        const data = await res.json();
        if (res.ok) {
          setItems(data.items);
          showToast(`"${product.name}" added to cart!`);
        } else {
          showToast(data.message || 'Failed to add to cart', 'error');
        }
      } catch {
        showToast('Network error — please try again', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setItems(prev => {
        const idx = prev.findIndex(i => i.productId === item.productId);
        const updated =
          idx >= 0
            ? prev.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + qty } : i))
            : [...prev, item];
        saveLocalCart(updated);
        return updated;
      });
      showToast(`"${product.name}" added to cart!`);
    }
  }, [user, showToast]);

  const removeFromCart = useCallback(async (productId) => {
    const pid = String(productId);

    if (user) {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/cart/remove/${pid}`, {
          method:  'DELETE',
          headers: authHeaders(),
        });
        const data = await res.json();
        if (res.ok) setItems(data.items);
        else showToast(data.message || 'Failed to remove item', 'error');
      } catch {
        showToast('Network error — please try again', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setItems(prev => {
        const updated = prev.filter(i => i.productId !== pid);
        saveLocalCart(updated);
        return updated;
      });
    }
  }, [user, showToast]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const pid = String(productId);
    if (quantity <= 0) return removeFromCart(pid);

    if (user) {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/cart/update`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body:    JSON.stringify({ productId: pid, quantity }),
        });
        const data = await res.json();
        if (res.ok) setItems(data.items);
        else showToast(data.message || 'Failed to update quantity', 'error');
      } catch {
        showToast('Network error — please try again', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setItems(prev => {
        const updated = prev.map(i => (i.productId === pid ? { ...i, quantity } : i));
        saveLocalCart(updated);
        return updated;
      });
    }
  }, [user, removeFromCart, showToast]);

  // Called after a successful order to wipe cart state and localStorage
  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const cartCount = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const cartTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, loading,
      addToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, cartTotal,
      toasts, dismissToast,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
