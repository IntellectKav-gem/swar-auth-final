/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Cursor Logic
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
      mx = e.clientX;
      my = e.clientY;
    };

    let mx = 0, my = 0, rx = 0, ry = 0;
    const animRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = `${rx}px`;
        cursorRingRef.current.style.top = `${ry}px`;
      }
      requestAnimationFrame(animRing);
    };
    animRing();

    window.addEventListener('mousemove', handleMouseMove);

    // Scroll Logic
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', window.scrollY > 60);
      }
      if (progressRef.current) {
        const progress = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        progressRef.current.style.width = `${progress}%`;
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Intersection Observer for animations
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('vis');
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('[data-scroll]').forEach((el) => io.observe(el));

    const io3d = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('vis');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-scroll-3d]').forEach((el) => io3d.observe(el));

    // WebGL Background
    const canvas = canvasRef.current;
    if (canvas) {
      const gl = canvas.getContext('webgl');
      if (gl) {
        const resize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        const vsSrc = `
          attribute vec2 a_pos;
          attribute float a_phase;
          uniform float u_time;
          varying vec2 v_uv;
          void main(){
            v_uv = a_pos * 0.5 + 0.5;
            gl_Position = vec4(a_pos, 0, 1);
          }
        `;
        const fsSrc = `
          precision mediump float;
          uniform float u_time;
          uniform vec2 u_res;
          varying vec2 v_uv;

          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main() {
            vec2 uv = v_uv;
            uv.x *= u_res.x / u_res.y;
            
            vec3 color = vec3(0.004, 0.006, 0.015);
            
            // Neural/Vocal mesh effect
            float t = u_time * 0.2;
            for(float i = 1.0; i < 6.0; i++) {
              vec2 p = uv;
              p.x += sin(p.y * 1.5 * i + t) * 0.15;
              p.y += cos(p.x * 1.5 * i + t) * 0.15;
              
              float dist = abs(p.y - 0.5 + sin(p.x * 3.0 + t) * 0.1);
              float line = smoothstep(0.015, 0.0, dist);
              
              vec3 lCol = i < 2.0 ? vec3(0.0, 0.96, 0.9) : 
                         (i < 3.0 ? vec3(0.61, 0.36, 0.9) : 
                         (i < 4.0 ? vec3(0.0, 0.72, 1.0) : vec3(0.97, 0.14, 0.51)));
              
              color += lCol * line * 0.12 / i;
            }
            
            // Add some "neural" pulses
            float pulse = smoothstep(0.4, 0.5, sin(u_time + uv.x * 10.0 + uv.y * 10.0));
            color += vec3(0.0, 0.96, 0.9) * pulse * 0.03;
            
            // Subtle grain
            color += noise(v_uv * u_time) * 0.015;
            
            gl_FragColor = vec4(color, 1.0);
          }
        `;

        const mkShader = (type: number, src: string) => {
          const s = gl.createShader(type)!;
          gl.shaderSource(s, src);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(s));
          }
          return s;
        };

        const prog = gl.createProgram()!;
        gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vsSrc));
        gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fsSrc));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        const pos = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uRes = gl.getUniformLocation(prog, 'u_res');

        let t0 = performance.now();
        const drawGL = () => {
          const t = (performance.now() - t0) / 1000;
          gl.uniform1f(uTime, t);
          gl.uniform2f(uRes, canvas.width, canvas.height);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          requestAnimationFrame(drawGL);
        };
        drawGL();

        return () => {
          window.removeEventListener('resize', resize);
        };
      }
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div id="cursor" ref={cursorRef}></div>
      <div id="cursor-ring" ref={cursorRingRef}></div>
      <div id="progress" ref={progressRef}></div>
      <div className="noise"></div>
      <canvas id="bg-canvas" ref={canvasRef}></canvas>

      <div className="page">
        <nav id="nav" ref={navRef}>
          <div className="nav-logo">
            <svg className="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="18" width="4" height="4" rx="2" fill="url(#logo-g)" />
              <rect x="12" y="12" width="4" height="16" rx="2" fill="url(#logo-g)" />
              <rect x="20" y="6" width="4" height="28" rx="2" fill="url(#logo-g)" />
              <rect x="28" y="14" width="4" height="12" rx="2" fill="url(#logo-g)" />
              <rect x="36" y="18" width="4" height="4" rx="2" fill="url(#logo-g)" />
              <defs>
                <linearGradient id="logo-g" x1="4" y1="6" x2="40" y2="34" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="var(--cyan)" />
                  <stop offset="100%" stopColor="var(--violet)" />
                </linearGradient>
              </defs>
            </svg>
            Swar-Auth
          </div>
          <ul className="nav-links">
            <li><a href="#platform">Platform</a></li>
            <li><a href="#technology">Technology</a></li>
            <li><a href="#enterprise">Enterprise</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
          <button className="nav-cta">Start Free Trial</button>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="eyebrow-line"></span>
            Neural Voice Security — Pure Sound Zero
            <span className="eyebrow-line"></span>
          </div>

          <h1 className="hero-title">
            <span className="line1">Your Voice.</span>
            <span className="line2">Zero Friction.</span>
          </h1>

          <p className="hero-sub">
            Military-grade vocal biometrics powered by transformer neural networks. Safeguarding victims from fraudsters with Pure Sound Zero technology.
          </p>

          <div className="hero-buttons">
            <button className="btn-glow">Start Voice Scan</button>
            <button className="btn-outline">Watch Demo →</button>
          </div>

          <div className="hero-ring-wrap">
            <svg className="ring-svg" viewBox="0 0 340 340" fill="none">
              <circle cx="170" cy="170" r="160" stroke="url(#rg1)" strokeWidth="1" strokeDasharray="6 14" opacity=".5" />
              <circle cx="170" cy="170" r="130" stroke="url(#rg2)" strokeWidth=".5" strokeDasharray="3 20" opacity=".4" />
              <defs>
                <linearGradient id="rg1" x1="0" y1="0" x2="340" y2="340" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00f5e4" />
                  <stop offset="50%" stopColor="#9b5de5" />
                  <stop offset="100%" stopColor="#00b8ff" />
                </linearGradient>
                <linearGradient id="rg2" x1="340" y1="0" x2="0" y2="340" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f72585" />
                  <stop offset="100%" stopColor="#00f5e4" />
                </linearGradient>
              </defs>
            </svg>
            <svg className="ring-svg2" viewBox="0 0 320 320" fill="none">
              <circle cx="160" cy="160" r="100" stroke="#00f5e4" strokeWidth=".5" strokeDasharray="2 8" opacity=".3" />
              <circle cx="160" cy="160" r="70" stroke="#9b5de5" strokeWidth=".5" strokeDasharray="4 12" opacity=".25" />
            </svg>
            <div className="ring-center">
              <svg className="mic-svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="24" y="12" width="16" height="24" rx="8" fill="url(#mic-g)" />
                <path d="M16 28C16 36.8366 23.1634 44 32 44C40.8366 44 48 36.8366 48 28" stroke="var(--cyan)" strokeWidth="3" strokeLinecap="round" />
                <rect x="30" y="44" width="4" height="8" fill="var(--cyan)" />
                <rect x="22" y="52" width="20" height="2" rx="1" fill="var(--cyan)" />
                <defs>
                  <linearGradient id="mic-g" x1="24" y1="12" x2="40" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="var(--cyan)" />
                    <stop offset="100%" stopColor="var(--violet)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="ring-status">Listening...</div>
              <div className="mini-wave">
                {[10, 14, 18, 22, 16, 20, 24, 18, 14, 10, 16, 22, 26, 22, 16].map((h, i) => (
                  <div
                    key={i}
                    className="mw-bar"
                    style={{
                      '--h': `${h}px`,
                      '--d': `${(0.7 + Math.random() * 0.6).toFixed(2)}s`,
                      '--dl': `${(i * 0.05).toFixed(2)}s`
                    } as React.CSSProperties}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="scroll-hint">
            <div className="scroll-mouse"></div>
            <span>Scroll to explore</span>
          </div>
        </section>

        {/* How It Works */}
        <section className="how" id="technology">
          <div className="section-tag" data-scroll>
            <span className="tag-line"></span>
            How It Works
          </div>
          <h2 className="section-title" data-scroll>
            Three steps.<br />Zero fraud.
          </h2>

          <div className="steps-grid">
            <div className="step-card" data-scroll style={{ '--dl': '.0s', '--card-glow': 'rgba(0,245,228,.06)', '--w': '88%' } as React.CSSProperties}>
              <div className="step-num">01</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="10" y="4" width="12" height="18" rx="6" fill="url(#ic1)" />
                  <path d="M6 16C6 21.5228 10.4772 26 16 26C21.5228 26 26 21.5228 26 16" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" />
                  <rect x="15" y="26" width="2" height="4" fill="var(--cyan)" />
                  <defs>
                    <linearGradient id="ic1" x1="10" y1="4" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="var(--cyan)" />
                      <stop offset="100%" stopColor="var(--cyan2)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="step-title">Speak Naturally</div>
              <div className="step-desc">Say any phrase — no PIN, no password. Our model analyzes over 140 distinct vocal biomarkers extracted from raw audio.</div>
              <div className="step-bar"><div className="step-bar-fill"></div></div>
            </div>
            <div className="step-card" data-scroll style={{ '--dl': '.15s', '--card-glow': 'rgba(155,93,229,.06)', '--w': '96%' } as React.CSSProperties}>
              <div className="step-num">02</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="10" stroke="url(#ic2)" strokeWidth="2" />
                  <circle cx="16" cy="16" r="4" fill="var(--violet)" />
                  <path d="M16 6V10M16 22V26M6 16H10M22 16H26" stroke="var(--violet)" strokeWidth="2" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="ic2" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="var(--violet)" />
                      <stop offset="100%" stopColor="var(--pink)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="step-title">Neural Analysis</div>
              <div className="step-desc">A 7-layer transformer processes spectral, prosodic, and articulatory features simultaneously in under 180ms.</div>
              <div className="step-bar"><div className="step-bar-fill" style={{ background: 'linear-gradient(90deg,var(--violet),var(--cyan2))' }}></div></div>
            </div>
            <div className="step-card" data-scroll style={{ '--dl': '.3s', '--card-glow': 'rgba(0,184,255,.06)', '--w': '74%' } as React.CSSProperties}>
              <div className="step-num">03</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4L26 8V16C26 21.5228 21.5228 26 16 28C10.4772 26 6 21.5228 6 16V8L16 4Z" fill="url(#ic3)" />
                  <path d="M12 16L15 19L20 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="ic3" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="var(--cyan2)" />
                      <stop offset="100%" stopColor="var(--cyan)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="step-title">Instant Access</div>
              <div className="step-desc">A cryptographically signed decision unlocks your system. Every session is tamper-evident and audit-logged.</div>
              <div className="step-bar"><div className="step-bar-fill" style={{ background: 'linear-gradient(90deg,#4cff91,var(--cyan))' }}></div></div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="dashboard-sec" id="platform">
          <div className="section-tag" data-scroll style={{ justifyContent: 'center' }}>
            <span className="tag-line"></span>
            Live Dashboard
            <span className="tag-line"></span>
          </div>
          <h2 className="section-title" data-scroll style={{ textAlign: 'center', marginBottom: '48px' }}>
            Command center.
          </h2>

          <div className="dash-wrap">
            <div className="dash-card" data-scroll-3d>
              <div className="dash-topbar">
                <div className="dash-dot"></div>
                <div className="dash-dot"></div>
                <div className="dash-dot"></div>
                <div className="dash-title-bar">Swar-Auth Dashboard — Live Session</div>
              </div>
              <div className="dash-body">
                <div className="dash-sidebar">
                  <div className="sidebar-item active">
                    <svg className="side-icon" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="12" width="4" height="8" rx="1" fill="url(#sg1)" />
                      <rect x="10" y="8" width="4" height="12" rx="1" fill="url(#sg1)" />
                      <rect x="16" y="4" width="4" height="16" rx="1" fill="url(#sg1)" />
                      <defs><linearGradient id="sg1" x1="4" y1="4" x2="20" y2="20"><stop offset="0%" stopColor="var(--cyan)" /><stop offset="100%" stopColor="var(--cyan2)" /></linearGradient></defs>
                    </svg>
                    Overview
                  </div>
                  <div className="sidebar-item">
                    <svg className="side-icon" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="4" width="6" height="10" rx="3" fill="url(#sg2)" />
                      <path d="M5 12C5 15.866 8.134 19 12 19C15.866 19 19 15.866 19 12" stroke="var(--violet)" strokeWidth="2" strokeLinecap="round" />
                      <defs><linearGradient id="sg2" x1="9" y1="4" x2="15" y2="14"><stop offset="0%" stopColor="var(--violet)" /><stop offset="100%" stopColor="var(--pink)" /></linearGradient></defs>
                    </svg>
                    Voice Profiles
                  </div>
                  <div className="sidebar-item">
                    <svg className="side-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4L19 7V12C19 16.284 16.284 19.5 12 20.5C7.716 19.5 4.5 16.284 4.5 12V7L12 4Z" fill="url(#sg3)" />
                      <defs><linearGradient id="sg3" x1="4.5" y1="4" x2="19" y2="20.5"><stop offset="0%" stopColor="var(--pink)" /><stop offset="100%" stopColor="var(--violet)" /></linearGradient></defs>
                    </svg>
                    Threat Log
                  </div>
                  <div className="sidebar-item">
                    <svg className="side-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M13 3L6 13H11L10 21L17 11H12L13 3Z" fill="url(#sg4)" />
                      <defs><linearGradient id="sg4" x1="6" y1="3" x2="17" y2="21"><stop offset="0%" stopColor="var(--gold)" /><stop offset="100%" stopColor="#ff9f1c" /></linearGradient></defs>
                    </svg>
                    Live Monitor
                  </div>
                  <div className="sidebar-item">
                    <svg className="side-icon" viewBox="0 0 24 24" fill="none">
                      <circle cx="9" cy="15" r="4" fill="url(#sg5)" />
                      <path d="M12 12L16 8L18 10M14.5 9.5L16.5 11.5" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" />
                      <defs><linearGradient id="sg5" x1="5" y1="11" x2="13" y2="19"><stop offset="0%" stopColor="var(--cyan)" /><stop offset="100%" stopColor="var(--cyan2)" /></linearGradient></defs>
                    </svg>
                    Access Control
                  </div>
                  <div className="sidebar-item">
                    <svg className="side-icon" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" fill="url(#sg6)" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="var(--muted)" strokeWidth="1.5" />
                      <defs><linearGradient id="sg6" x1="9" y1="9" x2="15" y2="15"><stop offset="0%" stopColor="var(--muted)" /><stop offset="100%" stopColor="white" /></linearGradient></defs>
                    </svg>
                    Settings
                  </div>
                </div>
                <div className="dash-main">
                  <div className="dash-top-row">
                    <div className="kpi-card" style={{ '--kpi-color': 'var(--cyan)' } as React.CSSProperties}>
                      <div className="kpi-label">Auth Success Rate</div>
                      <div className="kpi-val">99.97%</div>
                      <div className="kpi-sub">↑ 0.02% from last week</div>
                    </div>
                    <div className="kpi-card" style={{ '--kpi-color': 'var(--violet)' } as React.CSSProperties}>
                      <div className="kpi-label">Total Scans Today</div>
                      <div className="kpi-val">14,382</div>
                      <div className="kpi-sub">↑ 18% from yesterday</div>
                    </div>
                    <div className="kpi-card" style={{ '--kpi-color': 'var(--pink)' } as React.CSSProperties}>
                      <div className="kpi-label">Threats Blocked</div>
                      <div className="kpi-val">47</div>
                      <div className="kpi-sub">3 deepfake attempts</div>
                    </div>
                  </div>

                  <div className="dash-wave-area">
                    <div className="dash-wave-label">⬤ Live Voice Stream — Channel A</div>
                    <div className="wave-canvas-wrap">
                      {[8, 14, 22, 34, 42, 52, 58, 62, 66, 58, 52, 46, 38, 30, 22, 16, 12, 18, 26, 36, 48, 54, 60, 64, 58, 50, 42, 34, 26, 18, 14, 10, 8, 12, 20, 30, 42, 54, 62, 68, 62, 54, 42, 30, 20, 12, 8, 10, 16, 24].map((h, i) => (
                        <div
                          key={i}
                          className="wv"
                          style={{
                            '--h': `${h}px`,
                            '--d': `${(0.8 + Math.random() * 0.6).toFixed(2)}s`,
                            '--dl': `${(i * 0.022).toFixed(3)}s`
                          } as React.CSSProperties}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>Recent Events</div>
                  <div className="event-row">
                    <div className="event-dot" style={{ '--ed-color': 'var(--cyan)', background: 'var(--cyan)' } as React.CSSProperties}></div>
                    <div className="event-name">Sarah Mitchell</div>
                    <div className="event-time">00:23s ago</div>
                    <div className="event-status ev-ok">MATCHED</div>
                  </div>
                  <div className="event-row">
                    <div className="event-dot" style={{ '--ed-color': 'var(--cyan)', background: 'var(--cyan)' } as React.CSSProperties}></div>
                    <div className="event-name">James Okafor</div>
                    <div className="event-time">01:44s ago</div>
                    <div className="event-status ev-ok">MATCHED</div>
                  </div>
                  <div className="event-row">
                    <div className="event-dot" style={{ '--ed-color': 'var(--pink)', background: 'var(--pink)' } as React.CSSProperties}></div>
                    <div className="event-name">Unknown Caller</div>
                    <div className="event-time">03:12s ago</div>
                    <div className="event-status ev-fail">BLOCKED</div>
                  </div>
                </div>
                <div className="dash-right">
                  <div className="panel-title">Match Score</div>
                  <div className="radial-wrap">
                    <svg className="radial-svg" viewBox="0 0 140 140" fill="none">
                      <circle cx="70" cy="70" r="56" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                      <circle cx="70" cy="70" r="56" stroke="url(#rgrad)" strokeWidth="12"
                        strokeDasharray="316" strokeDashoffset="22"
                        strokeLinecap="round" transform="rotate(-90 70 70)" />
                      <defs>
                        <linearGradient id="rgrad" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#00f5e4" />
                          <stop offset="100%" stopColor="#9b5de5" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="radial-center">
                      <div className="radial-val">98.3</div>
                      <div className="radial-lbl">Score</div>
                    </div>
                  </div>

                  <div className="mini-metrics">
                    <div className="mm-row">
                      <div className="mm-top"><span className="mm-name">Clarity</span><span className="mm-val">88%</span></div>
                      <div className="mm-bar"><div className="mm-fill" style={{ width: '88%', '--mf-color': 'var(--cyan)' } as React.CSSProperties}></div></div>
                    </div>
                    <div className="mm-row">
                      <div className="mm-top"><span className="mm-name">Liveness</span><span className="mm-val">95%</span></div>
                      <div className="mm-bar"><div className="mm-fill" style={{ width: '95%', '--mf-color': 'var(--violet)' } as React.CSSProperties}></div></div>
                    </div>
                    <div className="mm-row">
                      <div className="mm-top"><span className="mm-name">Anti-Spoof</span><span className="mm-val">99%</span></div>
                      <div className="mm-bar"><div className="mm-fill" style={{ width: '99%', '--mf-color': '#4cff91' } as React.CSSProperties}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento */}
        <section className="features-sec" id="enterprise">
          <div className="section-tag" data-scroll>
            <span className="tag-line"></span>
            Capabilities
          </div>
          <h2 className="section-title" data-scroll>Built different.</h2>

          <div className="bento">
            <div className="bento-card b1" data-scroll style={{ '--dl': '.0s', '--bc-glow': 'rgba(0,245,228,.06)' } as React.CSSProperties}>
              <div className="bento-tag"><span className="bento-tag-dot"></span> Core Engine</div>
              <div className="bento-title">140-Dimensional<br />Voiceprint Analysis</div>
              <div className="bento-desc">Every voice is mapped across spectral, prosodic, phonetic, and articulatory dimensions in real time.</div>
              <div className="b1-viz">
                {[8, 12, 18, 24, 34, 44, 56, 68, 76, 80, 72, 62, 50, 40, 30, 22, 16, 12, 18, 26, 38, 50, 64, 74, 80, 76, 66, 54, 42, 30, 22, 16, 12, 18, 28, 40, 56, 68, 78, 80, 72, 62, 50, 38, 28, 20, 14, 10, 8, 12, 18, 26, 38, 52, 66, 76, 80, 74, 64, 52, 40, 30, 22, 16, 12, 18].map((h, i) => (
                  <div
                    key={i}
                    className="b1-bar"
                    style={{
                      '--h': `${h}px`,
                      '--d': `${(0.9 + Math.random() * 0.8).toFixed(2)}s`,
                      '--dl': `${(i * 0.018).toFixed(3)}s`
                    } as React.CSSProperties}
                  ></div>
                ))}
              </div>
              <div className="b1-overlay"></div>
            </div>

            <div className="bento-card b2" data-scroll style={{ '--dl': '.1s', '--bc-glow': 'rgba(247,37,133,.05)' } as React.CSSProperties}>
              <div className="bento-tag"><span className="bento-tag-dot" style={{ background: 'var(--pink)', boxShadow: '0 0 8px var(--pink)' }}></span> Liveness Detection</div>
              <div className="bento-title">Anti-Deepfake Shield</div>
              <div className="bento-desc">Defeats replay attacks, voice clones, and TTS synthesis at 99.9% precision.</div>
              <div className="rings-viz">
                <div className="r-ring" style={{ width: '110px', height: '110px', '--rd': '3s', '--rdl': '0s' } as React.CSSProperties}></div>
                <div className="r-ring" style={{ width: '80px', height: '80px', '--rd': '3s', '--rdl': '.5s' } as React.CSSProperties}></div>
                <div className="r-ring" style={{ width: '50px', height: '50px', '--rd': '3s', '--rdl': '1s' } as React.CSSProperties}></div>
                <div className="r-core"></div>
              </div>
            </div>

            <div className="bento-card b3" data-scroll style={{ '--dl': '.2s', '--bc-glow': 'rgba(155,93,229,.06)' } as React.CSSProperties}>
              <div className="bento-tag"><span className="bento-tag-dot" style={{ background: 'var(--violet)', boxShadow: '0 0 8px var(--violet)' }}></span> Zero-Trust</div>
              <div className="bento-title">SOC2 + GDPR<br />Compliant</div>
              <div className="bento-desc">Every session cryptographically signed and tamper-evident.</div>
              <div className="shield-viz">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 6L38 12V24C38 32.2843 32.2843 38 24 42C15.7157 38 10 32.2843 10 24V12L24 6Z" fill="url(#sh-g)" />
                  <path d="M18 24L22 28L30 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="sh-g" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="var(--violet)" />
                      <stop offset="100%" stopColor="var(--pink)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div className="bento-card b4" data-scroll style={{ '--dl': '.3s', '--bc-glow': 'rgba(0,245,228,.04)' } as React.CSSProperties}>
              <div className="bento-tag"><span className="bento-tag-dot"></span> Speed</div>
              <div className="bento-title">&lt;180ms<br />Auth</div>
              <div className="bento-desc">On-device inference. No round-trip latency.</div>
            </div>

            <div className="bento-card b5" data-scroll style={{ '--dl': '.4s', '--bc-glow': 'rgba(255,214,10,.04)' } as React.CSSProperties}>
              <div className="bento-tag"><span className="bento-tag-dot" style={{ background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)' }}></span> Global</div>
              <div className="bento-title">140+<br />Languages</div>
              <div className="bento-desc">Accent-agnostic models trained on 6M+ voice samples.</div>
            </div>

            <div className="bento-card b6" data-scroll style={{ '--dl': '.5s', '--bc-glow': 'rgba(76,255,145,.04)' } as React.CSSProperties}>
              <div className="bento-tag"><span className="bento-tag-dot" style={{ background: '#4cff91', boxShadow: '0 0 8px #4cff91' }}></span> API</div>
              <div className="bento-title">SDK in<br />5 Lines</div>
              <div className="bento-desc">REST + WebSocket. Drop-in integration for any stack.</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-sec" id="pricing">
          <div className="cta-glow"></div>
          <div className="cta-pre" data-scroll>Your voice is the key</div>
          <h2 className="cta-title" data-scroll>
            Start Securing<br />Today.
          </h2>
          <p className="cta-sub" data-scroll>
            Free forever for up to 500 authentications/month. No credit card required.
          </p>
          <div className="cta-buttons" data-scroll>
            <button className="btn-glow">Get Started Free</button>
            <button className="btn-outline">Talk to Sales →</button>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <div className="footer-brand">Swar-Auth</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Security</a>
            <a href="#">API Docs</a>
            <a href="#">Status</a>
            <a href="#">Blog</a>
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>© 2026 Swar-Auth Inc.</div>
        </footer>
      </div>
    </>
  );
}
