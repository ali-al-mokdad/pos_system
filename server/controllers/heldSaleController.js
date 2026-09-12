const prisma = require('../lib/prisma');

async function list(req, res) {
  const held = await prisma.heldSale.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  res.json(held.map((h) => ({ ...h, payload: JSON.parse(h.payload) })));
}

async function create(req, res) {
  const held = await prisma.heldSale.create({
    data: { userId: req.user.id, label: req.body.label || null, payload: JSON.stringify(req.body.payload || {}) },
  });
  res.status(201).json(held);
}

async function remove(req, res) {
  await prisma.heldSale.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
  res.json({ message: 'Held sale removed' });
}

module.exports = { list, create, remove };
