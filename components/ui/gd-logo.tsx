// DiamondLogo.jsx
import React from 'react';

/**
 * DiamondLogo Component
 * Renders a diamond-shaped SVG logo with a rolling gradient.
 * The gradient and its animation are handled using SVG SMIL, making the component self-contained.
 * This version features a diamond shape similar to a playing card suit (Karo).
 * @param {object} props - Component props.
 * @param {string} [props.size="w-32 h-32"] - Tailwind CSS classes for the logo size (e.g., "w-24 h-24", "w-48 h-48").
 */
const DiamondLogo = ({ size = "w-32 h-32" }) => {
  // Unique ID for SVG gradient to prevent conflicts if multiple logos are on the page
  const gradientId = React.useId ? React.useId() : `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      className={size} // Apply Tailwind size classes
      viewBox="0 0 100 100" // Defines the internal coordinate system of the SVG
      preserveAspectRatio="xMidYMid meet" // Ensures the SVG scales nicely
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Firmenlogo Karo-Form" // Accessibility: describe the logo
      role="img"
    >
      <defs>
        {/* Define the rolling linear gradient.
          gradientUnits="userSpaceOnUse" means x1,y1,x2,y2 are in viewBox coordinates.
          The gradient is 200 units wide (x2="200") for a 100-unit wide diamond.
          It displays a pattern of ColorA-ColorB-ColorC-ColorA over these 200 units.
          The animateTransform then shifts this gradient left by 100 units, creating the rolling effect.
        */}
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="50" x2="200" y2="50">
          <stop offset="0%" stopColor="#3A5BF0" />       {/* Blau */}
          <stop offset="16.66%" stopColor="#5C41E6" />  {/* Indigo/Violett */}
          <stop offset="33.33%" stopColor="#6A27D8" />  {/* Lila */}
          <stop offset="50%" stopColor="#3A5BF0" />       {/* Blau (to repeat pattern) */}
          <stop offset="66.66%" stopColor="#5C41E6" />  {/* Indigo/Violett */}
          <stop offset="83.33%" stopColor="#6A27D8" />  {/* Lila */}
          <stop offset="100%" stopColor="#3A5BF0" />     {/* Blau */}
          
          {/* SMIL animation to translate the gradient, creating the "rolling" effect */}
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            values="0 0; -100 0; 0 0" // Start, move left by diamond width, back to start for smooth loop
            keyTimes="0; 0.5; 1"      // Animation timing: 50% to target, 50% back (or hold)
            dur="4s"                  // Duration of one animation cycle
            repeatCount="indefinite"  // Loop indefinitely
          />
        </linearGradient>
      </defs>

      {/* Diamond Shape - Karo (Playing Card Suit) */}
      {/* Drawn using a polygon. Points are (x,y) pairs for a rhombus. */}
      {/* Filled with the animated gradient defined above. */}
      <polygon
        points="50,0 100,50 50,100 0,50"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
};

export default DiamondLogo;

// Example Usage (if you want to test it in an App component):
/*
function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div>
        <h2 className="text-center text-2xl font-bold mb-4">SVG Logo - Karo Form</h2>
        <DiamondLogo size="w-48 h-48" />
      </div>
      <div className="mt-8">
        <p className="text-center mt-4">Kleinere Version:</p>
        <DiamondLogo size="w-24 h-24" />
      </div>
    </div>
  );
}
*/
