import { useState, type FormEvent } from 'react';
import { X, Plus, Minus, Trash2, CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';
import type { CartItem, Order, PaymentMethod } from '../types';
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  PAYMENT_METHODS,
  STANDARD_SHIPPING_CENTS,
  formatKz,
} from '../utils/format';
import { BookCover } from './BookCover';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (bookId: number, nextQty: number) => void;
  onRemoveItem: (bookId: number) => void;
  onClearCart: () => void;
  onOrderCreated: (order: Order) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
}: CartDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostal, setShippingPostal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.book.price_cents * item.quantity,
    0
  );
  const shippingCents =
    subtotalCents === 0
      ? 0
      : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : STANDARD_SHIPPING_CENTS;
  const totalCents = subtotalCents + shippingCents;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);

  async function handleCheckoutSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_postal: shippingPostal,
          payment_method: paymentMethod,
          notes,
          items: items.map((item) => ({
            book_id: item.book.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível concluir o pedido.');
      }
      setConfirmedOrder(data as Order);
      onClearCart();
      onOrderCreated(data as Order);
      setStep('receipt');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseAndReset() {
    if (step === 'receipt') {
      setStep('cart');
      setConfirmedOrder(null);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setShippingAddress('');
      setShippingCity('');
      setShippingPostal('');
      setNotes('');
    }
    setError(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Sacola de compras"
    >
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white border-l border-[#E5E3DD] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E3DD]">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#18181B]">
              {step === 'cart' && 'Sacola de Livros'}
              {step === 'checkout' && 'Finalizar Pedido'}
              {step === 'receipt' && 'Pedido Confirmado'}
            </h2>
            {step === 'cart' && (
              <p className="text-xs text-[#52525B] mt-0.5 tabular-nums">
                {items.reduce((a, b) => a + b.quantity, 0)}{' '}
                {items.reduce((a, b) => a + b.quantity, 0) === 1 ? 'exemplar' : 'exemplares'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleCloseAndReset}
            className="p-2 text-[#52525B] hover:text-[#18181B] rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[#1E3A34]"
            aria-label="Fechar sacola"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'receipt' && confirmedOrder ? (
            <div className="space-y-6">
              <div className="p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#166534]">
                      Pedido {confirmedOrder.order_code} Confirmado
                    </p>
                    <p className="text-xs text-[#166534]/90 mt-1">
                      Status atual: {confirmedOrder.status}. Guarde o código{' '}
                      <span className="font-mono font-medium">{confirmedOrder.order_code}</span> para
                      acompanhar o envio em “Rastrear Pedido”.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-b border-[#E5E3DD] pb-4">
                <h3 className="text-xs font-medium text-[#52525B] tracking-wide">
                  Resumo da Entrega
                </h3>
                <div className="text-sm text-[#18181B] space-y-1">
                  <p className="font-medium">{confirmedOrder.customer_name}</p>
                  <p className="text-[#52525B]">
                    {confirmedOrder.shipping_address} — {confirmedOrder.shipping_city}
                  </p>
                  <p className="text-[#52525B] font-mono text-xs">
                    CEP {confirmedOrder.shipping_postal} · {confirmedOrder.payment_method}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-medium text-[#52525B] tracking-wide">
                  Exemplares Adquiridos
                </h3>
                <ul className="divide-y divide-[#E5E3DD]">
                  {confirmedOrder.items.map((item) => (
                    <li key={item.id} className="py-2.5 flex justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-[#18181B]">{item.book_title}</p>
                        <p className="text-xs text-[#52525B] tabular-nums">
                          {item.quantity} × {formatKz(item.unit_price_cents)}
                        </p>
                      </div>
                      <p className="font-mono tabular-nums text-[#18181B] font-medium">
                        {formatKz(item.unit_price_cents * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E5E3DD] space-y-1.5 text-sm">
                <div className="flex justify-between text-[#52525B]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatKz(confirmedOrder.subtotal_cents)}
                  </span>
                </div>
                <div className="flex justify-between text-[#52525B]">
                  <span>Frete</span>
                  <span className="font-mono tabular-nums">
                    {confirmedOrder.shipping_cents === 0
                      ? 'Grátis'
                      : formatKz(confirmedOrder.shipping_cents)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#18181B] pt-2 border-t border-[#E5E3DD]">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">
                    {formatKz(confirmedOrder.total_cents)}
                  </span>
                </div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-[#A1A1AA] mb-3" />
              <p className="font-serif text-xl font-medium text-[#18181B]">
                Sua sacola está vazia
              </p>
              <p className="text-sm text-[#52525B] mt-1 max-w-xs">
                Explore nossa seleção editorial e adicione seus títulos favoritos para iniciar o
                pedido.
              </p>
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="mt-6 px-5 py-2.5 text-sm font-medium bg-[#1E3A34] text-white rounded-md hover:bg-[#162C27] transition-colors"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-5">
              {/* Free shipping indicator */}
              <div className="p-3.5 bg-[#F9F8F6] border border-[#E5E3DD] rounded-md text-xs text-[#52525B]">
                {remainingForFreeShipping === 0 ? (
                  <span className="text-[#1E3A34] font-medium">
                    Você desbloqueou frete grátis para todo o país.
                  </span>
                ) : (
                  <span>
                    Faltam{' '}
                    <strong className="font-mono tabular-nums text-[#18181B]">
                      {formatKz(remainingForFreeShipping)}
                    </strong>{' '}
                    para frete grátis (acima de 35.000,00 Kz).
                  </span>
                )}
              </div>

              <ul className="divide-y divide-[#E5E3DD]">
                {items.map(({ book, quantity }) => (
                  <li key={book.id} className="py-4 flex gap-4">
                    <BookCover
                      src={book.cover_url}
                      title={book.title}
                      author={book.author}
                      className="w-16 h-22 shrink-0 rounded-sm border border-[#E5E3DD]"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm text-[#18181B] leading-snug line-clamp-2">
                            {book.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(book.id)}
                            className="text-[#71717A] hover:text-[#991B1B] p-1 transition-colors"
                            aria-label={`Remover ${book.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#52525B] mt-0.5">{book.author}</p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="inline-flex items-center border border-[#E5E3DD] rounded-md">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(book.id, quantity - 1)}
                            className="px-2.5 py-1.5 text-[#52525B] hover:text-[#18181B] transition-colors"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-mono tabular-nums text-[#18181B]">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(book.id, Math.min(book.stock, quantity + 1))
                            }
                            disabled={quantity >= book.stock}
                            className="px-2.5 py-1.5 text-[#52525B] hover:text-[#18181B] disabled:opacity-40 transition-colors"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-mono tabular-nums font-medium text-[#18181B]">
                          {formatKz(book.price_cents * quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B]">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex.: Mariana Albuquerque"
                  className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="nome@dominio.com.br"
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">
                  Endereço de Entrega *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Rua, número e complemento"
                  className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    Cidade / UF *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="São Paulo, SP"
                    className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">CEP *</label>
                  <input
                    type="text"
                    required
                    value={shippingPostal}
                    onChange={(e) => setShippingPostal(e.target.value)}
                    placeholder="01415-002"
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`px-3 py-2 text-xs font-medium rounded-md border text-left transition-colors ${
                        paymentMethod === method
                          ? 'border-[#1E3A34] bg-[#F2F6F4] text-[#1E3A34]'
                          : 'border-[#E5E3DD] text-[#52525B] hover:border-[#D4D2CA]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções de entrega ou embalagem para presente"
                  className="w-full px-3 py-2 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && step !== 'receipt' && (
          <div className="border-t border-[#E5E3DD] px-6 py-5 bg-[#F9F8F6] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#52525B]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatKz(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-[#52525B]">
                <span>Frete estimado</span>
                <span className="font-mono tabular-nums">
                  {shippingCents === 0 ? 'Grátis' : formatKz(shippingCents)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#18181B] pt-2 border-t border-[#E5E3DD]">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatKz(totalCents)}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1E3A34] text-white text-sm font-medium rounded-md hover:bg-[#162C27] transition-colors"
              >
                <span>Prosseguir para Entrega</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep('cart');
                  }}
                  className="px-4 py-3 text-sm font-medium text-[#52525B] border border-[#D4D2CA] bg-white rounded-md hover:text-[#18181B] transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-[#1E3A34] text-white text-sm font-medium rounded-md hover:bg-[#162C27] disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Processando Pedido...' : `Confirmar Pedido (${formatKz(totalCents)})`}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'receipt' && (
          <div className="border-t border-[#E5E3DD] px-6 py-4 bg-[#F9F8F6]">
            <button
              type="button"
              onClick={handleCloseAndReset}
              className="w-full py-2.5 px-4 bg-[#1E3A34] text-white text-sm font-medium rounded-md hover:bg-[#162C27] transition-colors"
            >
              Continuar Navegando
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
