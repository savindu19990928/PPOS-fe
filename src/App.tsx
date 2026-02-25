import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate } from
'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { SalesPage } from './pages/SalesPage';
import { RegisterPage } from './pages/RegisterPage';
function ProtectedRoute({ children }: {children: React.ReactNode;}) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
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
            } />

          <Route
            path="/sales"
            element={
            <ProtectedRoute>
                <SalesPage />
              </ProtectedRoute>
            } />

          <Route
            path="/registers"
            element={
            <ProtectedRoute>
                <RegisterPage />
              </ProtectedRoute>
            } />

        </Routes>
      </Router>
    </AuthProvider>);

}