'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package, ShoppingBag, Users, IndianRupee,
  Plus, ArrowRight, TrendingUp, Loader2,
} from 'lucide-react';

interface Stats { products: number; orders: number; users: number; revenue: number; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProduct = any;

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function StatCard({
  icon: Icon, label, value, color, sub,
}: {
  icon: React.ElementType; label: string; value: string; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [products, setProducts] = useState<AnyProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/admin/stats',             { headers }).then(r => r.json()),
      fetch('/api/admin/products?limit=5',  { headers }).then(r => r.json()),
    ])
      .then(([statsData, productsData]) => {
        setStats(statsData);
        setProducts(productsData.products ?? []);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back — here&apos;s what&apos;s happening</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold
                     px-4 py-2 rounded-lg hover:brightness-110 transition-all shadow-sm"
        >
          <Plus size={15} />
          Add Product
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={Package}     label="Total Products"
              value={stats.products.toLocaleString()}
              color="bg-blue-500"
              sub="In catalogue"
            />
            <StatCard
              icon={ShoppingBag} label="Total Orders"
              value={stats.orders.toLocaleString()}
              color="bg-orange-500"
              sub="All time"
            />
            <StatCard
              icon={Users}       label="Customers"
              value={stats.users.toLocaleString()}
              color="bg-green-500"
              sub="Registered users"
            />
            <StatCard
              icon={IndianRupee} label="Revenue"
              value={fmt(stats.revenue)}
              color="bg-purple-500"
              sub="Excl. cancelled orders"
            />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/admin/products/new', icon: Plus,        label: 'Add Product',       color: 'border-blue-200 bg-blue-50 hover:bg-blue-100'    },
              { href: '/admin/products',     icon: Package,     label: 'Manage Products',   color: 'border-gray-200 bg-white hover:bg-gray-50'       },
              { href: '/admin/orders',       icon: ShoppingBag, label: 'View Orders',       color: 'border-orange-200 bg-orange-50 hover:bg-orange-100' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium
                            text-gray-700 transition-colors ${color}`}
              >
                <Icon size={18} className="text-gray-600 flex-shrink-0" />
                {label}
                <ArrowRight size={14} className="ml-auto text-gray-400" />
              </Link>
            ))}
          </div>

          {/* Recent products */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                Recent Products
              </h2>
              <Link
                href="/admin/products"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No products yet.{' '}
                <Link href="/admin/products/new" className="text-primary font-medium hover:underline">
                  Add your first product
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {products.map((p: AnyProduct) => (
                  <div key={p._id} className="flex items-center gap-4 px-5 py-3">
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Package size={20} className="text-gray-300 m-auto mt-2.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.category?.name ?? '—'} · Stock: {p.stock}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {fmt(p.price)}
                      </p>
                      {p.isFeatured && (
                        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50
                                         px-1.5 py-0.5 rounded-full">Featured</span>
                      )}
                    </div>
                    <Link
                      href={`/admin/products/${p._id}/edit`}
                      className="text-xs text-primary font-medium hover:underline flex-shrink-0"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
