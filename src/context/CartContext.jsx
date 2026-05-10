import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch cart from backend and map it correctly
  const fetchCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/cart');
      
      // Backend returns 'cartItems', we map it to 'cart'
      const items = data.cartItems || [];
      
      setCart(items.map(item => ({
        _id: item._id,                // Subdocument ID (perfect for React keys)
        product: item.product,        // Populated object or ID string
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })));
      
      setTotalPrice(data.totalPrice || 0);
      setTotalQty(data.totalQty || 0);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      if (error.response?.status === 401) {
        setCart([]);
        setTotalPrice(0);
        setTotalQty(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    try {
      setIsSyncing(true);
      await api.post('/cart', { productId: product._id, quantity });
      await fetchCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchCart]);

  const updateCartQty = useCallback(async (productId, quantity) => {
    if (quantity < 1) return;
    try {
      setIsSyncing(true);
      await api.put(`/cart/${productId}`, { quantity });
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart qty:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchCart]);

  const removeFromCart = useCallback(async (productId) => {
    try {
      setIsSyncing(true);
      await api.delete(`/cart/${productId}`);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      setIsSyncing(true);
      await api.delete('/cart');
      setCart([]);
      setTotalPrice(0);
      setTotalQty(0);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const value = {
    cart,
    totalPrice,
    totalQty,
    isLoading,
    isSyncing,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;