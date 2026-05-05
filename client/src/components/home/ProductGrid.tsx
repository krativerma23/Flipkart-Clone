import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { products } from '@/lib/data';
import type { Product } from '@/lib/data';

type Props = {
  title: string;
  subtitle?: string;
  filter: Product['category'];
};

export default function ProductGrid({ title, subtitle, filter }: Props) {
  const filtered = products.filter((p) => p.category === filter);

  return (
    <section className="bg-white rounded-sm shadow-card overflow-hidden mt-4">
      {/* Section header */}
      <div className="flex items-end justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        <Link
          href={`/category/${filter}`}
          className="flex items-center gap-0.5 text-primary text-xs font-semibold
                     hover:gap-1.5 transition-all"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-gray-100">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
