/**
 * ParticleField — Google Antigravity-inspired particle system
 * Pure Canvas 2D — no external dependencies.
 * Spring physics · Mouse attraction · Depth layers · Connecting lines
 */
import React, { useRef, useEffect, useCallback } from 'react';

/* ─── Tuning constants ─────────────────────────────────────────── */
const BASE_COUNT      = 320;   // particles on desktop
const MOBILE_COUNT    = 120;   // particles on mobile
const CONNECT_DIST    = 110;   // max px to draw connecting lines
const ATTRACT_RADIUS  = 200;   // cursor influence radius
const ATTRACT_FORCE   = 0.014; // how strongly particles are pulled
const SPRING_K        = 0.028; // spring back to origin
const DAMPING         = 0.88;  // velocity damping
const ORBIT_FACTOR    = 0.006; // slight orbital spin around cursor
const WAVE_SPEED      = 0.0006;
const IDLE_AMPLITUDE  = 0.35;  // idle drift amplitude

/* ─── Brand palette ────────────────────────────────────────────── */
const COLORS = [
  { r: 14,  g: 165, b: 233 },  // #0EA5E9
  { r: 56,  g: 189, b: 248 },  // #38BDF8
  { r: 125, g: 211, b: 252 },  // #7DD3FC
  { r: 255, g: 255, b: 255 },  // #FFFFFF
  { r: 2,   g: 132, b: 199 },  // #0284C7
];

function lerp(a, b, t) { return a + (b - a) * t; }
function rand(min, max) { return Math.random() * (max - min) + min; }

/* ─── Particle factory ─────────────────────────────────────────── */
function createParticle(W, H) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const depth  = rand(0.2, 1.0);    // z-like depth layer
  const size   = rand(1.0, 3.5) * depth;
  const alpha  = rand(0.25, 0.85) * depth;
  return {
    ox: rand(0, W),  oy: rand(0, H),   // origin position
    x:  rand(0, W),  y:  rand(0, H),   // current position
    vx: 0,           vy: 0,             // velocity
    size, alpha, depth,
    color,
    phase: rand(0, Math.PI * 2),       // for idle wave offset
    glowPulse: rand(0, Math.PI * 2),
  };
}

/* ─── Component ────────────────────────────────────────────────── */
const ParticleField = () => {
  const canvasRef  = useRef(null);
  const stateRef   = useRef({
    particles:  [],
    mouse:      { x: -9999, y: -9999, active: false },
    raf:        null,
    W: 0, H: 0,
    time: 0,
  });

  /* ── resize handler ── */
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    s.W = W; s.H = H;

    // rebuild particles if sizes changed significantly
    const mobile = W < 600;
    const count  = mobile ? MOBILE_COUNT : BASE_COUNT;
    if (s.particles.length !== count) {
      s.particles = Array.from({ length: count }, () => createParticle(W, H));
    } else {
      // clamp existing origins to new dimensions
      s.particles.forEach(p => {
        p.ox = Math.min(p.ox, W);
        p.oy = Math.min(p.oy, H);
      });
    }
  }, []);

  /* ── main animation loop ── */
  const animate = useCallback(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { W, H, mouse } = s;
    s.time += 1;

    /* clear */
    ctx.clearRect(0, 0, W, H);

    const mx = mouse.x, my = mouse.y;
    const active = mouse.active;

    /* ── draw connecting lines (back-to-front by depth) ── */
    ctx.save();
    for (let i = 0; i < s.particles.length; i++) {
      const pi = s.particles[i];
      for (let j = i + 1; j < s.particles.length; j++) {
        const pj = s.particles[j];
        const dx = pi.x - pj.x, dy = pi.y - pj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const strength = (1 - dist / CONNECT_DIST);
          const avgDepth = (pi.depth + pj.depth) * 0.5;
          const alpha = strength * 0.18 * avgDepth;
          const c = pi.color;
          ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
          ctx.lineWidth   = strength * 0.8 * avgDepth;
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    /* ── update & draw particles ── */
    s.particles.forEach(p => {
      /* idle wave drift — layered sine for organic feel */
      const wave = Math.sin(s.time * WAVE_SPEED * 60 + p.phase) * IDLE_AMPLITUDE * 30
                 + Math.cos(s.time * WAVE_SPEED * 40 + p.phase * 1.3) * IDLE_AMPLITUDE * 14;
      const waveY = Math.sin(s.time * WAVE_SPEED * 50 + p.phase * 0.8) * IDLE_AMPLITUDE * 20;

      /* target = origin + wave offset */
      let tx = p.ox + wave  * p.depth;
      let ty = p.oy + waveY * p.depth;

      /* cursor attraction */
      if (active) {
        const dx = mx - p.x, dy = my - p.y;
        const distSq = dx * dx + dy * dy;
        const dist   = Math.sqrt(distSq);
        const radius = ATTRACT_RADIUS / p.depth;  // closer layers react stronger

        if (dist < radius && dist > 0.5) {
          const falloff = 1 - dist / radius;
          const force   = falloff * falloff * ATTRACT_FORCE * (1 / p.depth * 0.6 + 0.4);

          /* attraction */
          p.vx += dx * force;
          p.vy += dy * force;

          /* orbital spin — perpendicular velocity component */
          p.vx += -dy * ORBIT_FACTOR * falloff;
          p.vy +=  dx * ORBIT_FACTOR * falloff;
        }
      }

      /* spring back to target */
      p.vx += (tx - p.x) * SPRING_K;
      p.vy += (ty - p.y) * SPRING_K;

      /* damping */
      p.vx *= DAMPING;
      p.vy *= DAMPING;

      /* integrate */
      p.x += p.vx;
      p.y += p.vy;

      /* glow pulse */
      p.glowPulse += 0.015;
      const pulse = (Math.sin(p.glowPulse) * 0.5 + 0.5) * 0.4 + 0.6;

      /* draw particle */
      const { r, g, b } = p.color;
      const sz = p.size * pulse;
      const al = p.alpha * pulse;

      // soft glow halo
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 4);
      grad.addColorStop(0,   `rgba(${r},${g},${b},${al})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${al * 0.3})`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // solid core
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${al})`;
      ctx.fill();
    });

    s.raf = requestAnimationFrame(animate);
  }, []);

  /* ── pointer events ── */
  const onMove = useCallback((e) => {
    const s = stateRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    s.mouse.x = clientX - rect.left;
    s.mouse.y = clientY - rect.top;
    s.mouse.active = true;
  }, []);

  const onLeave = useCallback(() => {
    stateRef.current.mouse.active = false;
  }, []);

  /* ── lifecycle ── */
  useEffect(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    resize();
    s.raf = requestAnimationFrame(animate);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement || canvas);

    canvas.addEventListener('mousemove',  onMove,  { passive: true });
    canvas.addEventListener('mouseleave', onLeave, { passive: true });
    canvas.addEventListener('touchmove',  onMove,  { passive: true });
    canvas.addEventListener('touchend',   onLeave, { passive: true });

    return () => {
      cancelAnimationFrame(s.raf);
      ro.disconnect();
      canvas.removeEventListener('mousemove',  onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('touchmove',  onMove);
      canvas.removeEventListener('touchend',   onLeave);
    };
  }, [resize, animate, onMove, onLeave]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:       'absolute',
        inset:          0,
        width:          '100%',
        height:         '100%',
        pointerEvents:  'all',
        display:        'block',
        zIndex:         1,
      }}
      aria-hidden="true"
    />
  );
};

export default ParticleField;
