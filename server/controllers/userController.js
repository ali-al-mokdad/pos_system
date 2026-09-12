const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { publicUser } = require('./authController');

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'CASHIER']),
  isActive: z.boolean().optional(),
  canSeeCost: z.boolean().optional(),
  maxDiscountPercent: z.number().min(0).max(100).optional(),
});

const updateSchema = createSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).optional(),
});

async function list(_req, res) {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(users.map(publicUser));
}

async function create(req, res) {
  const data = { ...req.body, email: req.body.email.toLowerCase().trim() };
  const password = data.password;
  delete data.password;
  const user = await prisma.user.create({
    data: { ...data, passwordHash: bcrypt.hashSync(password, 10), mustChangePassword: true },
  });
  res.status(201).json(publicUser(user));
}

async function update(req, res) {
  const id = Number(req.params.id);
  const data = { ...req.body };
  if (data.email) data.email = data.email.toLowerCase().trim();
  if (data.password) {
    data.passwordHash = bcrypt.hashSync(data.password, 10);
    data.mustChangePassword = true;
  }
  delete data.password;
  const user = await prisma.user.update({ where: { id }, data });
  res.json(publicUser(user));
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account' });
  const salesCount = await prisma.sale.count({ where: { userId: id } });
  if (salesCount > 0) {
    // Preserve history: deactivate instead of destroying referenced records.
    const user = await prisma.user.update({ where: { id }, data: { isActive: false } });
    return res.json({ message: 'User has sales history and was deactivated instead', user: publicUser(user) });
  }
  await prisma.user.delete({ where: { id } });
  res.json({ message: 'User deleted' });
}

module.exports = { list, create, update, remove, createSchema, updateSchema };
