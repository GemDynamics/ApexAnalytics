import React, { useId } from 'react';

/**
 * ApexAnalyticsAnimatedLogo Komponente (Version 14.0 - Text zu APEXANALYTICS geändert).
 * Zeigt "APEXANALYTICS" in Großbuchstaben, fett, Schriftart 'Poppins'.
 * Das 'E' in "APEX" hat einen eigenen rollierenden Farbverlauf mit gesättigteren Versionen der Markenfarben und rollt in die entgegengesetzte Richtung.
 * Der Rest des Textes hat einen animierten Farbverlauf (blau/indigo/lila).
 * Die Animationen sind so eingestellt, dass sie perfekt schleifen.
 * Keine Outline.
 * Standard-Schriftgröße 3.5rem.
 *
 * @param {object} props - Die Props der Komponente.
 * @param {string} [props.className] - Optionale zusätzliche CSS-Klassen für den Container.
 * @param {string} [props.fontSize='3.5rem'] - CSS-Schriftgröße (z.B. '3.5rem', '48px'). Standard ist 3.5rem.
 * @returns {JSX.Element} Die gerenderte animierte Logo-Komponente.
 */
const ApexAnalyticsAnimatedLogo = ({
  className = '',
  fontSize = '3.5rem', // Default font size
}) => {
  const uniqueId = useId().replace(/:/g, '');

  // Colors for the main text fill gradient
  const brandBlue = '#3A5BF0';
  const brandIndigo = '#5C41E6';
  const brandPurple = '#6A27D8';

  // More saturated versions of brand colors for the 'E'
  const eSaturatedBlue = '#5D82F9';    // More saturated version of a light brandBlue
  const eSaturatedIndigo = '#8A74EF';  // More saturated version of a light brandIndigo
  const eSaturatedPurple = '#935DE5';  // More saturated version of a light brandPurple

  const textLineHeight = 1.2;
  const newFontFamily = "'Poppins', sans-serif"; 
  const fontWeight = 700; // Poppins Bold

  const styles = `
    /* Ensure Poppins font (with desired weights, e.g., 700 for Bold) is loaded in your project.
       This was handled in app/layout.tsx */

    .animated-logo-container-${uniqueId} {
      position: relative;
      display: inline-block;
      font-family: ${newFontFamily};
      font-size: ${fontSize};
      line-height: ${textLineHeight};
      user-select: none;
      text-transform: uppercase;
      font-weight: ${fontWeight}; /* Apply bold font weight */
    }

    .logo-text-segment-${uniqueId} {
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      position: relative;
      opacity: 0; 
      animation-fill-mode: forwards;
    }

    /* Styling for the main text gradient (AP X ANALYTICS) - scrolls left */
    .logo-text-fill-${uniqueId} {
      background-image: linear-gradient(
        90deg,
        ${brandBlue} 0%,
        ${brandIndigo} 25%,
        ${brandPurple} 50%,
        ${brandIndigo} 75%,
        ${brandBlue} 100% 
      );
      background-size: 300% 100%; 
      animation:
        gradient-scroll-fill-${uniqueId} 6s linear infinite 1.5s,
        fade-in-fill-${uniqueId} 1.5s ease-out 1.5s forwards;
    }

    /* Styling for the 'E' character's gradient - more saturated colors, scrolls right (backwards) */
    .logo-e-fill-${uniqueId} {
      background-image: linear-gradient(
        90deg,
        ${eSaturatedBlue} 0%,
        ${eSaturatedIndigo} 25%,
        ${eSaturatedPurple} 50%,
        ${eSaturatedIndigo} 75%,
        ${eSaturatedBlue} 100% 
      );
      background-size: 300% 100%; /* Matches main gradient structure */
      animation:
        gradient-scroll-e-${uniqueId} 6s linear infinite 1.5s, /* Speed matches main scroll, direction is reversed below */
        fade-in-fill-${uniqueId} 1.5s ease-out 1.5s forwards;
    }

    /* Main text gradient scrolls left */
    @keyframes gradient-scroll-fill-${uniqueId} {
      0% { background-position: 0% 50%; }
      100% { background-position: -200% 50%; } 
    }

    /* 'E' gradient scrolls right (backwards compared to main text) */
    @keyframes gradient-scroll-e-${uniqueId} {
      0% { background-position: 0% 50%; } /* Start at the same visual point */
      100% { background-position: 200% 50%; } /* Scrolls right by 2x element width */
    }
    
    @keyframes fade-in-fill-${uniqueId} {
      to { opacity: 1; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className={`animated-logo-container-${uniqueId} ${className}`}>
        <span className={`logo-text-segment-${uniqueId} logo-text-fill-${uniqueId}`}>Ap</span><span className={`logo-text-segment-${uniqueId} logo-e-fill-${uniqueId}`}>e</span><span className={`logo-text-segment-${uniqueId} logo-text-fill-${uniqueId}`}>x</span><span className={`logo-text-segment-${uniqueId} logo-text-fill-${uniqueId}`}>Analytics</span>
      </div>
    </>
  );
};

export default ApexAnalyticsAnimatedLogo;
