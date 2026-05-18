// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ NEW: Loading state

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setUser(userInfo);
    }
    setLoading(false); // ✅ NEW: Done loading from storage
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
    
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
  };

  const hasPermission = (requiredPermission) => {
    if (!user) return false;
    if (user.role === 'admin') return true; 
    if (user.role === 'sales_rep') {
      return user.permissions?.includes(requiredPermission) || false;
    }
    return false; 
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};