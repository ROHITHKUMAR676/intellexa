import { useState, useEffect, useRef, useCallback } from "react";

// ─── Utility: hook for scroll-triggered reveal ────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Starfield canvas ─────────────────────────────────────────────────────────
function StarField({ count = 200, opacity = 1 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      o: Math.random() * 0.7 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.twinkle += 0.01;
        const tw = 0.5 + 0.5 * Math.sin(s.twinkle);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o * tw * opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw(0);
    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [count, opacity]);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ─── Particle burst (contact form) ───────────────────────────────────────────
function ParticleBurst({ active, onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2, cy = H / 2;
    const particles = Array.from({ length: 60 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      return { x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, r: Math.random() * 3 + 1 };
    });
    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.025; p.vy += 0.05;
        if (p.life > 0) { alive = true; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${p.life * 0.9})`; ctx.fill();
      });
      if (alive) raf = requestAnimationFrame(draw);
      else onDone && onDone();
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, onDone]);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }} />;
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "", duration = 2000 }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView(0.3);
  useEffect(() => {
    if (!inView) return;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Section reveal wrapper ───────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView(0.08);
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(48px)",
      transition: `opacity 1.1s cubic-bezier(.16,1,.3,1) ${delay}s, transform 1.1s cubic-bezier(.16,1,.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ─── INTRO CINEMATIC (REPLACED) ───────────────────────────────────────────────
function Intro({ onComplete }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [phase, setPhase] = useState(0);
  const [logoVisible, setLogoVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [revealedLetters, setRevealedLetters] = useState([]);
  const logoText = "INTELLEXA";

  // Phase timeline
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 5200),
      setTimeout(() => { setPhase(5); setLogoVisible(true); }, 6100),
      setTimeout(() => setFadeOut(true), 10200),
      setTimeout(() => onComplete(), 11400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Mouse tracking for subtle parallax
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Logo letter stagger
  useEffect(() => {
    if (!logoVisible) return;
    const delays = logoText.split("").map((_, i) =>
      setTimeout(() => setRevealedLetters((prev) => [...prev, i]), i * 90 + 80)
    );
    return () => delays.forEach(clearTimeout);
  }, [logoVisible]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let raf;
    let startTime = null;

    // LAYER 1: distant stars
    const farStars = Array.from({ length: 420 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 0.6 + 0.1,
      opacity: 0, target: Math.random() * 0.55 + 0.1,
      twinklePhase: Math.random() * Math.PI * 2,
      layer: 0,
    }));

    // LAYER 2: mid stars
    const midStars = Array.from({ length: 180 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.0 + 0.3,
      opacity: 0, target: Math.random() * 0.7 + 0.2,
      twinklePhase: Math.random() * Math.PI * 2,
      layer: 1,
    }));

    // LAYER 3: nearby bright stars
    const nearStars = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.8,
      opacity: 0, target: Math.random() * 0.9 + 0.3,
      twinklePhase: Math.random() * Math.PI * 2,
      layer: 2,
      hasGlow: Math.random() > 0.6,
    }));

    // NEBULA clouds
    const nebulae = [
      { cx: W * 0.28, cy: H * 0.38, rx: W * 0.28, ry: H * 0.22, hue: "55,90,160", alpha: 0 },
      { cx: W * 0.72, cy: H * 0.55, rx: W * 0.24, ry: H * 0.20, hue: "40,70,140", alpha: 0 },
      { cx: W * 0.50, cy: H * 0.25, rx: W * 0.30, ry: H * 0.16, hue: "60,100,180", alpha: 0 },
    ];

    // STREAKS
    const streaks = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      len: Math.random() * 90 + 30,
      speed: Math.random() * 6 + 3,
      alpha: Math.random() * 0.18 + 0.05,
      layer: Math.random(),
    }));

    // BURST state
    let burstParticles = [];
    let shockwaveRadius = 0;
    let shockwaveAlpha = 0;
    let burstInitialized = false;

    // CAMERA drift
    const cam = { x: 0, y: 0 };
    const camDrift = { targetX: 0, targetY: 0, phase: Math.random() * Math.PI * 2 };

    // Read phase from canvas data attr (avoids stale closure)
    function getPhase() {
      return parseInt(canvas.dataset.phase || "0", 10);
    }

    function initBurst() {
      if (burstInitialized) return;
      burstInitialized = true;
      const cx = W / 2, cy = H / 2;
      shockwaveRadius = 0;
      shockwaveAlpha = 1;
      burstParticles = Array.from({ length: 220 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 1.5;
        const isBright = Math.random() > 0.4;
        return {
          x: cx + (Math.random() - 0.5) * 30,
          y: cy + (Math.random() - 0.5) * 30,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: Math.random() * 0.015 + 0.008,
          r: Math.random() * 2.5 + 0.5,
          hue: isBright ? "210,235,255" : "160,200,255",
        };
      });
    }

    function drawNebula(elapsed, p) {
      nebulae.forEach((n, i) => {
        const targetAlpha = p >= 2 ? [0.045, 0.035, 0.04][i] : 0;
        n.alpha += (targetAlpha - n.alpha) * 0.008;
        if (n.alpha < 0.001) return;
        const mx = mouseRef.current.x * (i + 1) * 5;
        const my = mouseRef.current.y * (i + 1) * 4;
        const pulse = 1 + 0.04 * Math.sin(elapsed * 0.3 + i * 1.5);
        const grad = ctx.createRadialGradient(
          n.cx + mx, n.cy + my, 0,
          n.cx + mx, n.cy + my,
          Math.max(n.rx, n.ry) * pulse
        );
        grad.addColorStop(0, `rgba(${n.hue},${n.alpha})`);
        grad.addColorStop(0.45, `rgba(${n.hue},${n.alpha * 0.5})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(n.cx + mx, n.cy + my, n.rx * pulse, n.ry * pulse, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      });
    }

    function drawStarLayer(stars, p, camOffX, camOffY, parallaxScale) {
      stars.forEach((s) => {
        const targetO = p >= 1 ? s.target : 0;
        s.opacity += (targetO - s.opacity) * 0.012;
        if (s.opacity < 0.005) return;
        s.twinklePhase += 0.006 + s.layer * 0.003;
        const tw = 0.7 + 0.3 * Math.sin(s.twinklePhase);
        const ox = camOffX * parallaxScale;
        const oy = camOffY * parallaxScale;
        const sx = ((s.x + ox) % W + W) % W;
        const sy = ((s.y + oy) % H + H) % H;
        const finalAlpha = s.opacity * tw;
        if (s.hasGlow) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 6);
          glow.addColorStop(0, `rgba(200,230,255,${finalAlpha * 0.35})`);
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sx, sy, s.r * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,245,255,${finalAlpha})`;
        ctx.fill();
      });
    }

    function drawStreaks(p) {
      const speedMult = p >= 3 ? 2.8 : p >= 2 ? 1.2 : 1;
      if (p >= 4) return;
      streaks.forEach((s) => {
        s.y += s.speed * speedMult;
        if (s.y - s.len > H) { s.y = -s.len; s.x = Math.random() * W; }
        const grad = ctx.createLinearGradient(s.x, s.y - s.len, s.x, s.y);
        grad.addColorStop(0, "rgba(100,170,255,0)");
        grad.addColorStop(1, `rgba(210,240,255,${s.alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.7 + s.layer * 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - s.len);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      });
    }

    function drawTension(elapsed, p) {
      if (p < 3) return;
      const t = Math.min((elapsed - 3.8) / 1.4, 1);
      const cx = W / 2, cy = H / 2;
      const vigAlpha = t * 0.55;
      const vig = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(0.5, `rgba(0,0,10,${vigAlpha * 0.4})`);
      vig.addColorStop(1, `rgba(0,0,10,${vigAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
      const ringAlpha = Math.sin(elapsed * 12) * 0.12 * t + t * 0.08;
      const ringR = 40 + t * 60 + Math.sin(elapsed * 6) * 5;
      const ring = ctx.createRadialGradient(cx, cy, ringR * 0.6, cx, cy, ringR);
      ring.addColorStop(0, `rgba(100,180,255,${ringAlpha})`);
      ring.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBurst(elapsed, p) {
      if (p < 4) return;
      if (!burstInitialized) initBurst();
      const cx = W / 2, cy = H / 2;
      const t = elapsed - 5.2;
      if (t < 0) return;
      shockwaveRadius = Math.min(shockwaveRadius + 28, Math.max(W, H));
      shockwaveAlpha = Math.max(0, 1 - shockwaveRadius / (Math.max(W, H) * 0.6));
      if (shockwaveAlpha > 0) {
        ctx.strokeStyle = `rgba(200,235,255,${shockwaveAlpha * 0.8})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        const innerR = shockwaveRadius * 0.4;
        ctx.strokeStyle = `rgba(255,255,255,${shockwaveAlpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.stroke();
        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, shockwaveRadius * 0.55);
        bloom.addColorStop(0, `rgba(255,255,255,${shockwaveAlpha * 0.95})`);
        bloom.addColorStop(0.12, `rgba(220,240,255,${shockwaveAlpha * 0.6})`);
        bloom.addColorStop(0.4, `rgba(100,170,255,${shockwaveAlpha * 0.15})`);
        bloom.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(cx, cy, shockwaveRadius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        if (shockwaveAlpha > 0.2) {
          [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5, Math.PI * 0.25, Math.PI * 0.75].forEach((angle, i) => {
            const flen = shockwaveRadius * (0.8 + (i % 2) * 0.4);
            const fAlpha = shockwaveAlpha * (i < 4 ? 0.6 : 0.3);
            const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * flen, cy + Math.sin(angle) * flen);
            grad.addColorStop(0, `rgba(255,255,255,${fAlpha})`);
            grad.addColorStop(0.3, `rgba(200,230,255,${fAlpha * 0.4})`);
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.strokeStyle = grad;
            ctx.lineWidth = i < 4 ? 1.5 : 0.8;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * flen, cy + Math.sin(angle) * flen);
            ctx.stroke();
          });
        }
      }
      burstParticles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.97; p.vy *= 0.97;
        p.life -= p.decay;
        if (p.life <= 0) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},${p.life * 0.9})`;
        ctx.fill();
      });
    }

    function drawVignette() {
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, Math.max(W, H) * 0.8);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,15,0.72)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    function drawGrain(elapsed) {
      const grainData = ctx.createImageData(W, H);
      const d = grainData.data;
      const seed = (elapsed * 30) | 0;
      for (let i = 0; i < d.length; i += 4) {
        const n = ((i * 2654435761 + seed) >>> 0) % 255;
        d[i] = d[i + 1] = d[i + 2] = n;
        d[i + 3] = n > 200 ? 8 : 0;
      }
      ctx.putImageData(grainData, 0, 0);
    }

    function draw(ts) {
      if (!startTime) startTime = ts;
      const elapsed = (ts - startTime) / 1000;
      const p = getPhase();

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgb(2,4,14)";
      ctx.fillRect(0, 0, W, H);

      // Camera drift
      camDrift.phase += 0.0006;
      camDrift.targetX = Math.sin(camDrift.phase) * 18 + mouseRef.current.x * 12;
      camDrift.targetY = Math.cos(camDrift.phase * 0.7) * 12 + mouseRef.current.y * 8;
      cam.x += (camDrift.targetX - cam.x) * 0.018;
      cam.y += (camDrift.targetY - cam.y) * 0.018;

      drawNebula(elapsed, p);
      drawStarLayer(farStars, p, cam.x, cam.y, 0.3);
      drawStarLayer(midStars, p, cam.x, cam.y, 0.65);
      drawStarLayer(nearStars, p, cam.x, cam.y, 1.1);
      if (p >= 2 && p < 5) drawStreaks(p);
      if (p >= 3 && p < 5) drawTension(elapsed, p);
      if (p >= 4) drawBurst(elapsed, p);
      drawVignette();
      if (Math.floor(elapsed * 24) % 2 === 0) drawGrain(elapsed);

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  // Sync phase to canvas data attribute so canvas loop can read it
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.dataset.phase = phase;
  }, [phase]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgb(2,4,14)",
      opacity: fadeOut ? 0 : 1,
      transition: "opacity 1.2s cubic-bezier(0.4,0,0.2,1)",
      pointerEvents: fadeOut ? "none" : "all",
      overflow: "hidden",
    }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* INTELLEXA logo */}
      {logoVisible && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          {/* Letters */}
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(2px,0.5vw,8px)", lineHeight: 1 }}>
            {logoText.split("").map((char, i) => (
              <span key={i} style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(2.8rem,7vw,6.5rem)",
                color: "#e8f4ff",
                letterSpacing: "0.12em",
                lineHeight: 1,
                opacity: revealedLetters.includes(i) ? 1 : 0,
                transform: revealedLetters.includes(i)
                  ? "translateY(0) scale(1)"
                  : "translateY(24px) scale(0.85)",
                transition: "opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)",
                textShadow: revealedLetters.includes(i)
                  ? "0 0 40px rgba(140,200,255,0.7), 0 0 80px rgba(100,160,255,0.35), 0 0 120px rgba(80,140,255,0.18)"
                  : "none",
                display: "inline-block",
              }}>
                {char}
              </span>
            ))}
          </div>

          <div style={{
            marginTop: "2.2rem",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "clamp(13px,1.5vw,18px)",
            fontWeight: 600,
            letterSpacing: "clamp(0.22em,0.8vw,0.5em)",
            color: "rgba(190,220,255,0)",
            textTransform: "uppercase",
            textAlign: "center",
            animation: "taglineFadeIntro 1s ease-out 0.7s forwards",
            textShadow: "0 0 18px rgba(120,185,255,0.32)",
          }}>
            Innovate • Impact • Inspire
          </div>

          <div style={{
            marginTop: "0.75rem",
            maxWidth: "min(760px,82vw)",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "clamp(15px,1.8vw,21px)",
            fontWeight: 400,
            lineHeight: 1.45,
            letterSpacing: "0.08em",
            color: "rgba(185,215,255,0)",
            textAlign: "center",
            animation: "introSubtagline 1.1s ease-out 1.05s forwards",
            textShadow: "0 0 24px rgba(95,165,255,0.28)",
          }}>
            Where curious minds converge, ideas launch, and the future is engineered.
          </div>

          <div style={{
            marginTop: "1.25rem",
            width: "clamp(120px,18vw,220px)",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(140,200,255,0.6), transparent)",
            opacity: 0,
            animation: "lineFadeIntro 1s ease-out 1s forwards",
          }} />
        </div>
      )}
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ visible }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const links = [
    { label: "Mission", id: "about" },
    { label: "Archive", id: "achievements" },
    { label: "Operations", id: "events" },
    { label: "The Crew", id: "team" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 900,
      padding: "0 clamp(20px,4vw,60px)",
      height: "64px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(2,4,14,0.85)" : "transparent",
      backdropFilter: scrolled ? "blur(18px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(100,150,255,0.12)" : "none",
      transition: "all 0.5s ease",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-20px)",
    }}>
      <div style={{
        fontFamily: "'Orbitron', sans-serif", fontSize: "18px", fontWeight: 700,
        letterSpacing: "0.15em",
        color: "transparent",
        background: "linear-gradient(90deg, #fff 0%, #8fb8e8 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        cursor: "pointer",
      }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        INTELLEXA
      </div>

      <div style={{ display: "flex", gap: "32px", alignItems: "center" }} className="nav-desktop">
        {links.map(l => (
          <button key={l.id} onClick={() => scrollTo(l.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
            fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase",
            color: "rgba(200,220,255,0.7)",
            transition: "color 0.3s ease", padding: "4px 0",
          }}
            onMouseEnter={e => e.target.style.color = "#fff"}
            onMouseLeave={e => e.target.style.color = "rgba(200,220,255,0.7)"}
          >
            {l.label}
          </button>
        ))}
      </div>

      <button onClick={() => setMenuOpen(!menuOpen)} style={{
        background: "none", border: "none", cursor: "pointer", display: "none",
        flexDirection: "column", gap: "5px", padding: "4px",
      }} className="nav-hamburger">
        {[0,1,2].map(i => <div key={i} style={{ width: "22px", height: "1.5px", background: "rgba(200,220,255,0.8)" }} />)}
      </button>

      {menuOpen && (
        <div style={{
          position: "absolute", top: "64px", left: 0, right: 0,
          background: "rgba(2,4,20,0.97)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(100,150,255,0.15)",
          padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: "16px",
        }}>
          {links.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} style={{
              background: "none", border: "none", cursor: "pointer", textAlign: "left",
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
              fontSize: "15px", letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(200,220,255,0.8)", padding: "8px 0",
            }}>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ visible }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 30, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section id="hero" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <StarField count={220} opacity={0.9} />

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 50% at 30% 40%, rgba(20,40,120,0.25) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 70% 70%, rgba(40,20,100,0.18) 0%, transparent 60%)",
        transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`,
        transition: "transform 0.8s ease",
      }} />

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "200px",
        background: "linear-gradient(to top, rgba(10,20,80,0.4), transparent)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", zIndex: 2, textAlign: "center",
        padding: "0 clamp(20px,6vw,80px)", maxWidth: "900px",
        opacity: visible ? 1 : 0,
        transform: visible ? `translate(${mousePos.x * 0.08}px, ${mousePos.y * 0.08}px)` : "translateY(30px)",
        transition: visible ? "opacity 1.4s ease 0.2s, transform 0.6s ease" : "opacity 1.4s ease",
      }}>
        <div style={{
          display: "inline-block", marginBottom: "24px",
          padding: "6px 20px",
          background: "rgba(100,150,255,0.08)",
          border: "1px solid rgba(100,150,255,0.2)",
          borderRadius: "40px",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "11px", letterSpacing: "0.35em", textTransform: "uppercase",
          color: "rgba(160,200,255,0.8)",
        }}>
          ◆ Est. 2022 · Innovation Club
        </div>

        <h1 style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "clamp(28px,6vw,72px)",
          fontWeight: 700, lineHeight: 1.1, margin: "0 0 24px",
          color: "transparent",
          background: "linear-gradient(135deg, #ffffff 0%, #b8d0f8 50%, #8fb8f0 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          letterSpacing: "-0.02em",
        }}>
          Engineering Innovation<br />Beyond Boundaries
        </h1>

        <p style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(14px,2vw,18px)",
          fontWeight: 400, lineHeight: 1.7, color: "rgba(180,210,255,0.65)",
          maxWidth: "580px", margin: "0 auto 48px", letterSpacing: "0.02em",
        }}>
          INTELLEXA is a futuristic innovation community — where curious minds converge, ideas launch, and the future is engineered one breakthrough at a time.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} style={{
            padding: "14px 36px",
            background: "linear-gradient(135deg, rgba(80,130,255,0.25), rgba(80,130,255,0.08))",
            border: "1px solid rgba(100,150,255,0.4)",
            borderRadius: "4px",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
            fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(200,230,255,0.9)",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            transition: "all 0.3s ease",
          }}
            onMouseEnter={e => { e.target.style.background = "linear-gradient(135deg,rgba(80,130,255,0.45),rgba(80,130,255,0.2))"; e.target.style.borderColor = "rgba(150,190,255,0.7)"; }}
            onMouseLeave={e => { e.target.style.background = "linear-gradient(135deg,rgba(80,130,255,0.25),rgba(80,130,255,0.08))"; e.target.style.borderColor = "rgba(100,150,255,0.4)"; }}
          >
            Explore INTELLEXA
          </button>
          <button onClick={() => document.getElementById("team")?.scrollIntoView({ behavior: "smooth" })} style={{
            padding: "14px 36px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(200,220,255,0.2)",
            borderRadius: "4px",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
            fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(200,220,255,0.7)",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            transition: "all 0.3s ease",
          }}
            onMouseEnter={e => { e.target.style.borderColor = "rgba(200,220,255,0.5)"; e.target.style.color = "rgba(220,235,255,0.95)"; }}
            onMouseLeave={e => { e.target.style.borderColor = "rgba(200,220,255,0.2)"; e.target.style.color = "rgba(200,220,255,0.7)"; }}
          >
            Meet the Crew
          </button>
        </div>

        <div style={{ marginTop: "80px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", opacity: 0.5 }}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(180,210,255,0.6)" }}>Scroll</div>
          <div style={{ width: "1px", height: "40px", background: "linear-gradient(to bottom, rgba(150,190,255,0.6), transparent)", animation: "scrollPulse 2s ease-in-out infinite" }} />
        </div>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About() {
  const stats = [
    { label: "Workshops Conducted", value: 42, suffix: "+" },
    { label: "Active Members", value: 180, suffix: "+" },
    { label: "Projects Launched", value: 28, suffix: "" },
    { label: "Awards & Recognitions", value: 15, suffix: "+" },
  ];

  const pillars = [
    { icon: "◈", title: "Mission", desc: "To cultivate a thriving culture of innovation — empowering students to solve real-world problems with emerging technology and bold thinking." },
    { icon: "◉", title: "Vision", desc: "A world where every student has the tools, community, and confidence to become tomorrow's breakthrough innovator." },
    { icon: "◆", title: "Culture", desc: "We operate at the intersection of technology, design, and human impact — building what's next, together." },
  ];

  return (
    <section id="about" style={{ position: "relative", padding: "clamp(80px,12vh,160px) clamp(20px,6vw,80px)", overflow: "hidden" }}>
      <StarField count={80} opacity={0.5} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(15,25,90,0.4) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(130,180,255,0.6)", marginBottom: "16px" }}>
              ◆ Mission Briefing
            </div>
            <h2 style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(28px,5vw,52px)",
              fontWeight: 700, margin: 0, letterSpacing: "-0.01em",
              color: "transparent",
              background: "linear-gradient(135deg, #fff 0%, #a8c8f8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              About INTELLEXA
            </h2>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "80px" }}>
          {pillars.map((p, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(100,150,255,0.15)",
                borderRadius: "8px", padding: "36px 28px",
                minHeight: "300px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                backdropFilter: "blur(20px)",
                transition: "border-color 0.3s, transform 0.3s, background 0.3s",
                cursor: "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(100,150,255,0.4)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,150,255,0.15)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              >
                <div style={{ fontSize: "28px", marginBottom: "16px", color: "rgba(140,190,255,0.8)" }}>{p.icon}</div>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "16px", fontWeight: 600, color: "rgba(220,235,255,0.9)", marginBottom: "12px", letterSpacing: "0.06em" }}>{p.title}</h3>
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "15px", lineHeight: 1.7, color: "rgba(160,200,255,0.65)", margin: 0, fontWeight: 400 }}>{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1px",
            background: "rgba(100,150,255,0.12)",
            border: "1px solid rgba(100,150,255,0.15)",
            borderRadius: "8px", overflow: "hidden",
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                padding: "36px 24px", textAlign: "center",
                background: "rgba(2,4,20,0.8)",
                backdropFilter: "blur(20px)",
              }}>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(28px,4vw,42px)",
                  fontWeight: 700, color: "transparent",
                  background: "linear-gradient(135deg, #fff 0%, #8fb8f0 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  marginBottom: "8px",
                }}>
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(140,180,255,0.55)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── ACHIEVEMENTS (TIMELINE) ──────────────────────────────────────────────────
function Achievements() {
  const items = [
    { year: "2022", title: "Club Founded", desc: "INTELLEXA launched with 30 founding members, establishing its core pillars of innovation and impact.", tag: "Origin" },
    { year: "2022", title: "First Hackathon", desc: "Hosted our inaugural 24-hour hackathon with 8 competing teams, resulting in 3 award-winning prototypes.", tag: "Milestone" },
    { year: "2023", title: "50+ Member Surge", desc: "Community grew beyond 50 active members within the first year. Launched weekly tech talks and design sprints.", tag: "Growth" },
    { year: "2023", title: "Best Innovation Club", desc: "Awarded Best Innovation Club at the regional inter-college tech summit.", tag: "Award" },
    { year: "2023", title: "Industry Workshop Series", desc: "Partnered with 4 tech companies for an exclusive 6-month workshop series on AI, Web3, and Product Design.", tag: "Partnership" },
    { year: "2024", title: "National Recognition", desc: "Featured in top 10 college innovation clubs nationally. Members secured internships at leading tech firms.", tag: "National" },
    { year: "2024", title: "180+ Members", desc: "Scaling new heights — INTELLEXA crossed 180 active members with 5 specialized domain chapters.", tag: "Scale" },
    { year: "2025", title: "Research Publication", desc: "First collaborative research paper published by INTELLEXA members in an international AI conference.", tag: "Research" },
  ];

  return (
    <section id="achievements" style={{ position: "relative", padding: "clamp(80px,12vh,160px) clamp(20px,6vw,80px)", overflow: "hidden" }}>
      <StarField count={60} opacity={0.35} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 40% at 50% 80%, rgba(30,10,80,0.35) 0%, transparent 60%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(130,180,255,0.6)", marginBottom: "16px" }}>◆ Mission Archive</div>
            <h2 style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, margin: 0,
              color: "transparent",
              background: "linear-gradient(135deg,#fff 0%,#a8c8f8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Past Achievements</h2>
          </div>
        </Reveal>

        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px",
            background: "linear-gradient(to bottom, transparent, rgba(100,150,255,0.4) 10%, rgba(100,150,255,0.4) 90%, transparent)",
            transform: "translateX(-50%)",
          }} />

          {items.map((item, i) => {
            const isLeft = i % 2 === 0;
            return (
              <Reveal key={i} delay={0.05}>
                <div style={{
                  display: "flex", justifyContent: isLeft ? "flex-start" : "flex-end",
                  marginBottom: "48px", position: "relative",
                }}>
                  <div style={{
                    position: "absolute", left: "50%", top: "24px",
                    width: "10px", height: "10px",
                    background: "rgba(120,170,255,0.9)",
                    borderRadius: "50%",
                    transform: "translateX(-50%)",
                    boxShadow: "0 0 12px rgba(100,150,255,0.8)",
                  }} />

                  <div style={{
                    width: "calc(50% - 36px)",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(100,150,255,0.15)",
                    borderRadius: "8px",
                    padding: "24px 24px",
                    backdropFilter: "blur(20px)",
                    transition: "border-color 0.3s, transform 0.3s",
                    cursor: "default",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(100,150,255,0.4)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,150,255,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{
                        fontFamily: "'Rajdhani', sans-serif", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase",
                        color: "rgba(100,150,255,0.8)",
                        background: "rgba(80,120,255,0.1)", border: "1px solid rgba(80,120,255,0.25)",
                        borderRadius: "3px", padding: "3px 10px",
                      }}>{item.tag}</span>
                      <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "13px", fontWeight: 600, color: "rgba(160,200,255,0.7)" }}>{item.year}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "14px", fontWeight: 600, color: "rgba(220,235,255,0.9)", margin: "0 0 10px", letterSpacing: "0.04em" }}>{item.title}</h3>
                    <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", lineHeight: 1.65, color: "rgba(150,190,255,0.6)", margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
function Events() {
  const events = [
  {
    title: "Curiosity Lab - Project Expo",
    type: "Project Expo",
    date: "Apr 24, 2025",
    desc: "A project showcase event where students presented their ideas and innovations, marking the conclusion of the Curiosity Lab initiative.",
    status: "Past"
  },

  {
    title: "Build&Break: AI Agents",
    type: "AI Workshop",
    date: "Jun 24, 2025",
    desc: "An introductory workshop on AI agents where students explored challenges in AI systems and built simple AI agents hands-on.",
    status: "Past"
  },

  {
    title: "Tailwind Takeoff",
    type: "Web Development",
    date: "Jul 26, 2025",
    desc: "A beginner-friendly session introducing TailwindCSS and practical UI development using HTML and React.",
    status: "Past"
  },

  {
    title: "Promptsmiths - Forge your own AI",
    type: "AI/LLM Workshop",
    date: "Aug 18, 2025",
    desc: "Students learned how language models work and customized their own LLMs using Ollama tools.",
    status: "Past"
  },

  {
    title: "Pixel Laura",
    type: "Photography Contest",
    date: "Aug 19, 2025",
    desc: "A creative photography event designed to encourage participants to showcase their skills through themed challenges.",
    status: "Past"
  },

  {
    title: "Inside the Black Box - How Machines Actually Learn",
    type: "Machine Learning",
    date: "Aug 23, 2025",
    desc: "A session explaining the fundamentals of machine learning and how AI models learn from data.",
    status: "Past"
  },

  {
    title: "Art of Pitching",
    type: "Soft Skills",
    date: "Sep 19, 2025",
    desc: "A workshop focused on improving pitching skills, communication clarity, and judge engagement techniques.",
    status: "Past"
  },

  {
    title: "Renaissance",
    type: "Club Inauguration",
    date: "Sep 29, 2025",
    desc: "The official club inauguration event introducing members, vision, and guest speakers from the industry.",
    status: "Past"
  },

  {
    title: "Docker Demystified",
    type: "DevOps Workshop",
    date: "Oct 09, 2025",
    desc: "A hands-on Docker session teaching students container creation, Dockerfiles, and image management basics.",
    status: "Past"
  },

  {
    title: "QUBIT - World Of Quantum Computing",
    type: "Quantum Computing",
    date: "Oct 11, 2025",
    desc: "A beginner-oriented session simplifying quantum computing concepts and introducing core ideas.",
    status: "Past"
  },

  {
    title: "N8N - Hands on Workshop",
    type: "Automation Workshop",
    date: "Oct 12, 2025",
    desc: "An automation workshop where students built no-code workflows and explored automation fundamentals live.",
    status: "Past"
  },

  {
    title: "IoT Connect",
    type: "IoT Workshop",
    date: "Oct 15, 2025",
    desc: "Participants learned IoT communication protocols and streamed live IoT data through local server setups.",
    status: "Past"
  },

  {
    title: "N8N - Contest",
    type: "Technical Contest",
    date: "Oct 22, 2025",
    desc: "A follow-up contest allowing students to apply and showcase the automation skills learned during the workshop.",
    status: "Past"
  },

  {
    title: "Journey of a Byte",
    type: "Networking",
    date: "Nov 29, 2025",
    desc: "A networking fundamentals session explaining how internet communication works and how data flows online.",
    status: "Past"
  },

  {
    title: "Dec Learnathon - IoT Journey",
    type: "IoT Learnathon",
    date: "Dec 01, 2025",
    desc: "Students explored electronics basics, IoT concepts, and created live simulations using Tinkercad and Wokwi.",
    status: "Past"
  },

  {
    title: "Dec Learnathon - Power of FlutterFlow",
    type: "App Development",
    date: "Dec 09, 2025",
    desc: "A no-code app development session teaching participants to build real, functional apps using FlutterFlow.",
    status: "Past"
  },

  {
    title: "Dec Learnathon - Boot into Linux",
    type: "Linux Workshop",
    date: "Dec 15, 2025",
    desc: "A Linux fundamentals workshop introducing virtual machines, command-line tools, and core Linux concepts.",
    status: "Past"
  },

  {
    title: "Dec Learnathon - Detect-A-Thon",
    type: "Computer Vision",
    date: "Dec 21, 2025",
    desc: "A computer vision session where students explored datasets, object detection models, and real-time training workflows.",
    status: "Past"
  },

  {
    title: "Web Launch – Build & Launch Your Website using WordPress",
    type: "Web Development",
    date: "Mar 15, 2026",
    desc: "A no-code website development workshop where students learned to create and launch websites using WordPress, along with basics of free hosting and subdomains.",
    status: "Past"
  }
];

  const statusColor = { Upcoming: "rgba(80,200,120,0.85)", Recent: "rgba(100,160,255,0.85)", Past: "rgba(140,140,160,0.7)" };

  return (
    <section id="events" style={{ position: "relative", padding: "clamp(80px,12vh,160px) clamp(20px,6vw,80px)", overflow: "hidden" }}>
      <StarField count={100} opacity={0.4} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 20% 50%, rgba(10,30,100,0.3) 0%, transparent 60%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(130,180,255,0.6)", marginBottom: "16px" }}>◆ Operations Console</div>
            <h2 style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, margin: 0,
              color: "transparent", background: "linear-gradient(135deg,#fff 0%,#a8c8f8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Events & Workshops</h2>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {events.map((ev, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <EventCard ev={ev} statusColor={statusColor} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCard({ ev, statusColor }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 12;
    setTilt({ x, y });
  };
  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(100,150,255,0.15)",
        borderRadius: "8px", padding: "28px 24px",
        backdropFilter: "blur(20px)",
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.25s ease, border-color 0.3s",
        cursor: "default",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(100,150,255,0.35)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(100,150,255,0.15)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
          background: "rgba(80,120,255,0.12)", border: "1px solid rgba(80,120,255,0.25)",
          borderRadius: "3px", padding: "3px 10px", color: "rgba(130,180,255,0.8)",
        }}>{ev.type}</span>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.08em", color: statusColor[ev.status] }}>
          ● {ev.status}
        </span>
      </div>
      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "15px", fontWeight: 600, color: "rgba(220,235,255,0.9)", margin: "0 0 8px", letterSpacing: "0.02em" }}>{ev.title}</h3>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "12px", letterSpacing: "0.1em", color: "rgba(130,170,255,0.6)", marginBottom: "14px" }}>{ev.date}</div>
      <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", lineHeight: 1.65, color: "rgba(150,190,255,0.6)", margin: "0 0 20px", flex: 1 }}>{ev.desc}</p>
      <button style={{
        alignSelf: "flex-start",
        background: "none", border: "1px solid rgba(100,150,255,0.3)", borderRadius: "3px",
        padding: "8px 18px", cursor: "pointer",
        fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "11px",
        letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(160,200,255,0.8)",
        transition: "all 0.25s",
      }}
        onMouseEnter={e => { e.target.style.background = "rgba(80,120,255,0.15)"; e.target.style.borderColor = "rgba(100,150,255,0.6)"; }}
        onMouseLeave={e => { e.target.style.background = "none"; e.target.style.borderColor = "rgba(100,150,255,0.3)"; }}
      >
        Learn More →
      </button>
    </div>
  );
}

// ─── TEAM ─────────────────────────────────────────────────────────────────────
function Team() {
  const coreTeam = [
    { name: "Amrithavarshini", role: "Mentor", initials: "AV" },
    { name: "Afra Zeenath Fathima", role: "President", initials: "AZF" },
    { name: "Sarvesh Sivasankaran", role: "Vice President", initials: "SV" },
    { name: "Jaeyalakshmi", role: "Faculty Coordinator", initials: "JL" },
  ];

  return (
    <section id="team" style={{ position: "relative", padding: "clamp(80px,12vh,160px) clamp(20px,6vw,80px)", overflow: "hidden" }}>
      <StarField count={120} opacity={0.45} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 80% 30%, rgba(20,10,80,0.35) 0%, transparent 60%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(130,180,255,0.6)", marginBottom: "16px" }}>◆ The Crew</div>
            <h2 style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, margin: 0,
              color: "transparent", background: "linear-gradient(135deg,#fff 0%,#a8c8f8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Meet the Team</h2>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(130,180,255,0.5)", marginBottom: "32px", textAlign: "center" }}>Core Team</div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "20px", marginBottom: "64px" }}>
          {coreTeam.map((m, i) => <Reveal key={i} delay={i * 0.1}><MemberCard m={m} highlight /></Reveal>)}
        </div>
      </div>
    </section>
  );
}

function MemberCard({ m, highlight }) {
  const [hovered, setHovered] = useState(false);
  const avatarColors = ["rgba(60,100,255,0.5)", "rgba(80,50,200,0.5)", "rgba(30,120,200,0.5)", "rgba(50,160,180,0.5)", "rgba(100,60,220,0.5)", "rgba(40,100,180,0.5)"];
  const color = avatarColors[m.initials.charCodeAt(0) % avatarColors.length];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(100,150,255,0.4)" : "rgba(100,150,255,0.13)"}`,
        borderRadius: "8px", padding: "28px 20px",
        backdropFilter: "blur(20px)",
        textAlign: "center",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "all 0.35s cubic-bezier(.16,1,.3,1)",
        position: "relative", overflow: "hidden",
      }}
    >
      {hovered && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${10 + (i * 37) % 80}%`, top: `${5 + (i * 53) % 90}%`,
              width: "2px", height: "2px", borderRadius: "50%",
              background: "rgba(150,200,255,0.4)",
            }} />
          ))}
        </div>
      )}

      <div style={{
        width: highlight ? "72px" : "60px",
        height: highlight ? "72px" : "60px",
        borderRadius: "50%", margin: "0 auto 16px",
        background: color,
        border: `2px solid ${hovered ? "rgba(150,200,255,0.6)" : "rgba(100,150,255,0.25)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Orbitron', sans-serif",
        fontSize: highlight ? "18px" : "15px", fontWeight: 700,
        color: "rgba(220,235,255,0.9)",
        transition: "border-color 0.3s",
        boxShadow: hovered ? `0 0 20px ${color}` : "none",
        position: "relative",
      }}>
        {m.initials}
      </div>

      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: highlight ? "14px" : "12px", fontWeight: 600, color: "rgba(220,235,255,0.9)", marginBottom: "6px", letterSpacing: "0.04em" }}>{m.name}</div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(130,180,255,0.6)" }}>{m.role}</div>

      <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "14px" }}>
        {["in", "gh", "tw"].map((s, i) => (
          <div key={i} style={{
            width: "26px", height: "26px", borderRadius: "50%",
            background: "rgba(80,120,255,0.1)", border: "1px solid rgba(80,120,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Rajdhani', sans-serif", fontSize: "9px", fontWeight: 700,
            color: "rgba(130,180,255,0.7)", cursor: "pointer",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(80,120,255,0.25)"; e.currentTarget.style.borderColor = "rgba(100,150,255,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(80,120,255,0.1)"; e.currentTarget.style.borderColor = "rgba(80,120,255,0.2)"; }}
          >{s}</div>
        ))}
      </div>
    </div>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [burst, setBurst] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    setBurst(true);
    setTimeout(() => { setBurst(false); setSent(true); }, 2000);
  };

  return (
    <section id="contact" style={{ position: "relative", padding: "clamp(80px,12vh,160px) clamp(20px,6vw,80px)", overflow: "hidden" }}>
      <StarField count={100} opacity={0.4} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(10,20,80,0.5) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "700px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(130,180,255,0.6)", marginBottom: "16px" }}>◆ Open Channel</div>
            <h2 style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, margin: 0,
              color: "transparent", background: "linear-gradient(135deg,#fff 0%,#a8c8f8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Contact Us</h2>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "24px", marginBottom: "48px" }}>
            {[
              { label: "Instagram", value: "@intellexa.rec" },
              { label: "LinkedIn", value: "Intellexa REC" },
              { label: "Youtube", value: "INTELLEXA REC" },
            ].map((c, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(100,150,255,0.6)", marginBottom: "4px" }}>{c.label}</div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", fontWeight: 500, color: "rgba(180,210,255,0.8)" }}>{c.value}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(100,150,255,0.15)",
            borderRadius: "8px", padding: "40px 36px", backdropFilter: "blur(20px)",
            position: "relative",
          }}>
            <ParticleBurst active={burst} onDone={() => {}} />

            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>✦</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "18px", fontWeight: 600, color: "rgba(220,235,255,0.9)", marginBottom: "12px" }}>Transmission Sent</div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "15px", color: "rgba(150,190,255,0.65)" }}>We'll get back to you shortly. Stay curious.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  { key: "name", label: "Your Name", type: "text", placeholder: "Full Name" },
                  { key: "email", label: "Email Address", type: "email", placeholder: "you@example.com" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(130,170,255,0.6)", marginBottom: "8px" }}>{f.label}</label>
                    <input
                      type={f.type} value={form[f.key]} placeholder={f.placeholder}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(100,150,255,0.2)", borderRadius: "4px",
                        padding: "12px 16px", color: "rgba(210,230,255,0.9)", fontFamily: "'Rajdhani', sans-serif", fontSize: "15px",
                        outline: "none", transition: "border-color 0.25s", boxSizing: "border-box",
                      }}
                      onFocus={e => e.target.style.borderColor = "rgba(100,150,255,0.55)"}
                      onBlur={e => e.target.style.borderColor = "rgba(100,150,255,0.2)"}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(130,170,255,0.6)", marginBottom: "8px" }}>Message</label>
                  <textarea value={form.message} placeholder="Your message..." rows={5}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(100,150,255,0.2)", borderRadius: "4px",
                      padding: "12px 16px", color: "rgba(210,230,255,0.9)", fontFamily: "'Rajdhani', sans-serif", fontSize: "15px",
                      outline: "none", resize: "vertical", transition: "border-color 0.25s", boxSizing: "border-box",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(100,150,255,0.55)"}
                    onBlur={e => e.target.style.borderColor = "rgba(100,150,255,0.2)"}
                  />
                </div>
                <button onClick={handleSubmit} style={{
                  padding: "14px 40px", alignSelf: "flex-start",
                  background: "linear-gradient(135deg,rgba(60,100,255,0.35),rgba(60,100,255,0.15))",
                  border: "1px solid rgba(100,150,255,0.4)",
                  borderRadius: "4px", cursor: "pointer",
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "13px",
                  letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(200,230,255,0.9)",
                  transition: "all 0.3s",
                }}
                  onMouseEnter={e => { e.target.style.background = "linear-gradient(135deg,rgba(60,100,255,0.55),rgba(60,100,255,0.3))"; e.target.style.borderColor = "rgba(150,190,255,0.7)"; }}
                  onMouseLeave={e => { e.target.style.background = "linear-gradient(135deg,rgba(60,100,255,0.35),rgba(60,100,255,0.15))"; e.target.style.borderColor = "rgba(100,150,255,0.4)"; }}
                >
                  Send Transmission
                </button>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ position: "relative", padding: "60px clamp(20px,6vw,80px) 40px", overflow: "hidden", borderTop: "1px solid rgba(100,150,255,0.1)" }}>
      <StarField count={60} opacity={0.3} />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(18px,3vw,28px)", fontWeight: 700,
          color: "transparent", background: "linear-gradient(135deg,#fff 0%,#6090d0 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          letterSpacing: "0.1em", marginBottom: "16px",
        }}>
          INTELLEXA
        </div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "12px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(130,170,255,0.5)", marginBottom: "40px" }}>
          Innovate • Impact • Inspire
        </div>
        <div style={{ width: "60px", height: "1px", background: "linear-gradient(90deg,transparent,rgba(100,150,255,0.4),transparent)", margin: "0 auto 32px" }} />
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", letterSpacing: "0.12em", color: "rgba(120,160,255,0.4)" }}>
          — End of Transmission —
        </div>
        <div style={{ marginTop: "24px", fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", color: "rgba(100,130,200,0.3)", letterSpacing: "0.08em" }}>
          © 2025 INTELLEXA. All systems nominal.
        </div>
      </div>
    </footer>
  );
}

// ─── CURSOR ──────────────────────────────────────────────────────────────────
function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState({ x: -100, y: -100 });
  const posRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const move = (e) => { posRef.current = { x: e.clientX, y: e.clientY }; setPos({ x: e.clientX, y: e.clientY }); };
    window.addEventListener("mousemove", move);
    let raf;
    function lerp() {
      setTrail(prev => ({ x: prev.x + (posRef.current.x - prev.x) * 0.12, y: prev.y + (posRef.current.y - prev.y) * 0.12 }));
      raf = requestAnimationFrame(lerp);
    }
    raf = requestAnimationFrame(lerp);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div style={{ position: "fixed", left: pos.x - 4, top: pos.y - 4, width: "8px", height: "8px", borderRadius: "50%", background: "rgba(200,225,255,0.9)", pointerEvents: "none", zIndex: 9999, mixBlendMode: "screen", transition: "transform 0.1s" }} />
      <div style={{ position: "fixed", left: trail.x - 18, top: trail.y - 18, width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(100,160,255,0.4)", pointerEvents: "none", zIndex: 9998 }} />
    </>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    window.scrollTo({ top: 0, behavior: "auto" });
    setTimeout(() => setHeroVisible(true), 200);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #02040e;
          color: rgba(200,220,255,0.85);
          overflow-x: hidden;
          cursor: none;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #02040e; }
        ::-webkit-scrollbar-thumb { background: rgba(80,120,255,0.3); border-radius: 2px; }
        input, textarea { color-scheme: dark; }
        input::placeholder, textarea::placeholder { color: rgba(100,140,200,0.4); }
        @keyframes godray {
          from { opacity: 0; transform: translateY(-30px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes taglineFadeIntro {
          from { color: rgba(140,200,255,0); }
          to   { color: rgba(140,200,255,0.55); }
        }
        @keyframes introSubtagline {
          from { opacity: 0; color: rgba(185,215,255,0); transform: translateY(10px); filter: blur(6px); }
          to   { opacity: 1; color: rgba(185,215,255,0.78); transform: translateY(0); filter: blur(0); }
        }
        @keyframes lineFadeIntro {
          from { opacity: 0; width: 60px; }
          to   { opacity: 1; width: clamp(120px,18vw,220px); }
        }
        @keyframes logoGlow {
          from { text-shadow: 0 0 14px rgba(190,225,255,0.72), 0 0 36px rgba(90,160,255,0.38); }
          to { text-shadow: 0 0 22px rgba(245,250,255,0.95), 0 0 62px rgba(110,185,255,0.68); }
        }
        @keyframes introLogoLetter {
          0% { opacity: 0; transform: translateY(26px) scale(0.92); filter: blur(9px); }
          60% { opacity: 1; transform: translateY(-3px) scale(1.02); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes introTagline {
          0% { opacity: 0; transform: translateY(12px); filter: blur(7px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.2; transform: scaleY(0.8); }
          50% { opacity: 0.8; transform: scaleY(1.2); }
        }
        @media (max-width: 720px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>

      <CustomCursor />
      <Intro onComplete={handleIntroComplete} />

      {introComplete && (
        <div>
          <Navbar visible={heroVisible} />
          <Hero visible={heroVisible} />
          <About />
          <Achievements />
          <Events />
          <Team />
          <Contact />
          <Footer />
        </div>
      )}
    </>
  );
}