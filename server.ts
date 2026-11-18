import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createBook,
  createOrder,
  deleteBook,
  getBookById,
  getOrderByCodeOrEmail,
  getSalesSummary,
  listBooks,
  listOrders,
  updateBook,
  updateOrderStatus,
} from './server/db.ts';
import type { BookBinding, OrderStatus, PaymentMethod } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_STATUSES: OrderStatus[] = [
  'Pendente',
  'Pago',
  'Em Separação',
  'Enviado',
  'Entregue',
  'Cancelado',
];

const ALLOWED_PAYMENTS: PaymentMethod[] = [
  'Pix',
  'Cartão de Crédito',
  'Boleto',
  'Pagamento na Entrega',
];

const ALLOWED_BINDINGS: BookBinding[] = ['Capa Dura', 'Brochura', 'Edição Especial'];

async function startServer(): Promise<void> {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'livraria-meridiano' });
  });

  // Catalog API
  app.get('/api/books', (req, res) => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const inStock = req.query.inStock === 'true';
      const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
      const books = listBooks({ search, category, inStock, sort });
      res.json(books);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/books/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'ID de livro inválido.' });
      return;
    }
    const book = getBookById(id);
    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado.' });
      return;
    }
    res.json(book);
  });

  app.post('/api/books', (req, res) => {
    try {
      const body = req.body ?? {};
      if (!body.title || !body.author || !body.isbn || !body.category) {
        res.status(400).json({ error: 'Título, autor, ISBN e categoria são obrigatórios.' });
        return;
      }
      const priceCents = Number(body.price_cents);
      const costCents = Number(body.cost_cents ?? Math.round(priceCents * 0.55));
      const stock = Number(body.stock ?? 0);
      const year = Number(body.year ?? new Date().getFullYear());
      const pages = Number(body.pages ?? 200);
      const binding: BookBinding = ALLOWED_BINDINGS.includes(body.binding)
        ? body.binding
        : 'Capa Dura';

      if (!Number.isFinite(priceCents) || priceCents <= 0) {
        res.status(400).json({ error: 'Informe um preço válido maior que zero.' });
        return;
      }
      if (!Number.isInteger(stock) || stock < 0) {
        res.status(400).json({ error: 'Estoque deve ser um número inteiro não negativo.' });
        return;
      }

      const book = createBook({
        isbn: String(body.isbn).trim(),
        title: String(body.title).trim(),
        author: String(body.author).trim(),
        publisher: String(body.publisher ?? 'Editora Meridiano').trim(),
        category: String(body.category).trim(),
        year,
        pages,
        binding,
        price_cents: Math.round(priceCents),
        cost_cents: Math.round(costCents),
        stock,
        cover_url: String(body.cover_url ?? '').trim(),
        synopsis: String(body.synopsis ?? 'Edição selecionada pela curadoria da Livraria Meridiano.').trim(),
        featured: body.featured ? 1 : 0,
      });
      res.status(201).json(book);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'Já existe um livro cadastrado com este ISBN.' });
        return;
      }
      res.status(500).json({ error: msg });
    }
  });

  app.put('/api/books/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }
      const body = req.body ?? {};
      const updated = updateBook(id, {
        ...(body.isbn !== undefined ? { isbn: String(body.isbn).trim() } : {}),
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
        ...(body.author !== undefined ? { author: String(body.author).trim() } : {}),
        ...(body.publisher !== undefined ? { publisher: String(body.publisher).trim() } : {}),
        ...(body.category !== undefined ? { category: String(body.category).trim() } : {}),
        ...(body.year !== undefined ? { year: Number(body.year) } : {}),
        ...(body.pages !== undefined ? { pages: Number(body.pages) } : {}),
        ...(body.binding !== undefined && ALLOWED_BINDINGS.includes(body.binding)
          ? { binding: body.binding as BookBinding }
          : {}),
        ...(body.price_cents !== undefined ? { price_cents: Math.round(Number(body.price_cents)) } : {}),
        ...(body.cost_cents !== undefined ? { cost_cents: Math.round(Number(body.cost_cents)) } : {}),
        ...(body.stock !== undefined ? { stock: Math.max(0, Math.round(Number(body.stock))) } : {}),
        ...(body.cover_url !== undefined ? { cover_url: String(body.cover_url).trim() } : {}),
        ...(body.synopsis !== undefined ? { synopsis: String(body.synopsis).trim() } : {}),
        ...(body.featured !== undefined ? { featured: body.featured ? 1 : 0 } : {}),
      });
      if (!updated) {
        res.status(404).json({ error: 'Livro não encontrado.' });
        return;
      }
      res.json(updated);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'Já existe outro livro com este ISBN.' });
        return;
      }
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/books/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }
    const result = deleteBook(id);
    if (!result.deleted) {
      res.status(result.reason ? 409 : 404).json({
        error: result.reason ?? 'Livro não encontrado.',
      });
      return;
    }
    res.json({ deleted: true });
  });

  // Orders API
  app.get('/api/orders', (req, res) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const orders = listOrders({ status, search });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/orders/track/:query', (req, res) => {
    try {
      const orders = getOrderByCodeOrEmail(req.params.query);
      if (orders.length === 0) {
        res.status(404).json({ error: 'Nenhum pedido encontrado com esse código ou e-mail.' });
        return;
      }
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/orders', (req, res) => {
    try {
      const body = req.body ?? {};
      if (
        !body.customer_name ||
        !body.customer_email ||
        !body.customer_phone ||
        !body.shipping_address ||
        !body.shipping_city ||
        !body.shipping_postal
      ) {
        res.status(400).json({ error: 'Preencha todos os dados de entrega e contato do cliente.' });
        return;
      }
      const paymentMethod: PaymentMethod = ALLOWED_PAYMENTS.includes(body.payment_method)
        ? body.payment_method
        : 'Pix';
      const status: OrderStatus | undefined =
        body.status && ALLOWED_STATUSES.includes(body.status) ? body.status : undefined;

      const order = createOrder({
        customer_name: String(body.customer_name),
        customer_email: String(body.customer_email),
        customer_phone: String(body.customer_phone),
        shipping_address: String(body.shipping_address),
        shipping_city: String(body.shipping_city),
        shipping_postal: String(body.shipping_postal),
        payment_method: paymentMethod,
        notes: body.notes ? String(body.notes) : '',
        status,
        items: Array.isArray(body.items) ? body.items : [],
      });

      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        res.status(400).json({ error: 'ID de pedido inválido.' });
        return;
      }
      const nextStatus = req.body?.status;
      if (!ALLOWED_STATUSES.includes(nextStatus)) {
        res.status(400).json({ error: 'Status de pedido inválido.' });
        return;
      }
      const updated = updateOrderStatus(id, nextStatus);
      if (!updated) {
        res.status(404).json({ error: 'Pedido não encontrado.' });
        return;
      }
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // Sales & Analytics API
  app.get('/api/sales/summary', (_req, res) => {
    try {
      const summary = getSalesSummary();
      res.json(summary);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Frontend middleware / static hosting
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Livraria Meridiano server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
