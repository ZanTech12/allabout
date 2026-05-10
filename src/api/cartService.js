// src/api/cartService.js
import api from './axios';

const cartService = {
  // Fetch cart from database
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add item to cart
  addItem: async (productId, quantity = 1) => {
    const response = await api.post('/cart', { productId, quantity });
    return response.data;
  },

  // Update item quantity
  updateQuantity: async (productId, quantity) => {
    const response = await api.put(`/cart/${productId}`, { quantity });
    return response.data;
  },

  // Remove item from cart
  removeItem: async (productId) => {
    const response = await api.delete(`/cart/${productId}`);
    return response.data;
  },

  // Clear entire cart
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
};

export default cartService;