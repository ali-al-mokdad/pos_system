const prisma = require('../lib/prisma');
const printer = require('../services/printerService');

async function loadSettings() {
  return prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

async function status(_req, res) {
  const settings = await loadSettings();
  res.json(await printer.status(settings));
}

async function test(_req, res) {
  const settings = await loadSettings();
  try {
    const result = await printer.printTest(settings);
    res.json(result);
  } catch (e) {
    res.status(502).json({ ok: false, message: e.message });
  }
}

async function printReceipt(req, res) {
  const settings = await loadSettings();
  const sale = await prisma.sale.findUnique({
    where: { id: Number(req.body.saleId) },
    include: { items: true, user: { select: { name: true } } },
  });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  try {
    const result = await printer.printReceipt(sale, settings, { reprint: !!req.body.reprint });
    res.json(result);
  } catch (e) {
    res.status(502).json({ ok: false, message: e.message, text: printer.buildReceiptText(sale, settings) });
  }
}

module.exports = { status, test, printReceipt };
