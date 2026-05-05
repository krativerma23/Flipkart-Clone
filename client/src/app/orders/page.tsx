'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package, ChevronRight, Loader2, ShoppingBag,
  CheckCircle2, Truck, RotateCcw, XCircle, Clock,
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
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const STATUS_STYLES: Record<string, { color: string; icon: React.ElementType }> = {
  placed:     { color: 'bg-blue-100 text-blue-700',   icon: Clock        },
  processing: { color: 'bg-yellow-100 text-yellow-700', icon: RotateCcw  },
  shipped:    { color: 'bg-purple-100 text-purple-700', icon: Truck       },
  delivered:  { color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  cancelled:  { color: 'bg-red-100 text-red-700',      icon: XCircle     },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Order = any;

export default function OrdersPage() {
  const router    = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login?returnTo=/orders'); return; }

    const token = localStorage.getItem('token');
    fetch('/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setOrders(data.orders ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load orders. Please try again.');
        setLoading(false);
      });
  }, [user, authLoading, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-surface py-4">
        <div className="max-w-[900px] mx-auto px-3 sm:px-4">

          <h1 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={20} className="text-primary" />
            My Orders
          </h1>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={36} className="animate-spin text-primary" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-5 text-sm text-center">
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <ShoppingBag size={72} className="text-gray-200" />
              <p className="text-lg font-semibold text-gray-700">No orders yet</p>
              <p className="text-sm text-gray-500">Your past orders will appear here once you place one.</p>
              <Link href="/" className="btn-primary mt-2">Start Shopping</Link>
            </div>
          )}

          {/* Orders list */}
          {!loading && !error && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order: Order) => {
                const style    = STATUS_STYLES[order.status] ?? STATUS_STYLES.placed;
                const StatusIcon = style.icon;
                const firstItem  = order.items?.[0];
                const extra      = (order.items?.length ?? 1) - 1;

                return (
                  <div key={order._id} className="bg-white rounded shadow-card overflow-hidden">

                    {/* Header bar */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100
                                    bg-gray-50 flex-wrap gap-2">
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap gap-y-1">
                        <div>
                          <span className="font-medium text-gray-700 uppercase tracking-wide">Order ID</span>
                          <span className="ml-1 font-mono text-[11px] text-gray-600">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Placed</span>
                          <span className="ml-1">{fmtDate(order.createdAt)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Total</span>
                          <span className="ml-1 font-semibold text-gray-800">{fmt(order.total)}</span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                                       px-2.5 py-1 rounded-full ${style.color}`}>
                        <StatusIcon size={11} />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    {/* Item preview + CTA */}
                    <div className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {firstItem?.image && (
                          <div className="relative w-14 h-14 flex-shrink-0 bg-gray-50 rounded
                                          border border-gray-100 overflow-hidden">
                            <Image
                              src={firstItem.image}
                              alt={firstItem.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {firstItem?.name ?? 'Order items'}
                          </p>
                          {extra > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              +{extra} more item{extra !== 1 ? 's' : ''}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/orders/${order._id}`}
                        className="flex items-center gap-1 text-primary text-sm font-semibold
                                   hover:underline flex-shrink-0"
                      >
                        View Details
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
