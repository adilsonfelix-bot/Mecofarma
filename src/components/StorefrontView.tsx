import { useMemo, useState } from 'react';
import { Search, ShoppingBag, ArrowUpRight, Check } from 'lucide-react';
import type { Book, CartItem } from '../types';
import { CATEGORIES, formatKz } from '../utils/format';
import { BookCover } from './BookCover';
import { BookDetailModal } from './BookDetailModal';

interface StorefrontViewProps {
  books: Book[];
  loading: boolean;
  cart: CartItem[];
  onAddToCart: (book: Book, quantity?: number) => void;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onSwitchToAdmin: () => void;
}

const HERO_IMAGE = '/src/assets/images/hero_livraria_meridiano_1795005230335.jpg';

export function StorefrontView({
  books,
  loading,
  cart,
  onAddToCart,
  onOpenCart,
  onOpenTracking,
  onSwitchToAdmin,
}: StorefrontViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>(
    'featured'
  );
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const availableCategories = useMemo(() => {
    const dynamicCats = new Set<string>(CATEGORIES);
    books.forEach((b) => dynamicCats.add(b.category));
    return Array.from(dynamicCats);
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = books.filter((b) => {
      if (selectedCategory !== 'Todos' && b.category !== selectedCategory) return false;
      if (onlyInStock && b.stock <= 0) return false;
      if (q) {
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q) ||
          b.publisher.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price_cents - b.price_cents;
      if (sortBy === 'price_desc') return b.price_cents - a.price_cents;
      if (sortBy === 'newest') return b.year - a.year || b.id - a.id;
      return b.featured - a.featured || a.id - b.id;
    });
  }, [books, search, selectedCategory, onlyInStock, sortBy]);

  function handleQuickAdd(book: Book) {
    const inCart = cart.find((c) => c.book.id === book.id)?.quantity ?? 0;
    if (inCart >= book.stock) return;
    onAddToCart(book, 1);
    setRecentlyAddedId(book.id);
    setTimeout(() => {
      setRecentlyAddedId((prev) => (prev === book.id ? null : prev));
    }, 1000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-[#18181B]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#F9F8F6]/95 backdrop-blur-sm border-b border-[#E5E3DD]">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#topo"
            className="font-serif text-2xl font-semibold tracking-tight text-[#18181B] whitespace-nowrap shrink-0"
          >
            Livraria Meridiano
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52525B]"
          >
            <a
              href="#catalogo"
              className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0"
            >
              Catálogo
            </a>
            <a
              href="#sobre"
              className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0"
            >
              Sobre a Casa
            </a>
            <button
              type="button"
              onClick={onOpenTracking}
              className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Rastrear Pedido
            </button>
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="hover:text-[#1E3A34] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Gestão &amp; Vendas
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="md:hidden text-xs font-medium text-[#52525B] hover:text-[#18181B] px-2.5 py-2 whitespace-nowrap shrink-0"
            >
              Gestão
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#1E3A34] text-white rounded-md hover:bg-[#162C27] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="tabular-nums">Sacola ({totalCartItems})</span>
            </button>
          </div>
        </div>
      </header>

      <main id="topo" className="flex-1">
        {/* Section 1: Editorial Hero */}
        <section className="max-w-[1280px] mx-auto px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between py-2 lg:py-4 space-y-8">
              <div className="space-y-5">
                <p className="text-xs text-[#52525B] tracking-wide">
                  Acervo Independente · Edições Selecionadas
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#18181B] leading-[1.08] tracking-tight [text-wrap:balance]">
                  Livros escolhidos pela permanência das ideias e pelo ofício editorial.
                </h1>
                <p className="text-base text-[#52525B] leading-relaxed max-w-md">
                  Catálogo de ficção contemporânea, arquitetura, ensaios botânicos e filosofia com
                  envio nacional e controle de acervo em tempo real.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="#catalogo"
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#1E3A34] text-white text-sm font-medium rounded-md hover:bg-[#162C27] transition-colors whitespace-nowrap shrink-0"
                  >
                    Explorar Catálogo
                  </a>
                  <button
                    type="button"
                    onClick={onOpenTracking}
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-[#18181B] hover:text-[#1E3A34] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Acompanhar Pedido</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-4 border-t border-[#E5E3DD] text-xs text-[#52525B] flex flex-wrap items-center gap-2">
                  <span>Frete grátis acima de 35.000 Kz</span>
                  <span aria-hidden="true">·</span>
                  <span>Pix, Cartão e Boleto</span>
                  <span aria-hidden="true">·</span>
                  <span>Despacho em até 24h úteis</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="w-full h-full min-h-[300px] lg:min-h-[440px] rounded-md overflow-hidden border border-[#E5E3DD] bg-[#ECEAE4]">
                <img
                  src={HERO_IMAGE}
                  alt="Interior iluminado da Livraria Meridiano com estantes de carvalho e mesa de leitura em pedra"
                  referrerPolicy="no-referrer"
                  className="w-full h-full lg:h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Catálogo Online */}
        <section id="catalogo" className="max-w-[1280px] mx-auto px-6 py-12 border-t border-[#E5E3DD]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-[#18181B]">
                Catálogo do Acervo
              </h2>
              <p className="text-sm text-[#52525B] mt-1 tabular-nums">
                {filteredBooks.length}{' '}
                {filteredBooks.length === 1 ? 'título disponível' : 'títulos disponíveis'} para
                envio imediato.
              </p>
            </div>

            {/* Search + Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar título, autor ou ISBN..."
                  aria-label="Buscar livros no catálogo"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as 'featured' | 'price_asc' | 'price_desc' | 'newest'
                  )
                }
                aria-label="Ordenar catálogo"
                className="px-3 py-2 text-sm bg-white border border-[#D4D2CA] rounded-md text-[#18181B] focus:outline-none focus:border-[#1E3A34]"
              >
                <option value="featured">Destaques da Casa</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="newest">Edições Mais Recentes</option>
              </select>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#52525B] cursor-pointer select-none px-2 py-2">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-[#1E3A34] rounded"
                />
                <span>Apenas em estoque</span>
              </label>
            </div>
          </div>

          {/* Interactive category tabs */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6"
            role="tablist"
            aria-label="Filtrar por categoria"
          >
            {availableCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#1E3A34] text-white'
                      : 'bg-white text-[#52525B] border border-[#E5E3DD] hover:text-[#18181B] hover:border-[#D4D2CA]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-[#E5E3DD] rounded-md p-5 space-y-4 animate-pulse"
                >
                  <div className="w-full aspect-[3/4] bg-[#ECEAE4] rounded-sm" />
                  <div className="h-3 w-1/3 bg-[#ECEAE4] rounded" />
                  <div className="h-5 w-3/4 bg-[#ECEAE4] rounded" />
                  <div className="h-4 w-1/2 bg-[#ECEAE4] rounded" />
                </div>
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white border border-[#E5E3DD] rounded-md p-12 text-center">
              <p className="font-serif text-2xl font-medium text-[#18181B]">
                Nenhum título corresponde à sua busca
              </p>
              <p className="text-sm text-[#52525B] mt-1">
                Tente limpar os filtros ou buscar por outro autor, palavra-chave ou ISBN.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('Todos');
                  setOnlyInStock(false);
                }}
                className="mt-5 px-4 py-2 text-xs font-medium bg-[#1E3A34] text-white rounded-md hover:bg-[#162C27] transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBooks.map((book) => {
                const inCartQty = cart.find((c) => c.book.id === book.id)?.quantity ?? 0;
                const canAddMore = book.stock - inCartQty > 0;
                const isJustAdded = recentlyAddedId === book.id;

                return (
                  <article
                    key={book.id}
                    className="group bg-white border border-[#E5E3DD] rounded-md p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedBook(book)}
                        className="w-full text-left focus-visible:outline-2 focus-visible:outline-[#1E3A34] rounded-sm cursor-pointer"
                      >
                        <div className="w-full aspect-[3/4] overflow-hidden rounded-sm bg-[#F4F2ED] mb-4">
                          <BookCover
                            src={book.cover_url}
                            title={book.title}
                            author={book.author}
                            className="w-full h-full transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </div>

                        {/* Zero-Pill Metadata */}
                        <div className="text-xs text-[#52525B] flex items-center gap-1.5 truncate">
                          <span>{book.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{book.year}</span>
                          <span aria-hidden="true">·</span>
                          <span>{book.binding}</span>
                        </div>

                        <h3 className="font-serif text-xl font-semibold text-[#18181B] mt-1.5 leading-snug group-hover:text-[#1E3A34] transition-colors line-clamp-1">
                          {book.title}
                        </h3>
                        <p className="text-sm text-[#52525B] mt-0.5 truncate">{book.author}</p>
                      </button>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#E5E3DD] flex items-center justify-between gap-3">
                      <div>
                        <p className="font-mono tabular-nums text-base font-medium text-[#18181B]">
                          {formatKz(book.price_cents)}
                        </p>
                        <p
                          className={`text-xs tabular-nums ${
                            book.stock === 0
                              ? 'text-[#991B1B]'
                              : book.stock <= 5
                              ? 'text-[#92400E]'
                              : 'text-[#71717A]'
                          }`}
                        >
                          {book.stock === 0
                            ? 'Esgotado'
                            : book.stock <= 5
                            ? `Últimas ${book.stock} un.`
                            : `${book.stock} em estoque`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickAdd(book)}
                        disabled={!canAddMore}
                        className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isJustAdded
                            ? 'bg-[#166534] text-white'
                            : canAddMore
                            ? 'bg-[#1E3A34] text-white hover:bg-[#162C27]'
                            : 'bg-[#ECEAE4] text-[#71717A] cursor-not-allowed'
                        }`}
                      >
                        {isJustAdded ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Adicionado
                          </span>
                        ) : book.stock === 0 ? (
                          'Esgotado'
                        ) : !canAddMore ? (
                          'Máx. na Sacola'
                        ) : (
                          'Adicionar'
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3: Sobre a Casa */}
        <section id="sobre" className="max-w-[1280px] mx-auto px-6 py-14 border-t border-[#E5E3DD]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            <div className="md:col-span-5">
              <p className="text-xs text-[#52525B] mb-2">Sobre a Casa</p>
              <h2 className="font-serif text-3xl font-semibold text-[#18181B] leading-tight [text-wrap:balance]">
                Curadoria independente, encadernação durável e entrega transparente.
              </h2>
            </div>
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm text-[#52525B] leading-relaxed">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#18181B]">
                  Acervo Verificado em Tempo Real
                </h3>
                <p>
                  Cada exemplar listado no catálogo reflete o inventário físico da livraria. Ao
                  confirmar um pedido, a reserva do estoque é feita instantaneamente no servidor.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#18181B]">
                  Envio Protegido e Rastreável
                </h3>
                <p>
                  Despachamos em embalagem reforçada com papel kraft neutro. Pedidos acima de
                  35.000,00 Kz contam com frete gratuito e acompanhamento direto pelo código do
                  pedido.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E5E3DD] bg-white">
        <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#52525B]">
          <div className="space-y-1">
            <p className="font-serif text-base font-semibold text-[#18181B]">Livraria Meridiano</p>
            <p>Rua da Consolação, 1840 · São Paulo, SP · Seg a Sáb, 10h às 19h</p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#catalogo" className="hover:text-[#18181B] transition-colors">
              Catálogo
            </a>
            <button
              type="button"
              onClick={onOpenTracking}
              className="hover:text-[#18181B] transition-colors cursor-pointer"
            >
              Rastrear Pedido
            </button>
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="hover:text-[#18181B] transition-colors cursor-pointer"
            >
              Painel de Gestão
            </button>
          </div>
        </div>
      </footer>

      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onAddToCart={onAddToCart}
        cartQuantityForBook={
          selectedBook ? cart.find((c) => c.book.id === selectedBook.id)?.quantity ?? 0 : 0
        }
      />
    </div>
  );
}
