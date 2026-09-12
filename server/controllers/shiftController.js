const { z } = require('zod');
const prisma = require('../lib/prisma');

const openSchema = z.object({ openingCash: z.number().min(0) });
const closeSchema = z.object({ actualCash: z.number().min(0), note: z.string().optional() });

async function list(req, res) {
  const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
  const shifts = await prisma.shift.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
    orderBy: { openedAt: 'desc' },
    take: 100,
  });
  res.json(shifts);
}

async function get(req, res) {
  const shift = await prisma.shift.findUnique({
    where: { id: Number(req.params.id) },
    include: { user: { select: { id: true, name: true } }, sales: true },
  });
  if (!shift) return res.status(404).json({ message: 'Shift not found' });
  if (req.user.role !== 'ADMIN' && shift.userId !== req.user.id) {
    return res.status(403).json({ message: 'Not allowed' });
  }
  const cashSales = shift.sales.filter((s) => s.paymentMethod === 'CASH').reduce((a, s) => a + s.total, 0);
  const cardSales = shift.sales.filter((s) => s.paymentMethod === 'CARD').reduce((a, s) => a + s.total, 0);
  res.json({ ...shift, cashSales, cardSales, expected: shift.openingCash + cashSales });
}

async function open(req, res) {
  const existing = await prisma.shift.findFirst({ where: { userId: req.user.id, status: 'OPEN' } });
  if (existing) return res.status(409).json({ message: 'You already have an open shift' });
  const shift = await prisma.shift.create({
    data: { userId: req.user.id, openingCash: req.body.openingCash },
  });
  res.status(201).json(shift);
}

async function close(req, res) {
  const id = Number(req.params.id);
  const shift = await prisma.shift.findUnique({ where: { id }, include: { sales: true } });
  if (!shift) return res.status(404).json({ message: 'Shift not found' });
  if (shift.status === 'CLOSED' && req.user.role !== 'ADMIN') {
    return res.status(409).json({ message: 'Shift is already closed' });
  }
  if (req.user.role !== 'ADMIN' && shift.userId !== req.user.id) {
    return res.status(403).json({ message: 'Not allowed' });
  }
  const cashSales = shift.sales.filter((s) => s.paymentMethod === 'CASH').reduce((a, s) => a + s.total, 0);
  const expectedCash = Math.round((shift.openingCash + cashSales) * 100) / 100;
  const difference = Math.round((req.body.actualCash - expectedCash) * 100) / 100;

  const updated = await prisma.shift.update({
    where: { id },
    data: {
      closingCash: req.body.actualCash,
      expectedCash,
      difference,
      note: req.body.note,
      closedAt: new Date(),
      status: 'CLOSED',
    },
  });
  res.json({ ...updated, cashSales });
}

module.exports = { list, get, open, close, openSchema, closeSchema };
