import React from 'react';
import { Database, Globe, Code2, Terminal, BookOpen, ArrowRight } from 'lucide-react';

export const SubjectAttendanceCard = ({ subjects = [], onViewAll }) => {
  const displaySubjects = subjects;

  const totalCount = displaySubjects.length;
  const aboveTargetCount = displaySubjects.filter((s) => (s.percentage || 0) >= 75).length;

  const getSubjectIcon = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('data') || lower.includes('dbms') || lower.includes('database')) return Database;
    if (lower.includes('web') || lower.includes('network') || lower.includes('internet')) return Globe;
    if (lower.includes('software') || lower.includes('engineering') || lower.includes('system')) return Code2;
    if (lower.includes('algo') || lower.includes('code') || lower.includes('python') || lower.includes('java')) return Terminal;
    return BookOpen;
  };

  return (
    <div
      style={{
        background: 'rgba(13, 17, 30, 0.65)',
        border: '1px solid rgba(120, 170, 255, 0.14)',
        borderRadius: '16px',
        padding: '1.4rem 1.6rem',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        width: '100%'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.4rem'
        }}
      >
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#EAEEF7',
          letterSpacing: '0.01em'
        }}>
          Attendance by Subject
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#3FD8E0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>View details</span>
            <ArrowRight size={14} color="#3FD8E0" />
          </button>
        )}
      </div>

      {/* Grid: Left side subject bars, Right side Futuristic Radial Visualization */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1.8fr) minmax(220px, 1fr)',
          gap: '2rem',
          alignItems: 'center'
        }}
      >
        {/* Left Column: Horizontal Progress Bars matching reference image */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {displaySubjects.length === 0 ? (
            <div style={{ color: '#8A93A8', fontFamily: "'Inter', sans-serif", fontSize: '0.9rem' }}>
              No subject attendance data yet.
            </div>
          ) : displaySubjects.map((subj, idx) => {
            const pct = Math.min(100, Math.max(0, Math.round(subj.percentage || 0)));
            const Icon = getSubjectIcon(subj.subject_name);

            return (
              <div
                key={subj.subject_id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                {/* Subject Icon */}
                <div style={{
                  width: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3FD8E0',
                  flexShrink: 0
                }}>
                  <Icon size={18} color="#3FD8E0" />
                </div>

                {/* Subject Name */}
                <div
                  style={{
                    width: '170px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#EAEEF7',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flexShrink: 0
                  }}
                >
                  {subj.subject_name}
                </div>

                {/* Horizontal Neon Progress Bar */}
                <div
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: '100px',
                      background: 'linear-gradient(90deg, #4E8CFF, #3FD8E0)',
                      boxShadow: '0 0 10px rgba(63, 216, 224, 0.5)',
                      transition: 'width 0.6s ease'
                    }}
                  />
                </div>

                {/* Right Percentage */}
                <div
                  style={{
                    width: '45px',
                    textAlign: 'right',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#3FD8E0',
                    flexShrink: 0
                  }}
                >
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Futuristic Radial Visualization matching reference image */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            paddingLeft: '1rem',
            borderLeft: '1px solid rgba(120, 170, 255, 0.1)'
          }}
        >
          {/* Futuristic Radial Radar Visualization */}
          <div style={{ position: 'relative', width: '170px', height: '170px' }}>
            <svg width="170" height="170" viewBox="0 0 170 170">
              {/* Outer thin radar circle */}
              <circle cx="85" cy="85" r="78" fill="none" stroke="rgba(120, 170, 255, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Secondary radar track */}
              <circle cx="85" cy="85" r="66" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="8" />

              {/* Purple Secondary Arc (Background Accent) */}
              <circle
                cx="85"
                cy="85"
                r="66"
                fill="none"
                stroke="#8C7CF0"
                strokeWidth="8"
                strokeDasharray="414"
                strokeDashoffset="120"
                strokeLinecap="round"
                transform="rotate(135 85 85)"
                opacity="0.6"
              />

              {/* Cyan Primary Arc (Glowing Main Progress Arc) */}
              <circle
                cx="85"
                cy="85"
                r="66"
                fill="none"
                stroke="#3FD8E0"
                strokeWidth="9"
                strokeDasharray="414"
                strokeDashoffset={414 - (aboveTargetCount / (totalCount || 1)) * 310}
                strokeLinecap="round"
                transform="rotate(-90 85 85)"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(63, 216, 224, 0.8))',
                  transition: 'stroke-dashoffset 0.8s ease'
                }}
              />

              {/* Inner thin technical ring */}
              <circle cx="85" cy="85" r="50" fill="none" stroke="rgba(63, 216, 224, 0.25)" strokeWidth="1" strokeDasharray="2 4" />

              {/* Tick marks on 4 axes */}
              <line x1="85" y1="9" x2="85" y2="15" stroke="#3FD8E0" strokeWidth="2" opacity="0.7" />
              <line x1="85" y1="155" x2="85" y2="161" stroke="#3FD8E0" strokeWidth="2" opacity="0.7" />
              <line x1="9" y1="85" x2="15" y2="85" stroke="#3FD8E0" strokeWidth="2" opacity="0.7" />
              <line x1="155" y1="85" x2="161" y2="85" stroke="#3FD8E0" strokeWidth="2" opacity="0.7" />
            </svg>

            {/* Center Count Text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#EAEEF7',
                  lineHeight: 1
                }}
              >
                {aboveTargetCount}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8rem',
                  color: '#8A93A8',
                  marginTop: '0.15rem'
                }}
              >
                of {totalCount}
              </div>
            </div>
          </div>

          {/* Bottom Caption */}
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.88rem',
              fontWeight: 600,
              color: '#EAEEF7',
              textAlign: 'center',
              letterSpacing: '0.01em'
            }}
          >
            Subjects above 75%
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectAttendanceCard;
