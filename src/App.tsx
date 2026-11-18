import { useCallback, useEffect, useState } from 'react';
import type { Book, CartItem, Order, SalesSummary } from './types';
import { StorefrontView } from './components/StorefrontView';
import { ManagementWorkspace } from './components/ManagementWorkspace';
import { CartDrawer } from './components/CartDrawer';
import { OrderTrackingModal } from './components/OrderTrackingModal';

export default function App() {
  const [view, setView] = useState<'storefront' | 'admin'>('storefront');
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [booksRes, ordersRes, summaryRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/orders'),
        fetch('/api/sales/summary'),
      ]);

      if (!booksRes.ok || !ordersRes.ok || !summaryRes.ok) {
        throw new Error('Falha ao carregar dados do servidor.');
      }

      const [booksData, ordersData, summaryData] = await Promise.all([
        booksRes.json(),
        ordersRes.json(),
        summaryRes.json(),
      ]);

      setBooks(booksData as Book[]);
      setOrders(ordersData as Order[]);
      setSalesSummary(summaryData as SalesSummary);
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  function handleAddToCart(book: Book, quantity = 1) {
    setCart((prev) => {
      const existing = prev.find((item) => item.book.id === book.id);
      if (existing) {
        const nextQty = Math.min(book.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.book.id === book.id ? { ...item, book, quantity: nextQty } : item
        );
      }
      return [...prev, { book, quantity: Math.min(book.stock, quantity) }];
    });
  }

  function handleUpdateCartQty(bookId: number, nextQty: number) {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.book.id !== bookId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.book.id === bookId
          ? { ...item, quantity: Math.min(item.book.stock, nextQty) }
          : item
      )
    );
  }

  function handleRemoveFromCart(bookId: number) {
    setCart((prev) => prev.filter((item) => item.book.id !== bookId));
  }

  function handleClearCart() {
    setCart([]);
  }

  function handleOrderCreated(_order: Order) {
    fetchAllData();
  }

  return (
    <>
      {apiError && (
        <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-6 py-2.5 text-xs text-[#991B1B] flex items-center justify-between">
          <span>{apiError}</span>
          <button
            type="button"
            onClick={fetchAllData}
            className="font-medium underline cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {view === 'storefront' ? (
        <StorefrontView
          books={books}
          loading={loading}
          cart={cart}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setCartOpen(true)}
          onOpenTracking={() => setTrackingOpen(true)}
          onSwitchToAdmin={() => {
            setView('admin');
            window.scrollTo({ top: 0, behavior: 'auto' });
          }}
        />
      ) : (
        <ManagementWorkspace
          books={books}
          orders={orders}
          salesSummary={salesSummary}
          loading={loading}
          onRefreshAll={fetchAllData}
          onBackToStorefront={() => {
            setView('storefront');
            window.scrollTo({ top: 0, behavior: 'auto' });
          }}
        />
      )}

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderCreated={handleOrderCreated}
      />

      <OrderTrackingModal isOpen={trackingOpen} onClose={() => setTrackingOpen(false)} />
    </>
  );
}
