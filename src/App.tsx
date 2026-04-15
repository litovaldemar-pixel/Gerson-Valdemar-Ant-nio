import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import DRE from './pages/DRE';
import Statement from './pages/Statement';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import Payroll from './pages/Payroll';
import POS from './pages/POS';

const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, userRole } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'caixa' ? "/pos" : "/dashboard"} />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<PrivateRoute allowedRoles={['admin', 'gerente']}><Dashboard /></PrivateRoute>} />
        <Route path="pos" element={<PrivateRoute allowedRoles={['admin', 'gerente', 'caixa']}><POS /></PrivateRoute>} />
        <Route path="lancamentos" element={<PrivateRoute allowedRoles={['admin', 'gerente']}><Transactions /></PrivateRoute>} />
        <Route path="clientes" element={<PrivateRoute allowedRoles={['admin', 'gerente']}><Customers /></PrivateRoute>} />
        <Route path="fornecedores" element={<PrivateRoute allowedRoles={['admin', 'gerente']}><Suppliers /></PrivateRoute>} />
        <Route path="mercadorias" element={<PrivateRoute allowedRoles={['admin', 'gerente']}><Products /></PrivateRoute>} />
        <Route path="salarios" element={<PrivateRoute allowedRoles={['admin']}><Payroll /></PrivateRoute>} />
        <Route path="dre" element={<PrivateRoute allowedRoles={['admin']}><DRE /></PrivateRoute>} />
        <Route path="balancete" element={<PrivateRoute allowedRoles={['admin', 'gerente']}><Statement /></PrivateRoute>} />
        <Route path="admin" element={<PrivateRoute allowedRoles={['admin']}><AdminPanel /></PrivateRoute>} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}


