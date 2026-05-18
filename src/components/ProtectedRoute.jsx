// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user, loading, hasPermission } = useAuth();

  // ✅ 1. If AuthContext is still reading localStorage, show a blank screen or spinner
  if (loading) {
    return null; // Or return <div>Loading...</div>
  }

  // ✅ 2. Not logged in at all → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ 3. If a specific permission is required for this route
  if (requiredPermission) {
    if (!['admin', 'sales_rep'].includes(user.role)) {
      return <Navigate to="/" replace />;
    }

    if (!hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You do not have the required permissions to view this page.
            </p>
            <button 
              onClick={() => window.history.back()} 
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  console.warn("AdminRoute is deprecated. Use ProtectedRoute with requiredPermission instead.");
  return <Navigate to="/" replace />;
};