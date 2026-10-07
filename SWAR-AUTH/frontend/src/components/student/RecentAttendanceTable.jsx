import React from 'react';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export const RecentAttendanceTable = ({ history = [], onViewAll }) => {
  const displayHistory = history.slice(0, 4);

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
          marginBottom: '1.2rem'
        }}
      >
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#EAEEF7',
          letterSpacing: '0.01em'
        }}>
          Recent Attendance
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

      {/* Dark SaaS Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(120, 170, 255, 0.14)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', fontFamily: "'IBM Plex Mono', monospace", color: '#3FD8E0', fontWeight: 600, width: '25%' }}>
                DATE
              </th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', fontFamily: "'IBM Plex Mono', monospace", color: '#3FD8E0', fontWeight: 600, width: '55%' }}>
                SUBJECT
              </th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', fontFamily: "'IBM Plex Mono', monospace", color: '#3FD8E0', fontWeight: 600, width: '20%', textAlign: 'center' }}>
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {displayHistory.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '1rem', color: '#8A93A8', textAlign: 'center' }}>
                  No attendance records yet.
                </td>
              </tr>
            ) : displayHistory.map((rec, idx) => {
              const isPresent = (rec.status || 'present').toLowerCase() === 'present';

              return (
                <tr
                  key={rec.id || idx}
                  style={{
                    borderBottom: idx === displayHistory.length - 1 ? 'none' : '1px solid rgba(120, 170, 255, 0.07)',
                    transition: 'background 120ms ease'
                  }}
                >
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.88rem', color: '#8A93A8', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {rec.date}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.92rem', color: '#EAEEF7', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {rec.subject_name || rec.subject_id}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: `1.5px solid ${isPresent ? '#10b981' : '#ef4444'}`,
                        background: 'rgba(16, 185, 129, 0.08)'
                      }}
                    >
                      {isPresent ? (
                        <CheckCircle2 size={16} color="#10b981" strokeWidth={2.5} />
                      ) : (
                        <XCircle size={16} color="#ef4444" strokeWidth={2.5} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentAttendanceTable;
