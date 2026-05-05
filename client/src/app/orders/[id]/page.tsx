'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2, Package, Truck, MapPin, CreditCard,
  Loader2, ArrowLeft, Home, RotateCcw, XCircle, Clock,
  ShoppingBag,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Status stepper definition
const STEPS = ['placed', 'processing', 'shipped', 'delivered'] as const;
type Status = typeof STEPS[number] | 'cancelled';

const STEP_META: Record<string, { label: string; icon: React.ElementType; desc: string }> = {
  placed:     { label: 'Order Placed',    icon: CheckCircle2, desc: 'We have received your order'       },
  processing: { label: 'Processing',      icon: RotateCcw,    desc: 'Your order is being packed'        },
  shipped:    { label: 'Shipped',         icon: Truck,        desc: 'On the way to your address'        },
  delivered:  { label: 'Delivered',       icon: Home,         desc: 'Successfully delivered'            },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Order = any;

function StatusStepper({ status }: { status: Status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 py-4 text-red-600">
        <XCircle size={22} />
        <span className="font-semibold text-base">Order Cancelled</span>
      </div>
    );
  }

  const activeIdx = STEPS.indexOf(status as typeof STEPS[number]);

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {STEPS.map((step, idx) => {
        const meta    = STEP_META[step];
        const Icon    = meta.icon;
        const done    = idx <= activeIdx;
        const active  = idx === activeIdx;
        const isLast  = idx === STEPS.length - 1;

        return (
          <div key={step} className="flex items-start flex-1 min-w-[80px]">
            <div className="flex flex-col items-center flex-1">
              {/* Circle */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                              border-2 transition-colors
                              ${done
                                ? 'bg-primary border-primary text-white'
                                : 'bg-white border-gray-300 text-gray-400'}`}>
                <Icon size={16} />
              </div>
              {/* Label */}
              <p className={`text-[10px] font-semibold mt-1 text-center leading-tight
                             ${active ? 'text-primary' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                {meta.label}
              </p>
              {active && (
                <p className="text-[9px] text-gray-500 text-center mt-0.5 leading-tight max-w-[70px]">
                  {meta.desc}
                </p>
              )}
            </div>
            {/* Connector line */}
            {!isLast && (
              <div className={`flex-1 h-0.5 mt-4 mx-1 transition-colors
                               ${idx < activeIdx ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const router  = useRouter();
  const params  = useParams();
  const orderId = params?.id as string;

  const { user, loading: authLoading } = useAuth();
  const [order,   setOrder]   = useState<Order>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!orderId) return;

    const token = localStorage.getItem('token');
    fetch(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.order) setOrder(data.order);
        else setError(data.message || 'Order not found');
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load order. Please try again.');
        setLoading(false);
      });
  }, [orderId, user, authLoading, router]);

  const mrpTotal = order?.items?.reduce(
    (s: number, i: Order) => s + ((i.mrp ?? i.price) * i.quantity), 0
  ) ?? 0;
  const discount = mrpTotal - (order?.total ?? 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-surface py-4">
        <div className="max-w-[900px] mx-auto px-3 sm:px-4">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={36} className="animate-spin text-primary" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-24 space-y-4">
              <Package size={64} className="text-gray-200 mx-auto" />
              <p className="text-lg font-semibold text-gray-700">{error}</p>
              <Link href="/orders" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={14} /> My Orders
              </Link>
            </div>
          )}

          {/* Order detail */}
          {!loading && !error && order && (
            <div className="space-y-4">

              {/* Success banner — shown for freshly placed orders */}
              {order.status === 'placed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5
                                flex flex-col sm:flex-row items-center gap-4">
                  <CheckCircle2 size={44} className="text-green-500 flex-shrink-0" />
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-bold text-green-800">Order Placed Successfully!</p>
                    <p className="text-sm text-green-700 mt-0.5">
                      Thank you, <strong>{user?.name}</strong>! We&apos;ll confirm your order shortly.
                    </p>
                  </div>
                  <Link href="/" className="ml-auto btn-primary flex items-center gap-2 flex-shrink-0">
                    <ShoppingBag size={14} />
                    Continue Shopping
                  </Link>
                </div>
              )}

              {/* Order header */}
              <div className="bg-white rounded shadow-card p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Order ID</p>
                    <p className="font-mono text-sm font-semibold text-gray-800">
                      #{order._id.slice(-12).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Placed on</p>
                    <p className="text-sm text-gray-700">{fmtDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Payment</p>
                    <p className="text-sm text-gray-700 capitalize">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Total</p>
                    <p className="text-base font-bold text-gray-900">{fmt(order.total)}</p>
                  </div>
                </div>

                {/* Status stepper */}
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Order Status
                  </p>
                  <StatusStepper status={order.status as Status} />
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded shadow-card p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
                  <Package size={16} className="text-primary" />
                  Items Ordered
                </h2>
                <div className="space-y-4 divide-y divide-gray-100">
                  {order.items.map((item: Order, idx: number) => {
                    const pct = item.mrp && item.mrp > item.price
                      ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                      : 0;
                    return (
                      <div key={idx} className="flex items-center gap-4 pt-4 first:pt-0">
                        <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded
                                        border border-gray-100 overflow-hidden">
                          <Image
                            src={item.image || 'https://picsum.photos/seed/order-fallback/64/64'}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-sm font-bold text-gray-900">{fmt(item.price)}</span>
                            {pct > 0 && (
                              <span className="text-xs text-green-600 font-medium">{pct}% off</span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-800 flex-shrink-0">
                          {fmt(item.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price + Address side by side on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Price summary */}
                <div className="bg-white rounded shadow-card p-5">
                  <h2 className="text-sm font-semibold text-gray-800 mb-3">Price Details</h2>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>MRP Total</span>
                      <span>{fmt(mrpTotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Discount</span>
                        <span>− {fmt(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-gray-900
                                    pt-2 border-t border-dashed border-gray-200 mt-2">
                      <span>Amount Paid</span>
                      <span>{fmt(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping address */}
                <div className="bg-white rounded shadow-card p-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                    <MapPin size={14} className="text-primary" />
                    Delivery Address
                  </h2>
                  {order.shippingAddress ? (
                    <address className="not-italic text-sm text-gray-700 leading-relaxed space-y-0.5">
                      <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
                      <p>{order.shippingAddress.street}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
                      <p className="flex items-center gap-1 mt-1 text-gray-600">
                        <CreditCard size={12} />
                        {order.shippingAddress.phone}
                      </p>
                    </address>
                  ) : (
                    <p className="text-sm text-gray-500">Address not available</p>
                  )}
                </div>

              </div>

              {/* Footer CTAs */}
              <div className="flex flex-wrap gap-3 pb-4">
                <Link href="/orders"
                  className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                  <ArrowLeft size={14} />
                  Back to My Orders
                </Link>
                <Link href="/"
                  className="flex items-center gap-2 btn-primary ml-auto">
                  <ShoppingBag size={14} />
                  Continue Shopping
                </Link>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
