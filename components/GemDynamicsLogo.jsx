import React, { useState, useEffect, useRef } from 'react';

const GemDynamicsLogo = () => {
  const [angle, setAngle] = useState(0);
  const logoRef = useRef(null);

  // --- CONFIGURATION AREA ---
  // Diese Werte wurden basierend auf dem Referenzbild präzise eingestellt

  // 1. ViewBox Dimensionen
  const viewBoxWidth = 420;
  const viewBoxHeight = 180;

  // 2. Farben
  const COLOR_SYMBOL_GRADIENT_START = '#4D8AFF'; // Blau
  const COLOR_SYMBOL_GRADIENT_END = '#9C27B0';   // Lila
  const COLOR_GEM_TEXT = '#2979FF';              // Blau
  const COLOR_DYNAMICS_TEXT = '#AEB8D0';         // Silber-Grau
  const COLOR_SHINE_EFFECT = '#DA70D6';          // Lila-Effekt für die Animation

  // 3. Schrift-Eigenschaften
  const FONT_FAMILY = '"Inter", Arial, sans-serif';
  const FONT_GEM_SIZE = 48;
  const FONT_DYNAMICS_SIZE = 22;
  const DYNAMICS_LETTER_SPACING = 1.5;

  // 4. Animations-Eigenschaften
  const animationSpeed = 0.6;
  const lightSpotRadius = 75;

  // 5. SVG Pfaddaten für das G+D Symbol - präzise nach dem Referenzbild nachgezeichnet mit Bézier-Kurven
  // Äußerer Pfad mit korrekter Hausform und geschwungenen Linien für G und D
  const GD_SYMBOL_OUTER_PATH = "M70,25 L108,25 C116,25 121,25 125,25 L145,45 C145,45 145,80 145,115 L70,115 L70,70 L90,70 C96,70 103,70 110,70 L110,115";
  
  // Innere Ausschnitte für D und G mit Kurven für eine glattere Darstellung
  const GD_SYMBOL_INNER_CUTOUT_PATH = "M85,40 L108,40 C112,40 114,40 118,42 C122,44 124,48 130,55 L130,100 L85,100 L85,70 M85,85 L110,85 L110,70";
    
  // Positionierung für Symbol und Text
  const SYMBOL_TRANSFORM = "translate(0, 0)";
  const GEM_TEXT_X = 165;
  const GEM_TEXT_Y = 78;
  const DYNAMICS_TEXT_X = 165;
  const DYNAMICS_TEXT_Y = 118;

  // Animation-Effekt
  useEffect(() => {
    const animationFrame = requestAnimationFrame(function animate() {
      setAngle(prevAngle => (prevAngle + animationSpeed) % 360);
      requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Berechnung der Lichteffekt-Position
  const calculateShinePosition = () => {
    const radians = (angle * Math.PI) / 180;
    const radius = 60; // Radius der Kreisbahn für den Lichteffekt
    
    // Positionierung im Bereich des Symbols, nicht außerhalb
    const centerX = 105; // Mittelpunkt X des Symbols
    const centerY = 70;  // Mittelpunkt Y des Symbols
    
    const x = centerX + radius * Math.cos(radians);
    const y = centerY + radius * Math.sin(radians);
    
    return { x, y };
  };

  const shinePosition = calculateShinePosition();

  return (
    <svg 
      ref={logoRef}
      width="100%" 
      height="100%" 
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: COLOR_SYMBOL_GRADIENT_START }} />
          <stop offset="100%" style={{ stopColor: COLOR_SYMBOL_GRADIENT_END }} />
        </linearGradient>
        
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
        </filter>
        
        <radialGradient id="shineGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: COLOR_SHINE_EFFECT, stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: COLOR_SHINE_EFFECT, stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {/* Beweglicher Lichteffekt */}
      <circle 
        cx={shinePosition.x} 
        cy={shinePosition.y} 
        r={lightSpotRadius} 
        fill="url(#shineGradient)" 
        filter="url(#glow)"
        opacity="0.6"
      />

      {/* Äußerer Pfad - GD-Logo mit Hausform und geschwungenen Linien */}
      <path 
        d={GD_SYMBOL_OUTER_PATH} 
        fill="url(#logoGradient)"
        transform={SYMBOL_TRANSFORM}
        strokeLinejoin="round"
      />

      {/* Innerer Pfad als Ausschnitt für die GD-Form */}
      <path 
        d={GD_SYMBOL_INNER_CUTOUT_PATH} 
        fill="#121212"
        transform={SYMBOL_TRANSFORM}
        strokeLinejoin="round"
      />

      {/* GEM Text */}
      <text 
        x={GEM_TEXT_X} 
        y={GEM_TEXT_Y} 
        fontFamily={FONT_FAMILY}
        fontSize={FONT_GEM_SIZE}
        fontWeight="bold"
        fill={COLOR_GEM_TEXT}
      >
        GEM
      </text>
      
      {/* DYNAMICS Text */}
      <text 
        x={DYNAMICS_TEXT_X} 
        y={DYNAMICS_TEXT_Y}
        fontFamily={FONT_FAMILY}
        fontSize={FONT_DYNAMICS_SIZE}
        fontWeight="normal"
        letterSpacing={DYNAMICS_LETTER_SPACING}
        fill={COLOR_DYNAMICS_TEXT}
      >
        DYNAMICS
      </text>
    </svg>
  );
};

export default GemDynamicsLogo; 