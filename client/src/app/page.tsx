import Navbar       from '@/components/layout/Navbar';
import Footer       from '@/components/layout/Footer';
import HeroBanner   from '@/components/home/HeroBanner';
import CategoryBar  from '@/components/home/CategoryBar';
import ProductGrid  from '@/components/home/ProductGrid';
import DealsBanner  from '@/components/home/DealsBanner';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <CategoryBar />

      <main className="flex-1">
        <HeroBanner />

        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 space-y-4 pb-8">
          <ProductGrid
            title="Today's Deals"
            subtitle="Up to 70% off"
            filter="deals"
          />
          <DealsBanner />
          <ProductGrid
            title="Top Electronics"
            subtitle="Best picks for you"
            filter="electronics"
          />
          <ProductGrid
            title="Fashion Favourites"
            subtitle="Trending styles"
            filter="fashion"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
