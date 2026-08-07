import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FastForward,
  Flame,
  PlayCircle,
  Sparkles,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function DailyRoadmap({ curriculumData, onMarkTask, onAdvanceDay }) {
  const curriculum = curriculumData?.curriculum || { days: [] };
  const days = curriculum.days || [];

  const [selectedDayNum, setSelectedDayNum] = useState(curriculumData?.current_day || 1);

  const activeDayObj = days.find((d) => d.day_number === selectedDayNum) || days[0] || {
    day_number: 1,
    theme: 'Arrays & Dynamic Programming Foundations',
    tasks: [],
  };

  // Calculate overall stats
  let totalTasks = 0;
  let completedTasks = 0;
  days.forEach((d) => {
    (d.tasks || []).forEach((t) => {
      totalTasks++;
      if (t.status === 'done') completedTasks++;
    });
  });

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 15;

  const handleTaskStatusChange = (taskId, newStatus) => {
    if (onMarkTask) {
      onMarkTask(taskId, newStatus);
    }
  };

  const handleNextDay = () => {
    const nextDay = Math.min(selectedDayNum + 1, days.length || 30);
    setSelectedDayNum(nextDay);
    if (onAdvanceDay) onAdvanceDay(nextDay);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1040px', margin: '20px auto', padding: '0 20px' }}>

      {/* Progress & Milestone Header */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-purple"><Flame size={14} /> 4 Day Streak</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Day {selectedDayNum} of {days.length || 30}</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
              Personalized Placement Study Plan
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Progress</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#67e8f9' }}>{progressPercent}%</div>
            </div>

            <button
              onClick={handleNextDay}
              className="btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.9rem' }}
            >
              <FastForward size={16} />
              Advance Day
            </button>
          </div>

        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Day Selector Pills Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
        {days.slice(0, 30).map((d) => {
          const dayNum = d.day_number;
          const isSelected = dayNum === selectedDayNum;
          const isCompleted = (d.tasks || []).every((t) => t.status === 'done') && (d.tasks || []).length > 0;

          return (
            <button
              key={dayNum}
              onClick={() => setSelectedDayNum(dayNum)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: isSelected ? 700 : 500,
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                background: isSelected ? 'var(--primary-glow)' : 'var(--bg-card)',
                color: isSelected ? '#c4b5fd' : isCompleted ? '#6ee7b7' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Day {dayNum} {isCompleted && '✓'}
            </button>
          );
        })}
      </div>

      {/* Active Day Plan Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span className="badge badge-cyan"><Calendar size={14} /> Day {selectedDayNum} Theme</span>
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
          {activeDayObj.theme || `Day ${selectedDayNum} Focus Tasks`}
        </h3>
      </div>

      {/* Daily Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        {(activeDayObj.tasks || []).map((task) => {
          const isDone = task.status === 'done';
          const isInProgress = task.status === 'in_progress';
          const isSkipped = task.status === 'skipped';

          return (
            <div
              key={task.task_id}
              className="glass-panel"
              style={{
                padding: '20px',
                opacity: isSkipped ? 0.6 : 1,
                borderLeft: isDone ? '4px solid var(--accent-emerald)' : isInProgress ? '4px solid var(--accent-amber)' : '4px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className={`badge ${task.difficulty === 'hard' ? 'badge-rose' : task.difficulty === 'medium' ? 'badge-amber' : 'badge-emerald'}`}>
                      {task.difficulty || 'medium'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {task.estimated_minutes || 30} mins
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, textDecoration: isDone ? 'line-through' : 'none' }}>
                    {task.title}
                  </h4>
                </div>

                {/* Status Toggle Buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleTaskStatusChange(task.task_id, 'done')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: isDone ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
                      color: isDone ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={14} /> Done
                  </button>

                  <button
                    onClick={() => handleTaskStatusChange(task.task_id, 'in_progress')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: isInProgress ? 'var(--accent-amber)' : 'rgba(255,255,255,0.05)',
                      color: isInProgress ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <PlayCircle size={14} /> Doing
                  </button>

                  <button
                    onClick={() => handleTaskStatusChange(task.task_id, 'skipped')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: isSkipped ? 'var(--text-dim)' : 'rgba(255,255,255,0.05)',
                      color: isSkipped ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <XCircle size={14} /> Skip
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {task.description}
              </p>

              {task.resource_url && (
                <a
                  href={task.resource_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: '#67e8f9',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <ExternalLink size={14} /> Open Study Guide / LeetCode Resource
                </a>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
