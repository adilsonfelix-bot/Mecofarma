export type OrderStatus =
  | 'Pendente'
  | 'Pago'
  | 'Em Separação'
  | 'Enviado'
  | 'Entregue'
  | 'Cancelado';

export type PaymentMethod =
  | 'Pix'
  | 'Cartão de Crédito'
  | 'Boleto'
  | 'Pagamento na Entrega';

export type BookBinding = 'Capa Dura' | 'Brochura' | 'Edição Especial';

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  year: number;
  pages: number;
  binding: BookBinding;
  price_cents: number;
  cost_cents: number;
  stock: number;
  cover_url: string;
  synopsis: string;
  featured: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  book_id: number;
  book_title: string;
  book_author: string;
  book_isbn: string;
  quantity: number;
  unit_price_cents: number;
  unit_cost_cents: number;
}

export interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal: string;
  payment_method: PaymentMethod;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  notes: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface RevenueDay {
  date: string;
  label: string;
  revenue_cents: number;
  orders_count: number;
}

export interface CategorySales {
  category: string;
  units_sold: number;
  revenue_cents: number;
}

export interface TopBookSales {
  book_id: number;
  title: string;
  author: string;
  units_sold: number;
  revenue_cents: number;
}

export interface SalesSummary {
  total_revenue_cents: number;
  total_profit_cents: number;
  total_orders: number;
  pending_orders: number;
  average_ticket_cents: number;
  books_sold_count: number;
  low_stock_books: Book[];
  revenue_by_day: RevenueDay[];
  sales_by_category: CategorySales[];
  top_books: TopBookSales[];
}

export interface CartItem {
  book: Book;
  quantity: number;
}
