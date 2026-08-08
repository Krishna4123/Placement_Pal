import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

export const ProtectedRoute: React.FC = () => {
  const { hasActiveSession } = useSession();

  if (!hasActiveSession) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
