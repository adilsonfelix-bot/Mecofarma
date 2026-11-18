import { useState, type FormEvent } from 'react';
import { X, Search, PackageCheck, Truck, Clock } from 'lucide-react';
import type { Order, OrderStatus } from '../types';
import { formatKz, formatDateTime, getStatusStyle } from '../utils/format';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROGRESS_STEPS: OrderStatus[] = [
  'Pendente',
  'Pago',
  'Em Separação',
  'Enviado',
  'Entregue',
];

export function OrderTrackingModal({ isOpen, onClose }: OrderTrackingModalProps) {
  const [query, setQuery] = useState('PED-1040');
  const [results, setResults] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function runLookup(target: string) {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(target.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Pedido não encontrado.');
      }
      setResults(data as Order[]);
    } catch (err) {
      setResults(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    runLookup(query);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Rastrear Pedido"
    >
      <div className="w-full max-w-2xl bg-white border border-[#E5E3DD] rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E3DD]">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#18181B]">
              Acompanhar Pedido
            </h2>
            <p className="text-xs text-[#52525B] mt-0.5">
              Consulte o andamento pelo código do pedido ou e-mail cadastrado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#52525B] hover:text-[#18181B] rounded-md transition-colors"
            aria-label="Fechar rastreamento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Código (ex.: PED-1042) ou e-mail"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#D4D2CA] rounded-md focus:outline-none focus:border-[#1E3A34]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#1E3A34] text-white text-sm font-medium rounded-md hover:bg-[#162C27] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {loading ? 'Buscando...' : 'Consultar'}
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#52525B]">
            <span>Consultas rápidas:</span>
            {['PED-1042', 'PED-1041', 'PED-1040', 'PED-1039'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  runLookup(sample);
                }}
                className="font-mono px-2 py-1 border border-[#E5E3DD] rounded hover:border-[#1E3A34] hover:text-[#1E3A34] transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-sm text-[#991B1B]">
              {error}
            </div>
          )}

          {results &&
            results.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              const currentStepIdx = PROGRESS_STEPS.indexOf(order.status);

              return (
                <div
                  key={order.id}
                  className="border border-[#E5E3DD] rounded-lg p-5 space-y-5 bg-[#F9F8F6]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E3DD] pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-semibold text-[#18181B]">
                          {order.order_code}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 text-xs font-medium rounded border ${statusStyle.bgClass} ${statusStyle.textClass} ${statusStyle.borderClass}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#52525B] mt-1">
                        Realizado em {formatDateTime(order.created_at)} · {order.payment_method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#52525B]">Total</p>
                      <p className="font-mono tabular-nums text-base font-semibold text-[#18181B]">
                        {formatKz(order.total_cents)}
                      </p>
                    </div>
                  </div>

                  {order.status !== 'Cancelado' ? (
                    <div className="grid grid-cols-5 gap-2">
                      {PROGRESS_STEPS.map((st, idx) => {
                        const completed = idx <= currentStepIdx;
                        return (
                          <div key={st} className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                completed ? 'bg-[#1E3A34]' : 'bg-[#E5E3DD]'
                              }`}
                            />
                            <p
                              className={`text-[11px] leading-tight ${
                                completed ? 'text-[#18181B] font-medium' : 'text-[#71717A]'
                              }`}
                            >
                              {st}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-[#991B1B]">
                      <Clock className="w-4 h-4" />
                      <span>Este pedido foi cancelado e os exemplares retornaram ao acervo.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#52525B] pt-2">
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-[#1E3A34] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-[#18181B]">{order.customer_name}</p>
                        <p>
                          {order.shipping_address}, {order.shipping_city}
                        </p>
                        <p className="font-mono">CEP {order.shipping_postal}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <PackageCheck className="w-4 h-4 text-[#1E3A34] shrink-0 mt-0.5" />
                      <div className="w-full space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between gap-2">
                            <span className="text-[#18181B] truncate">
                              {item.quantity}× {item.book_title}
                            </span>
                            <span className="font-mono tabular-nums shrink-0">
                              {formatKz(item.unit_price_cents * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
