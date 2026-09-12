// All stock changes must go through here so an InventoryMovement is always recorded.
async function applyStockChange(tx, { productId, delta, type, reason, userId }) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) {
    const err = new Error(`Product ${productId} not found`);
    err.status = 404;
    throw err;
  }
  const previousStock = product.stockQuantity;
  const newStock = round(previousStock + delta);

  await tx.product.update({ where: { id: productId }, data: { stockQuantity: newStock } });
  await tx.inventoryMovement.create({
    data: { productId, type, quantity: Math.abs(delta), previousStock, newStock, reason, userId },
  });
  return newStock;
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

module.exports = { applyStockChange, round };
