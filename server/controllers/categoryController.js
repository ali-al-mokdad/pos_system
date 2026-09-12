const { z } = require('zod');
const prisma = require('../lib/prisma');

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  order: z.array(z.object({ id: z.number().int(), displayOrder: z.number().int() })),
});

async function list(req, res) {
  const where = req.query.all === 'true' ? {} : { isActive: true };
  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  });
  res.json(categories);
}

async function get(req, res) {
  const category = await prisma.category.findUnique({ where: { id: Number(req.params.id) } });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
}

async function create(req, res) {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json(category);
}

async function update(req, res) {
  const category = await prisma.category.update({ where: { id: Number(req.params.id) }, data: req.body });
  res.json(category);
}

async function reorder(req, res) {
  await prisma.$transaction(
    req.body.order.map((o) => prisma.category.update({ where: { id: o.id }, data: { displayOrder: o.displayOrder } }))
  );
  res.json({ message: 'Order updated' });
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return res.status(409).json({ message: `Category has ${count} product(s). Move or delete them first.` });
  }
  await prisma.category.delete({ where: { id } });
  res.json({ message: 'Category deleted' });
}

module.exports = { list, get, create, update, remove, reorder, schema, reorderSchema };
