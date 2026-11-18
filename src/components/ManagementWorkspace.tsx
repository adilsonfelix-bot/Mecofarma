import { useState, type FormEvent } from 'react';
import {
  BarChart3,
  Package,
  BookMarked,
  ArrowLeft,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type {
  Book,
  BookBinding,
  Order,
  OrderStatus,
  PaymentMethod,
  SalesSummary,
} from '../types';
import {
  BOOK_BINDINGS,
  CATEGORIES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  STUDIO_COVER_PRESETS,
  formatKz,
  formatDateShort,
  formatDateTime,
  getStatusStyle,
} from '../utils/format';
import { BookCover } from './BookCover';

interface ManagementWorkspaceProps {
  books: Book[];
  orders: Order[];
  salesSummary: SalesSummary | null;
  loading: boolean;
  onRefreshAll: () => Promise<void>;
  onBackToStorefront: () => void;
}

type AdminTab = 'analytics' | 'orders' | 'catalog';

export function ManagementWorkspace({
  books,
  orders,
  salesSummary,
  loading,
  onRefreshAll,
  onBackToStorefront,
}: ManagementWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Order filters & detail state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Manual Order Modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderEmail, setNewOrderEmail] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderCity, setNewOrderCity] = useState('');
  const [newOrderPostal, setNewOrderPostal] = useState('');
  const [newOrderPayment, setNewOrderPayment] = useState<PaymentMethod>('Pix');
  const [newOrderBookId, setNewOrderBookId] = useState<number>(books[0]?.id ?? 1);
  const [newOrderQty, setNewOrderQty] = useState<number>(1);
  const [newOrderSubmitting, setNewOrderSubmitting] = useState(false);

  // Catalog filters & Book Modal
  const [catalogSearch, setCatalogSearch] = useState('');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Book Form State
  const [formIsbn, setFormIsbn] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formPublisher, setFormPublisher] = useState('Editora Meridiano');
  const [formCategory, setFormCategory] = useState<string>('Ficção Literária');
  const [formYear, setFormYear] = useState(2025);
  const [formPages, setFormPages] = useState(240);
  const [formBinding, setFormBinding] = useState<BookBinding>('Capa Dura');
  const [formPriceReais, setFormPriceReais] = useState('14500.00');
  const [formCostReais, setFormCostReais] = useState('7800.00');
  const [formStock, setFormStock] = useState(10);
  const [formCoverUrl, setFormCoverUrl] = useState(STUDIO_COVER_PRESETS[0].url);
  const [formSynopsis, setFormSynopsis] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [bookSubmitting, setBookSubmitting] = useState(false);

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'Todos' && o.status !== orderStatusFilter) return false;
    const q = orderSearch.trim().toLowerCase();
    if (q) {
      return (
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        o.shipping_city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredBooks = books.filter((b) => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  });

  async function handleOrderStatusChange(orderId: number, nextStatus: OrderStatus) {
    setOrderError(null);
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar status do pedido.');
      }
      setSelectedOrder(data as Order);
      await onRefreshAll();
    } catch (err) {
      setOrderError((err as Error).message);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleQuickRestock(book: Book, delta: number) {
    setCatalogError(null);
    const nextStock = Math.max(0, book.stock + delta);
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: nextStock }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao atualizar estoque.');
      }
      await onRefreshAll();
    } catch (err) {
      setCatalogError((err as Error).message);
    }
  }

  function openNewBookModal() {
    setEditingBook(null);
    setCatalogError(null);
    setFormIsbn(`978-65-88120-${String(books.length + 10).padStart(2, '0')}-0`);
    setFormTitle('');
    setFormAuthor('');
    setFormPublisher('Editora Meridiano');
    setFormCategory('Ficção Literária');
    setFormYear(2025);
    setFormPages(240);
    setFormBinding('Capa Dura');
    setFormPriceReais('14500.00');
    setFormCostReais('7800.00');
    setFormStock(12);
    setFormCoverUrl(STUDIO_COVER_PRESETS[0].url);
    setFormSynopsis('');
    setFormFeatured(false);
    setShowBookModal(true);
  }

  function openEditBookModal(book: Book) {
    setEditingBook(book);
    setCatalogError(null);
    setFormIsbn(book.isbn);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormPublisher(book.publisher);
    setFormCategory(book.category);
    setFormYear(book.year);
    setFormPages(book.pages);
    setFormBinding(book.binding);
    setFormPriceReais((book.price_cents / 100).toFixed(2));
    setFormCostReais((book.cost_cents / 100).toFixed(2));
    setFormStock(book.stock);
    setFormCoverUrl(book.cover_url);
    setFormSynopsis(book.synopsis);
    setFormFeatured(book.featured === 1);
    setShowBookModal(true);
  }

  async function handleSaveBook(e: FormEvent) {
    e.preventDefault();
    setCatalogError(null);
    setBookSubmitting(true);

    const priceCents = Math.round(parseFloat(formPriceReais.replace(',', '.')) * 100);
    const costCents = Math.round(parseFloat(formCostReais.replace(',', '.')) * 100);

    try {
      const payload = {
        isbn: formIsbn,
        title: formTitle,
        author: formAuthor,
        publisher: formPublisher,
        category: formCategory,
        year: Number(formYear),
        pages: Number(formPages),
        binding: formBinding,
        price_cents: priceCents,
        cost_cents: Number.isFinite(costCents) ? costCents : Math.round(priceCents * 0.55),
        stock: Number(formStock),
        cover_url: formCoverUrl,
        synopsis: formSynopsis,
        featured: formFeatured ? 1 : 0,
      };

      const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books';
      const method = editingBook ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível salvar o livro.');
      }
      setShowBookModal(false);
      await onRefreshAll();
    } catch (err) {
      setCatalogError((err as Error).message);
    } finally {
      setBookSubmitting(false);
    }
  }

  async function handleDeleteBook(book: Book) {
    setCatalogError(null);
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível remover o livro.');
      }
      await onRefreshAll();
    } catch (err) {
      setCatalogError((err as Error).message);
    }
  }

  async function handleCreateManualOrder(e: FormEvent) {
    e.preventDefault();
    setOrderError(null);
    setNewOrderSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: newOrderCustomer,
          customer_email: newOrderEmail,
          customer_phone: newOrderPhone,
          shipping_address: newOrderAddress,
          shipping_city: newOrderCity,
          shipping_postal: newOrderPostal,
          payment_method: newOrderPayment,
          status: 'Pago',
          items: [{ book_id: Number(newOrderBookId), quantity: Number(newOrderQty) }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao registrar pedido.');
      }
      setShowNewOrderModal(false);
      setNewOrderCustomer('');
      setNewOrderEmail('');
      setNewOrderPhone('');
      setNewOrderAddress('');
      setNewOrderCity('');
      setNewOrderPostal('');
      setNewOrderQty(1);
      await onRefreshAll();
    } catch (err) {
      setOrderError((err as Error).message);
    } finally {
      setNewOrderSubmitting(false);
    }
  }

  const maxDayRevenue = salesSummary
    ? Math.max(1, ...salesSummary.revenue_by_day.map((d) => d.revenue_cents))
    : 1;

  return (
    <div className="min-h-screen flex bg-[#F5F4F0] text-[#18181B]">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col justify-between bg-white border-r border-[#E5E3DD]">
        <div>
          <div className="h-16 px-6 flex items-center border-b border-[#E5E3DD]">
            <span className="font-serif text-xl font-semibold text-[#18181B] whitespace-nowrap">
              Livraria Meridiano
            </span>
          </div>

          <nav className="p-4 space-y-1" aria-label="Módulos de Gestão">
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#1E3A34] text-white'
                  : 'text-[#52525B] hover:bg-[#F5F4F0] hover:text-[#18181B]'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Visão Geral &amp; Vendas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#1E3A34] text-white'
                  : 'text-[#52525B] hover:bg-[#F5F4F0] hover:text-[#18181B]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Package className="w-4 h-4 shrink-0" />
                <span>Pedidos</span>
              </span>
              <span className="font-mono tabular-nums text-xs opacity-80">{orders.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-[#1E3A34] text-white'
                  : 'text-[#52525B] hover:bg-[#F5F4F0] hover:text-[#18181B]'
              }`}
            >
              <span className="flex items-center gap-3">
                <BookMarked className="w-4 h-4 shrink-0" />
                <span>Catálogo &amp; Estoque</span>
              </span>
              <span className="font-mono tabular-nums text-xs opacity-80">{books.length}</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#E5E3DD]">
          <button
            type="button"
            onClick={onBackToStorefront}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F4F0] rounded-md transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Catálogo</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Breadcrumbs */}
        <header className="h-16 bg-white border-b border-[#E5E3DD] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-[#71717A] hidden sm:inline">Livraria Meridiano</span>
            <span className="text-[#D4D2CA] hidden sm:inline">/</span>
            <span className="text-[#71717A]">Gestão</span>
            <span className="text-[#D4D2CA]">/</span>
            <span className="font-medium text-[#18181B] truncate">
              {activeTab === 'analytics' && 'Visão Geral & Vendas'}
              {activeTab === 'orders' && 'Gerenciamento de Pedidos'}
              {activeTab === 'catalog' && 'Catálogo & Estoque'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onRefreshAll}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#52525B] border border-[#E5E3DD] bg-white rounded-md hover:text-[#18181B] transition-colors cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              type="button"
              onClick={onBackToStorefront}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1E3A34] border border-[#CBDAD4] bg-[#F2F6F4] rounded-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Loja</span>
            </button>
            {activeTab === 'orders' && (
              <button
                type="button"
                onClick={() => {
                  setOrderError(null);
                  if (books[0]) setNewOrderBookId(books[0].id);
                  setShowNewOrderModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#1E3A34] text-white rounded-md hover:bg-[#162C27] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Pedido</span>
              </button>
            )}
            {activeTab === 'catalog' && (
              <button
                type="button"
                onClick={openNewBookModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#1E3A34] text-white rounded-md hover:bg-[#162C27] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Livro</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden bg-white border-b border-[#E5E3DD] px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-[#1E3A34] text-white'
                : 'text-[#52525B] bg-[#F5F4F0]'
            }`}
          >
            Visão Geral &amp; Vendas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'orders' ? 'bg-[#1E3A34] text-white' : 'text-[#52525B] bg-[#F5F4F0]'
            }`}
          >
            Pedidos ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'catalog' ? 'bg-[#1E3A34] text-white' : 'text-[#52525B] bg-[#F5F4F0]'
            }`}
          >
            Catálogo &amp; Estoque ({books.length})
          </button>
        </div>

        {/* Workspace Content */}
        <main className="flex-1 p-6 max-w-[1320px] w-full mx-auto space-y-6">
          {activeTab === 'analytics' && salesSummary && (
            <>
              {/* 4-Column KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E3DD] rounded-md p-5">
                  <p className="text-xs font-medium text-[#52525B]">Receita Bruta (Ativos)</p>
                  <p className="font-mono tabular-nums text-2xl font-semibold text-[#18181B] mt-2">
                    {formatKz(salesSummary.total_revenue_cents)}
                  </p>
                  <p className="text-xs text-[#166534] font-mono tabular-nums mt-1.5">
                    Margem bruta: {formatKz(salesSummary.total_profit_cents)}
                  </p>
                </div>

                <div className="bg-white border border-[#E5E3DD] rounded-md p-5">
                  <p className="text-xs font-medium text-[#52525B]">Pedidos Confirmados</p>
                  <p className="font-mono tabular-nums text-2xl font-semibold text-[#18181B] mt-2">
                    {salesSummary.total_orders}
                  </p>
                  <p className="text-xs text-[#92400E] tabular-nums mt-1.5">
                    {salesSummary.pending_orders} aguardando envio/conclusão
                  </p>
                </div>

                <div className="bg-white border border-[#E5E3DD] rounded-md p-5">
                  <p className="text-xs font-medium text-[#52525B]">Ticket Médio</p>
                  <p className="font-mono tabular-nums text-2xl font-semibold text-[#18181B] mt-2">
                    {formatKz(salesSummary.average_ticket_cents)}
                  </p>
                  <p className="text-xs text-[#71717A] mt-1.5">Por pedido não cancelado</p>
                </div>

                <div className="bg-white border border-[#E5E3DD] rounded-md p-5">
                  <p className="text-xs font-medium text-[#52525B]">Exemplares Vendidos</p>
                  <p className="font-mono tabular-nums text-2xl font-semibold text-[#18181B] mt-2">
                    {salesSummary.books_sold_count}
                  </p>
                  <p className="text-xs text-[#52525B] tabular-nums mt-1.5">
                    {salesSummary.low_stock_books.length} título(s) com estoque baixo
                  </p>
                </div>
              </div>

              {/* Revenue 7-day SVG Chart + Top Books */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-[#E5E3DD] rounded-md p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-base font-semibold text-[#18181B]">
                        Receita nos Últimos 7 Dias
                      </h2>
                      <p className="text-xs text-[#52525B] mt-0.5">
                        Faturamento diário consolidado (exclui pedidos cancelados)
                      </p>
                    </div>
                    {hoveredDay && (
                      <div className="text-right font-mono tabular-nums text-xs">
                        {(() => {
                          const d = salesSummary.revenue_by_day.find((x) => x.date === hoveredDay);
                          if (!d) return null;
                          return (
                            <>
                              <p className="font-medium text-[#18181B]">
                                {d.label} · {formatKz(d.revenue_cents)}
                              </p>
                              <p className="text-[#71717A]">{d.orders_count} pedido(s)</p>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="w-full h-56 flex items-end gap-3 pt-4 border-b border-[#E5E3DD]">
                    {salesSummary.revenue_by_day.map((day) => {
                      const heightPct = Math.max(
                        4,
                        Math.round((day.revenue_cents / maxDayRevenue) * 100)
                      );
                      const isHovered = hoveredDay === day.date;
                      return (
                        <div
                          key={day.date}
                          onMouseEnter={() => setHoveredDay(day.date)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className="flex-1 h-full flex flex-col items-center justify-end gap-2 group cursor-pointer"
                        >
                          <span className="text-[11px] font-mono tabular-nums text-[#52525B] opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.revenue_cents > 0 ? formatKz(day.revenue_cents) : '0 Kz'}
                          </span>
                          <div className="w-full max-w-[44px] flex-1 flex items-end">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t-sm transition-colors ${
                                day.revenue_cents === 0
                                  ? 'bg-[#E5E3DD]'
                                  : isHovered
                                  ? 'bg-[#162C27]'
                                  : 'bg-[#1E3A34]'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 pt-2.5">
                    {salesSummary.revenue_by_day.map((day) => (
                      <div
                        key={day.date}
                        className="flex-1 text-center font-mono tabular-nums text-xs text-[#52525B]"
                      >
                        {day.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sales by Category */}
                <div className="lg:col-span-5 bg-white border border-[#E5E3DD] rounded-md p-6">
                  <h2 className="text-base font-semibold text-[#18181B]">Vendas por Categoria</h2>
                  <p className="text-xs text-[#52525B] mt-0.5 mb-4">
                    Participação de exemplares e receita
                  </p>

                  {salesSummary.sales_by_category.length === 0 ? (
                    <p className="text-sm text-[#71717A] py-8 text-center">
                      Nenhuma venda registrada ainda.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#E5E3DD] text-xs text-[#71717A]">
                            <th className="py-2 text-left font-medium">Categoria</th>
                            <th className="py-2 text-right font-medium">Qtd.</th>
                            <th className="py-2 text-right font-medium">Receita</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E3DD]">
                          {salesSummary.sales_by_category.map((cat) => (
                            <tr key={cat.category} className="hover:bg-[#F9F8F6]">
                              <td className="py-2.5 text-[#18181B]">{cat.category}</td>
                              <td className="py-2.5 text-right font-mono tabular-nums text-[#52525B]">
                                {cat.units_sold}
                              </td>
                              <td className="py-2.5 text-right font-mono tabular-nums font-medium text-[#18181B]">
                                {formatKz(cat.revenue_cents)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Grid: Top Selling Books + Low Stock Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-[#E5E3DD] rounded-md p-6">
                  <h2 className="text-base font-semibold text-[#18181B] mb-4">
                    Títulos Mais Vendidos
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E3DD] text-xs text-[#71717A]">
                          <th className="py-2 text-left font-medium">Título</th>
                          <th className="py-2 text-left font-medium">Autor</th>
                          <th className="py-2 text-right font-medium">Vendidos</th>
                          <th className="py-2 text-right font-medium">Receita</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E3DD]">
                        {salesSummary.top_books.map((tb) => (
                          <tr key={tb.book_id} className="hover:bg-[#F9F8F6]">
                            <td className="py-2.5 font-medium text-[#18181B]">{tb.title}</td>
                            <td className="py-2.5 text-[#52525B]">{tb.author}</td>
                            <td className="py-2.5 text-right font-mono tabular-nums text-[#18181B]">
                              {tb.units_sold}
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums font-medium text-[#18181B]">
                              {formatKz(tb.revenue_cents)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white border border-[#E5E3DD] rounded-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-[#18181B]">
                        Alertas de Reposição
                      </h2>
                      <p className="text-xs text-[#52525B]">Livros com 5 ou menos unidades</p>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-[#92400E]" />
                  </div>

                  {salesSummary.low_stock_books.length === 0 ? (
                    <p className="text-sm text-[#166534] py-6">
                      Todo o acervo está com estoque regular acima de 5 exemplares.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#E5E3DD]">
                      {salesSummary.low_stock_books.map((bk) => (
                        <li
                          key={bk.id}
                          className="py-3 flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-[#18181B] truncate">{bk.title}</p>
                            <p className="text-xs text-[#92400E] font-mono tabular-nums">
                              Restam {bk.stock} un.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(bk, 5)}
                            className="px-3 py-1.5 text-xs font-medium border border-[#D4D2CA] rounded-md hover:border-[#1E3A34] hover:text-[#1E3A34] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            +5 un.
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orderError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B]">
                  {orderError}
                </div>
              )}

              {/* Filters Toolbar */}
              <div className="bg-white border border-[#E5E3DD] rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Buscar código, cliente ou cidade..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(['Todos', ...ORDER_STATUSES] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        orderStatusFilter === status
                          ? 'bg-[#1E3A34] text-white'
                          : 'bg-[#F5F4F0] text-[#52525B] hover:text-[#18181B]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* High-Density Orders Table */}
              <div className="bg-white border border-[#E5E3DD] rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F9F8F6] border-b border-[#E5E3DD] text-xs text-[#52525B]">
                        <th className="px-4 py-3 text-left font-medium">Código</th>
                        <th className="px-4 py-3 text-left font-medium">Data</th>
                        <th className="px-4 py-3 text-left font-medium">Cliente</th>
                        <th className="px-4 py-3 text-left font-medium">Cidade</th>
                        <th className="px-4 py-3 text-left font-medium">Pagamento</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Itens</th>
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                        <th className="px-4 py-3 text-right font-medium">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E3DD]">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-[#71717A]">
                            Nenhum pedido encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          const st = getStatusStyle(order.status);
                          const totalItems = order.items.reduce((a, b) => a + b.quantity, 0);
                          return (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className="hover:bg-[#F9F8F6] transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3 font-mono font-medium text-[#18181B] whitespace-nowrap">
                                {order.order_code}
                              </td>
                              <td className="px-4 py-3 font-mono tabular-nums text-xs text-[#52525B] whitespace-nowrap">
                                {formatDateShort(order.created_at)}
                              </td>
                              <td className="px-4 py-3 font-medium text-[#18181B]">
                                {order.customer_name}
                              </td>
                              <td className="px-4 py-3 text-[#52525B]">{order.shipping_city}</td>
                              <td className="px-4 py-3 text-xs text-[#52525B]">
                                {order.payment_method}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${st.bgClass} ${st.textClass} ${st.borderClass}`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums text-[#52525B]">
                                {totalItems}
                              </td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums font-medium text-[#18181B]">
                                {formatKz(order.total_cents)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                  }}
                                  className="text-xs font-medium text-[#1E3A34] hover:underline cursor-pointer"
                                >
                                  Gerenciar
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-4">
              {catalogError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B]">
                  {catalogError}
                </div>
              )}

              <div className="bg-white border border-[#E5E3DD] rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Buscar título, autor, ISBN ou categoria..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <p className="text-xs text-[#52525B] tabular-nums">
                  {filteredBooks.length} título(s) no catálogo
                </p>
              </div>

              <div className="bg-white border border-[#E5E3DD] rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F9F8F6] border-b border-[#E5E3DD] text-xs text-[#52525B]">
                        <th className="px-4 py-3 text-left font-medium">Livro</th>
                        <th className="px-4 py-3 text-left font-medium">ISBN</th>
                        <th className="px-4 py-3 text-left font-medium">Categoria</th>
                        <th className="px-4 py-3 text-right font-medium">Custo</th>
                        <th className="px-4 py-3 text-right font-medium">Venda</th>
                        <th className="px-4 py-3 text-right font-medium">Estoque</th>
                        <th className="px-4 py-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E3DD]">
                      {filteredBooks.map((book) => (
                        <tr key={book.id} className="hover:bg-[#F9F8F6] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <BookCover
                                src={book.cover_url}
                                title={book.title}
                                author={book.author}
                                className="w-9 h-12 rounded-sm shrink-0 border border-[#E5E3DD]"
                              />
                              <div>
                                <p className="font-medium text-[#18181B]">{book.title}</p>
                                <p className="text-xs text-[#52525B]">
                                  {book.author} · {book.binding}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-xs text-[#52525B] whitespace-nowrap">
                            {book.isbn}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#52525B]">{book.category}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-[#71717A]">
                            {formatKz(book.cost_cents)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-medium text-[#18181B]">
                            {formatKz(book.price_cents)}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickRestock(book, -1)}
                                disabled={book.stock <= 0}
                                className="px-1.5 py-0.5 text-xs border border-[#E5E3DD] rounded hover:border-[#1E3A34] disabled:opacity-40 cursor-pointer"
                                aria-label="Reduzir estoque em 1"
                              >
                                -1
                              </button>
                              <span
                                className={`min-w-[32px] text-center font-mono tabular-nums font-medium ${
                                  book.stock === 0
                                    ? 'text-[#991B1B]'
                                    : book.stock <= 5
                                    ? 'text-[#92400E]'
                                    : 'text-[#18181B]'
                                }`}
                              >
                                {book.stock}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickRestock(book, 1)}
                                className="px-1.5 py-0.5 text-xs border border-[#E5E3DD] rounded hover:border-[#1E3A34] cursor-pointer"
                                aria-label="Aumentar estoque em 1"
                              >
                                +1
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditBookModal(book)}
                                className="p-1.5 text-[#52525B] hover:text-[#1E3A34] transition-colors cursor-pointer"
                                aria-label={`Editar ${book.title}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBook(book)}
                                className="p-1.5 text-[#52525B] hover:text-[#991B1B] transition-colors cursor-pointer"
                                aria-label={`Excluir ${book.title}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Order Detail & Status Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes do pedido ${selectedOrder.order_code}`}
        >
          <div className="w-full max-w-2xl bg-white border border-[#E5E3DD] rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E3DD] flex items-center justify-between">
              <div>
                <h2 className="font-mono text-lg font-semibold text-[#18181B]">
                  Pedido {selectedOrder.order_code}
                </h2>
                <p className="text-xs text-[#52525B]">
                  Criado em {formatDateTime(selectedOrder.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-[#52525B] hover:text-[#18181B]"
                aria-label="Fechar detalhes do pedido"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <p className="text-xs font-medium text-[#52525B] mb-2">
                  Atualizar Status do Pedido
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ORDER_STATUSES.map((st) => {
                    const active = selectedOrder.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={updatingOrderId === selectedOrder.id || active}
                        onClick={() => handleOrderStatusChange(selectedOrder.id, st)}
                        className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#1E3A34] text-white border-[#1E3A34]'
                            : 'bg-white text-[#52525B] border-[#E5E3DD] hover:border-[#1E3A34] hover:text-[#18181B]'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#71717A] mt-2">
                  Alterar o status para “Cancelado” devolve automaticamente os exemplares ao
                  estoque.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F9F8F6] border border-[#E5E3DD] rounded-md text-xs">
                <div className="space-y-1">
                  <p className="font-medium text-[#18181B]">Cliente &amp; Contato</p>
                  <p className="text-[#18181B]">{selectedOrder.customer_name}</p>
                  <p className="text-[#52525B]">{selectedOrder.customer_email}</p>
                  <p className="text-[#52525B] font-mono">{selectedOrder.customer_phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#18181B]">Entrega &amp; Pagamento</p>
                  <p className="text-[#52525B]">
                    {selectedOrder.shipping_address}, {selectedOrder.shipping_city}
                  </p>
                  <p className="text-[#52525B] font-mono">CEP {selectedOrder.shipping_postal}</p>
                  <p className="text-[#1E3A34] font-medium">{selectedOrder.payment_method}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-[#52525B] mb-2">Itens do Pedido</h3>
                <table className="w-full text-sm border border-[#E5E3DD] rounded-md">
                  <thead>
                    <tr className="bg-[#F9F8F6] border-b border-[#E5E3DD] text-xs text-[#52525B]">
                      <th className="px-3 py-2 text-left font-medium">Título</th>
                      <th className="px-3 py-2 text-right font-medium">Qtd.</th>
                      <th className="px-3 py-2 text-right font-medium">Unitário</th>
                      <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DD]">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-[#18181B]">{item.book_title}</p>
                          <p className="text-xs text-[#71717A] font-mono">{item.book_isbn}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#52525B]">
                          {formatKz(item.unit_price_cents)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums font-medium">
                          {formatKz(item.unit_price_cents * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedOrder.notes && (
                <div className="text-xs text-[#52525B]">
                  <strong className="text-[#18181B]">Observações:</strong> {selectedOrder.notes}
                </div>
              )}

              <div className="border-t border-[#E5E3DD] pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-[#52525B]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatKz(selectedOrder.subtotal_cents)}
                  </span>
                </div>
                <div className="flex justify-between text-[#52525B]">
                  <span>Frete</span>
                  <span className="font-mono tabular-nums">
                    {selectedOrder.shipping_cents === 0
                      ? 'Grátis'
                      : formatKz(selectedOrder.shipping_cents)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-base text-[#18181B] pt-1">
                  <span>Total do Pedido</span>
                  <span className="font-mono tabular-nums">
                    {formatKz(selectedOrder.total_cents)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Creation Modal */}
      {showNewOrderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Registrar novo pedido manual"
        >
          <div className="w-full max-w-lg bg-white border border-[#E5E3DD] rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E3DD] flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-[#18181B]">
                Registrar Pedido de Balcão / Telefone
              </h2>
              <button
                type="button"
                onClick={() => setShowNewOrderModal(false)}
                className="p-2 text-[#52525B] hover:text-[#18181B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateManualOrder} className="p-6 overflow-y-auto space-y-4">
              {orderError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B]">
                  {orderError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">
                  Selecionar Livro *
                </label>
                <select
                  value={newOrderBookId}
                  onChange={(e) => setNewOrderBookId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                >
                  {books
                    .filter((b) => b.stock > 0)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} — {formatKz(b.price_cents)} ({b.stock} un.)
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newOrderQty}
                    onChange={(e) => setNewOrderQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Pagamento *
                  </label>
                  <select
                    value={newOrderPayment}
                    onChange={(e) => setNewOrderPayment(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={newOrderCustomer}
                  onChange={(e) => setNewOrderCustomer(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={newOrderEmail}
                    onChange={(e) => setNewOrderEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newOrderPhone}
                    onChange={(e) => setNewOrderPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">Endereço *</label>
                <input
                  type="text"
                  required
                  value={newOrderAddress}
                  onChange={(e) => setNewOrderAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Cidade / UF *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrderCity}
                    onChange={(e) => setNewOrderCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">CEP *</label>
                  <input
                    type="text"
                    required
                    value={newOrderPostal}
                    onChange={(e) => setNewOrderPostal(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[#52525B] border border-[#D4D2CA] rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={newOrderSubmitting}
                  className="px-5 py-2 text-sm font-medium bg-[#1E3A34] text-white rounded-md hover:bg-[#162C27] disabled:opacity-60"
                >
                  {newOrderSubmitting ? 'Registrando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Create / Edit Modal */}
      {showBookModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingBook ? 'Editar livro' : 'Cadastrar novo livro'}
        >
          <div className="w-full max-w-2xl bg-white border border-[#E5E3DD] rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E3DD] flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-[#18181B]">
                {editingBook ? `Editar: ${editingBook.title}` : 'Cadastrar Novo Título'}
              </h2>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="p-2 text-[#52525B] hover:text-[#18181B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 overflow-y-auto space-y-4">
              {catalogError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B]">
                  {catalogError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">Título *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">Autor *</label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">ISBN *</label>
                  <input
                    type="text"
                    required
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  >
                    {CATEGORIES.filter((c) => c !== 'Todos').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Editora *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPublisher}
                    onChange={(e) => setFormPublisher(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Preço (Kz) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPriceReais}
                    onChange={(e) => setFormPriceReais(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Custo (Kz) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCostReais}
                    onChange={(e) => setFormCostReais(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">Estoque *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">Ano</label>
                  <input
                    type="number"
                    required
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Acabamento
                  </label>
                  <select
                    value={formBinding}
                    onChange={(e) => setFormBinding(e.target.value as BookBinding)}
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  >
                    {BOOK_BINDINGS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">Páginas</label>
                  <input
                    type="number"
                    min={1}
                    value={formPages}
                    onChange={(e) => setFormPages(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">
                  Capa (selecione um padrão editorial ou deixe vazio para capa tipográfica)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {STUDIO_COVER_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setFormCoverUrl(preset.url)}
                      className={`px-2.5 py-1 text-[11px] rounded border cursor-pointer ${
                        formCoverUrl === preset.url
                          ? 'border-[#1E3A34] bg-[#F2F6F4] text-[#1E3A34]'
                          : 'border-[#E5E3DD] text-[#52525B]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormCoverUrl('')}
                    className={`px-2.5 py-1 text-[11px] rounded border cursor-pointer ${
                      formCoverUrl === ''
                        ? 'border-[#1E3A34] bg-[#F2F6F4] text-[#1E3A34]'
                        : 'border-[#E5E3DD] text-[#52525B]'
                    }`}
                  >
                    Tipográfica
                  </button>
                </div>
                <input
                  type="text"
                  value={formCoverUrl}
                  onChange={(e) => setFormCoverUrl(e.target.value)}
                  placeholder="/src/assets/images/..."
                  className="w-full px-3 py-2 text-xs font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">Sinopse</label>
                <textarea
                  rows={3}
                  value={formSynopsis}
                  onChange={(e) => setFormSynopsis(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#18181B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="accent-[#1E3A34]"
                />
                <span>Destacar no topo do catálogo</span>
              </label>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#E5E3DD]">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[#52525B] border border-[#D4D2CA] rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={bookSubmitting}
                  className="px-5 py-2 text-sm font-medium bg-[#1E3A34] text-white rounded-md hover:bg-[#162C27] disabled:opacity-60"
                >
                  {bookSubmitting ? 'Salvando...' : editingBook ? 'Salvar Alterações' : 'Cadastrar Livro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
