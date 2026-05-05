'use client';

import { AuthProvider }   from '@/context/AuthContext';
import { CartProvider }   from '@/context/CartContext';
import { SearchProvider } from '@/context/SearchContext';
import ToastContainer     from '@/components/common/ToastContainer';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          {children}
          <ToastContainer />
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}
