const { z } = require('zod');
const prisma = require('../lib/prisma');
const { createSale, money } = require('../services/saleService');
const { applyStockChange } = require('../services/inventoryService');
const printer = require('../services/printerService');

const createSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int(),
        quantity: z.number().positive(),
        discount: z.number().min(0).optional(),
      })
    )
    .min(1, 'Cart is empty'),
  saleDiscount: z.number().min(0).optional().default(0),
  saleDiscountType: z.enum(['FIXED', 'PERCENT']).optional().default('FIXED'),
  paymentMethod: z.enum(['CASH', 'CARD', 'OTHER']),
  amountReceived: z.number().min(0).optional().default(0),
  print: z.boolean().optional().default(true),
});

const refundSchema = z.object({
  items: z
    .array(z.object({ saleItemId: z.number().int(), quantity: z.number().positive() }))
    .min(1),
  reason: z.string().optional(),
});

function rangeFilter(query) {
  const { period, from, to } = query;
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let gte;
  let lte;
  if (period === 'today') gte = startOfDay(now);
  else if (period === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    gte = startOfDay(y);
    lte = startOfDay(now);
  } else if (period === 'week') {
    const w = new Date(now);
    w.setDate(w.getDate() - 7);
    gte = startOfDay(w);
  } else if (period === 'month') {
    const m = new Date(now);
    m.setMonth(m.getMonth() - 1);
    gte = startOfDay(m);
  } else if (from || to) {
    if (from) gte = new Date(from);
    if (to) {
      lte = new Date(to);
      lte.setHours(23, 59, 59, 999);
    }
  }
  if (!gte && !lte) return undefined;
  return { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
}

async function list(req, res) {
  const where = {};
  const createdAt = rangeFilter(req.query);
  if (createdAt) where.createdAt = createdAt;
  if (req.query.paymentMethod) where.paymentMethod = req.query.paymentMethod;
  if (req.query.status) where.status = req.query.status;
  if (req.query.search) where.receiptNumber = { contains: req.query.search };
  // Cashiers only see their own sales.
  if (req.user.role !== 'ADMIN') where.userId = req.user.id;

  const sales = await prisma.sale.findMany({
    where,
    include: { user: { select: { id: true, name: true } }, _count: { select: { items: true } } },
    orderBy: { createdAt: 'desc' },
    take: Number(req.query.take || 200),
  });
  res.json(sales);
}

async function get(req, res) {
  const sale = await prisma.sale.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: true, user: { select: { id: true, name: true } }, refunds: true },
  });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  if (req.user.role !== 'ADMIN' && sale.userId !== req.user.id) {
    return res.status(403).json({ message: 'Not allowed to view this sale' });
  }
  res.json(sale);
}

async function create(req, res) {
  const sale = await createSale(prisma, { ...req.body, user: req.user });
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  let print = { ok: false, message: 'Printing skipped' };
  if (req.body.print) {
    try {
      print = await printer.printReceipt(sale, settings);
    } catch (e) {
      print = { ok: false, message: e.message };
    }
  }
  const receiptText = printer.buildReceiptText(sale, settings);
  res.status(201).json({ sale, print, receiptText });
}

async function reprint(req, res) {
  const sale = await prisma.sale.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: true, user: { select: { id: true, name: true } } },
  });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  // Reprint never touches inventory or creates a sale.
  let print;
  try {
    print = await printer.printReceipt(sale, settings, { reprint: true });
  } catch (e) {
    print = { ok: false, message: e.message };
  }
  res.json({ print, receiptText: printer.buildReceiptText(sale, settings, { reprint: true }) });
}

async function refund(req, res) {
  const saleId = Number(req.params.id);
  const result = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id: saleId }, include: { items: true } });
    if (!sale) {
      const e = new Error('Sale not found');
      e.status = 404;
      throw e;
    }
    let amount = 0;
    const recorded = [];
    for (const line of req.body.items) {
      const item = sale.items.find((i) => i.id === line.saleItemId);
      if (!item) {
        const e = new Error(`Sale item ${line.saleItemId} not in this sale`);
        e.status = 400;
        throw e;
      }
      const remaining = item.quantity - item.refundedQty;
      if (line.quantity > remaining + 0.0001) {
        const e = new Error(`Cannot refund ${line.quantity} of ${item.productName}; only ${remaining} remain`);
        e.status = 400;
        throw e;
      }
      const unitNet = item.subtotal / item.quantity;
      const lineAmount = money(unitNet * line.quantity);
      amount += lineAmount;
      recorded.push({ saleItemId: item.id, quantity: line.quantity, amount: lineAmount });

      await tx.saleItem.update({
        where: { id: item.id },
        data: { refundedQty: item.refundedQty + line.quantity },
      });
      if (item.productId) {
        await applyStockChange(tx, {
          productId: item.productId,
          delta: line.quantity,
          type: 'RETURN',
          reason: `Refund for ${sale.receiptNumber}`,
          userId: req.user.id,
        });
      }
    }

    const refundRecord = await tx.refund.create({
      data: {
        saleId,
        userId: req.user.id,
        amount: money(amount),
        reason: req.body.reason,
        items: JSON.stringify(recorded),
      },
    });

    const items = await tx.saleItem.findMany({ where: { saleId } });
    const fullyRefunded = items.every((i) => i.refundedQty >= i.quantity - 0.0001);
    // The original sale is preserved; only its status changes.
    await tx.sale.update({
      where: { id: saleId },
      data: { status: fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
    });

    return refundRecord;
  });
  res.status(201).json(result);
}

module.exports = { list, get, create, refund, reprint, createSchema, refundSchema, rangeFilter };
