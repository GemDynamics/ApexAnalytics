'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

// Farb-Platzhalter basierend auf der Theme-Analyse
// Diese sollten idealerweise aus CSS-Variablen gelesen oder zentral definiert werden,
// aber für die SMIL-Animation müssen sie direkt im SVG sein.
const THEME_COLORS = {
  gradientOuterBlue: '#3A5BF0',    // from baulytics.gradient_start
  gradientOuterViolet: '#5C41E6',  // from baulytics.gradient_mid
  gradientOuterPurple: '#6A27D8',  // from baulytics.gradient_end
  strokeGlowOuter: 'hsl(200, 100%, 60%)', // Placeholder: Bright cyan/blue for glow
  gradientInnerGray1: 'hsl(210, 20%, 85%)', // Placeholder: Subtle light gray
  gradientInnerGray2: 'hsl(210, 15%, 75%)', // Placeholder: Subtle darker light gray
  // --primary HSL values will be used for hover glow via CSS variable if possible
};

// Der Pfad d="..." für outer-path stammt aus der Benutzeranfrage.
// ACHTUNG: Die Pfaddaten für inner-path (beginnend mit "M 44.00,179.52...") fehlen in der Anfrage!
// Ich füge einen leeren d="" Platzhalter für inner-path ein. Bitte ergänzen Sie diesen.
const SVG_PATHS = {
  outer: "M 338.00,330.00 L 0.00,330.00 L 0.00,0.00 L 338.00,0.00 M 87.07,104.08 L 85.00,104.30 L 83.89,104.70 L 81.58,105.69 L 80.25,106.48 L 78.87,107.31 L 78.12,107.81 L 76.58,108.84 L 75.73,109.42 L 73.97,110.65 L 73.01,111.34 L 71.01,112.76 L 69.91,113.54 L 64.28,117.62 L 61.05,120.07 L 59.65,121.19 L 57.02,123.35 L 55.90,124.35 L 53.79,126.31 L 52.90,127.24 L 51.24,129.09 L 50.55,129.99 L 49.25,131.80 L 48.71,132.72 L 47.69,134.58 L 47.27,135.56 L 46.46,137.55 L 46.11,138.62 L 44.94,143.00 L 44.68,144.67 L 44.57,145.68 L 44.38,147.84 L 44.31,149.19 L 44.19,152.11 L 44.15,153.94 L 44.11,155.85 L 44.09,156.91 L 44.06,159.10 L 44.05,160.32 L 44.03,162.85 L 44.02,164.24 L 44.01,167.13 L 44.01,168.72 L 44.00,172.00 L 44.00,173.79 L 44.00,177.50 L 44.00,214.00 L 73.24,214.00 L 80.37,208.59 L 84.31,205.58 L 86.71,203.74 L 87.80,202.89 L 89.90,201.23 L 90.84,200.46 L 92.67,198.97 L 93.48,198.27 L 96.49,195.62 L 97.66,194.43 L 99.78,192.12 L 100.56,191.03 L 101.94,188.85 L 102.41,187.74 L 103.21,185.47 L 103.45,184.23 L 103.82,181.67 L 103.90,180.19 L 104.00,177.10 L 104.00,166.00 L 92.00,166.00 L 92.00,174.05 L 91.94,177.14 L 91.83,178.97 L 91.74,179.78 L 91.27,182.75 L 90.84,183.94 L 89.85,186.13 L 89.11,187.05 L 87.46,188.81 L 86.35,189.64 L 84.66,190.92 L 83.10,192.10 L 82.18,192.80 L 78.18,195.85 L 76.16,197.39 L 73.78,199.20 L 72.45,200.18 L 71.88,200.57 L 70.80,201.29 L 70.32,201.57 L 69.39,202.07 L 68.95,202.25 L 67.22,202.79 L 66.20,202.89 L 65.13,202.97 L 64.51,202.98 L 63.20,203.00 L 56.00,203.00 L 56.00,173.23 L 56.00,168.44 L 56.01,165.52 L 56.01,164.18 L 56.02,161.58 L 56.03,160.40 L 56.04,158.12 L 56.05,157.08 L 56.10,153.23 L 56.14,151.67 L 56.23,148.80 L 56.29,147.66 L 56.43,145.58 L 56.53,144.77 L 56.73,143.29 L 56.85,142.71 L 57.43,140.78 L 57.85,139.98 L 58.78,138.52 L 59.60,137.46 L 60.13,136.88 L 61.25,135.69 L 61.94,135.03 L 63.38,133.68 L 64.23,132.94 L 66.02,131.41 L 67.05,130.57 L 69.21,128.85 L 70.43,127.91 L 72.98,125.97 L 74.40,124.91 L 77.36,122.74 L 79.00,121.56 L 86.99,115.81 L 97.23,123.15 L 105.76,129.59 L 108.33,131.64 L 109.38,132.52 L 110.38,133.37 L 110.81,133.75 L 111.61,134.46 L 111.91,134.75 L 113.33,136.09 L 114.15,136.81 L 114.52,137.11 L 115.89,138.10 L 116.57,138.38 L 117.97,138.82 L 118.88,138.90 L 119.82,138.97 L 120.38,138.98 L 121.55,139.00 L 122.25,139.00 L 124.12,138.99 L 125.13,138.97 L 125.53,138.95 L 126.87,138.83 L 127.21,138.68 L 127.69,138.32 L 127.71,138.01 L 127.62,137.29 L 127.45,136.75 L 126.53,134.23 L 125.76,132.62 L 125.26,131.82 L 124.20,130.23 L 123.54,129.41 L 122.11,127.76 L 121.23,126.88 L 119.35,125.08 L 118.21,124.10 L 115.80,122.08 L 114.37,120.96 L 111.35,118.63 L 109.59,117.33 L 105.88,114.62 L 103.74,113.09 L 100.76,110.97 L 98.96,109.69 L 98.14,109.13 L 95.07,107.05 L 93.77,106.30 L 91.32,104.99 L 90.23,104.61 L 88.11,104.07 M 84.65,143.00 L 79.23,146.73 L 76.52,148.66 L 75.06,149.82 L 74.48,150.42 L 73.42,151.64 L 73.02,152.34 L 72.30,153.82 L 72.04,154.74 L 71.60,156.70 L 71.47,157.94 L 71.24,160.59 L 71.20,162.26 L 71.16,163.98 L 71.15,164.93 L 71.14,166.91 L 71.15,168.01 L 71.16,170.28 L 71.18,171.53 L 71.21,174.11 L 71.23,175.53 L 71.50,195.07 L 76.72,191.29 L 81.94,187.50 L 81.97,173.25 L 81.97,169.89 L 81.97,167.87 L 81.98,166.97 L 82.04,163.62 L 82.16,162.32 L 82.47,159.94 L 82.77,159.06 L 83.50,157.48 L 84.08,156.94 L 85.40,156.01 L 86.34,155.72 L 88.43,155.27 L 89.82,155.16 L 91.28,155.07 L 92.11,155.04 L 93.82,155.01 L 94.79,155.00 L 96.79,154.99 L 97.91,154.99 L 100.22,155.00 L 117.00,155.00 L 117.00,203.00 L 106.93,203.00 L 103.31,203.02 L 101.30,203.07 L 100.45,203.14 L 98.83,203.31 L 98.12,203.46 L 96.74,203.80 L 96.09,204.06 L 94.79,204.64 L 94.12,205.04 L 92.74,205.93 L 91.97,206.50 L 90.36,207.75 L 89.42,208.53 L 87.42,210.20 L 86.22,211.22 L 82.93,214.00 L 129.00,214.00 L 129.00,143.00 M 219.78,188.01 L 219.21,188.23 L 218.92,188.48 L 218.36,189.08 L 218.08,189.51 L 217.52,190.48 L 217.25,191.10 L 216.71,192.44 L 216.44,193.25 L 215.63,195.66 L 215.01,197.45 L 214.69,198.35 L 214.04,200.16 L 213.73,200.99 L 213.13,202.60 L 212.88,203.25 L 212.45,204.34 L 212.28,204.79 L 211.97,205.63 L 211.86,205.96 L 211.52,207.07 L 211.53,207.37 L 211.65,207.83 L 211.89,207.91 L 212.48,208.00 L 212.95,208.00 L 214.49,207.41 L 215.33,206.55 L 215.50,206.00 L 215.99,205.03 L 216.47,204.57 L 216.82,204.42 L 217.59,204.16 L 218.12,204.09 L 219.28,204.00 L 220.03,204.00 L 221.91,204.11 L 222.91,204.29 L 223.30,204.45 L 224.02,204.81 L 224.29,205.07 L 224.80,205.63 L 225.00,206.00 L 226.05,207.22 L 226.95,207.80 L 227.38,207.93 L 228.22,208.10 L 228.52,207.99 L 229.00,207.65 L 229.00,207.25 L 228.85,206.53 L 228.60,205.70 L 228.42,205.15 L 228.02,203.97 L 227.78,203.28 L 227.27,201.84 L 226.98,201.05 L 225.77,197.80 L 225.13,196.18 L 223.87,193.02 L 223.32,191.75 L 222.43,189.97 L 221.84,189.07 L 221.54,188.76 L 220.95,188.23 L 220.66,188.11 L 220.07,187.95 M 235.76,188.00 L 234.83,188.31 L 234.42,188.97 L 234.29,189.67 L 234.18,190.43 L 234.14,190.93 L 234.08,192.01 L 234.06,192.69 L 234.02,194.14 L 234.01,195.02 L 234.00,196.89 L 234.00,198.00 L 234.00,199.92 L 234.01,200.75 L 234.04,202.31 L 234.06,202.97 L 234.11,204.21 L 234.15,204.72 L 234.23,205.66 L 234.29,206.03 L 234.54,207.27 L 234.73,207.57 L 235.16,208.00 L 235.45,208.00 L 236.16,207.66 L 236.52,207.06 L 236.66,206.54 L 236.90,205.33 L 236.99,204.46 L 237.15,202.53 L 237.20,201.25 L 237.50,194.50 L 240.00,198.93 L 242.06,202.15 L 242.68,202.94 L 242.93,203.21 L 243.38,203.64 L 243.52,203.68 L 244.11,203.45 L 244.64,202.97 L 244.96,202.59 L 245.61,201.75 L 245.96,201.23 L 246.66,200.13 L 247.00,199.51 L 248.68,196.65 L 249.52,195.49 L 249.81,195.27 L 250.32,195.06 L 250.45,195.31 L 250.65,196.04 L 250.65,196.75 L 250.66,199.61 L 250.70,201.28 L 250.73,202.01 L 250.80,203.38 L 250.85,203.95 L 250.96,205.04 L 251.04,205.48 L 251.37,207.00 L 251.62,207.41 L 252.15,208.00 L 252.50,208.00 L 253.25,207.59 L 253.60,206.81 L 253.71,206.07 L 253.81,205.27 L 253.85,204.76 L 253.92,203.66 L 253.94,203.00 L 253.98,201.58 L 253.99,200.74 L 254.00,198.97 L 254.00,197.93 L 253.99,194.66 L 253.98,192.90 L 253.96,192.20 L 253.91,190.91 L 253.87,190.43 L 253.77,189.55 L 253.70,189.24 L 253.54,188.69 L 253.43,188.53 L 253.19,188.25 L 253.03,188.18 L 252.30,188.10 L 251.75,188.18 L 250.57,188.64 L 249.77,189.26 L 249.35,189.72 L 248.49,190.77 L 248.04,191.45 L 247.12,192.95 L 246.62,193.87 L 243.75,199.24 L 240.63,193.62 L 239.21,191.26 L 238.30,189.97 L 237.88,189.49 L 237.07,188.63 L 236.71,188.38 L 236.04,188.00 M 262.00,188.00 L 260.90,188.25 L 260.43,188.83 L 260.30,189.50 L 260.18,190.24 L 260.14,190.73 L 260.07,191.81 L 260.05,192.50 L 260.02,193.98 L 260.01,194.89 L 260.00,196.83 L 260.00,198.00 L 260.00,200.20 L 260.01,201.11 L 260.03,202.81 L 260.05,203.50 L 260.10,204.77 L 260.14,205.27 L 260.23,206.17 L 260.30,206.50 L 260.62,207.54 L 260.90,207.75 L 261.53,208.00 L 262.00,208.00 L 263.10,207.75 L 263.57,207.17 L 263.70,206.50 L 263.82,205.76 L 263.86,205.27 L 263.93,204.19 L 263.95,203.50 L 263.98,202.02 L 263.99,201.11 L 264.00,199.17 L 264.00,198.00 L 263.99,194.89 L 263.97,193.19 L 263.95,192.50 L 263.90,191.23 L 263.86,190.73 L 263.77,189.83 L 263.70,189.50 L 263.38,188.46 L 263.10,188.25 L 262.47,188.00 M 205.00,188.00 L 203.93,188.20 L 203.46,188.63 L 203.32,189.09 L 203.11,190.21 L 203.06,191.12 L 203.02,192.11 L 203.01,192.71 L 203.00,193.98 L 203.00,201.48 L 198.48,194.74 L 196.31,191.63 L 195.10,190.03 L 194.60,189.47 L 193.67,188.53 L 193.29,188.31 L 192.60,188.03 L 192.33,188.14 L 191.85,188.55 L 191.67,189.01 L 191.37,190.11 L 191.27,190.93 L 191.10,192.74 L 191.06,193.92 L 191.00,196.45 L 191.00,198.00 L 191.00,199.92 L 191.01,200.75 L 191.04,202.31 L 191.06,202.97 L 191.11,204.21 L 191.15,204.72 L 191.23,205.66 L 191.29,206.03 L 191.54,207.27 L 191.73,207.57 L 192.16,208.00 L 192.45,208.00 L 193.16,207.67 L 193.52,207.08 L 193.66,206.56 L 193.90,205.37 L 193.99,204.51 L 194.15,202.62 L 194.20,201.36 L 194.50,194.73 L 199.00,201.34 L 200.94,204.00 L 202.17,205.51 L 202.73,206.10 L 203.78,207.16 L 204.21,207.48 L 204.99,207.97 L 205.25,207.98 L 206.18,207.67 L 206.59,207.02 L 206.71,206.32 L 206.82,205.56 L 206.86,205.06 L 206.92,203.98 L 206.94,203.30 L 206.98,201.85 L 206.99,200.98 L 207.00,199.11 L 207.00,198.00 L 206.99,194.89 L 206.97,193.19 L 206.95,192.50 L 206.90,191.23 L 206.86,190.73 L 206.77,189.83 L 206.70,189.50 L 206.38,188.46 L 206.10,188.25 L 205.47,188.00 M 279.25,188.00 L 275.99,188.45 L 274.08,189.16 L 273.27,189.68 L 271.75,190.84 L 271.15,191.55 L 270.06,193.05 L 269.69,193.89 L 269.08,195.63 L 268.97,196.56 L 268.88,198.43 L 269.05,199.38 L 269.54,201.28 L 270.01,202.21 L 271.11,204.04 L 271.90,204.89 L 273.03,206.05 L 273.54,206.46 L 274.55,207.18 L 275.09,207.41 L 276.20,207.78 L 276.87,207.88 L 278.30,208.00 L 279.21,208.00 L 281.38,207.88 L 282.62,207.67 L 283.16,207.49 L 284.21,207.08 L 284.68,206.79 L 285.59,206.16 L 286.03,205.76 L 287.13,204.65 L 287.56,204.11 L 287.63,203.92 L 287.66,203.58 L 287.54,203.47 L 287.21,203.28 L 286.90,203.22 L 285.00,203.44 L 283.35,203.98 L 282.58,204.37 L 279.82,205.18 L 277.97,205.16 L 277.11,204.89 L 275.46,204.18 L 274.78,203.60 L 273.53,202.27 L 273.14,201.40 L 272.28,199.14 L 272.05,197.91 L 272.12,197.34 L 272.38,196.23 L 272.70,195.63 L 273.48,194.39 L 274.07,193.63 L 276.10,191.88 L 277.67,191.17 L 278.52,191.06 L 280.23,191.00 L 281.07,191.22 L 282.75,191.83 L 283.52,192.39 L 285.25,193.22 L 286.39,193.40 L 286.76,193.26 L 287.29,192.90 L 287.40,192.57 L 287.33,192.34 L 287.11,191.85 L 286.87,191.52 L 286.30,190.82 L 285.88,190.37 L 284.60,189.24 L 283.70,188.70 L 283.18,188.51 L 282.10,188.20 L 281.46,188.12 L 280.08,188.00 M 298.48,188.05 L 296.52,188.19 L 295.65,188.46 L 294.03,189.11 L 293.52,189.63 L 292.59,190.78 L 292.19,191.58 L 292.09,191.98 L 291.96,192.79 L 291.99,193.19 L 292.13,194.01 L 292.30,194.41 L 293.24,196.03 L 294.10,196.80 L 296.07,198.31 L 297.43,199.00 L 299.35,200.02 L 300.40,200.64 L 300.82,200.93 L 301.58,201.49 L 301.85,201.74 L 302.33,202.25 L 302.47,202.48 L 302.68,202.94 L 302.68,203.16 L 302.62,203.59 L 302.49,203.80 L 301.71,204.62 L 300.94,205.03 L 299.73,205.54 L 299.02,205.66 L 298.66,205.60 L 297.93,205.39 L 297.50,205.16 L 296.60,204.60 L 296.04,204.19 L 294.74,203.37 L 293.94,202.99 L 293.59,202.89 L 292.92,202.74 L 292.64,202.74 L 292.14,202.80 L 291.96,202.89 L 291.66,203.13 L 291.59,203.31 L 291.52,203.71 L 291.59,203.96 L 291.79,204.51 L 292.00,204.83 L 292.50,205.50 L 292.88,205.88 L 293.94,206.77 L 294.57,207.08 L 295.88,207.62 L 296.59,207.77 L 298.02,207.98 L 298.76,207.97 L 300.21,207.88 L 300.91,207.73 L 302.27,207.36 L 302.88,207.08 L 304.04,206.46 L 304.50,206.07 L 305.34,205.22 L 305.60,204.72 L 306.00,203.66 L 306.00,203.07 L 305.51,200.99 L 304.74,199.63 L 304.19,199.02 L 303.00,197.87 L 302.30,197.44 L 300.84,196.68 L 300.07,196.51 L 297.62,195.61 L 296.21,194.75 L 295.86,194.33 L 295.28,193.49 L 295.13,193.03 L 295.17,192.81 L 295.35,192.39 L 295.56,192.16 L 296.08,191.69 L 296.47,191.40 L 297.53,190.73 L 298.14,190.52 L 298.44,190.53 L 299.04,190.62 L 299.40,190.78 L 300.16,191.19 L 300.65,191.51 L 302.06,192.32 L 302.89,192.68 L 303.24,192.77 L 303.90,192.91 L 304.15,192.91 L 304.61,192.84 L 304.76,192.74 L 305.00,192.49 L 305.03,192.30 L 305.02,191.87 L 304.92,191.61 L 304.65,191.03 L 304.40,190.69 L 303.83,189.97 L 303.43,189.57 L 301.31,188.42 L 299.46,188.05 Z",
  inner: "", // BITTE HIER DIE PFADDATEN FÜR INNER-PATH ERGÄNZEN (beginnend mit M 44.00,179.52)
};

const AnimatedApexLogo: React.FC<{ className?: string }> = ({ className }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const outerPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (outerPathRef.current && svgRef.current) {
      const length = outerPathRef.current.getTotalLength();
      svgRef.current.style.setProperty('--outer-path-length', length.toString());
    }
  }, []);

  return (
    <>
      <Link href="/" aria-label="ApexAnalytics Homepage">
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          width="338"
          height="330"
          viewBox="0 0 338 330"
          className={className} // e.g., "h-8 w-auto" or "h-10 w-auto"
        >
          <defs>
            <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <linearGradient id="animatedGradientOuter">
              <stop offset="0%" stopColor={THEME_COLORS.gradientOuterBlue}>
                <animate attributeName="stop-color" values={`${THEME_COLORS.gradientOuterBlue};${THEME_COLORS.gradientOuterViolet};${THEME_COLORS.gradientOuterPurple};${THEME_COLORS.gradientOuterBlue}`} dur="10s" repeatCount="indefinite"/>
              </stop>
              <stop offset="50%" stopColor={THEME_COLORS.gradientOuterViolet}>
                 <animate attributeName="stop-color" values={`${THEME_COLORS.gradientOuterViolet};${THEME_COLORS.gradientOuterPurple};${THEME_COLORS.gradientOuterBlue};${THEME_COLORS.gradientOuterViolet}`} dur="10s" repeatCount="indefinite"/>
              </stop>
              <stop offset="100%" stopColor={THEME_COLORS.gradientOuterPurple}>
                 <animate attributeName="stop-color" values={`${THEME_COLORS.gradientOuterPurple};${THEME_COLORS.gradientOuterBlue};${THEME_COLORS.gradientOuterViolet};${THEME_COLORS.gradientOuterPurple}`} dur="10s" repeatCount="indefinite"/>
              </stop>
              <animateTransform attributeName="gradientTransform" type="rotate" values="0 0.5 0.5; 360 0.5 0.5" dur="15s" repeatCount="indefinite" />
            </linearGradient>

            <linearGradient id="animatedGradientInner">
              <stop offset="0%" stopColor={THEME_COLORS.gradientInnerGray1}>
                <animate attributeName="stop-color" values={`${THEME_COLORS.gradientInnerGray1};${THEME_COLORS.gradientInnerGray2};${THEME_COLORS.gradientInnerGray1}`} dur="12s" repeatCount="indefinite"/>
              </stop>
              <stop offset="100%" stopColor={THEME_COLORS.gradientInnerGray2}>
                <animate attributeName="stop-color" values={`${THEME_COLORS.gradientInnerGray2};${THEME_COLORS.gradientInnerGray1};${THEME_COLORS.gradientInnerGray2}`} dur="12s" repeatCount="indefinite"/>
              </stop>
              <animateTransform attributeName="gradientTransform" type="rotate" values="45 0.5 0.5; 405 0.5 0.5" dur="18s" repeatCount="indefinite" />
            </linearGradient>
          </defs>
          <g className="logo-group">
            <path
              ref={outerPathRef}
              id="outer-path"
              d={SVG_PATHS.outer}
              fill="none" // Initial fill overridden by CSS animation
            />
            {/* BITTE ERGÄNZEN SIE DIE FEHLENDEN PFADDATEN (d="...") FÜR inner-path HIER: */}
            <path
              id="inner-path"
              d={SVG_PATHS.inner} // Dieser Pfad ist aktuell leer!
              fill="none" // Initial fill overridden by CSS animation
            />
          </g>
        </svg>
      </Link>
      <style jsx>{`
        /* Fallback, wird per JS gesetzt */
        /* :root wird hier nicht benötigt, da die Variable direkt am SVG-Element gesetzt wird */

        .logo-group:hover {
          filter: drop-shadow(0 0 5px hsl(var(--primary, ${THEME_COLORS.strokeGlowOuter}) / 0.7)) drop-shadow(0 0 10px hsl(var(--primary, ${THEME_COLORS.strokeGlowOuter}) / 0.5));
          transform: scale(1.03);
          transition: filter 0.3s ease-out, transform 0.3s ease-out;
        }
        .logo-group {
          transition: filter 0.3s ease-out, transform 0.3s ease-out;
        }


        #outer-path {
          fill: url(#animatedGradientOuter);
          fill-opacity: 0; /* Startet mit unsichtbarer Füllung */

          stroke: ${THEME_COLORS.strokeGlowOuter};
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: url(#glowEffect); /* Glow-Effekt auf den Strich */

          stroke-dasharray: var(--outer-path-length, 2345); /* Fallback im CSS */
          stroke-dashoffset: var(--outer-path-length, 2345);

          animation: drawAndRevealOuterPath 7s linear forwards;
        }

        #inner-path {
          fill: url(#animatedGradientInner);
          stroke: none; /* Kein Strich */
          opacity: 0; /* Startet unsichtbar */
          animation: fadeInInnerPathFill 2s linear 6.8s forwards;
        }
        
        /* Wenn der inner-path keine Daten hat, blenden wir ihn nicht ein */
        ${SVG_PATHS.inner === '' ? '#inner-path { display: none !important; }' : ''}


        @keyframes drawAndRevealOuterPath {
          0% {
            stroke-dashoffset: var(--outer-path-length, 2345); /* Strich startet ungezogen */
            fill-opacity: 0; /* Füllung ist unsichtbar */
            stroke-opacity: 1;
          }
          70% { /* Strich Zeichenphase */
            stroke-dashoffset: 0; /* Strich komplett gezeichnet */
            fill-opacity: 0; /* Füllung bleibt unsichtbar */
            stroke-opacity: 1; /* Leuchtender Strich ist sichtbar */
          }
          100% {
            stroke-dashoffset: 0; /* Strich bleibt gezeichnet */
            fill-opacity: 1; /* Füllung (mit Rolling Gradient) wird voll sichtbar */
            /* Optional: Strich verstecken oder ändern, nachdem Füllung sichtbar ist: */
            /* stroke-opacity: 0; */
            /* filter: none; */
          }
        }

        @keyframes fadeInInnerPathFill {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default AnimatedApexLogo; 