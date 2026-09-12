const { z } = require('zod');
const prisma = require('../lib/prisma');

const schema = z.object({
  businessName: z.string().min(1).optional(),
  logo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  currency: z.string().min(1).max(5).optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  receiptFooter: z.string().optional(),
  allowNegativeStock: z.boolean().optional(),
  printerType: z.enum(['USB', 'NETWORK', 'SERIAL', 'NONE']).optional(),
  printerName: z.string().optional().nullable(),
  printerIp: z.string().optional().nullable(),
  printerPort: z.number().int().min(1).max(65535).optional(),
  paperWidth: z.union([z.literal(58), z.literal(80)]).optional(),
});

async function getSettings(_req, res) {
  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  res.json(settings);
}

async function updateSettings(req, res) {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: req.body,
    create: { id: 1, ...req.body },
  });
  res.json(settings);
}

module.exports = { getSettings, updateSettings, schema };
