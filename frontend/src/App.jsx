import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ManagerHome from './pages/ManagerHome';
import ViewerHome from './pages/ViewerHome';
import SheetDetail from './pages/SheetDetail';
import { AuthRoute, ManagerRoute, ViewerRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/manager/home"
        element={
          <ManagerRoute>
            <ManagerHome />
          </ManagerRoute>
        }
      />
      <Route
        path="/viewer/home"
        element={
          <ViewerRoute>
            <ViewerHome />
          </ViewerRoute>
        }
      />
      <Route
        path="/sheet/:id"
        element={
          <AuthRoute>
            <SheetDetail />
          </AuthRoute>
        }
      />
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}
