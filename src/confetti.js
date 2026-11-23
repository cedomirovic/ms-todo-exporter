/**
 * Lagane konfete bez ikakvih biblioteka.
 * Poštuje `prefers-reduced-motion` — ako je korisnik tražio manje animacija,
 * ne prikazuje se ništa.
 */
export function burstConfetti({ duration = 2400 } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  const resize = () => {
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#a6e45a', '#50a0f0', '#2564cf', '#ffd166', '#ff6b6b', '#35d399', '#c084fc', '#ffffff'];
  const count = Math.max(80, Math.min(180, Math.round(width / 8)));
  const particles = [];

  const spawn = (originX, originY, spread, angle, speed) => {
    for (let i = 0; i < count / 2; i += 1) {
      const velocity = speed * (0.6 + Math.random() * 0.7);
      const direction = angle + (Math.random() - 0.5) * spread;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(direction) * velocity,
        vy: Math.sin(direction) * velocity,
        size: 5 + Math.random() * 7,
        color: colors[(Math.random() * colors.length) | 0],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.35,
        shape: Math.random() < 0.55 ? 'rect' : 'circle',
      });
    }
  };

  // Dva „topa“ iz donjih uglova.
  spawn(-10, height + 10, Math.PI / 3, -Math.PI / 3, 22);
  spawn(width + 10, height + 10, Math.PI / 3, -Math.PI * (2 / 3), 22);

  const started = performance.now();
  let frame = 0;

  const tick = (now) => {
    const elapsed = now - started;
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.vy += 0.32;
      particle.vx *= 0.994;
      particle.vy *= 0.996;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.spin;

      const fade = Math.max(0, 1 - Math.max(0, elapsed - duration * 0.55) / (duration * 0.45));
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      if (particle.shape === 'rect') {
        ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (elapsed < duration) {
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      canvas.remove();
    }
  };

  frame = requestAnimationFrame(tick);
}
