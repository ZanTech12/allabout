import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setUser(userInfo);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
    
    // ← ADD THIS: save token separately so axios can find it
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token'); // ← ADD THIS
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};