import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const POSContext = createContext(null);

const r2 = (n) => Math.round(n * 100) / 100;

export function POSProvider({ children }) {
  const { settings } = useAuth();
  const [items, setItems] = useState([]);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [saleDiscountType, setSaleDiscountType] = useState('FIXED');

  const addProduct = useCallback((product, quantity = 1) => {
    let result = { ok: true };
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      const nextQty = (existing ? existing.quantity : 0) + quantity;
      if (!settings?.allowNegativeStock && nextQty > product.stockQuantity) {
        result = { ok: false, message: `Only ${product.stockQuantity} ${product.unit.toLowerCase()} of ${product.name} in stock` };
        return prev;
      }
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: r2(nextQty) } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          stockQuantity: product.stockQuantity,
          image: product.image,
          quantity,
          discount: 0,
        },
      ];
    });
    return result;
  }, [settings]);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: r2(Math.max(0, quantity)) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const setItemDiscount = useCallback((productId, discount) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, discount: Math.max(0, Math.min(discount, i.unitPrice * i.quantity)) } : i
      )
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSaleDiscount(0);
    setSaleDiscountType('FIXED');
  }, []);

  const restore = useCallback((payload) => {
    setItems(payload.items || []);
    setSaleDiscount(payload.saleDiscount || 0);
    setSaleDiscountType(payload.saleDiscountType || 'FIXED');
  }, []);

  // Client-side preview only. The backend recalculates and is the authority.
  const totals = useMemo(() => {
    const subtotal = r2(items.reduce((a, i) => a + i.unitPrice * i.quantity, 0));
    const itemDiscounts = r2(items.reduce((a, i) => a + i.discount, 0));
    const afterItems = r2(subtotal - itemDiscounts);
    const orderDiscount =
      saleDiscountType === 'PERCENT'
        ? r2((afterItems * Math.min(saleDiscount, 100)) / 100)
        : r2(Math.min(saleDiscount, afterItems));
    const taxable = r2(afterItems - orderDiscount);
    const tax = settings?.taxEnabled ? r2((taxable * (settings.taxRate || 0)) / 100) : 0;
    return {
      subtotal,
      discount: r2(itemDiscounts + orderDiscount),
      tax,
      total: r2(taxable + tax),
      count: r2(items.reduce((a, i) => a + i.quantity, 0)),
    };
  }, [items, saleDiscount, saleDiscountType, settings]);

  const value = {
    items,
    addProduct,
    setQuantity,
    setItemDiscount,
    removeItem,
    clearCart,
    restore,
    totals,
    saleDiscount,
    setSaleDiscount,
    saleDiscountType,
    setSaleDiscountType,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS must be used inside POSProvider');
  return ctx;
}
