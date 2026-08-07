import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Phase1Onboarding from './components/Phase1Onboarding';
import StrategyDashboard from './components/StrategyDashboard';
import DailyRoadmap from './components/DailyRoadmap';
import ActiveRecall from './components/ActiveRecall';
import KnowledgeVault from './components/KnowledgeVault';
import ProgressAnalytics from './components/ProgressAnalytics';

import { runPhase1Pipeline, runPhase2Pipeline, markTaskStatus, advanceSessionDay } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('onboarding');
  const [isLoadingPhase1, setIsLoadingPhase1] = useState(false);
  const [isLoadingPhase2, setIsLoadingPhase2] = useState(false);

  // Session Data States
  const [phase1Data, setPhase1Data] = useState(null);
  const [phase2Data, setPhase2Data] = useState(null);

  // Trigger Phase 1 Pipeline
  const handleGenerateStrategy = async (payload) => {
    setIsLoadingPhase1(true);
    const data = await runPhase1Pipeline(payload);
    setIsLoadingPhase1(false);

    if (data) {
      setPhase1Data(data);
      setActiveTab('dashboard'); // Automatically navigate to Strategy Dashboard
    }
  };

  // Trigger Phase 2 Pipeline
  const handleGeneratePhase2 = async () => {
    if (!phase1Data) return;

    setIsLoadingPhase2(true);
    const data = await runPhase2Pipeline({
      session_id: phase1Data.session_id,
      preparation_duration_days: phase1Data.interpreted_intent?.preparation_duration_days || 30,
    });
    setIsLoadingPhase2(false);

    if (data) {
      setPhase2Data(data);
      setActiveTab('roadmap'); // Automatically navigate to Daily Roadmap
    }
  };

  // Mark task status (Done / In Progress / Skipped)
  const handleMarkTask = (taskId, newStatus) => {
    if (!phase2Data) return;

    // Optimistically update UI
    setPhase2Data((prev) => {
      if (!prev || !prev.curriculum) return prev;

      const updatedDays = (prev.curriculum.days || []).map((day) => ({
        ...day,
        tasks: (day.tasks || []).map((t) => (t.task_id === taskId ? { ...t, status: newStatus } : t)),
      }));

      return {
        ...prev,
        curriculum: { ...prev.curriculum, days: updatedDays },
      };
    });

    // Notify backend
    markTaskStatus(phase1Data?.session_id || 'session-1', taskId, newStatus);
  };

  // Advance day
  const handleAdvanceDay = (targetDay) => {
    if (!phase2Data) return;

    setPhase2Data((prev) => ({
      ...prev,
      current_day: targetDay,
    }));

    advanceSessionDay(phase1Data?.session_id || 'session-1', targetDay);
  };

  // Reset Session
  const handleResetSession = () => {
    setPhase1Data(null);
    setPhase2Data(null);
    setActiveTab('onboarding');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessionState={{
          phase1Complete: !!phase1Data,
          phase2Complete: !!phase2Data,
        }}
        onResetSession={handleResetSession}
      />

      {/* Main Screen Content Router */}
      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {activeTab === 'onboarding' && (
          <Phase1Onboarding
            onGenerateStrategy={handleGenerateStrategy}
            isLoading={isLoadingPhase1}
          />
        )}

        {activeTab === 'dashboard' && (
          <StrategyDashboard
            phase1Data={phase1Data}
            onGeneratePhase2={handleGeneratePhase2}
            isLoadingPhase2={isLoadingPhase2}
          />
        )}

        {activeTab === 'roadmap' && (
          <DailyRoadmap
            curriculumData={phase2Data}
            onMarkTask={handleMarkTask}
            onAdvanceDay={handleAdvanceDay}
          />
        )}

        {activeTab === 'recall' && (
          <ActiveRecall recallData={phase2Data} />
        )}

        {activeTab === 'vault' && (
          <KnowledgeVault />
        )}

        {activeTab === 'analytics' && (
          <ProgressAnalytics
            sessionState={phase1Data}
            curriculumData={phase2Data}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        PlacementPal &copy; 2026 — AI-Powered Tech Placement Preparation Platform
      </footer>

    </div>
  );
}
