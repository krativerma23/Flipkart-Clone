'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CartItem = any;

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { items = [], loading, removeFromCart, updateQuantity, cartTotal } = (useCart() as any) ?? {};

  const mrpTotal = items.reduce((s: number, i: CartItem) => s + ((i.mrp ?? i.price) * i.quantity), 0);
  const discount = mrpTotal - cartTotal;

  const handlePlaceOrder = () => {
    if (!user) {
      router.push('/login?returnTo=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <ShoppingCart size={80} className="text-gray-200" />
          <h2 className="text-xl font-semibold text-gray-700">Your cart is empty!</h2>
          <p className="text-sm text-gray-500">Add items to your cart to continue shopping.</p>
          <Link href="/" className="btn-primary mt-2">Shop Now</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-surface py-4">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4">

          <h1 className="text-xl font-semibold text-gray-800 mb-4">
            My Cart{' '}
            <span className="text-base font-normal text-gray-500">
              ({items.length} item{items.length !== 1 ? 's' : ''})
            </span>
          </h1>

          <div className="flex flex-col lg:flex-row gap-4 items-start">

            {/* ── Item list ────────────────────────────────────── */}
            <div className="flex-1 space-y-3 min-w-0">
              {items.map((item: CartItem) => {
                const itemDiscount = item.mrp && item.mrp > item.price
                  ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                  : 0;

                return (
                  <div key={item.productId} className="bg-white rounded shadow-card p-4">
                    <div className="flex gap-4">

                      {/* Image */}
                      <div className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded overflow-hidden border border-gray-100">
                        <Image
                          src={item.image || 'https://picsum.photos/seed/cart-item-fallback/96/96'}
                          alt={item.name}
                          fill
                          className="object-contain p-2"
                          sizes="96px"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                            {item.name}
                          </p>
                          <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
                            <span className="text-base font-bold text-gray-900">{fmt(item.price)}</span>
                            {item.mrp && item.mrp > item.price && (
                              <>
                                <span className="text-xs text-gray-400 line-through">{fmt(item.mrp)}</span>
                                <span className="text-xs font-semibold text-green-600">{itemDiscount}% off</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={loading}
                              className="w-8 h-8 flex items-center justify-center text-primary
                                         hover:bg-gray-50 disabled:opacity-40 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-10 h-8 flex items-center justify-center text-sm font-semibold border-x border-gray-300">
                              {loading ? <Loader2 size={12} className="animate-spin" /> : item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={loading}
                              className="w-8 h-8 flex items-center justify-center text-primary
                                         hover:bg-gray-50 disabled:opacity-40 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.productId)}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700
                                       transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Line total (desktop) */}
                      <div className="hidden sm:flex flex-col items-end justify-between flex-shrink-0 pl-4">
                        <span className="text-sm font-bold text-gray-800">
                          {fmt(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Price summary ────────────────────────────────── */}
            <div className="lg:w-80 w-full flex-shrink-0">
              <div className="bg-white rounded shadow-card p-5 sticky top-20">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                  Price Details
                </h2>

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Price ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                    <span>{fmt(mrpTotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount</span>
                      <span>− {fmt(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Charges</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between
                                  text-base font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>{fmt(cartTotal)}</span>
                  </div>

                  {discount > 0 && (
                    <p className="text-green-600 text-xs font-medium">
                      You will save {fmt(discount)} on this order
                    </p>
                  )}
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full btn-primary mt-5 flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={15} />
                  {user ? 'Place Order' : 'Login to Place Order'}
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
