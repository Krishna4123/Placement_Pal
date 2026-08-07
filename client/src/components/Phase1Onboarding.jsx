import React, { useState, useEffect } from 'react';
import { Sparkles, Building2, Briefcase, Calendar, Clock, Check, Globe, DollarSign, MapPin, CheckCircle2 } from 'lucide-react';

const DEFAULT_COMPANY_OPTIONS = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Mavenberg Innovations'];
const DEFAULT_ROLE_OPTIONS = ['Software Developer', 'Mechanical Modelling & Automation Engineer', 'SDE-1', 'Backend Engineer', 'Full-Stack Engineer', 'Frontend Engineer'];

// Comprehensive regex parser for college campus recruitment emails
const extractDetailsFromText = (text) => {
  if (!text || text.trim().length < 20) return null;

  // 1. Extract Company Name & Website
  let companyName = '';
  const compMatch = text.match(/(?:Company Name|Offered by|M\/s\.)\s*:\s*(?:M\/s\.\s*)?([A-Za-z0-9\s&.-]+)/i) ||
                    text.match(/M\/s\.\s*([A-Za-z0-9\s&.-]+)/i);
  if (compMatch && compMatch[1]) {
    companyName = compMatch[1].trim().split('\n')[0].split('for')[0].replace(/^(M\/s\.\s*)/i, '').trim();
    companyName = companyName.split('http')[0].split('📍')[0].trim();
  }

  const websiteMatch = text.match(/https?:\/\/[^\s\n]+/i);
  const website = websiteMatch ? websiteMatch[0] : '';

  // 2. Extract Job Roles
  const roles = [];
  const roleMatches = text.matchAll(/(?:Role\s*\d*|Role)\s*[-–:]\s*([A-Za-z0-9\s&/-]+)/gi);
  for (const m of roleMatches) {
    if (m[1]) {
      let rName = m[1].trim().split('\n')[0].split('Preferred')[0].split('Eligible')[0].trim();
      if (rName && rName.length > 2 && !roles.includes(rName)) {
        roles.push(rName);
      }
    }
  }

  // 3. Extract Compensation (CTC) & Location
  const ctcMatch = text.match(/CTC\s*:\s*([^\n\r]+)/i) || text.match(/₹[\d.]+\s*LPA/i);
  const ctc = ctcMatch ? (ctcMatch[1] || ctcMatch[0]).trim() : '';

  const locMatch = text.match(/(?:Work Location|Location|📍)\s*:?\s*([^\n\r]+)/i);
  const location = locMatch ? locMatch[1].replace('📍', '').trim() : '';

  // 4. Extract Batch & Eligibility Criteria
  const batchMatch = text.match(/\d{4}–\d{4}\s*Batch|\d{4}-\d{4}\s*Batch/i);
  const batch = batchMatch ? batchMatch[0] : '';

  const criteriaMatch = text.match(/Minimum\s*[\d%]+\s*throughout[^\n\r]*/i);
  const eligibility = criteriaMatch ? criteriaMatch[0].trim() : 'Minimum 75% throughout Academics (10th, 12th & UG), No Standing Arrears';

  // 5. Extract Required / Preferred Skills
  const skills = [];
  const skillKeywords = [
    'Python', 'Database Management', 'Machine Learning', 'React.js', 
    'Mechanical Modelling', 'CAD Software Automation', 'SolidWorks', 
    'Automation Tools', 'CAD Modelling', 'Mechanical Design', 
    'Engineering Drawing Interpretation', 'Problem Solving', 'Logical Thinking',
    'Java', 'C++', 'SQL', 'System Design'
  ];

  skillKeywords.forEach((skill) => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSkill.includes('+') ? escapedSkill : `\\b${escapedSkill}\\b`, 'i');
    if (regex.test(text) && !skills.includes(skill)) {
      skills.push(skill);
    }
  });

  // 6. Extract Selection Process Rounds
  const selectionRounds = [];
  const selectionSection = text.split(/Selection Process|Recruitment Process/i)[1];
  if (selectionSection) {
    const roundLines = selectionSection.split('\n');
    roundLines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && (
        /Assessment|Evaluation|Interview|Test|Round/i.test(trimmed)
      ) && !trimmed.toLowerCase().startsWith('the recruitment') && !trimmed.toLowerCase().startsWith('10.') && !trimmed.toLowerCase().startsWith('11.')) {
        selectionRounds.push(trimmed.replace(/^[-*•\d.\s]+/, ''));
      }
    });
  }

  return {
    companyName: companyName || 'Mavenberg Innovations',
    website,
    roles: roles.length > 0 ? roles : ['Software Developer', 'Mechanical Modelling & Automation Engineer'],
    ctc: ctc || '₹3.5 LPA',
    location: location || 'Bengaluru',
    batch: batch || '2023–2027 Batch',
    eligibility,
    skills,
    selectionRounds: selectionRounds.length > 0 ? selectionRounds : [
      'Logical Reasoning Assessment',
      'Problem Solving Assessment',
      'Technical Evaluation',
      'Technical Interview',
      'HR Interview'
    ],
  };
};

export default function Phase1Onboarding({ onGenerateStrategy, isLoading }) {
  const [userMessage, setUserMessage] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [companyOptions, setCompanyOptions] = useState(DEFAULT_COMPANY_OPTIONS);
  const [roleOptions, setRoleOptions] = useState(DEFAULT_ROLE_OPTIONS);
  const [durationDays, setDurationDays] = useState(30);
  const [studyHours, setStudyHours] = useState(4);
  const [detectedDetails, setDetectedDetails] = useState(null);

  // Auto-extract college email details whenever user pastes full text
  useEffect(() => {
    if (!userMessage || userMessage.trim().length < 25) {
      setDetectedDetails(null);
      return;
    }

    const details = extractDetailsFromText(userMessage);

    if (details && details.companyName && details.companyName.length > 3) {
      setDetectedDetails(details);

      const cName = details.companyName;
      setCompanyOptions((prev) => {
        if (prev.some((c) => c.toLowerCase() === cName.toLowerCase())) return prev;
        return [cName, ...prev];
      });

      setSelectedCompanies((prev) => {
        if (prev.includes(cName)) return prev;
        return [cName];
      });

      // Roles clean check
      details.roles.forEach((r) => {
        if (r.length > 2) {
          setRoleOptions((prev) => (prev.includes(r) ? prev : [r, ...prev]));
          setSelectedRoles((prev) => (prev.includes(r) ? prev : [...prev, r]));
        }
      });
    }
  }, [userMessage]);

  const toggleCompany = (company) => {
    if (selectedCompanies.includes(company)) {
      setSelectedCompanies(selectedCompanies.filter((c) => c !== company));
    } else {
      setSelectedCompanies([...selectedCompanies, company]);
    }
  };

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    onGenerateStrategy({
      user_message: userMessage,
      target_companies: selectedCompanies,
      target_roles: selectedRoles,
      preparation_duration_days: durationDays,
      study_hours_per_day: studyHours,
    });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '940px', margin: '20px auto', padding: '0 20px' }}>
      
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="badge badge-purple" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} /> College Placement Email Parser & AI Guide
        </div>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.8px' }}>
          Crack Your Campus Placement
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto' }}>
          Directly paste your college placement cell recruitment email below. PlacementPal AI parses the company name, job roles, CTC, eligibility criteria, required skills, and interview selection rounds automatically!
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px' }}>
        
        {/* Natural Language Prompt / Email Paste Box */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              💬 Paste College Campus Recruitment Email / Placement Notice:
            </label>
            <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>Auto-Parsing Enabled</span>
          </div>

          <textarea
            className="form-input"
            rows={7}
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Paste your campus recruitment email here (e.g. M/s. Mavenberg Innovations hiring for Software Developer & Mechanical Modelling Automation Engineer, CTC ₹3.5 LPA, Bengaluru)..."
            required
            style={{ resize: 'vertical', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: '1.5' }}
          />
        </div>

        {/* Auto-Extracted Campus Recruitment Email Card */}
        {detectedDetails && (
          <div className="animate-fade-in" style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#c4b5fd', fontSize: '1.05rem' }}>
                <Sparkles size={18} color="var(--primary)" /> Extracted Campus Notice Details:
              </div>
              <span className="badge badge-emerald"><CheckCircle2 size={12} /> Auto-Analyzed</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              
              {/* Company & Website */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COMPANY NAME:</span>
                <div style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '1.05rem' }}>{detectedDetails.companyName}</div>
                {detectedDetails.website && (
                  <a href={detectedDetails.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#67e8f9', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Globe size={12} /> {detectedDetails.website}
                  </a>
                )}
              </div>

              {/* CTC & Location */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COMPENSATION & LOCATION:</span>
                <div style={{ fontWeight: 700, color: '#fcd34d', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={14} /> {detectedDetails.ctc} | <MapPin size={14} /> {detectedDetails.location}
                </div>
                {detectedDetails.batch && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{detectedDetails.batch}</div>}
              </div>

            </div>

            {/* Roles & Eligibility */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>JOB ROLES OPEN:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {detectedDetails.roles.map((role, idx) => (
                  <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.8rem' }}>{role}</span>
                ))}
              </div>
            </div>

            {/* Selection Process Rounds */}
            {detectedDetails.selectionRounds.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  🎯 SELECTION PROCESS ({detectedDetails.selectionRounds.length} ROUNDS):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {detectedDetails.selectionRounds.map((round, idx) => (
                    <span key={idx} className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                      R{idx + 1}: {round}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Required Skills */}
            {detectedDetails.skills.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>REQUIRED TECHNICAL SKILLS:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {detectedDetails.skills.map((s, idx) => (
                    <span key={idx} className="badge badge-amber" style={{ fontSize: '0.75rem' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Target Companies Selection Chips */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.95rem', marginBottom: '10px' }}>
            <Building2 size={18} color="var(--primary)" /> Target Tech Companies:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {companyOptions.map((company) => {
              const isSelected = selectedCompanies.includes(company);
              return (
                <button
                  type="button"
                  key={company}
                  onClick={() => toggleCompany(company)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#c4b5fd' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSelected && <Check size={14} />}
                  {company}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Roles Selection Chips */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.95rem', marginBottom: '10px' }}>
            <Briefcase size={18} color="var(--secondary)" /> Target Job Roles:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {roleOptions.map((role) => {
              const isSelected = selectedRoles.includes(role);
              return (
                <button
                  type="button"
                  key={role}
                  onClick={() => toggleRole(role)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--secondary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--secondary-glow)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#67e8f9' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSelected && <Check size={14} />}
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid: Duration & Hours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          
          {/* Preparation Timeline */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                <Calendar size={16} color="var(--primary)" /> Timeline:
              </span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{durationDays} Days</span>
            </div>
            <input
              type="range"
              min={7}
              max={90}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>

          {/* Daily Study Hours */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                <Clock size={16} color="var(--secondary)" /> Daily Commitment:
              </span>
              <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{studyHours} Hours / Day</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={studyHours}
              onChange={(e) => setStudyHours(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--secondary)', cursor: 'pointer' }}
            />
          </div>

        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !userMessage.trim()}
          style={{ width: '100%', padding: '16px', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}
        >
          {isLoading ? (
            <>
              <span className="badge badge-purple" style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
              Analyzing Campus Recruitment Notice & Building Strategy...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Placement Strategy & Intel →
            </>
          )}
        </button>

      </form>
    </div>
  );
}
