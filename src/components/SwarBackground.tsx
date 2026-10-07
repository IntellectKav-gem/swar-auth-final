import React, { useEffect, useRef } from 'react';

export const SwarBackground: React.FC = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const dotGridRef = useRef<HTMLDivElement>(null);
  const glowARef = useRef<HTMLDivElement>(null);
  const glowBRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulseLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse tracking
    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      active: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Spotlight & Parallax Smooth Loop
    let animFrameId: number;
    let lastScrollY = window.scrollY || 0;
    let sx = mouse.x;
    let sy = mouse.y;

    const smoothLoop = () => {
      if (!prefersReducedMotion) {
        sx += (mouse.x - sx) * 0.08;
        sy += (mouse.y - sy) * 0.08;

        if (spotlightRef.current) {
          spotlightRef.current.style.transform = `translate(${sx - 320}px, ${sy - 320}px)`;
        }

        const nx = sx / window.innerWidth - 0.5;
        const ny = sy / window.innerHeight - 0.5;

        if (glowARef.current) {
          glowARef.current.style.transform = `translate(${nx * -18 + lastScrollY * 0.06}px, ${ny * -14}px)`;
        }

        if (glowBRef.current) {
          glowBRef.current.style.transform = `translate(${nx * 16}px, ${ny * 12 + lastScrollY * -0.04}px)`;
        }
      }

      animFrameId = requestAnimationFrame(smoothLoop);
    };

    const handleScroll = () => {
      lastScrollY = window.scrollY || 0;
      if (dotGridRef.current && !prefersReducedMotion) {
        dotGridRef.current.style.transform = `translateY(${lastScrollY * 0.03}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    animFrameId = requestAnimationFrame(smoothLoop);

    // Canvas Particle Network
    const canvas = canvasRef.current;
    let canvasAnimFrame: number;
    let nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      pulse: number;
    }> = [];

    let W = window.innerWidth;
    let H = window.innerHeight;

    const burstAt = (cx: number, cy: number) => {
      nodes.forEach((n) => {
        const dx = n.x - cx;
        const dy = n.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 220) n.pulse = 1;
      });
    };

    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const resizeCanvas = () => {
          W = window.innerWidth;
          H = window.innerHeight;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = W * dpr;
          canvas.height = H * dpr;
          canvas.style.width = `${W}px`;
          canvas.style.height = `${H}px`;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const count = Math.round((W * H) / 26000);
        nodes = [];
        for (let i = 0; i < count; i++) {
          nodes.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.18,
            vy: (Math.random() - 0.5) * 0.18,
            r: 1 + Math.random() * 1.4,
            pulse: 0,
          });
        }

        const LINK_DIST = 140;
        const MOUSE_LINK_DIST = 200;
        const REPEL_DIST = 110;

        const tick = () => {
          ctx.clearRect(0, 0, W, H);

          for (const n of nodes) {
            if (!prefersReducedMotion) {
              n.x += n.vx;
              n.y += n.vy;

              if (n.x < -10) n.x = W + 10;
              if (n.x > W + 10) n.x = -10;
              if (n.y < -10) n.y = H + 10;
              if (n.y > H + 10) n.y = -10;

              if (mouse.active) {
                const dx = n.x - mouse.x;
                const dy = n.y - mouse.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < REPEL_DIST && d > 0.01) {
                  const f = (1 - d / REPEL_DIST) * 0.6;
                  n.x += (dx / d) * f;
                  n.y += (dy / d) * f;
                }
              }
            }

            if (n.pulse > 0) n.pulse -= 0.02;
          }

          // draw links between nodes
          ctx.lineWidth = 1;
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < LINK_DIST) {
                const op = (1 - d / LINK_DIST) * 0.22;
                ctx.strokeStyle = `rgba(120,175,255,${op})`;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
              }
            }

            // link to mouse cursor
            if (mouse.active && !prefersReducedMotion) {
              const dx = nodes[i].x - mouse.x;
              const dy = nodes[i].y - mouse.y;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < MOUSE_LINK_DIST) {
                const op = (1 - d / MOUSE_LINK_DIST) * 0.35;
                ctx.strokeStyle = `rgba(63,216,224,${op})`;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
              }
            }
          }

          // render node dots
          for (const n of nodes) {
            const glowR = n.r + n.pulse * 3;
            ctx.beginPath();
            ctx.fillStyle = `rgba(160,205,255,${0.55 + n.pulse * 0.4})`;
            ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
            ctx.fill();
          }

          canvasAnimFrame = requestAnimationFrame(tick);
        };

        tick();
      }
    }

    // Click Ripple / Voice Pulse Effect
    const handleClick = (e: MouseEvent) => {
      if (!pulseLayerRef.current) return;
      const p = document.createElement('div');
      p.className = 'ping';
      p.style.left = `${e.clientX}px`;
      p.style.top = `${e.clientY}px`;
      pulseLayerRef.current.appendChild(p);
      setTimeout(() => {
        p.remove();
      }, 1500);
      burstAt(e.clientX, e.clientY);
    };

    window.addEventListener('click', handleClick);

    // Ambient Periodic Pulses
    const ambientInterval = setInterval(() => {
      if (Math.random() < 0.5 || prefersReducedMotion) return;
      if (!pulseLayerRef.current) return;
      const p = document.createElement('div');
      p.className = 'ping';
      p.style.left = `${10 + Math.random() * 80}vw`;
      p.style.top = `${10 + Math.random() * 70}vh`;
      pulseLayerRef.current.appendChild(p);
      setTimeout(() => {
        p.remove();
      }, 1500);
    }, 2600);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animFrameId);
      cancelAnimationFrame(canvasAnimFrame);
      clearInterval(ambientInterval);
    };
  }, []);

  return (
    <div className="bg-scene" id="bgScene" aria-hidden="true">
      <div className="dot-grid" id="dotGrid" ref={dotGridRef}></div>
      <div className="glow glow-a" id="glowA" ref={glowARef}></div>
      <div className="glow glow-b" id="glowB" ref={glowBRef}></div>
      <div className="glow glow-c"></div>
      <div className="spotlight" id="spotlight" ref={spotlightRef}></div>

      <svg className="waveforms" preserveAspectRatio="none" viewBox="0 0 1440 900">
        <path className="w1" d="M-100,180 C 200,80 400,280 700,180 S 1100,80 1540,200"></path>
        <path className="w2" d="M-100,680 C 250,600 450,760 760,680 S 1150,600 1540,700"></path>
      </svg>

      <div className="rings ring-set-1">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="rings ring-set-2">
        <span></span>
        <span></span>
      </div>

      <canvas id="netCanvas" ref={canvasRef}></canvas>
      <div id="pulseLayer" ref={pulseLayerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}></div>

      <div className="vignette"></div>
    </div>
  );
};

export default SwarBackground;
