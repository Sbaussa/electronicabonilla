import { createContext, useContext, useState, useCallback } from 'react';



const POSContext = createContext(null);

export function POSProvider({ children }) {
  const [items, setItems]     = useState([]);
  const [client, setClient]   = useState(null);
  const [discount, setDiscount] = useState(0);

  const addItem = useCallback((product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
          : i
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        code: product.code,
        unit_price: product.sale_price,
        quantity: 1,
        stock: product.stock,
        subtotal: product.sale_price,
        discount: 0,
      }];
    });
  }, []);

  const removeItem = useCallback((product_id) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id));
  }, []);

  const updateQty = useCallback((product_id, qty) => {
    setItems(prev => prev.map(i => {
      if (i.product_id !== product_id) return i;
      const q = Math.max(1, Math.min(qty, i.stock));
      return { ...i, quantity: q, subtotal: q * i.unit_price - i.discount };
    }));
  }, []);

  const updatePrice = useCallback((product_id, price) => {
    setItems(prev => prev.map(i => {
      if (i.product_id !== product_id) return i;
      return { ...i, unit_price: price, subtotal: i.quantity * price - i.discount };
    }));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]); setClient(null); setDiscount(0);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total    = Math.max(0, subtotal - discount);

  return (
    <POSContext.Provider value={{
      items, client, discount, subtotal, total,
      setClient, setDiscount,
      addItem, removeItem, updateQty, updatePrice, clearCart,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export const usePOS = () => useContext(POSContext);

