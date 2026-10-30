import React from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { SalesPage } from './pages/SalesPage';
import { StockPage } from './pages/StockPage';
import { CreditPage } from './pages/CreditPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { UsersPage } from './pages/UsersPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    // Cashiers are restricted from Sales history and Admin operations
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/credit"
            element={
              <ProtectedRoute>
                <CreditPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sales"
            element={
              <AdminRoute>
                <SalesPage />
              </AdminRoute>
            }
          />

          <Route
            path="/stock"
            element={
              <AdminRoute>
                <StockPage />
              </AdminRoute>
            }
          />

          <Route
            path="/suppliers"
            element={
              <AdminRoute>
                <SuppliersPage />
              </AdminRoute>
            }
          />

          <Route
            path="/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}