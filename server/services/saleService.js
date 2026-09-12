const { applyStockChange } = require('./inventoryService');

const money = (n) => Math.round(n * 100) / 100;

async function nextReceiptNumber(tx) {
  const counter = await tx.counter.upsert({
    where: { name: 'receipt' },
    update: { value: { increment: 1 } },
    create: { name: 'receipt', value: 1 },
  });
  return String(counter.value).padStart(8, '0');
}

/**
 * The backend is the single authority for prices, stock, discounts, tax and totals.
 * The client only sends product ids, quantities and requested discounts.
 */
async function createSale(prisma, { items, saleDiscount, saleDiscountType, paymentMethod, amountReceived, user }) {
  return prisma.$transaction(async (tx) => {
    const settings = (await tx.settings.findUnique({ where: { id: 1 } })) || {};
    const openShift = await tx.shift.findFirst({ where: { userId: user.id, status: 'OPEN' } });

    let subtotal = 0;
    let itemDiscountTotal = 0;
    const prepared = [];

    for (const line of items) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product || !product.isActive) {
        const e = new Error(`Product ${line.productId} is unavailable`);
        e.status = 400;
        throw e;
      }
      if (!settings.allowNegativeStock && product.stockQuantity < line.quantity) {
        const e = new Error(`Insufficient stock for ${product.name} (available ${product.stockQuantity})`);
        e.status = 409;
        throw e;
      }
      const gross = money(product.sellingPrice * line.quantity);
      const discount = Math.min(money(line.discount || 0), gross);
      subtotal += gross;
      itemDiscountTotal += discount;
      prepared.push({
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantity: line.quantity,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        discount,
        subtotal: money(gross - discount),
      });
    }

    subtotal = money(subtotal);
    const afterItemDiscounts = money(subtotal - itemDiscountTotal);

    let orderDiscount = 0;
    if (saleDiscount > 0) {
      orderDiscount =
        saleDiscountType === 'PERCENT'
          ? money((afterItemDiscounts * Math.min(saleDiscount, 100)) / 100)
          : money(Math.min(saleDiscount, afterItemDiscounts));
      const pct = afterItemDiscounts > 0 ? (orderDiscount / afterItemDiscounts) * 100 : 0;
      if (pct > (user.maxDiscountPercent ?? 0) && user.role !== 'ADMIN') {
        const e = new Error(`Discount exceeds your limit of ${user.maxDiscountPercent}%`);
        e.status = 403;
        throw e;
      }
    }

    const taxable = money(afterItemDiscounts - orderDiscount);
    const tax = settings.taxEnabled ? money((taxable * (settings.taxRate || 0)) / 100) : 0;
    const total = money(taxable + tax);

    if (paymentMethod === 'CASH' && money(amountReceived || 0) + 0.001 < total) {
      const e = new Error('Amount received is less than the total');
      e.status = 400;
      throw e;
    }

    const received = paymentMethod === 'CASH' ? money(amountReceived) : total;
    const receiptNumber = await nextReceiptNumber(tx);

    const sale = await tx.sale.create({
      data: {
        receiptNumber,
        userId: user.id,
        shiftId: openShift ? openShift.id : null,
        subtotal,
        discount: money(itemDiscountTotal + orderDiscount),
        tax,
        total,
        paymentMethod,
        amountReceived: received,
        changeAmount: money(Math.max(0, received - total)),
        items: { create: prepared },
      },
      include: { items: true, user: { select: { id: true, name: true } } },
    });

    for (const item of prepared) {
      await applyStockChange(tx, {
        productId: item.productId,
        delta: -item.quantity,
        type: 'SALE',
        reason: `Sale ${receiptNumber}`,
        userId: user.id,
      });
    }

    return sale;
  });
}

module.exports = { createSale, money };
