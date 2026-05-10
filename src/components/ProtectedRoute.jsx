import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

export const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user && user.role === 'admin' ? children : <Navigate to="/login" />;
};