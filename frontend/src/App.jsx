import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthRoute, ManagerRoute, ViewerRoute } from './components/ProtectedRoute';
import { SheetsProvider } from './context/SheetsContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ManagerHome = lazy(() => import('./pages/ManagerHome'));
const ViewerHome = lazy(() => import('./pages/ViewerHome'));
const SheetDetail = lazy(() => import('./pages/SheetDetail'));

export default function App() {
  return (
    <SheetsProvider>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
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
      </Suspense>
    </SheetsProvider>
  );
}
