const prisma = require('../lib/prisma');
const { rangeFilter } = require('./saleController');

const r2 = (n) => Math.round(n * 100) / 100;

async function loadSales(query) {
  const createdAt = rangeFilter(query);
  return prisma.sale.findMany({
    where: { ...(createdAt ? { createdAt } : {}) },
    include: { items: true, user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

async function sales(req, res) {
  const list = await loadSales(req.query);
  const total = list.reduce((a, s) => a + s.total, 0);
  const byDay = {};
  const byMethod = {};
  for (const s of list) {
    const day = new Date(s.createdAt).toISOString().slice(0, 10);
    byDay[day] = r2((byDay[day] || 0) + s.total);
    byMethod[s.paymentMethod] = r2((byMethod[s.paymentMethod] || 0) + s.total);
  }
  res.json({
    totalSales: r2(total),
    transactions: list.length,
    averageTransaction: list.length ? r2(total / list.length) : 0,
    discounts: r2(list.reduce((a, s) => a + s.discount, 0)),
    taxes: r2(list.reduce((a, s) => a + s.tax, 0)),
    byDay: Object.entries(byDay).map(([date, amount]) => ({ date, amount })),
    byPaymentMethod: Object.entries(byMethod).map(([method, amount]) => ({ method, amount })),
  });
}

async function profit(req, res) {
  const list = await loadSales(req.query);
  let revenue = 0;
  let cost = 0;
  for (const s of list) {
    for (const i of s.items) {
      const net = i.quantity - i.refundedQty;
      revenue += (i.subtotal / i.quantity) * net;
      cost += i.costPrice * net;
    }
  }
  res.json({ revenue: r2(revenue), cost: r2(cost), profit: r2(revenue - cost), transactions: list.length });
}

async function products(req, res) {
  const list = await loadSales(req.query);
  const map = new Map();
  for (const s of list) {
    for (const i of s.items) {
      const key = i.productId || i.productName;
      const net = i.quantity - i.refundedQty;
      const entry = map.get(key) || { productId: i.productId, name: i.productName, quantity: 0, revenue: 0, profit: 0 };
      entry.quantity += net;
      entry.revenue += (i.subtotal / i.quantity) * net;
      entry.profit += ((i.subtotal / i.quantity) - i.costPrice) * net;
      map.set(key, entry);
    }
  }
  const rows = [...map.values()].map((r) => ({ ...r, revenue: r2(r.revenue), profit: r2(r.profit) }));
  const sold = new Set(rows.map((r) => r.productId));
  const never = await prisma.product.findMany({ where: { isActive: true } });
  res.json({
    bestSelling: [...rows].sort((a, b) => b.quantity - a.quantity).slice(0, 20),
    slowSelling: [
      ...never
        .filter((p) => !sold.has(p.id))
        .map((p) => ({ productId: p.id, name: p.name, quantity: 0, revenue: 0, profit: 0 })),
      ...[...rows].sort((a, b) => a.quantity - b.quantity),
    ].slice(0, 20),
  });
}

async function inventory(_req, res) {
  const list = await prisma.product.findMany({ include: { category: true }, orderBy: { name: 'asc' } });
  res.json({
    products: list.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category ? p.category.name : '',
      stockQuantity: p.stockQuantity,
      minimumStock: p.minimumStock,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      stockValue: r2(p.stockQuantity * p.costPrice),
      status: p.stockQuantity <= 0 ? 'OUT_OF_STOCK' : p.stockQuantity <= p.minimumStock ? 'LOW_STOCK' : 'OK',
    })),
    stockValue: r2(list.reduce((a, p) => a + p.stockQuantity * p.costPrice, 0)),
    lowStock: list.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock).length,
    outOfStock: list.filter((p) => p.stockQuantity <= 0).length,
  });
}

async function dashboard(req, res) {
  const list = await loadSales({ period: req.query.period || 'today', from: req.query.from, to: req.query.to });
  const allProducts = await prisma.product.findMany();
  const categories = await prisma.category.count();

  let profitValue = 0;
  const productMap = new Map();
  const categoryMap = new Map();
  const catNames = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.id, c.name])
  );

  for (const s of list) {
    for (const i of s.items) {
      const net = i.quantity - i.refundedQty;
      const rev = (i.subtotal / i.quantity) * net;
      profitValue += rev - i.costPrice * net;
      const e = productMap.get(i.productName) || { name: i.productName, quantity: 0, revenue: 0 };
      e.quantity += net;
      e.revenue += rev;
      productMap.set(i.productName, e);
      const prod = allProducts.find((p) => p.id === i.productId);
      const cname = prod && prod.categoryId ? catNames[prod.categoryId] : 'Other';
      categoryMap.set(cname, r2((categoryMap.get(cname) || 0) + rev));
    }
  }

  const byDay = {};
  for (const s of list) {
    const day = new Date(s.createdAt).toISOString().slice(0, 10);
    byDay[day] = r2((byDay[day] || 0) + s.total);
  }

  res.json({
    totalSales: r2(list.reduce((a, s) => a + s.total, 0)),
    transactions: list.length,
    profit: r2(profitValue),
    cashSales: r2(list.filter((s) => s.paymentMethod === 'CASH').reduce((a, s) => a + s.total, 0)),
    cardSales: r2(list.filter((s) => s.paymentMethod === 'CARD').reduce((a, s) => a + s.total, 0)),
    totalProducts: allProducts.length,
    lowStock: allProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock).length,
    outOfStock: allProducts.filter((p) => p.stockQuantity <= 0).length,
    totalCategories: categories,
    salesByDay: Object.entries(byDay).map(([date, amount]) => ({ date, amount })),
    salesByMethod: ['CASH', 'CARD', 'OTHER'].map((method) => ({
      method,
      amount: r2(list.filter((s) => s.paymentMethod === method).reduce((a, s) => a + s.total, 0)),
    })),
    bestSellers: [...productMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((p) => ({ ...p, revenue: r2(p.revenue) })),
    salesByCategory: [...categoryMap.entries()].map(([name, amount]) => ({ name, amount })),
  });
}

module.exports = { sales, profit, products, inventory, dashboard };
