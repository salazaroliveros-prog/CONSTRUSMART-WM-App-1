import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/theme-provider';

/**
 * AnimatedBackground — Fondo cinematográfico con parallax suave
 * 
 * Características:
 * - Imagen de fondo en ultra-alta resolución (día/noche según tema)
 * - Efecto parallax lento tipo "Ken Burns" con movimiento suave
 * - Overlays con degradados dinámicos que cambian con el tema
 * - Partículas/gradientes animados sutiles
 * - Transición suave entre modo día ↔ noche
 */

const AnimatedBackground: React.FC = () => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isDark, setIsDark] = useState(false);

  // Detectar modo oscuro (incluyendo "system")
  useEffect(() => {
    const checkDark = () => {
      const root = document.documentElement;
      const isDarkMode = root.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  // Parallax con mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Parallax con scroll
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxX = mousePos.x * 8;
  const parallaxY = mousePos.y * 6 + scrollY * 0.15;

  return (
    <>
      {/* === Fondo base sólido (evita flash blanco) === */}
      <div
        className="fixed inset-0 z-0 transition-colors duration-1000 ease-in-out"
        style={{
          backgroundColor: isDark ? '#0a0e1a' : '#e8f0fe',
        }}
      />

      {/* === Imagen de fondo con parallax tipo Ken Burns === */}
      <div
        ref={containerRef}
        className="fixed inset-0 z-[1] overflow-hidden transition-opacity duration-[1500ms] ease-in-out"
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            backgroundImage: `url(${isDark ? '/noche.jpg' : '/dia.jpg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translate(${parallaxX * 0.3}px, ${parallaxY * 0.2}px) scale(1.08)`,
            transition: 'transform 0.1s ease-out, background-image 1.5s ease-in-out',
            filter: isDark
              ? 'brightness(0.5) contrast(1.1) saturate(0.7)'
              : 'brightness(0.9) contrast(1.05) saturate(1.1)',
          }}
        >
          {/* Overlay degradado modo día */}
          <div
            className="absolute inset-0 transition-opacity duration-[1500ms]"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(10,14,26,0.7) 0%, rgba(20,30,60,0.5) 50%, rgba(10,14,26,0.8) 100%)'
                : 'linear-gradient(135deg, rgba(232,240,254,0.4) 0%, rgba(200,220,250,0.2) 50%, rgba(232,240,254,0.5) 100%)',
              opacity: isDark ? 1 : 0.6,
            }}
          />
        </div>
      </div>

      {/* === Círculos de luz animados (modo día) === */}
      <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
        {/* Luz cálida - solo día */}
        <div
          className="absolute rounded-full blur-3xl transition-all duration-[2000ms]"
          style={{
            width: '600px',
            height: '600px',
            top: '10%',
            left: '15%',
            background: isDark
              ? 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 40%, transparent 70%)',
            transform: `translate(${parallaxX * -0.5}px, ${parallaxY * -0.3}px)`,
            opacity: isDark ? 0.6 : 1,
          }}
        />
        {/* Luz azul - ambos modos */}
        <div
          className="absolute rounded-full blur-3xl transition-all duration-[2000ms]"
          style={{
            width: '400px',
            height: '400px',
            bottom: '15%',
            right: '10%',
            background: isDark
              ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            transform: `translate(${parallaxX * 0.4}px, ${parallaxY * 0.5}px)`,
            opacity: isDark ? 0.8 : 0.5,
          }}
        />
        {/* Partículas sutiles - solo noche */}
        {isDark && (
          <>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full animate-pulse-soft"
                style={{
                  background: `rgba(255,255,255,${0.2 + Math.random() * 0.3})`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                  animationDelay: `${Math.random() * 2}s`,
                  transform: `translate(${parallaxX * (0.1 + Math.random() * 0.2)}px, ${parallaxY * (0.1 + Math.random() * 0.2)}px)`,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* === Gradiente lateral de acento === */}
      <div
        className="fixed left-0 top-0 bottom-0 w-[3px] z-[3] pointer-events-none transition-all duration-1000"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.6), rgba(59,130,246,0.3), transparent)'
            : 'linear-gradient(to bottom, transparent, rgba(37,99,235,0.5), rgba(37,99,235,0.2), transparent)',
          opacity: 0.8,
        }}
      />

      {/* === Barra de acento inferior === */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[2px] z-[3] pointer-events-none transition-all duration-1000"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.5) 20%, rgba(59,130,246,0.3) 50%, rgba(99,102,241,0.5) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.3) 20%, rgba(59,130,246,0.15) 50%, rgba(37,99,235,0.3) 80%, transparent 100%)',
        }}
      />
    </>
  );
};

export default AnimatedBackground;