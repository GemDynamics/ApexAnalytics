import React, { useId } from 'react';

/**
 * GemDynamicsAnimatedLogo Komponente (Version 13.5 - 'E' mit gesättigteren Farben, rollt rückwärts).
 * Zeigt "GEMDYNAMICS" in Großbuchstaben, fett, Schriftart 'Poppins'.
 * Das 'E' in "GEM" hat einen eigenen rollierenden Farbverlauf mit gesättigteren Versionen der Markenfarben und rollt in die entgegengesetzte Richtung.
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
const GemDynamicsAnimatedLogo = ({
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
       Example import is in the App component below. */

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

    /* Styling for the main text gradient (G M DYNAMICS) - scrolls left */
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
        <span className={`logo-text-segment-${uniqueId} logo-text-fill-${uniqueId}`}>G</span><span className={`logo-text-segment-${uniqueId} logo-e-fill-${uniqueId}`}>e</span><span className={`logo-text-segment-${uniqueId} logo-text-fill-${uniqueId}`}>m</span><span className={`logo-text-segment-${uniqueId} logo-text-fill-${uniqueId}`}>Dynamics</span>
      </div>
    </>
  );
};

// Example App Component for Demonstration
const App = () => {
  // Font import for Poppins (ensure you include the weights you need, e.g., 700 for bold)
  const fontImportStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Lexend:wght@800&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap');
  `;

  return (
    <>
      <style>{fontImportStyle}</style>
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 mb-3" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>
            GEMDYNAMICS LOGO V13.5
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            'E' in GEM: More Saturated Brand Colors, Rolls Backwards. Rest: Rolling Blue-Indigo-Purple Gradient. Font: Poppins (Bold, Uppercase).
          </p>
        </div>

        <div className="my-6 sm:my-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl ring-1 ring-slate-700">
          <GemDynamicsAnimatedLogo fontSize="5rem" />
        </div>
        
        <div className="my-6 sm:my-8 p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl ring-1 ring-slate-700">
          <GemDynamicsAnimatedLogo /> 
        </div>
        
        <div className="mt-10 sm:mt-16 p-4 sm:p-6 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg max-w-3xl w-full text-xs sm:text-sm shadow-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
          <h3 className="font-semibold text-base sm:text-lg mb-3 text-slate-100" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>Merkmale (V13.5):</h3>
          <ul className="list-disc list-inside space-y-1.5 sm:space-y-2">
            <li>**Schriftart:** 'Poppins'.</li>
            <li>**Schriftstil:** Gesamter Text in Großbuchstaben und durchgehend fett (Poppins Bold 700).</li>
            <li>**Schriftgröße:** Standardmäßig auf <code className="bg-slate-700 text-slate-100 px-1 py-0.5 rounded">3.5rem</code>.</li>
            <li>**Füllung "E" in GEM:** Stärker gesättigte Versionen der Markenfarben. Rollt rückwärts (nach rechts).</li>
            <li>**Füllung Rest:** Rolling Gradient (Blau-Indigo-Lila). Rollt vorwärts (nach links).</li>
            <li>**Animation:** Alle Teile blenden ein. Farbverläufe scrollen kontinuierlich.</li>
            <li>**Outline:** Keine.</li>
          </ul>
          <div className="mt-4 p-3 bg-slate-700/50 rounded-md">
            <h4 className="font-semibold text-slate-100 mb-2" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>Wichtig: Schriftart laden</h4>
            <p className="text-slate-300">
              Damit 'Poppins' korrekt angezeigt wird, muss die Schriftart in Ihr Projekt geladen werden (mit den benötigten Schriftgewichten, z.B. 700 für Fett). Die Beispiel-App importiert Poppins mit Gewicht 700.
            </p>
            <pre className="bg-slate-900 text-slate-200 p-2 rounded-md mt-2 text-[0.8em] overflow-x-auto">
              <code>
                {`<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap" rel="stylesheet">`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
