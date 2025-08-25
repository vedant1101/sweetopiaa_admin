'use client';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../components/LoginPage';
import OrdersDashboard from '../components/OrdersDashboard';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return user ? <OrdersDashboard /> : <LoginPage />;
}