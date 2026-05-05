'use client';

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from 'react';

export interface APIProduct {
  _id: string;
  name: string;
  price: number;
  mrp: number;
  images: string[];
  brand?: string;
  ratings: number;
  numReviews: number;
  stock: number;
  category?: { _id: string; name: string; slug: string };
  isFeatured?: boolean;
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface SearchFilters {
  sort: SortOption;
  minPrice?: number;
  maxPrice?: number;
}

interface SearchContextValue {
  query:              string;
  setQuery:           (q: string) => void;
  results:            APIProduct[];
  total:              number;
  pages:              number;
  currentPage:        number;
  loading:            boolean;
  error:              string | null;
  suggestions:        APIProduct[];
  suggestionsOpen:    boolean;
  setSuggestionsOpen: (v: boolean) => void;
  filters:            SearchFilters;
  setFilters:         (f: Partial<SearchFilters>) => void;
  recentSearches:     string[];
  search:             (q: string, page?: number, overrideFilters?: Partial<SearchFilters>) => Promise<void>;
  clearRecent:        () => void;
  removeRecent:       (q: string) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

const API         = '/api';
const RECENT_KEY  = 'shopkart_recent';
const MAX_RECENT  = 6;

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query,           setQueryRaw]      = useState('');
  const [results,         setResults]       = useState<APIProduct[]>([]);
  const [total,           setTotal]         = useState(0);
  const [pages,           setPages]         = useState(0);
  const [currentPage,     setCurrentPage]   = useState(1);
  const [loading,         setLoading]       = useState(false);
  const [error,           setError]         = useState<string | null>(null);
  const [suggestions,     setSuggestions]   = useState<APIProduct[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [recentSearches,  setRecentSearches] = useState<string[]>([]);
  const [filters,         setFiltersState]  = useState<SearchFilters>({ sort: 'relevance' });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate recent searches (client-only)
  useEffect(() => { setRecentSearches(loadRecent()); }, []);

  // Debounced suggestions fetch whenever query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/products/suggestions?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (res.ok) setSuggestions(data.suggestions ?? []);
      } catch { /* network error — silent */ }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const setQuery = useCallback((q: string) => {
    setQueryRaw(q);
    if (!q.trim()) { setSuggestions([]); setSuggestionsOpen(false); }
    else           { setSuggestionsOpen(true); }
  }, []);

  const setFilters = useCallback((f: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...f }));
  }, []);

  const saveRecent = useCallback((q: string) => {
    const t = q.trim();
    if (!t) return;
    setRecentSearches(prev => {
      const next = [t, ...prev.filter(r => r !== t)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_KEY);
    setRecentSearches([]);
  }, []);

  const removeRecent = useCallback((q: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(r => r !== q);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const search = useCallback(async (
    q: string,
    page = 1,
    overrideFilters?: Partial<SearchFilters>,
  ): Promise<void> => {
    const trimmed = q.trim();
    setQueryRaw(trimmed);
    setSuggestionsOpen(false);
    if (trimmed) saveRecent(trimmed);

    const activeFilters = overrideFilters ? { ...filters, ...overrideFilters } : filters;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q:    trimmed,
        page: String(page),
        limit: '20',
        sort:  activeFilters.sort,
        ...(activeFilters.minPrice ? { minPrice: String(activeFilters.minPrice) } : {}),
        ...(activeFilters.maxPrice ? { maxPrice: String(activeFilters.maxPrice) } : {}),
      });

      const res  = await fetch(`${API}/products/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');

      setResults(data.products  ?? []);
      setTotal(data.total       ?? 0);
      setPages(data.pages       ?? 0);
      setCurrentPage(page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, saveRecent]);

  return (
    <SearchContext.Provider value={{
      query, setQuery,
      results, total, pages, currentPage,
      loading, error,
      suggestions, suggestionsOpen, setSuggestionsOpen,
      filters, setFilters,
      recentSearches,
      search, clearRecent, removeRecent,
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within <SearchProvider>');
  return ctx;
}
