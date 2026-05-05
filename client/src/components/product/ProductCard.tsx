'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Truck, ImageOff } from 'lucide-react';
import type { Product } from '@/lib/data';
import { useCart } from '@/context/CartContext';

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 bg-green-600 text-white text-xs
                     font-semibold px-1.5 py-0.5 rounded">
      {rating}
      <Star size={10} fill="white" className="flex-shrink-0" />
    </span>
  );
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatReviews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

type Props = { product: Product };

export default function ProductCard({ product }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { addToCart } = (useCart() as any) ?? {};
  const [imgError, setImgError] = useState(false);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <Link href={`/product/${product.id}`} className="product-card group flex flex-col h-full">

      {/* Image area */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">

        {imgError ? (
          /* Graceful fallback when the image URL fails to load */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <ImageOff size={36} />
            <span className="text-[10px] text-gray-400">Image unavailable</span>
          </div>
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImgError(true)}
          />
        )}

        {product.badge && (
          <span className={`badge absolute top-2 left-2 ${product.badgeColor}`}>
            {product.badge}
          </span>
        )}

        {/* Quick add to cart — slides up on hover */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart?.(product); }}
          className="absolute bottom-0 inset-x-0 bg-primary text-white text-xs font-semibold
                     py-2 flex items-center justify-center gap-1.5
                     translate-y-full group-hover:translate-y-0
                     transition-transform duration-200"
        >
          <ShoppingCart size={13} />
          Add to Cart
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <p className="text-[10px] text-muted font-medium uppercase tracking-wide">
          {product.brand}
        </p>
        <p className="text-sm text-gray-800 font-medium leading-snug line-clamp-2 flex-1">
          {product.name}
        </p>

        {/* Rating row */}
        <div className="flex items-center gap-1.5 mt-1">
          <StarRating rating={product.rating} />
          <span className="text-xs text-muted">({formatReviews(product.reviews)})</span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
          <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
          <span className="text-xs text-muted line-through">{formatPrice(product.mrp)}</span>
          <span className="text-xs font-semibold text-green-600">{discount}% off</span>
        </div>

        {/* Free delivery tag */}
        {product.freeDelivery && (
          <span className="flex items-center gap-1 text-[10px] text-primary font-medium mt-1">
            <Truck size={11} />
            Free Delivery
          </span>
        )}
      </div>
    </Link>
  );
}
