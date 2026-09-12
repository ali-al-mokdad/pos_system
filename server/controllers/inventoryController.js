const { z } = require('zod');
const prisma = require('../lib/prisma');
const { applyStockChange } = require('../services/inventoryService');

const adjustSchema = z.object({
  productId: z.number().int(),
  type: z.enum(['RESTOCK', 'ADJUSTMENT', 'DAMAGE', 'EXPIRY', 'RETURN']),
  quantity: z.number(),
  mode: z.enum(['ADD', 'REMOVE', 'SET']).default('ADD'),
  reason: z.string().min(1, 'A reason is required'),
});

async function overview(_req, res) {
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { name: 'asc' } });
  const stockValue = products.reduce((s, p) => s + p.stockQuantity * p.costPrice, 0);
  const retailValue = products.reduce((s, p) => s + p.stockQuantity * p.sellingPrice, 0);
  res.json({
    products,
    summary: {
      totalProducts: products.length,
      lowStock: products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock).length,
      outOfStock: products.filter((p) => p.stockQuantity <= 0).length,
      stockValue: Math.round(stockValue * 100) / 100,
      retailValue: Math.round(retailValue * 100) / 100,
    },
  });
}

async function lowStock(_req, res) {
  const products = await prisma.product.findMany({ where: { isActive: true }, include: { category: true } });
  res.json(
    products
      .filter((p) => p.stockQuantity <= p.minimumStock)
      .map((p) => ({ ...p, status: p.stockQuantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK' }))
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
  );
}

async function adjust(req, res) {
  const { productId, type, quantity, mode, reason } = req.body;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  let delta;
  if (mode === 'ADD') delta = Math.abs(quantity);
  else if (mode === 'REMOVE') delta = -Math.abs(quantity);
  else delta = quantity - product.stockQuantity;

  const newStock = await prisma.$transaction((tx) =>
    applyStockChange(tx, { productId, delta, type, reason, userId: req.user.id })
  );
  res.json({ productId, newStock });
}

async function movements(req, res) {
  const where = {};
  if (req.query.productId) where.productId = Number(req.query.productId);
  if (req.query.type) where.type = req.query.type;
  const list = await prisma.inventoryMovement.findMany({
    where,
    include: { product: { select: { id: true, name: true, unit: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: Number(req.query.take || 200),
  });
  res.json(list);
}

module.exports = { overview, lowStock, adjust, movements, adjustSchema };
