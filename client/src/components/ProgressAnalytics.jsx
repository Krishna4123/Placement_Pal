import React from 'react';
import { 
  CheckCircle2, 
  Flame, 
  Clock, 
  Target, 
  TrendingUp, 
  Download
} from 'lucide-react';

export default function ProgressAnalytics({ sessionState, curriculumData }) {
  const curriculum = curriculumData?.curriculum || { days: [] };
  const days = curriculum.days || [];

  let totalTasks = 0;
  let completedTasks = 0;
  days.forEach((d) => {
    (d.tasks || []).forEach((t) => {
      totalTasks++;
      if (t.status === 'done') completedTasks++;
    });
  });

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const targetCompanies = sessionState?.interpreted_intent?.target_companies || [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1040px', margin: '20px auto', padding: '0 20px' }}>
      
      {/* Analytics Header */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="badge badge-purple" style={{ marginBottom: '6px' }}>
              <TrendingUp size={14} /> Analytics & Performance Insights
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
              Placement Readiness Report
            </h2>
          </div>

          <button className="btn-secondary" onClick={() => window.print()} style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <Download size={16} />
            Export Report (PDF)
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* Readiness Score */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Readiness Score</span>
            <Target size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c4b5fd' }}>{completionPercent}%</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Based on completed tasks</span>
        </div>

        {/* Active Streak */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Day</span>
            <Flame size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fcd34d' }}>Day {curriculumData?.current_day || 1}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active session tracker</span>
        </div>

        {/* Tasks Completed */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tasks Done</span>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6ee7b7' }}>{completedTasks} / {totalTasks}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roadmap tasks finished</span>
        </div>

        {/* Study Days Planned */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Planned Days</span>
            <Clock size={18} color="var(--secondary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#67e8f9' }}>{days.length || sessionState?.interpreted_intent?.preparation_duration_days || 0} Days</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preparation duration</span>
        </div>

      </div>

      {/* Target Companies Readiness Status */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Target Company Coverage</h3>

      {targetCompanies.length === 0 ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          No target companies configured in current session state.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {targetCompanies.map((company) => (
            <div key={company} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700 }}>{company}</span>
                <span style={{ fontWeight: 700, color: '#c4b5fd' }}>{completionPercent}% Covered</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)' }}>
                <div style={{ width: `${completionPercent}%`, height: '100%', background: 'var(--primary)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
