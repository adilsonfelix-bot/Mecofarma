import { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import type { Book } from '../types';
import { formatKz } from '../utils/format';
import { BookCover } from './BookCover';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onAddToCart: (book: Book, quantity: number) => void;
  cartQuantityForBook: number;
}

export function BookDetailModal({
  book,
  onClose,
  onAddToCart,
  cartQuantityForBook,
}: BookDetailModalProps) {
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!book) return null;

  const remainingAvailable = Math.max(0, book.stock - cartQuantityForBook);
  const effectiveQty = Math.min(qty, Math.max(1, remainingAvailable));

  function handleAdd() {
    if (!book || remainingAvailable <= 0) return;
    onAddToCart(book, effectiveQty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${book.title}`}
    >
      <div className="relative w-full max-w-4xl bg-white border border-[#E5E3DD] rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 text-[#52525B] hover:text-[#18181B] border border-[#E5E3DD] rounded-md transition-colors"
          aria-label="Fechar detalhes do livro"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
          {/* Cover gallery left */}
          <div className="md:col-span-5 bg-[#F4F2ED] p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#E5E3DD]">
            <BookCover
              src={book.cover_url}
              title={book.title}
              author={book.author}
              className="w-full max-w-[260px] aspect-[3/4] rounded-sm shadow-sm"
            />
          </div>

          {/* Contiguous purchase module right */}
          <div className="md:col-span-7 p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="text-xs text-[#52525B] flex flex-wrap items-center gap-2">
                <span>{book.category}</span>
                <span aria-hidden="true">·</span>
                <span>{book.year}</span>
                <span aria-hidden="true">·</span>
                <span>{book.binding}</span>
              </div>

              <div>
                <h2 className="font-serif text-3xl font-semibold text-[#18181B] leading-tight">
                  {book.title}
                </h2>
                <p className="text-base text-[#52525B] mt-1">Por {book.author}</p>
              </div>

              <div className="flex items-baseline justify-between border-y border-[#E5E3DD] py-3.5">
                <span className="font-mono tabular-nums text-2xl font-medium text-[#18181B]">
                  {formatKz(book.price_cents)}
                </span>
                <span
                  className={`text-xs font-medium ${
                    book.stock === 0
                      ? 'text-[#991B1B]'
                      : book.stock <= 5
                      ? 'text-[#92400E]'
                      : 'text-[#1E3A34]'
                  }`}
                >
                  {book.stock === 0
                    ? 'Esgotado no momento'
                    : book.stock <= 5
                    ? `Últimas ${book.stock} unidades`
                    : `${book.stock} exemplares disponíveis`}
                </span>
              </div>

              <p className="text-sm text-[#3F3F46] leading-relaxed">{book.synopsis}</p>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div>
                  <dt className="text-[#71717A]">Editora</dt>
                  <dd className="text-[#18181B] font-medium mt-0.5">{book.publisher}</dd>
                </div>
                <div>
                  <dt className="text-[#71717A]">Páginas</dt>
                  <dd className="text-[#18181B] font-mono tabular-nums font-medium mt-0.5">
                    {book.pages} p.
                  </dd>
                </div>
                <div>
                  <dt className="text-[#71717A]">ISBN</dt>
                  <dd className="text-[#18181B] font-mono tabular-nums font-medium mt-0.5">
                    {book.isbn}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-[#E5E3DD] flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center border border-[#D4D2CA] rounded-md bg-white">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={remainingAvailable <= 0}
                  className="px-3 py-2.5 text-[#52525B] hover:text-[#18181B] disabled:opacity-40"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-mono tabular-nums text-[#18181B]">
                  {remainingAvailable <= 0 ? 0 : effectiveQty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(remainingAvailable, q + 1))}
                  disabled={effectiveQty >= remainingAvailable}
                  className="px-3 py-2.5 text-[#52525B] hover:text-[#18181B] disabled:opacity-40"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={remainingAvailable <= 0}
                className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 px-5 bg-[#1E3A34] text-white text-sm font-medium rounded-md hover:bg-[#162C27] disabled:bg-[#D4D2CA] disabled:text-[#71717A] transition-colors"
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Adicionado à Sacola</span>
                  </>
                ) : remainingAvailable <= 0 ? (
                  <span>
                    {book.stock === 0 ? 'Indisponível' : 'Limite na Sacola Atingido'}
                  </span>
                ) : (
                  <span>
                    Adicionar à Sacola · {formatKz(book.price_cents * effectiveQty)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
