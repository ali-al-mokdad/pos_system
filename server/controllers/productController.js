const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const UNITS = ['PIECE', 'KG', 'GRAM', 'LITER', 'BOTTLE', 'BOX', 'PACK'];

const numeric = z.preprocess((v) => (v === '' || v === undefined || v === null ? undefined : Number(v)), z.number());
const boolish = z.preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean());

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  barcode: z.string().min(1, 'Barcode is required'),
  qrCode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  categoryId: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().nullable()).optional(),
  sellingPrice: numeric.optional(),
  costPrice: numeric.optional(),
  stockQuantity: numeric.optional(),
  minimumStock: numeric.optional(),
  unit: z.enum(UNITS).optional(),
  isActive: boolish.optional(),
});

const updateSchema = schema.partial();

function strip(product, user) {
  if (user && (user.role === 'ADMIN' || user.canSeeCost)) return product;
  const { costPrice, ...rest } = product;
  return rest;
}

async function list(req, res) {
  const { search, categoryId, active, lowStock, take } = req.query;
  const where = {};
  if (active !== 'all') where.isActive = active === 'false' ? false : true;
  if (categoryId) where.categoryId = Number(categoryId);
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { barcode: { contains: search } },
      { qrCode: { contains: search } },
      { sku: { contains: search } },
      { category: { name: { contains: search } } },
    ];
  }
  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: 'asc' },
    take: take ? Number(take) : 500,
  });
  const filtered = lowStock === 'true' ? products.filter((p) => p.stockQuantity <= p.minimumStock) : products;
  res.json(filtered.map((p) => strip(p, req.user)));
}

async function get(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: { category: true },
  });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(strip(product, req.user));
}

// Optimised hot path for the barcode scanner: single indexed unique lookup.
async function getByBarcode(req, res) {
  const code = String(req.params.barcode).trim();
  let product = await prisma.product.findUnique({ where: { barcode: code }, include: { category: true } });
  if (!product) {
    product = await prisma.product.findFirst({
      where: { OR: [{ qrCode: code }, { sku: code }] },
      include: { category: true },
    });
  }
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (!product.isActive) return res.status(404).json({ message: 'Product is not available for sale' });
  res.json(strip(product, req.user));
}

function imagePath(req) {
  return req.file ? `/uploads/products/${req.file.filename}` : undefined;
}

function deleteImage(image) {
  if (!image) return;
  const file = path.join(__dirname, '..', image.replace(/^\//, ''));
  fs.promises.unlink(file).catch(() => {});
}

async function create(req, res) {
  const data = { ...req.body };
  const image = imagePath(req);
  if (image) data.image = image;
  const existing = await prisma.product.findUnique({ where: { barcode: data.barcode } });
  if (existing) return res.status(409).json({ message: 'A product with this barcode already exists' });
  const initialStock = data.stockQuantity || 0;

  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({ data });
    if (initialStock > 0) {
      await tx.inventoryMovement.create({
        data: {
          productId: p.id,
          type: 'RESTOCK',
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          reason: 'Initial stock',
          userId: req.user.id,
        },
      });
    }
    return p;
  });
  res.status(201).json(product);
}

async function update(req, res) {
  const id = Number(req.params.id);
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ message: 'Product not found' });

  const data = { ...req.body };
  if (data.barcode && data.barcode !== current.barcode) {
    const clash = await prisma.product.findUnique({ where: { barcode: data.barcode } });
    if (clash) return res.status(409).json({ message: 'A product with this barcode already exists' });
  }
  const image = imagePath(req);
  if (image) {
    data.image = image;
    deleteImage(current.image);
  }
  // Stock is only changed through inventory adjustments so movements stay accurate.
  delete data.stockQuantity;

  const product = await prisma.product.update({ where: { id }, data, include: { category: true } });
  res.json(product);
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const sold = await prisma.saleItem.count({ where: { productId: id } });
  if (sold > 0) {
    const product = await prisma.product.update({ where: { id }, data: { isActive: false } });
    return res.json({ message: 'Product has sales history and was deactivated instead', product });
  }
  const current = await prisma.product.findUnique({ where: { id } });
  await prisma.inventoryMovement.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  if (current) deleteImage(current.image);
  res.json({ message: 'Product deleted' });
}

module.exports = { list, get, getByBarcode, create, update, remove, schema, updateSchema, UNITS };
