import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type {
  Book,
  BookBinding,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  SalesSummary,
} from '../src/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'livraria.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    publisher TEXT NOT NULL,
    category TEXT NOT NULL,
    year INTEGER NOT NULL,
    pages INTEGER NOT NULL,
    binding TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    cost_cents INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    cover_url TEXT NOT NULL,
    synopsis TEXT NOT NULL,
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_postal TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL,
    subtotal_cents INTEGER NOT NULL,
    shipping_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id),
    book_title TEXT NOT NULL,
    book_author TEXT NOT NULL,
    book_isbn TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    unit_cost_cents INTEGER NOT NULL
  );
`);

function daysAgoISO(daysAgo: number, hour = 14): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 25, 0, 0);
  return d.toISOString();
}

function seedDatabaseIfEmpty(): void {
  const bookCountRow = db.prepare('SELECT COUNT(*) as count FROM books').get() as { count: number };
  if (bookCountRow.count > 0) {
    return;
  }

  const seedBooks: Array<Omit<Book, 'id'>> = [
    {
      isbn: '978-65-88120-01-4',
      title: 'Cartografia do Silêncio',
      author: 'Helena Vasconcelos',
      publisher: 'Editora Meridiano',
      category: 'Ficção Literária',
      year: 2025,
      pages: 312,
      binding: 'Capa Dura',
      price_cents: 1450000,
      cost_cents: 780000,
      stock: 18,
      cover_url: '/src/assets/images/book_cartografia_silencio_1795005230137.jpg',
      synopsis:
        'Um romance atmosférico sobre um cartógrafo que reconstrói a memória de uma vila costeira por meio de mapas antigos, cartas esquecidas e cadernos de bordo encontrados em um farol desativado.',
      featured: 1,
      created_at: daysAgoISO(30),
    },
    {
      isbn: '978-65-88120-02-1',
      title: 'Structura: Ensaios de Arquitetura',
      author: 'David Miller',
      publisher: 'Prensa Tectônica',
      category: 'Arquitetura & Design',
      year: 2024,
      pages: 268,
      binding: 'Capa Dura',
      price_cents: 2200000,
      cost_cents: 1200000,
      stock: 11,
      cover_url: '/src/assets/images/book_arquitetura_luz_1795005231428.jpg',
      synopsis:
        'Coletânea ilustrada de ensaios sobre proporção, luz natural, concreto aparente e permanência espacial na arquitetura modernista e contemporânea.',
      featured: 1,
      created_at: daysAgoISO(28),
    },
    {
      isbn: '978-65-88120-03-8',
      title: 'Herbarium: Notas de Flora e Campo',
      author: 'Eliza Reed',
      publisher: 'Casa Botânica',
      category: 'Botânica & Natureza',
      year: 2025,
      pages: 224,
      binding: 'Edição Especial',
      price_cents: 1850000,
      cost_cents: 980000,
      stock: 4,
      cover_url: '/src/assets/images/book_herbarium_atlantico_1795005231610.jpg',
      synopsis:
        'Observações de campo, pranchas botânicas detalhadas e ensaios sobre florestas temperadas, sementes nativas e a história natural das plantas medicinais.',
      featured: 1,
      created_at: daysAgoISO(25),
    },
    {
      isbn: '978-65-88120-04-5',
      title: 'A Essência do Ser',
      author: 'Eliza Vance',
      publisher: 'Ateliê Filosófico',
      category: 'Filosofia',
      year: 2024,
      pages: 296,
      binding: 'Capa Dura',
      price_cents: 1350000,
      cost_cents: 700000,
      stock: 15,
      cover_url: '/src/assets/images/book_etica_tempo_1795005231812.jpg',
      synopsis:
        'Uma investigação lúcida sobre atenção, ética do cotidiano e a experiência subjetiva do tempo em diálogo com a tradição fenomenológica.',
      featured: 0,
      created_at: daysAgoISO(22),
    },
    {
      isbn: '978-65-88120-05-2',
      title: 'Colheita & Herança',
      author: 'Eleanor Vance',
      publisher: 'Oficina da Mesa',
      category: 'Gastronomia & Cultura',
      year: 2025,
      pages: 340,
      binding: 'Edição Especial',
      price_cents: 2100000,
      cost_cents: 1120000,
      stock: 9,
      cover_url: '/src/assets/images/book_mesa_portuguesa_1795005232418.jpg',
      synopsis:
        'Antologia cultural que reúne receitas sazonais, crônicas de produtores artesanais e a história material da cerâmica e do cultivo de grãos.',
      featured: 1,
      created_at: daysAgoISO(19),
    },
    {
      isbn: '978-65-88120-06-9',
      title: 'Urbanismo & Vida Pública',
      author: 'Samuel T. Harper',
      publisher: 'Prensa Tectônica',
      category: 'Urbanismo & Sociedade',
      year: 2024,
      pages: 280,
      binding: 'Capa Dura',
      price_cents: 1750000,
      cost_cents: 920000,
      stock: 3,
      cover_url: '/src/assets/images/book_economia_cidades_1795005232470.jpg',
      synopsis:
        'Ensaios sobre desenho urbano em escala humana, vitalidade de bairros, mobilidade ativa e o papel das bibliotecas e praças na vida cívica.',
      featured: 0,
      created_at: daysAgoISO(16),
    },
  ];

  const insertBook = db.prepare(`
    INSERT INTO books (
      isbn, title, author, publisher, category, year, pages, binding,
      price_cents, cost_cents, stock, cover_url, synopsis, featured, created_at
    ) VALUES (
      @isbn, @title, @author, @publisher, @category, @year, @pages, @binding,
      @price_cents, @cost_cents, @stock, @cover_url, @synopsis, @featured, @created_at
    )
  `);

  const insertedBooks: Book[] = [];
  for (const b of seedBooks) {
    const info = insertBook.run(b);
    insertedBooks.push({ ...b, id: Number(info.lastInsertRowid) });
  }

  const seedOrders: Array<{
    order_code: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_postal: string;
    payment_method: PaymentMethod;
    status: OrderStatus;
    daysAgo: number;
    items: Array<{ bookIdx: number; qty: number }>;
    notes: string;
  }> = [
    {
      order_code: 'PED-1035',
      customer_name: 'Mariana Albuquerque',
      customer_email: 'mariana.albuquerque@exemplo.com.br',
      customer_phone: '(11) 98412-3309',
      shipping_address: 'Rua Bela Cintra, 1142, Apto 71',
      shipping_city: 'São Paulo, SP',
      shipping_postal: '01415-002',
      payment_method: 'Pix',
      status: 'Entregue',
      daysAgo: 6,
      items: [
        { bookIdx: 0, qty: 2 },
        { bookIdx: 3, qty: 1 },
      ],
      notes: 'Embalagem para presente solicitada.',
    },
    {
      order_code: 'PED-1036',
      customer_name: 'Rafael Monteiro',
      customer_email: 'rafael.monteiro@exemplo.com.br',
      customer_phone: '(21) 99204-8811',
      shipping_address: 'Av. Atlântica, 2410, Bloco B',
      shipping_city: 'Rio de Janeiro, RJ',
      shipping_postal: '22041-001',
      payment_method: 'Cartão de Crédito',
      status: 'Entregue',
      daysAgo: 5,
      items: [{ bookIdx: 1, qty: 1 }],
      notes: '',
    },
    {
      order_code: 'PED-1037',
      customer_name: 'Camila Siqueira',
      customer_email: 'camila.siqueira@exemplo.com.br',
      customer_phone: '(31) 98755-1204',
      shipping_address: 'Rua Tomé de Souza, 810',
      shipping_city: 'Belo Horizonte, MG',
      shipping_postal: '30140-136',
      payment_method: 'Pix',
      status: 'Entregue',
      daysAgo: 4,
      items: [
        { bookIdx: 2, qty: 1 },
        { bookIdx: 4, qty: 1 },
      ],
      notes: '',
    },
    {
      order_code: 'PED-1038',
      customer_name: 'Lucas Ferreira Lima',
      customer_email: 'lucas.lima@exemplo.com.br',
      customer_phone: '(41) 99123-7740',
      shipping_address: 'Alameda Dr. Carlos de Carvalho, 555',
      shipping_city: 'Curitiba, PR',
      shipping_postal: '80430-180',
      payment_method: 'Boleto',
      status: 'Cancelado',
      daysAgo: 4,
      items: [{ bookIdx: 5, qty: 1 }],
      notes: 'Cancelado a pedido do cliente antes da postagem.',
    },
    {
      order_code: 'PED-1039',
      customer_name: 'Beatriz Nogueira',
      customer_email: 'beatriz.nogueira@exemplo.com.br',
      customer_phone: '(51) 99601-4422',
      shipping_address: 'Rua Padre Chagas, 320, Sala 402',
      shipping_city: 'Porto Alegre, RS',
      shipping_postal: '90570-080',
      payment_method: 'Cartão de Crédito',
      status: 'Enviado',
      daysAgo: 3,
      items: [
        { bookIdx: 1, qty: 1 },
        { bookIdx: 5, qty: 2 },
      ],
      notes: 'Entregar em horário comercial.',
    },
    {
      order_code: 'PED-1040',
      customer_name: 'Thiago Azevedo',
      customer_email: 'thiago.azevedo@exemplo.com.br',
      customer_phone: '(11) 97118-5590',
      shipping_address: 'Rua dos Pinheiros, 684',
      shipping_city: 'São Paulo, SP',
      shipping_postal: '05422-001',
      payment_method: 'Pix',
      status: 'Em Separação',
      daysAgo: 2,
      items: [
        { bookIdx: 4, qty: 2 },
        { bookIdx: 0, qty: 1 },
      ],
      notes: '',
    },
    {
      order_code: 'PED-1041',
      customer_name: 'Fernanda Costa e Silva',
      customer_email: 'fernanda.costa@exemplo.com.br',
      customer_phone: '(61) 98114-9032',
      shipping_address: 'SQS 308 Bloco D, Apto 204',
      shipping_city: 'Brasília, DF',
      shipping_postal: '70355-040',
      payment_method: 'Cartão de Crédito',
      status: 'Pago',
      daysAgo: 1,
      items: [
        { bookIdx: 2, qty: 2 },
        { bookIdx: 3, qty: 1 },
      ],
      notes: '',
    },
    {
      order_code: 'PED-1042',
      customer_name: 'Gabriel Duarte',
      customer_email: 'gabriel.duarte@exemplo.com.br',
      customer_phone: '(71) 99340-1182',
      shipping_address: 'Av. Sete de Setembro, 1980',
      shipping_city: 'Salvador, BA',
      shipping_postal: '40080-002',
      payment_method: 'Pagamento na Entrega',
      status: 'Pendente',
      daysAgo: 0,
      items: [{ bookIdx: 0, qty: 1 }],
      notes: 'Confirmar presença na portaria.',
    },
  ];

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_code, customer_name, customer_email, customer_phone,
      shipping_address, shipping_city, shipping_postal,
      payment_method, status, subtotal_cents, shipping_cents, total_cents,
      notes, created_at, updated_at
    ) VALUES (
      @order_code, @customer_name, @customer_email, @customer_phone,
      @shipping_address, @shipping_city, @shipping_postal,
      @payment_method, @status, @subtotal_cents, @shipping_cents, @total_cents,
      @notes, @created_at, @updated_at
    )
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (
      order_id, book_id, book_title, book_author, book_isbn,
      quantity, unit_price_cents, unit_cost_cents
    ) VALUES (
      @order_id, @book_id, @book_title, @book_author, @book_isbn,
      @quantity, @unit_price_cents, @unit_cost_cents
    )
  `);

  for (const o of seedOrders) {
    let subtotalCents = 0;
    for (const item of o.items) {
      subtotalCents += insertedBooks[item.bookIdx].price_cents * item.qty;
    }
    const shippingCents = subtotalCents >= 3500000 ? 0 : 250000;
    const totalCents = subtotalCents + shippingCents;
    const ts = daysAgoISO(o.daysAgo, 10 + (o.daysAgo % 7));

    const res = insertOrder.run({
      order_code: o.order_code,
      customer_name: o.customer_name,
      customer_email: o.customer_email,
      customer_phone: o.customer_phone,
      shipping_address: o.shipping_address,
      shipping_city: o.shipping_city,
      shipping_postal: o.shipping_postal,
      payment_method: o.payment_method,
      status: o.status,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      notes: o.notes,
      created_at: ts,
      updated_at: ts,
    });

    const orderId = Number(res.lastInsertRowid);
    for (const item of o.items) {
      const bk = insertedBooks[item.bookIdx];
      insertOrderItem.run({
        order_id: orderId,
        book_id: bk.id,
        book_title: bk.title,
        book_author: bk.author,
        book_isbn: bk.isbn,
        quantity: item.qty,
        unit_price_cents: bk.price_cents,
        unit_cost_cents: bk.cost_cents,
      });
    }
  }
}

seedDatabaseIfEmpty();

export function listBooks(filters: {
  search?: string;
  category?: string;
  inStock?: boolean;
  sort?: string;
}): Book[] {
  const clauses: string[] = [];
  const params: Record<string, string | number> = {};

  if (filters.search && filters.search.trim()) {
    clauses.push('(title LIKE @q OR author LIKE @q OR isbn LIKE @q OR publisher LIKE @q)');
    params.q = `%${filters.search.trim()}%`;
  }
  if (filters.category && filters.category !== 'Todos') {
    clauses.push('category = @category');
    params.category = filters.category;
  }
  if (filters.inStock) {
    clauses.push('stock > 0');
  }

  let orderBy = 'featured DESC, id ASC';
  if (filters.sort === 'price_asc') orderBy = 'price_cents ASC';
  else if (filters.sort === 'price_desc') orderBy = 'price_cents DESC';
  else if (filters.sort === 'newest') orderBy = 'year DESC, id DESC';
  else if (filters.sort === 'title') orderBy = 'title ASC';

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.prepare(`SELECT * FROM books ${whereSql} ORDER BY ${orderBy}`).all(params) as Book[];
}

export function getBookById(id: number): Book | undefined {
  return db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
}

export function createBook(input: {
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
  featured?: number;
}): Book {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO books (
      isbn, title, author, publisher, category, year, pages, binding,
      price_cents, cost_cents, stock, cover_url, synopsis, featured, created_at
    ) VALUES (
      @isbn, @title, @author, @publisher, @category, @year, @pages, @binding,
      @price_cents, @cost_cents, @stock, @cover_url, @synopsis, @featured, @created_at
    )
  `);
  const info = stmt.run({
    ...input,
    featured: input.featured ?? 0,
    created_at: now,
  });
  return getBookById(Number(info.lastInsertRowid))!;
}

export function updateBook(
  id: number,
  input: Partial<{
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
  }>
): Book | undefined {
  const existing = getBookById(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...input };
  db.prepare(`
    UPDATE books SET
      isbn = @isbn,
      title = @title,
      author = @author,
      publisher = @publisher,
      category = @category,
      year = @year,
      pages = @pages,
      binding = @binding,
      price_cents = @price_cents,
      cost_cents = @cost_cents,
      stock = @stock,
      cover_url = @cover_url,
      synopsis = @synopsis,
      featured = @featured
    WHERE id = @id
  `).run({ ...merged, id });
  return getBookById(id);
}

export function deleteBook(id: number): { deleted: boolean; reason?: string } {
  const ref = db
    .prepare('SELECT COUNT(*) as count FROM order_items WHERE book_id = ?')
    .get(id) as { count: number };
  if (ref.count > 0) {
    return {
      deleted: false,
      reason: 'Este título possui histórico em pedidos registrados e não pode ser removido; zere o estoque para ocultá-lo da venda.',
    };
  }
  const res = db.prepare('DELETE FROM books WHERE id = ?').run(id);
  return { deleted: res.changes > 0 };
}

function hydrateOrders(orders: Array<Omit<Order, 'items'>>): Order[] {
  if (orders.length === 0) return [];
  const stmt = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC');
  return orders.map((o) => ({
    ...o,
    items: stmt.all(o.id) as OrderItem[],
  }));
}

export function listOrders(filters: { status?: string; search?: string }): Order[] {
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filters.status && filters.status !== 'Todos') {
    clauses.push('status = @status');
    params.status = filters.status;
  }
  if (filters.search && filters.search.trim()) {
    clauses.push(
      '(order_code LIKE @q OR customer_name LIKE @q OR customer_email LIKE @q OR shipping_city LIKE @q)'
    );
    params.q = `%${filters.search.trim()}%`;
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM orders ${whereSql} ORDER BY created_at DESC, id DESC`)
    .all(params) as Array<Omit<Order, 'items'>>;

  return hydrateOrders(rows);
}

export function getOrderByCodeOrEmail(query: string): Order[] {
  const clean = query.trim();
  if (!clean) return [];
  const rows = db
    .prepare(
      `SELECT * FROM orders WHERE UPPER(order_code) = UPPER(?) OR LOWER(customer_email) = LOWER(?) ORDER BY created_at DESC`
    )
    .all(clean, clean) as Array<Omit<Order, 'items'>>;
  return hydrateOrders(rows);
}

export function createOrder(input: {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal: string;
  payment_method: PaymentMethod;
  notes?: string;
  status?: OrderStatus;
  items: Array<{ book_id: number; quantity: number }>;
}): Order {
  const runTransaction = db.transaction(() => {
    if (!input.items || input.items.length === 0) {
      throw new Error('O pedido deve conter ao menos um exemplar.');
    }

    let subtotalCents = 0;
    const resolvedItems: Array<{
      book: Book;
      quantity: number;
    }> = [];

    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error('Quantidade inválida para um dos itens do pedido.');
      }
      const book = getBookById(item.book_id);
      if (!book) {
        throw new Error(`Livro #${item.book_id} não encontrado no catálogo.`);
      }
      if (book.stock < item.quantity) {
        throw new Error(
          `Estoque insuficiente para "${book.title}". Disponível: ${book.stock} un.`
        );
      }
      subtotalCents += book.price_cents * item.quantity;
      resolvedItems.push({ book, quantity: item.quantity });
    }

    const shippingCents = subtotalCents >= 3500000 ? 0 : 250000;
    const totalCents = subtotalCents + shippingCents;

    const maxRow = db.prepare('SELECT MAX(id) as maxId FROM orders').get() as { maxId: number | null };
    const nextNumber = 1035 + (maxRow.maxId ?? 0) + 1;
    const orderCode = `PED-${nextNumber}`;
    const now = new Date().toISOString();
    const initialStatus: OrderStatus = input.status ?? (input.payment_method === 'Cartão de Crédito' ? 'Pago' : 'Pendente');

    const orderRes = db
      .prepare(`
        INSERT INTO orders (
          order_code, customer_name, customer_email, customer_phone,
          shipping_address, shipping_city, shipping_postal,
          payment_method, status, subtotal_cents, shipping_cents, total_cents,
          notes, created_at, updated_at
        ) VALUES (
          @order_code, @customer_name, @customer_email, @customer_phone,
          @shipping_address, @shipping_city, @shipping_postal,
          @payment_method, @status, @subtotal_cents, @shipping_cents, @total_cents,
          @notes, @created_at, @updated_at
        )
      `)
      .run({
        order_code: orderCode,
        customer_name: input.customer_name.trim(),
        customer_email: input.customer_email.trim(),
        customer_phone: input.customer_phone.trim(),
        shipping_address: input.shipping_address.trim(),
        shipping_city: input.shipping_city.trim(),
        shipping_postal: input.shipping_postal.trim(),
        payment_method: input.payment_method,
        status: initialStatus,
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        notes: (input.notes ?? '').trim(),
        created_at: now,
        updated_at: now,
      });

    const orderId = Number(orderRes.lastInsertRowid);
    const insertItem = db.prepare(`
      INSERT INTO order_items (
        order_id, book_id, book_title, book_author, book_isbn,
        quantity, unit_price_cents, unit_cost_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const deductStock = db.prepare('UPDATE books SET stock = stock - ? WHERE id = ?');

    for (const { book, quantity } of resolvedItems) {
      insertItem.run(
        orderId,
        book.id,
        book.title,
        book.author,
        book.isbn,
        quantity,
        book.price_cents,
        book.cost_cents
      );
      if (initialStatus !== 'Cancelado') {
        deductStock.run(quantity, book.id);
      }
    }

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Omit<Order, 'items'>;
    return hydrateOrders([created])[0];
  });

  return runTransaction();
}

export function updateOrderStatus(orderId: number, nextStatus: OrderStatus): Order | undefined {
  const runTx = db.transaction(() => {
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
      | Omit<Order, 'items'>
      | undefined;
    if (!existing) return undefined;

    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(orderId) as OrderItem[];

    const wasCanceled = existing.status === 'Cancelado';
    const willCancel = nextStatus === 'Cancelado';

    if (!wasCanceled && willCancel) {
      const restoreStmt = db.prepare('UPDATE books SET stock = stock + ? WHERE id = ?');
      for (const item of items) {
        restoreStmt.run(item.quantity, item.book_id);
      }
    } else if (wasCanceled && !willCancel) {
      const checkStmt = db.prepare('SELECT stock, title FROM books WHERE id = ?');
      const deductStmt = db.prepare('UPDATE books SET stock = stock - ? WHERE id = ?');
      for (const item of items) {
        const bk = checkStmt.get(item.book_id) as { stock: number; title: string } | undefined;
        if (!bk || bk.stock < item.quantity) {
          throw new Error(
            `Estoque insuficiente para reativar "${item.book_title}". Disponível: ${bk?.stock ?? 0} un.`
          );
        }
        deductStmt.run(item.quantity, item.book_id);
      }
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(
      nextStatus,
      now,
      orderId
    );

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Omit<
      Order,
      'items'
    >;
    return { ...updated, items };
  });

  return runTx();
}

export function getSalesSummary(): SalesSummary {
  const activeOrders = db
    .prepare(`SELECT * FROM orders WHERE status != 'Cancelado'`)
    .all() as Array<Omit<Order, 'items'>>;

  const totalRevenueCents = activeOrders.reduce((acc, o) => acc + o.total_cents, 0);
  const totalOrders = activeOrders.length;
  const pendingOrders = activeOrders.filter(
    (o) => o.status === 'Pendente' || o.status === 'Pago' || o.status === 'Em Separação'
  ).length;
  const averageTicketCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;

  const itemMetrics = db
    .prepare(`
      SELECT
        oi.book_id,
        oi.book_title,
        oi.book_author,
        oi.quantity,
        oi.unit_price_cents,
        oi.unit_cost_cents,
        COALESCE(b.category, 'Outros') as category
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN books b ON b.id = oi.book_id
      WHERE o.status != 'Cancelado'
    `)
    .all() as Array<{
    book_id: number;
    book_title: string;
    book_author: string;
    quantity: number;
    unit_price_cents: number;
    unit_cost_cents: number;
    category: string;
  }>;

  let booksSoldCount = 0;
  let totalItemCost = 0;
  let totalItemRevenue = 0;

  const categoryMap = new Map<string, { units_sold: number; revenue_cents: number }>();
  const bookMap = new Map<
    number,
    { book_id: number; title: string; author: string; units_sold: number; revenue_cents: number }
  >();

  for (const row of itemMetrics) {
    booksSoldCount += row.quantity;
    const rev = row.unit_price_cents * row.quantity;
    const cost = row.unit_cost_cents * row.quantity;
    totalItemRevenue += rev;
    totalItemCost += cost;

    const catEntry = categoryMap.get(row.category) ?? { units_sold: 0, revenue_cents: 0 };
    catEntry.units_sold += row.quantity;
    catEntry.revenue_cents += rev;
    categoryMap.set(row.category, catEntry);

    const bkEntry = bookMap.get(row.book_id) ?? {
      book_id: row.book_id,
      title: row.book_title,
      author: row.book_author,
      units_sold: 0,
      revenue_cents: 0,
    };
    bkEntry.units_sold += row.quantity;
    bkEntry.revenue_cents += rev;
    bookMap.set(row.book_id, bkEntry);
  }

  const totalProfitCents = totalItemRevenue - totalItemCost;

  const lowStockBooks = db
    .prepare('SELECT * FROM books WHERE stock <= 5 ORDER BY stock ASC, title ASC')
    .all() as Book[];

  const dayList: Array<{ date: string; label: string; revenue_cents: number; orders_count: number }> =
    [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    const label = `${dd}/${mm}`;
    dayList.push({ date: key, label, revenue_cents: 0, orders_count: 0 });
  }

  const dayLookup = new Map(dayList.map((d) => [d.date, d]));
  for (const o of activeOrders) {
    const dayKey = o.created_at.slice(0, 10);
    const slot = dayLookup.get(dayKey);
    if (slot) {
      slot.revenue_cents += o.total_cents;
      slot.orders_count += 1;
    }
  }

  const salesByCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      units_sold: data.units_sold,
      revenue_cents: data.revenue_cents,
    }))
    .sort((a, b) => b.revenue_cents - a.revenue_cents);

  const topBooks = Array.from(bookMap.values())
    .sort((a, b) => b.units_sold - a.units_sold || b.revenue_cents - a.revenue_cents)
    .slice(0, 5);

  return {
    total_revenue_cents: totalRevenueCents,
    total_profit_cents: totalProfitCents,
    total_orders: totalOrders,
    pending_orders: pendingOrders,
    average_ticket_cents: averageTicketCents,
    books_sold_count: booksSoldCount,
    low_stock_books: lowStockBooks,
    revenue_by_day: dayList,
    sales_by_category: salesByCategory,
    top_books: topBooks,
  };
}
