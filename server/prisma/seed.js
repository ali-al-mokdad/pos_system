const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function main() {
  const hash = bcrypt.hashSync('ChangeMe123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@market.local' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@market.local',
      passwordHash: hash,
      role: 'ADMIN',
      canSeeCost: true,
      maxDiscountPercent: 100,
      mustChangePassword: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'cashier@market.local' },
    update: {},
    create: {
      name: 'John Cashier',
      email: 'cashier@market.local',
      passwordHash: hash,
      role: 'CASHIER',
      maxDiscountPercent: 10,
      mustChangePassword: true,
    },
  });

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: 'Green Valley Market',
      address: '12 Market Street, Beirut',
      phone: '+961 1 234 567',
      currency: '$',
      taxEnabled: true,
      taxRate: 11,
      receiptFooter: 'Thank you for shopping with us!',
      printerType: 'NETWORK',
      printerIp: '192.168.1.100',
      printerPort: 9100,
      paperWidth: 80,
    },
  });

  await prisma.counter.upsert({
    where: { name: 'receipt' },
    update: {},
    create: { name: 'receipt', value: 0 },
  });

  const categories = [
    // 'Drinks', 'Snacks', 'Dairy', 'Bread', 'Frozen', 'Household'
  ];
  const catMap = {};
  for (let i = 0; i < categories.length; i++) {
    const c = await prisma.category.upsert({
      where: { name: categories[i] },
      update: {},
      create: { name: categories[i], displayOrder: i },
    });
    catMap[c.name] = c.id;
  }

  const products = [
    // ['Fresh Milk 1L', '6291234567890', 'SKU-MILK-1L', 'Dairy', 3.0, 2.1, 40, 10, 'LITER'],
    // ['White Bread Loaf', '6291234567891', 'SKU-BRD-500', 'Bread', 1.5, 0.9, 25, 8, 'PIECE'],
    // ['Dark Chocolate 100g', '6291234567892', 'SKU-CHOC-100', 'Snacks', 2.0, 1.2, 60, 15, 'PIECE'],
    // ['Cola Can 330ml', '6291234567893', 'SKU-COLA-330', 'Drinks', 0.9, 0.55, 120, 24, 'BOTTLE'],
    // ['Mineral Water 1.5L', '6291234567894', 'SKU-WTR-15', 'Drinks', 0.75, 0.4, 200, 30, 'BOTTLE'],
    // ['Greek Yogurt 500g', '6291234567895', 'SKU-YOG-500', 'Dairy', 2.75, 1.8, 18, 10, 'PACK'],
    // ['Potato Chips 150g', '6291234567896', 'SKU-CHIP-150', 'Snacks', 1.85, 1.05, 5, 12, 'PACK'],
    // ['Frozen Peas 400g', '6291234567897', 'SKU-PEA-400', 'Frozen', 2.4, 1.5, 0, 6, 'PACK'],
    // ['Dish Soap 750ml', '6291234567898', 'SKU-DISH-750', 'Household', 3.6, 2.2, 32, 8, 'BOTTLE'],
    // ['Bananas', '6291234567899', 'SKU-BAN-KG', 'Snacks', 1.99, 1.2, 45, 10, 'KG'],
  ];

  for (const [name, barcode, sku, cat, sell, cost, stock, min, unit] of products) {
    await prisma.product.upsert({
      where: { barcode },
      update: {},
      create: {
        name,
        barcode,
        sku,
        categoryId: catMap[cat],
        sellingPrice: sell,
        costPrice: cost,
        stockQuantity: stock,
        minimumStock: min,
        unit,
      },
    });
  }

  console.log('Seed complete. Login: admin@market.local / ChangeMe123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
