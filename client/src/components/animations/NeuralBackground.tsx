import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface NeuralBackgroundProps {
  className?: string;
}

const PARTICLE_COUNT_DESKTOP = 60;
const PARTICLE_COUNT_MOBILE = 0; // disabled on mobile

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

export const NeuralBackground: React.FC<NeuralBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const reduced = useReducedMotion();
  const themeRef = useRef(resolvedTheme);

  useEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (isMobile() || reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Scene Setup ─────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // ── Particles ───────────────────────────────────────────
    const particleCount = PARTICLE_COUNT_DESKTOP;
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 6;
      const z = (Math.random() - 0.5) * 2;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.003,
        0
      ));
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const getParticleColor = () =>
      themeRef.current === 'dark'
        ? new THREE.Color(0x7C9FFF)
        : new THREE.Color(0x2563EB);

    const particleMat = new THREE.PointsMaterial({
      color: getParticleColor(),
      size: themeRef.current === 'dark' ? 0.055 : 0.045,
      transparent: true,
      opacity: themeRef.current === 'dark' ? 0.75 : 0.55,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Connection Lines ─────────────────────────────────────
    const MAX_CONNECTIONS = 120;
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setDrawRange(0, 0);

    const getLineColor = () =>
      themeRef.current === 'dark'
        ? new THREE.Color(0x5B7BE8)
        : new THREE.Color(0x93AEEC);

    const lineMat = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({
        color: getLineColor(),
        transparent: true,
        opacity: themeRef.current === 'dark' ? 0.35 : 0.25,
      })
    ).material as THREE.LineBasicMaterial;

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── Mouse Interaction ────────────────────────────────────
    const mouse = new THREE.Vector2(0, 0);
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // ── Resize ──────────────────────────────────────────────
    const handleResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    // ── Animation Loop ───────────────────────────────────────
    let animId: number;
    const CONNECTION_DIST = 2.0;
    const MOUSE_INFLUENCE = 0.0008;

    const posArr = particleGeo.attributes.position.array as Float32Array;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;

        // Mouse gentle pull
        const dx = mouse.x * 5 - posArr[idx];
        const dy = mouse.y * 3 - posArr[idx + 1];
        velocities[i].x += dx * MOUSE_INFLUENCE;
        velocities[i].y += dy * MOUSE_INFLUENCE;

        posArr[idx]     += velocities[i].x;
        posArr[idx + 1] += velocities[i].y;

        // Dampen velocity
        velocities[i].multiplyScalar(0.98);

        // Boundary wrap
        if (posArr[idx] >  5.5) posArr[idx] = -5.5;
        if (posArr[idx] < -5.5) posArr[idx] =  5.5;
        if (posArr[idx + 1] >  3.2) posArr[idx + 1] = -3.2;
        if (posArr[idx + 1] < -3.2) posArr[idx + 1] =  3.2;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Update connections
      let lineIdx = 0;
      const lp = lineGeo.attributes.position.array as Float32Array;

      for (let a = 0; a < particleCount && lineIdx < MAX_CONNECTIONS; a++) {
        for (let b = a + 1; b < particleCount && lineIdx < MAX_CONNECTIONS; b++) {
          const ax = posArr[a * 3], ay = posArr[a * 3 + 1];
          const bx = posArr[b * 3], by = posArr[b * 3 + 1];
          const dist = Math.hypot(ax - bx, ay - by);

          if (dist < CONNECTION_DIST) {
            lp[lineIdx * 6]     = ax;
            lp[lineIdx * 6 + 1] = ay;
            lp[lineIdx * 6 + 2] = 0;
            lp[lineIdx * 6 + 3] = bx;
            lp[lineIdx * 6 + 4] = by;
            lp[lineIdx * 6 + 5] = 0;
            lineIdx++;
          }
        }
      }
      lineGeo.setDrawRange(0, lineIdx * 2);
      lineGeo.attributes.position.needsUpdate = true;

      // Update theme colors dynamically
      particleMat.color.set(getParticleColor());
      particleMat.opacity = themeRef.current === 'dark' ? 0.75 : 0.55;
      lineMat.color.set(getLineColor());
      lineMat.opacity = themeRef.current === 'dark' ? 0.35 : 0.22;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
      particleGeo.dispose();
      lineGeo.dispose();
      particleMat.dispose();
      (lines.material as THREE.LineBasicMaterial).dispose();
    };
  }, [reduced]);

  if (isMobile() || reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};
