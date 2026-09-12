const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  isActive: u.isActive,
  canSeeCost: u.canSeeCost,
  maxDiscountPercent: u.maxDiscountPercent,
  mustChangePassword: u.mustChangePassword,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function login(req, res) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  });
  res.json({ token, user: publicUser(user) });
}

async function logout(_req, res) {
  // Stateless JWT: the client discards the token. Endpoint exists for symmetry/auditing.
  res.json({ message: 'Logged out' });
}

async function me(req, res) {
  const shift = await prisma.shift.findFirst({ where: { userId: req.user.id, status: 'OPEN' } });
  res.json({ user: publicUser(req.user), openShift: shift });
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!bcrypt.compareSync(currentPassword, req.user.passwordHash)) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: bcrypt.hashSync(newPassword, 10), mustChangePassword: false },
  });
  res.json({ message: 'Password updated' });
}

module.exports = { login, logout, me, changePassword, loginSchema, changePasswordSchema, publicUser };
