import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  return children;
}

export function ManagerRoute({ children }) {
  const { isAuthenticated, isManager, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  if (!isManager) return <Navigate to="/viewer/home" replace />;
  return children;
}

export function ViewerRoute({ children }) {
  const { isAuthenticated, isViewer, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  if (!isViewer) return <Navigate to="/manager/home" replace />;
  return children;
}
