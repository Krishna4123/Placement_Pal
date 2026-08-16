import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/* ─── Dot Loader ─────────────────────────────────────────── */
export const AILoader: React.FC<{ size?: 'sm' | 'md'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const reduced = useReducedMotion();
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  if (reduced) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${dotSize} rounded-full bg-blue-500`} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${dotSize} rounded-full bg-blue-500`}
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

/* ─── AI Processing Banner ────────────────────────────────── */
export const AIProcessing: React.FC<{ label?: string; className?: string }> = ({
  label = 'AI is processing…',
  className = '',
}) => {
  const reduced = useReducedMotion();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div
        animate={reduced ? {} : { rotate: [0, 360] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        className="text-blue-500 shrink-0"
      >
        <Sparkles className="w-4 h-4" />
      </motion.div>
      <span className="text-sm text-muted-foreground">{label}</span>
      <AILoader size="sm" />
    </div>
  );
};

/* ─── AI Scanning Steps ───────────────────────────────────── */
interface ScanStep {
  label: string;
  done: boolean;
  active: boolean;
}

export const AIScanning: React.FC<{ steps: ScanStep[]; className?: string }> = ({
  steps,
  className = '',
}) => {
  const reduced = useReducedMotion();

  return (
    <div className={`space-y-2 ${className}`}>
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={reduced ? {} : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15, duration: 0.4 }}
          className={`flex items-center gap-2.5 text-sm ${
            step.done
              ? 'text-green-600'
              : step.active
              ? 'text-blue-600 font-medium'
              : 'text-muted-foreground'
          }`}
        >
          {step.done ? (
            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg className="w-2.5 h-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : step.active ? (
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-blue-500 shrink-0"
              animate={reduced ? {} : { rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ borderTopColor: 'transparent' }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
          )}
          <span>{step.label}</span>
          {step.active && <AILoader size="sm" className="ml-auto" />}
        </motion.div>
      ))}
    </div>
  );
};
