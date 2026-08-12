import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { AppRoutes } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

