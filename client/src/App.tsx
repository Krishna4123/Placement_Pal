import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { AppRoutes } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </SessionProvider>
    </BrowserRouter>
  );
}
