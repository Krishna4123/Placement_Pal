import React from 'react';
import { 
  Sparkles, 
  Calendar, 
  BrainCircuit, 
  FolderKanban, 
  BarChart3, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, sessionState, onResetSession }) {
  const navItems = [
    { id: 'onboarding', label: 'AI Strategy', icon: Sparkles },
    { id: 'dashboard', label: 'Company Intel', icon: BrainCircuit, disabled: !sessionState?.phase1Complete },
    { id: 'roadmap', label: 'Daily Roadmap', icon: Calendar, disabled: !sessionState?.phase2Complete },
    { id: 'recall', label: 'Active Recall', icon: CheckCircle2, disabled: !sessionState?.phase2Complete },
    { id: 'vault', label: 'Knowledge Vault', icon: FolderKanban },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, disabled: !sessionState?.phase2Complete },
  ];

  return (
    <header className="glass-panel" style={{ margin: '16px 24px', padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('onboarding')}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              PlacementPal
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AI Placement Assistant
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.id}
                disabled={isDisabled}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#fff' : isDisabled ? '#4b5563' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isDisabled ? 0.5 : 1
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Status Indicator & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            API Connected
          </div>

          <button 
            className="btn-secondary" 
            onClick={onResetSession}
            title="Reset Session Goal"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>

      </div>
    </header>
  );
}
