import React, { useEffect, useRef, useState, useMemo } from 'react';

/**
 * FighterJetLoader - IAF Tricolor Volumetric Smoke Loading System
 * 
 * - Aircraft = FINAL fixed high-resolution clean asset (/iaf_fighter_jet_clean.png).
 * - Real-Time Volumetric Smoke = Advanced multi-lobed cloud clusters with turbulent 
 *   swirl, organic noise displacement, intermixed micro-dust particles, and prominent Saffron, White, Green streams.
 * - Main Loader Theme = Default clean white (#FFFFFF), automatically inherits active dashboard theme.
 * - Ongoing Loader = Transparent backdrop, small aircraft scale, zero card/text/line.
 * - Rapid Multilingual India Title Transition = Cycles through 16 Indian language translations of India/Bharat.
 * 
 * Props:
 * - variant: 'fullscreen' (Full theme-aware overlay) | 'inline' (Transparent ongoing loader, jet + smoke only)
 * - progress: number (0 to 100, connected to real system state)
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - statusText: string (default: 'LOADING...')
 */
export default function FighterJetLoader({
  variant = 'fullscreen',
  progress = 0,
  size = 'md',
  statusText = 'LOADING...',
  subtitleText = 'This process may take a few moments while sensor streams & ML models recalibrate. Please do not refresh or close this tab/window.'
}) {
  const canvasRef = useRef(null);
  const [wordIndex, setWordIndex] = useState(0);

  const indiaWords = useMemo(() => [
    'India',
    'भारत',
    'ভাৰত',
    'ਭਾਰਤ',
    'ભારત',
    'ଓଡ଼ିଆ: ଭାରତ',
    'ಭಾರತ',
    'بھارت',
    'भारत',
    'भारतम्',
    'भारतदेशम्',
    'ഇന്ത്യ',
    'இந்தியா',
    'భారతదేశం',
    'ᱵᱷᱟᱨᱚᱛ',
    'ہندوستان'
  ], []);

  useEffect(() => {
    if (variant !== 'fullscreen') return;
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % indiaWords.length);
    }, 110);
    return () => clearInterval(timer);
  }, [variant, indiaWords.length]);

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // Aircraft Display Dimensions (FINAL FIXED SCALE)
  const jetWidth = variant === 'inline' 
    ? (isSmall ? 110 : (isLarge ? 170 : 135))
    : (isSmall ? 220 : (isLarge ? 360 : 300));
  const jetHeight = Math.round(jetWidth * (875 / 1374));

  const scale = jetWidth / 160;

  // Real-Time Soft Volumetric Aircraft Smoke Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Exact Nozzle Tip & Composition Centering Calculation (Exact 50% / 50% Center Alignment)
    const jetCenterX = width * 0.50;
    const jetCenterY = height * 0.50;

    const nozzleX = jetCenterX - (jetWidth * 0.34);
    const nozzleY = jetCenterY + (jetHeight * 0.22);

    const particles = [];
    const microParticles = [];
    const maxParticles = variant === 'inline' ? (isSmall ? 35 : 55) : 80;

    // Distinct Indian Tricolor Palette (Saffron, Pure White, India Green)
    const colors = {
      saffron: { r: 255, g: 115, b: 0 },
      white: { r: 255, g: 255, b: 255 },
      green: { r: 19, g: 136, b: 8 }
    };

    let frameCount = 0;

    const createParticle = () => {
      // 3 Equal-Weight Tricolor Streams arranged GREEN (Top) -> WHITE (Middle) -> SAFFRON (Bottom)
      const streamTypes = ['green', 'white', 'saffron'];
      const type = streamTypes[Math.floor(Math.random() * streamTypes.length)];
      const rgb = colors[type];

      // Stream offset perpendicular to 35-degree climb pitch angle (-55 deg vector)
      // Top Stream (Green): negative offset; Middle (White): 0 offset; Bottom (Saffron): positive offset
      let offsetDist = 0;
      if (type === 'green') offsetDist = -7 * scale;
      if (type === 'white') offsetDist = 0;
      if (type === 'saffron') offsetDist = 7 * scale;

      const perpAngle = -0.96;
      const offsetX = Math.cos(perpAngle) * offsetDist;
      const offsetY = Math.sin(perpAngle) * offsetDist;

      // Reverse flight angle (~215 degrees) with turbulent swirl
      const backAngle = 3.75 + (Math.random() * 0.14 - 0.07);
      const speed = (1.5 + Math.random() * 1.2) * scale;

      // Multi-lobed sub-puff cluster (8 micro-lobes) for realistic organic smoke cloud silhouette
      const subPuffs = [];
      const numLobes = 7 + Math.floor(Math.random() * 3);
      for (let k = 0; k < numLobes; k++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = (Math.random() * 5.5) * scale;
        subPuffs.push({
          ox: Math.cos(angle) * dist,
          oy: Math.sin(angle) * dist,
          rRatio: 0.5 + Math.random() * 0.45
        });
      }

      particles.push({
        x: nozzleX + offsetX,
        y: nozzleY + offsetY,
        vx: Math.cos(backAngle) * speed,
        vy: Math.sin(backAngle) * speed,
        radius: (4.5 + Math.random() * 2.5) * scale,
        maxRadius: (19 + Math.random() * 8) * scale,
        alpha: (type === 'white' ? 0.82 : 0.74) + Math.random() * 0.15,
        life: 0,
        maxLife: variant === 'inline' ? (28 + Math.random() * 12) : (38 + Math.random() * 16),
        seed: Math.random() * 100,
        rgb,
        subPuffs
      });

      // Intermix micro-dust smoke specks inside the cloud volume
      if (Math.random() > 0.3) {
        microParticles.push({
          x: nozzleX + offsetX + (Math.random() * 3 - 1.5),
          y: nozzleY + offsetY + (Math.random() * 3 - 1.5),
          vx: Math.cos(backAngle) * (speed * 1.15),
          vy: Math.sin(backAngle) * (speed * 1.15),
          radius: (1.2 + Math.random() * 2) * scale,
          alpha: 0.7 + Math.random() * 0.25,
          life: 0,
          maxLife: variant === 'inline' ? (18 + Math.random() * 10) : (22 + Math.random() * 14),
          rgb
        });
      }
    };

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      // Emit real-time soft volumetric smoke particles
      if (particles.length < maxParticles && frameCount % 2 === 0) {
        createParticle();
        createParticle();
      }

      // 1. Render Micro-Dust Smoke Specks
      for (let i = microParticles.length - 1; i >= 0; i--) {
        const mp = microParticles[i];
        mp.life++;
        mp.x += mp.vx;
        mp.y += mp.vy;
        mp.vx *= 0.975;
        mp.vy *= 0.975;

        const lifeRatio = mp.life / mp.maxLife;
        let currentAlpha = mp.alpha * (1 - lifeRatio);

        // Soft Edge-Fade Guard: smoothstep fade to 0 alpha near any canvas edge
        const distLeft = mp.x - mp.radius;
        const distTop = mp.y - mp.radius;
        const distRight = (width - mp.x) - mp.radius;
        const distBottom = (height - mp.y) - mp.radius;
        const minEdgeDist = Math.min(distLeft, distTop, distRight, distBottom);

        if (minEdgeDist < 40) {
          const norm = Math.max(0, minEdgeDist / 40);
          currentAlpha *= norm * norm * (3 - 2 * norm);
        }

        if (mp.life >= mp.maxLife || currentAlpha <= 0.005) {
          microParticles.splice(i, 1);
          continue;
        }

        const { r, g, b } = mp.rgb;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, mp.radius * (1 + lifeRatio * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;
        ctx.fill();
      }

      // 2. Render Main Volumetric Cloud Billows
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        // Turbulence & atmospheric swirl displacement
        const swirlX = Math.sin(p.life * 0.12 + p.seed) * 0.25 * scale;
        const swirlY = Math.cos(p.life * 0.14 + p.seed) * 0.25 * scale;

        p.x += p.vx + swirlX;
        p.y += p.vy + swirlY;

        p.vx *= 0.982;
        p.vy *= 0.982;

        const lifeRatio = p.life / p.maxLife;
        // Expands wider and softer as it travels backward
        const currentRadius = p.radius + (p.maxRadius - p.radius) * Math.sin(lifeRatio * Math.PI * 0.5);
        const currentAlpha = p.alpha * (1 - Math.pow(lifeRatio, 1.3));

        if (p.life >= p.maxLife || currentAlpha <= 0.005) {
          particles.splice(i, 1);
          continue;
        }

        const { r, g, b } = p.rgb;

        // Render multi-lobed organic cloud silhouette with non-linear radial density
        for (let j = 0; j < p.subPuffs.length; j++) {
          const sp = p.subPuffs[j];
          const px = p.x + sp.ox * (1 + lifeRatio * 1.3);
          const py = p.y + sp.oy * (1 + lifeRatio * 1.3);
          const puffRadius = currentRadius * sp.rRatio;

          // Soft Edge-Fade Guard: smoothstep fade to 0 alpha near any canvas boundary
          const distLeft = px - puffRadius;
          const distTop = py - puffRadius;
          const distRight = (width - px) - puffRadius;
          const distBottom = (height - py) - puffRadius;
          const minEdgeDist = Math.min(distLeft, distTop, distRight, distBottom);

          let edgeFade = 1.0;
          if (minEdgeDist < 50) {
            const norm = Math.max(0, minEdgeDist / 50);
            edgeFade = norm * norm * (3 - 2 * norm);
          }

          const puffAlpha = currentAlpha * edgeFade;
          if (puffAlpha <= 0.005) continue;

          const grad = ctx.createRadialGradient(px, py, 0, px, py, puffRadius);
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${puffAlpha * 0.85})`);
          grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${puffAlpha * 0.45})`);
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

          ctx.beginPath();
          ctx.arc(px, py, puffRadius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant, size, jetWidth, jetHeight, scale]);

  const displayProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: variant === 'fullscreen' ? 'fixed' : 'relative',
        inset: variant === 'fullscreen' ? 0 : 'auto',
        zIndex: variant === 'fullscreen' ? 99999 : 10,
        // Theme-Aware Dynamic Background: clean white by default (#FFFFFF), automatically inherits active dashboard theme
        backgroundColor: variant === 'fullscreen' ? 'var(--bg-app, var(--bg-surface, #FFFFFF))' : 'transparent',
        color: 'var(--text-primary, #0F172A)',
        width: variant === 'fullscreen' ? '100%' : (isSmall ? '280px' : (isLarge ? '420px' : '350px')),
        height: variant === 'fullscreen' ? '100%' : (isSmall ? '140px' : (isLarge ? '200px' : '170px')),
        margin: variant === 'fullscreen' ? 0 : '0 auto',
        alignSelf: 'center',
        pointerEvents: variant === 'fullscreen' ? 'all' : 'none',
        userSelect: 'none',
        transition: 'background-color 0.25s ease, opacity 0.3s ease'
      }}
    >
      {/* Scene Container - Centering Aircraft + Smoke Composition Together */}
      <div
        style={{
          position: 'relative',
          width: variant === 'fullscreen' ? '560px' : '100%',
          height: variant === 'fullscreen' ? '340px' : '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible'
        }}
      >
        {/* Real-Time Soft Volumetric Tricolor Smoke Canvas Layer */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        />

        {/* High-Resolution Final Fixed Aircraft Asset */}
        <img
          src="/iaf_fighter_jet_clean.png"
          alt="IAF Fighter Jet"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%', // Centered in the middle
            transform: 'translate(-50%, -50%)',
            width: `${jetWidth}px`,
            height: `${jetHeight}px`,
            objectFit: 'contain',
            zIndex: 2,
            filter: 'none',
            animation: 'jetSubtleClimb 2.8s ease-in-out infinite alternate'
          }}
        />
      </div>

      {/* Inline Variant: Centered Status Text */}
      {variant !== 'fullscreen' && statusText && (
        <div
          style={{
            marginTop: '8px',
            fontSize: isSmall ? '11px' : '13px',
            fontWeight: 700,
            color: 'var(--accent-iaf, var(--text-primary))',
            letterSpacing: '0.05em',
            textAlign: 'center',
            textTransform: 'uppercase',
            userSelect: 'none'
          }}
        >
          {statusText}
        </div>
      )}

      {/* Fullscreen Variant: Rapid Multilingual India Name Transition & Subtitle */}
      {variant === 'fullscreen' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '36px',
              minWidth: '280px'
            }}
          >
            <span
              key={wordIndex}
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-primary, #0F172A)',
                letterSpacing: '0.08em',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                animation: 'rapidWordFade 0.11s ease-in-out forwards',
                textAlign: 'center',
                userSelect: 'none'
              }}
            >
              {indiaWords[wordIndex]}
            </span>
          </div>

          {subtitleText && (
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary, #64748B)',
                marginTop: '24px',
                textAlign: 'center',
                letterSpacing: '0.03em',
                userSelect: 'none',
                maxWidth: '480px',
                lineHeight: '1.4'
              }}
            >
              {subtitleText}
            </div>
          )}
        </div>
      )}

      {/* Animation Keyframes */}
      <style>{`
        @keyframes rapidWordFade {
          0% {
            opacity: 0.3;
            transform: translateY(2px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes jetSubtleClimb {
          0% {
            transform: translate(-50%, -50%) translateY(0px) rotate(0deg);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-5px) rotate(0.8deg);
          }
          100% {
            transform: translate(-50%, -50%) translateY(3px) rotate(-0.5deg);
          }
        }
      `}</style>
    </div>
  );
}







