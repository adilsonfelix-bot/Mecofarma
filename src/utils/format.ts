import type { BookBinding, OrderStatus, PaymentMethod } from '../types';

export const CATEGORIES = [
  'Todos',
  'Ficção Literária',
  'Arquitetura & Design',
  'Botânica & Natureza',
  'Filosofia',
  'Gastronomia & Cultura',
  'Urbanismo & Sociedade',
] as const;

export const ORDER_STATUSES: OrderStatus[] = [
  'Pendente',
  'Pago',
  'Em Separação',
  'Enviado',
  'Entregue',
  'Cancelado',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Pix',
  'Cartão de Crédito',
  'Boleto',
  'Pagamento na Entrega',
];

export const BOOK_BINDINGS: BookBinding[] = ['Capa Dura', 'Brochura', 'Edição Especial'];

export const STUDIO_COVER_PRESETS = [
  {
    label: 'Linho Verde Floresta',
    url: '/src/assets/images/book_cartografia_silencio_1795005230137.jpg',
  },
  {
    label: 'Cinza Arquitetônico',
    url: '/src/assets/images/book_arquitetura_luz_1795005231428.jpg',
  },
  {
    label: 'Oliva Botânico',
    url: '/src/assets/images/book_herbarium_atlantico_1795005231610.jpg',
  },
  {
    label: 'Bordô Clássico',
    url: '/src/assets/images/book_etica_tempo_1795005231812.jpg',
  },
  {
    label: 'Linho Aveia',
    url: '/src/assets/images/book_mesa_portuguesa_1795005232418.jpg',
  },
  {
    label: 'Azul Ardósia',
    url: '/src/assets/images/book_economia_cidades_1795005232470.jpg',
  },
];

export const FREE_SHIPPING_THRESHOLD_CENTS = 3500000;
export const STANDARD_SHIPPING_CENTS = 250000;

export function formatKz(cents: number): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
  return `${formatted} Kz`;
}

export function formatDateShort(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getStatusStyle(status: OrderStatus): {
  textClass: string;
  bgClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'Entregue':
      return {
        textClass: 'text-[#166534]',
        bgClass: 'bg-[#F0FDF4]',
        borderClass: 'border-[#BBF7D0]',
      };
    case 'Enviado':
    case 'Pago':
      return {
        textClass: 'text-[#1E3A34]',
        bgClass: 'bg-[#F2F6F4]',
        borderClass: 'border-[#CBDAD4]',
      };
    case 'Em Separação':
    case 'Pendente':
      return {
        textClass: 'text-[#92400E]',
        bgClass: 'bg-[#FFFBEB]',
        borderClass: 'border-[#FDE68A]',
      };
    case 'Cancelado':
      return {
        textClass: 'text-[#991B1B]',
        bgClass: 'bg-[#FEF2F2]',
        borderClass: 'border-[#FECACA]',
      };
  }
}
