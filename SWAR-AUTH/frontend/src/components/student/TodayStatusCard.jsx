import React from 'react';
import { CheckCircle2, Calendar, Radio } from 'lucide-react';

export const TodayStatusCard = ({ activeSessions = [], history = [] }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttended = history.some((rec) => rec.date === todayStr || rec.date === new Date().toLocaleDateString('en-GB'));
  const hasActiveSession = activeSessions.length > 0;

  let statusTitle = 'No classes currently active';
  let statusSub = 'Check back during scheduled lecture hours.';
  let iconComponent = <CheckCircle2 size={24} color="#10b981" strokeWidth={2} />;

  if (hasActiveSession) {
    statusTitle = 'Attendance session active';
    statusSub = activeSessions[0]?.subject_name || 'Live Class';
    iconComponent = <Radio size={24} color="#3FD8E0" strokeWidth={2} />;
  } else if (todayAttended) {
    statusTitle = 'Attendance marked today.';
    statusSub = 'Your attendance log is up to date.';
    iconComponent = <CheckCircle2 size={24} color="#10b981" strokeWidth={2} />;
  }

  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(13, 17, 30, 0.65)',
        border: '1px solid rgba(120, 170, 255, 0.14)',
        borderRadius: '16px',
        padding: '1.4rem 1.6rem',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        minWidth: '280px',
        overflow: 'hidden'
      }}
    >
      {/* Title */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#EAEEF7',
        letterSpacing: '0.01em',
        marginBottom: '1rem'
      }}>
        Today's Status
      </div>

      {/* Center Layout matching reference image */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          {/* Audio Wave Badge Container */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(63, 216, 224, 0.1)',
              border: '1px solid rgba(63, 216, 224, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(63, 216, 224, 0.15)',
              flexShrink: 0
            }}
          >
            {iconComponent}
          </div>

          {/* Status Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.08rem',
                fontWeight: 700,
                color: '#EAEEF7',
                lineHeight: 1.2
              }}
            >
              {statusTitle}
            </div>
            {statusSub && (
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.95rem',
                  color: hasActiveSession ? '#3FD8E0' : '#8A93A8',
                  fontWeight: 600
                }}
              >
                {statusSub}
              </div>
            )}
          </div>
        </div>

        {/* Right Calendar Pill Icon matching reference image */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(15, 22, 38, 0.8)',
            border: '1px solid rgba(120, 170, 255, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8A93A8'
          }}
        >
          <Calendar size={18} color="#8A93A8" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
};

export default TodayStatusCard;
