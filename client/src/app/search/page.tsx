'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, ShoppingCart, SlidersHorizontal, X,
  Loader2, SearchX, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Navbar  from '@/components/layout/Navbar';
import Footer  from '@/components/layout/Footer';
import { useSearch, APIProduct, SortOption } from '@/context/SearchContext';
import { useCart as _useCart } from '@/context/CartContext';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useCart = _useCart as unknown as () => any;

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function discount(price: number, mrp: number) {
  return mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
}

// Wrap matched keyword in a yellow highlight span
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts   = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.trim().toLowerCase()
          ? <mark key={i} className="bg-yellow-100 text-yellow-900 not-italic font-semibold px-0.5 rounded-sm">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ product, query }: { product: APIProduct; query: string }) {
  const cart       = useCart();
  const addToCart  = cart?.addToCart;
  const pct        = discount(product.price, product.mrp);
  const image      = product.images?.[0] || 'https://placehold.co/200x200/e2e8f0/64748b?text=Product';
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!addToCart) return;
    setBusy(true);
    await addToCart({ ...product, id: product._id, image });
    setBusy(false);
  };

  return (
    <Link
      href={`/product/${product._id}`}
      className="bg-white rounded shadow-card hover:shadow-card-hover transition-shadow
                 flex flex-col overflow-hidden group"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={image}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width:640px) 50vw,(max-width:1024px) 25vw,20vw"
        />
        {pct >= 20 && (
          <span className="badge absolute top-2 left-2 bg-green-100 text-green-700">
            {pct}% off
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        {product.brand && (
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
            {product.brand}
          </p>
        )}

        <p className="text-sm text-gray-800 font-medium leading-snug line-clamp-2 flex-1">
          <HighlightText text={product.name} query={query} />
        </p>

        {/* Rating */}
        {product.ratings > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 bg-green-600 text-white
                             text-xs font-semibold px-1.5 py-0.5 rounded">
              {product.ratings.toFixed(1)}
              <Star size={9} fill="white" />
            </span>
            {product.numReviews > 0 && (
              <span className="text-xs text-gray-400">
                ({product.numReviews >= 1000
                  ? `${(product.numReviews / 1000).toFixed(1)}K`
                  : product.numReviews})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1 flex-wrap">
          <span className="text-base font-bold text-gray-900">{fmt(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through">{fmt(product.mrp)}</span>
          )}
        </div>

        {/* Stock status */}
        {product.stock === 0 && (
          <p className="text-xs font-semibold text-red-500 mt-1">Out of stock</p>
        )}
      </div>

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        disabled={busy || product.stock === 0}
        className="mx-3 mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold
                   py-2 rounded border border-primary text-primary hover:bg-primary hover:text-white
                   transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <ShoppingCart size={12} />}
        {product.stock === 0 ? 'Out of stock' : 'Add to Cart'}
      </button>
    </Link>
  );
}

// ── Filter sidebar ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance',  label: 'Relevance'          },
  { value: 'price_asc',  label: 'Price: Low to High'  },
  { value: 'price_desc', label: 'Price: High to Low'  },
  { value: 'rating',     label: 'Customer Rating'     },
  { value: 'newest',     label: 'Newest First'        },
];

const PRICE_RANGES = [
  { label: 'Under ₹500',      min: 0,    max: 500   },
  { label: '₹500 – ₹1,000',   min: 500,  max: 1000  },
  { label: '₹1,000 – ₹5,000', min: 1000, max: 5000  },
  { label: '₹5,000 – ₹15,000',min: 5000, max: 15000 },
  { label: 'Over ₹15,000',    min: 15000, max: 0    },
];

interface FilterPanelProps {
  onApply: () => void;
  onClose?: () => void;
}

function FilterPanel({ onApply, onClose }: FilterPanelProps) {
  const { filters, setFilters } = useSearch();
  const [minInput, setMinInput] = useState(filters.minPrice ? String(filters.minPrice) : '');
  const [maxInput, setMaxInput] = useState(filters.maxPrice ? String(filters.maxPrice) : '');

  const applyPrice = () => {
    setFilters({
      minPrice: minInput ? Number(minInput) : undefined,
      maxPrice: maxInput ? Number(maxInput) : undefined,
    });
    onApply();
  };

  const clearPrice = () => {
    setMinInput('');
    setMaxInput('');
    setFilters({ minPrice: undefined, maxPrice: undefined });
    onApply();
  };

  const setPreset = (min: number, max: number) => {
    setMinInput(min ? String(min) : '');
    setMaxInput(max ? String(max) : '');
    setFilters({
      minPrice: min || undefined,
      maxPrice: max || undefined,
    });
    onApply();
  };

  return (
    <aside className="bg-white rounded shadow-card p-4 space-y-6 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-base">Filters</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sort By</p>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                value={o.value}
                checked={filters.sort === o.value}
                onChange={() => { setFilters({ sort: o.value }); onApply(); }}
                className="accent-primary"
              />
              <span className="text-gray-700 group-hover:text-gray-900">{o.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price presets */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Range</p>
        <div className="space-y-1.5">
          {PRICE_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setPreset(r.min, r.max)}
              className={`block w-full text-left px-2 py-1 rounded text-sm transition-colors
                         ${filters.minPrice === (r.min || undefined) && filters.maxPrice === (r.max || undefined)
                           ? 'bg-primary text-white'
                           : 'text-gray-700 hover:bg-surface'}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Custom range */}
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-500">Custom range</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minInput}
              onChange={e => setMinInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs
                         outline-none focus:border-primary"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxInput}
              onChange={e => setMaxInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs
                         outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={applyPrice}
              className="flex-1 bg-primary text-white text-xs font-semibold py-1.5 rounded hover:brightness-110 transition-all">
              Apply
            </button>
            <button onClick={clearPrice}
              className="flex-1 border border-gray-300 text-gray-700 text-xs font-semibold py-1.5 rounded hover:bg-surface transition-all">
              Clear
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({ currentPage, pages, onPage }: {
  currentPage: number; pages: number; onPage: (p: number) => void;
}) {
  if (pages <= 1) return null;

  const nums: (number | '...')[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      nums.push(i);
    } else if (nums[nums.length - 1] !== '...') {
      nums.push('...');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-surface"
      >
        <ChevronLeft size={16} />
      </button>
      {nums.map((n, i) => (
        n === '...'
          ? <span key={`e${i}`} className="px-2 text-gray-400">…</span>
          : <button
              key={n}
              onClick={() => onPage(n as number)}
              className={`w-8 h-8 rounded text-sm font-medium border transition-colors
                         ${currentPage === n
                           ? 'bg-primary text-white border-primary'
                           : 'border-gray-300 hover:bg-surface text-gray-700'}`}
            >
              {n}
            </button>
      ))}
      <button
        onClick={() => onPage(currentPage + 1)}
        disabled={currentPage === pages}
        className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-surface"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

function SearchPageInner() {
  const router      = useRouter();
  const params      = useSearchParams();
  const urlQuery    = params?.get('q') || '';

  const {
    query, results, total, pages, currentPage,
    loading, error, filters, search,
  } = useSearch();

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Run search whenever URL query changes
  useEffect(() => {
    search(urlQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  // Re-run search when filters change (but only if there's a query)
  useEffect(() => {
    if (urlQuery) search(urlQuery, 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handlePage = useCallback((p: number) => {
    search(urlQuery, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [urlQuery, search]);

  const handleFilterApply = useCallback(() => {
    search(urlQuery, 1);
    setFiltersOpen(false);
  }, [urlQuery, search]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-surface py-4">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              {urlQuery ? (
                <h1 className="text-lg font-semibold text-gray-800">
                  Results for &ldquo;<span className="text-primary">{urlQuery}</span>&rdquo;
                  {!loading && total > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({total.toLocaleString()} product{total !== 1 ? 's' : ''})
                    </span>
                  )}
                </h1>
              ) : (
                <h1 className="text-lg font-semibold text-gray-800">All Products</h1>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className="lg:hidden flex items-center gap-1.5 border border-gray-300 text-sm
                         font-medium px-3 py-1.5 rounded bg-white hover:bg-surface"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>

          <div className="flex gap-4 items-start">

            {/* ── Sidebar filters (desktop) ── */}
            <div className="hidden lg:block w-56 flex-shrink-0 sticky top-20">
              <FilterPanel onApply={handleFilterApply} />
            </div>

            {/* ── Mobile filter drawer ── */}
            {filtersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setFiltersOpen(false)}
                />
                <div className="absolute right-0 top-0 bottom-0 w-72 bg-surface overflow-y-auto p-4 shadow-xl">
                  <FilterPanel
                    onApply={handleFilterApply}
                    onClose={() => setFiltersOpen(false)}
                  />
                </div>
              </div>
            )}

            {/* ── Results area ── */}
            <div className="flex-1 min-w-0">

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 size={36} className="animate-spin text-primary" />
                  <p className="text-sm text-gray-500">Searching products…</p>
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <SearchX size={56} className="text-gray-200" />
                  <p className="text-base font-semibold text-gray-700">Something went wrong</p>
                  <p className="text-sm text-gray-500">{error}</p>
                  <button
                    onClick={() => search(urlQuery)}
                    className="flex items-center gap-2 btn-primary mt-2"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                </div>
              )}

              {/* No results */}
              {!loading && !error && results.length === 0 && urlQuery && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                  <SearchX size={72} className="text-gray-200" />
                  <p className="text-lg font-semibold text-gray-700">No results found</p>
                  <p className="text-sm text-gray-500 max-w-sm">
                    We couldn&apos;t find anything for &ldquo;<strong>{urlQuery}</strong>&rdquo;.
                    Try a different keyword or check your spelling.
                  </p>
                  <button onClick={() => router.push('/')} className="btn-primary mt-3">
                    Back to Home
                  </button>
                </div>
              )}

              {/* Empty state — no query */}
              {!loading && !error && results.length === 0 && !urlQuery && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                  <SearchX size={72} className="text-gray-200" />
                  <p className="text-lg font-semibold text-gray-700">Search for something</p>
                  <p className="text-sm text-gray-500">
                    Use the search bar above to find products.
                  </p>
                </div>
              )}

              {/* Results grid */}
              {!loading && !error && results.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {results.map(product => (
                      <ResultCard key={product._id} product={product} query={query} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    pages={pages}
                    onPage={handlePage}
                  />
                </>
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Suspense boundary required for useSearchParams in Next.js App Router
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
