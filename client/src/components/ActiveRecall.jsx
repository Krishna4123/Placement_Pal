import React, { useState } from 'react';
import { Brain, HelpCircle, Eye, CheckCircle2, RotateCcw, Award, Sparkles, ChevronRight, ThumbsUp } from 'lucide-react';

const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    topic: 'Dynamic Programming',
    question: 'What is the core difference between Top-Down Memoization and Bottom-Up Tabulation?',
    answer: 'Memoization solves the problem recursively starting from the main target and caches subproblem results. Tabulation solves subproblems iteratively starting from smallest base cases to build up the solution table.',
    difficulty: 'Medium',
    question_type: 'Conceptual Pattern',
  },
  {
    id: 'q2',
    topic: 'Dynamic Programming',
    question: 'How do you identify the 0/1 Knapsack pattern in a coding interview problem?',
    answer: 'Given a set of items with weights and values, choose a subset to maximize total value without exceeding capacity limit. Each item can be chosen AT MOST ONCE (0 or 1).',
    difficulty: 'Medium',
    question_type: 'Pattern Identification',
  },
  {
    id: 'q3',
    topic: 'System Design',
    question: 'Explain how Consistent Hashing solves server re-mapping issues in distributed caching.',
    answer: 'Consistent Hashing maps both servers and keys onto a virtual hash ring (0 to 2^32-1). When a server node is added or removed, only k/n keys need to be remapped on average rather than all keys.',
    difficulty: 'Hard',
    question_type: 'System Architecture',
  },
  {
    id: 'q4',
    topic: 'System Design',
    question: 'What are the trade-offs between SQL (Relational) and NoSQL (Document/KV) databases?',
    answer: 'SQL guarantees ACID compliance and structured schemas (ideal for financial transactions), but scales vertically. NoSQL scales horizontally, handles unstructured data, and offers high read/write throughput (BASE model).',
    difficulty: 'Easy',
    question_type: 'Database Fundamentals',
  },
];

export default function ActiveRecall({ recallData }) {
  const questionsList = recallData?.recall_questions?.flatMap((group) =>
    (group.questions || []).map((q) => ({ ...q, topic: group.topic || 'General Tech' }))
  ) || DEFAULT_QUESTIONS;

  const [selectedTopic, setSelectedTopic] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  const filteredQuestions = selectedTopic === 'All'
    ? questionsList
    : questionsList.filter((q) => q.topic === selectedTopic);

  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0] || DEFAULT_QUESTIONS[0];

  const handleNext = (confidence) => {
    if (confidence === 'easy') {
      setMasteredCount((prev) => prev + 1);
    }
    setIsRevealed(false);
    setCurrentIndex((prev) => (prev + 1) % filteredQuestions.length);
  };

  const topicsList = ['All', ...new Set(questionsList.map((q) => q.topic))];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '880px', margin: '20px auto', padding: '0 20px' }}>

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', textAlign: 'center' }}>
        <div className="badge badge-purple" style={{ marginBottom: '8px' }}>
          <Brain size={14} /> Active Recall & Spaced Repetition
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0' }}>
          Master Placement Flashcards
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Testing yourself with active recall is proven to double long-term memory retention for technical interviews.
        </p>

        {/* Mastered Counter Pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 16px', borderRadius: 'var(--radius-full)', color: '#6ee7b7', fontWeight: 600, fontSize: '0.85rem' }}>
          <Award size={16} /> Flashcards Mastered Today: {masteredCount} / {filteredQuestions.length}
        </div>
      </div>

      {/* Topic Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '28px' }}>
        {topicsList.map((topic) => (
          <button
            key={topic}
            onClick={() => {
              setSelectedTopic(topic);
              setCurrentIndex(0);
              setIsRevealed(false);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: selectedTopic === topic ? 600 : 500,
              border: selectedTopic === topic ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              background: selectedTopic === topic ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
              color: selectedTopic === topic ? '#c4b5fd' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Main Flashcard Container */}
      <div className="glass-panel" style={{ padding: '36px', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 0 30px rgba(139, 92, 246, 0.15)' }}>

        {/* Card Top Metadata */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span className="badge badge-cyan">{currentQ.topic || 'Practice Question'}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-purple">{currentQ.question_type || 'Interview Q'}</span>
              <span className={`badge ${currentQ.difficulty === 'Hard' ? 'badge-rose' : 'badge-amber'}`}>
                {currentQ.difficulty || 'Medium'}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
            <HelpCircle size={24} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: '1.4', margin: 0 }}>
              {currentQ.question}
            </h3>
          </div>

          {/* Solution Explanation (Revealed State) */}
          {isRevealed && (
            <div className="animate-fade-in" style={{ background: 'rgba(0,0,0,0.3)', borderLeft: '4px solid var(--accent-emerald)', padding: '20px', borderRadius: 'var(--radius-md)', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#6ee7b7', marginBottom: '8px' }}>
                <CheckCircle2 size={18} /> Official Solution & Key Insights:
              </div>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-main)', lineHeight: '1.6', margin: 0 }}>
                {currentQ.answer}
              </p>
            </div>
          )}
        </div>

        {/* Card Bottom Controls */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Card {currentIndex + 1} of {filteredQuestions.length}
          </span>

          {!isRevealed ? (
            <button
              onClick={() => setIsRevealed(true)}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.95rem' }}
            >
              <Eye size={18} />
              Reveal Answer
            </button>
          ) : (
            /* Self Rating Confidence Buttons */
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleNext('hard')}
                className="btn-secondary"
                style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fca5a5', borderColor: 'rgba(244, 63, 94, 0.4)' }}
              >
                Hard (Repeat)
              </button>

              <button
                onClick={() => handleNext('medium')}
                className="btn-secondary"
                style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                Medium
              </button>

              <button
                onClick={() => handleNext('easy')}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <ThumbsUp size={16} />
                Easy (Got It!)
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
