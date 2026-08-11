import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingLayout } from '../layouts/LandingLayout';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

import { LandingPage } from '../pages/LandingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { NewSessionPage } from '../pages/NewSessionPage';
import { CompanyPage } from '../pages/CompanyPage';
import { VaultPage } from '../pages/VaultPage';
import { ResumePage } from '../pages/ResumePage';
import { RecallPage } from '../pages/RecallPage';
import { CurriculumPage } from '../pages/CurriculumPage';
import { PlannerPage } from '../pages/PlannerPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Routes */}
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/new-session" element={<NewSessionPage />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/recall" element={<RecallPage />} />
          <Route path="/curriculum" element={<CurriculumPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Wildcard 404 Route */}
      <Route element={<LandingLayout />}>
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
};
