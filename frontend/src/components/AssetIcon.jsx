import React from 'react';

/**
 * Military Platform Silhouette Icons (40x40px minimum)
 * Clean, recognizable vector line-art silhouettes designed specifically
 * for IAF assets: Delta-Wing Fighter, Multi-Blade Transport Helicopter, Tracked Armoured Vehicle.
 * All cutouts use transparent negative space (fillRule="evenodd") so they adapt perfectly
 * to any container background in both Light and Dark themes.
 */
export default function AssetIcon({ type, imageUrl, size = 44, className = '' }) {
  const isJet = type?.includes('Jet') || imageUrl?.includes('fighter-jet');
  const isHeli = type?.includes('Helicopter') || imageUrl?.includes('helicopter');
  const isVehicle = type?.includes('Armoured') || imageUrl?.includes('armoured-vehicle');

  if (isJet) {
    // Delta-wing fighter silhouette (Tejas Mk1A / Mirage 2000 / Su-30MKI style)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="currentColor"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
        aria-label="Delta-Wing Fighter Jet"
      >
        {/* Needle Nose Cone */}
        <polygon points="32,2 29.5,9 34.5,9" />
        
        {/* Cockpit Canopy Window (Subtle cutout / transparent line) */}
        <path
          fillRule="evenodd"
          d="M30,9 L34,9 L34.5,19 L29.5,19 Z M31,11 L33,11 L33,17 L31,17 Z"
        />

        {/* Fuselage, Foreplanes/Canards, and Large Delta Wings */}
        <path d="
          M29.5,19 
          L22,23 L22,25.5 L29,24.5 
          L28,34 
          L4,46 L4,49.5 L28,46.5 
          L27,56 L20,60 L20,62 L32,59 L44,62 L44,60 L37,56 
          L36,46.5 L60,49.5 L60,46 
          L36,34 
          L35,24.5 L42,25.5 L42,23 
          L34.5,19 
          Z
        " />

        {/* Twin Engine Exhaust Nozzles */}
        <rect x="28.5" y="58" width="2.5" height="4" rx="0.8" />
        <rect x="33" y="58" width="2.5" height="4" rx="0.8" />
        {/* Wingtip Missile Rails */}
        <rect x="3" y="44" width="1.5" height="7" rx="0.5" />
        <rect x="59.5" y="44" width="1.5" height="7" rx="0.5" />
      </svg>
    );
  }

  if (isHeli) {
    // Multi-blade transport helicopter silhouette (Mi-17V-5 / Chinook / ALH Dhruv style)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="currentColor"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
        aria-label="Multi-Blade Transport Helicopter"
      >
        {/* 5-Blade Rotor System: Hub & Wide Rotor Disc */}
        <rect x="3" y="8" width="58" height="2.5" rx="1.2" />
        {/* Rotor Mast & Swashplate Assembly */}
        <rect x="29" y="10.5" width="6" height="4" rx="0.5" />
        <rect x="26.5" y="13" width="11" height="2" rx="0.8" />

        {/* Engine Turbines & Main Cabin Fuselage with transparent window cutouts (evenodd) */}
        <path
          fillRule="evenodd"
          d="
            M22,15 L42,15 C44,15 46,17 46,19 L20,19 C20,17 21,15 22,15 Z 
            M12,19 C6,22 3,27 3,33 C3,39 7,43 16,43 L38,43 C43,43 47,39 49,34 
            L61,29 L61,27 L48,28 L44,19 Z
            M7,28 C8.5,24 12,22.5 15,22.5 L15,28.5 L7,28.5 Z
            M19,25 L24,25 L24,30 L19,30 Z
            M27,25 L32,25 L32,30 L27,30 Z
            M35,25 L40,25 L40,30 L35,30 Z
          "
        />

        {/* Upswept Tail Rotor (Vertical Fin & Multi-Blade Tail Rotor) */}
        <rect x="59.5" y="19" width="2.5" height="15" rx="1" />
        <rect x="57" y="25" width="7.5" height="2" rx="0.5" />

        {/* Heavy Landing Gear Struts & Sponsons */}
        <rect x="13" y="47.5" width="28" height="2.5" rx="1.2" />
        <rect x="17" y="43" width="2.5" height="5" />
        <rect x="33" y="43" width="2.5" height="5" />
      </svg>
    );
  }

  // Tracked Armoured Vehicle (T-90 Bhishma / BMP-2 style)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Tracked Armoured Vehicle"
    >
      {/* 125mm Smoothbore Main Gun Barrel with Muzzle Brake & Bore Evacuator */}
      <rect x="2" y="21.5" width="23" height="3" rx="1" />
      <rect x="2" y="20.5" width="4" height="5" rx="1" />
      <rect x="14" y="20" width="3.5" height="6" rx="0.8" />

      {/* Low-Profile Commander Turret with Sight & Antenna */}
      <path d="M23,17.5 L39,17.5 L45,26.5 L21,26.5 Z" />
      <rect x="28" y="14" width="8" height="3.5" rx="1" />
      <line x1="34" y1="14" x2="34" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

      {/* Sloped Hull Glacis Armor & Rear Engine Grille */}
      <path d="M10,26.5 L53,26.5 L61,33.5 L57,41.5 L7,41.5 L9,31.5 Z" />

      {/* Continuous Caterpillar Track with 6 Road Wheels cut out transparently via fillRule="evenodd" */}
      <path
        fillRule="evenodd"
        d="
          M6,40.5 L58,40.5 C61.3,40.5 64,43.2 64,46.5 C64,49.8 61.3,52.5 58,52.5 L6,52.5 C2.7,52.5 0,49.8 0,46.5 C0,43.2 2.7,40.5 6,40.5 Z
          M12,46.5 A3.5,3.5 0 1,0 12,46.49 Z
          M20,46.5 A3.5,3.5 0 1,0 20,46.49 Z
          M28,46.5 A3.5,3.5 0 1,0 28,46.49 Z
          M36,46.5 A3.5,3.5 0 1,0 36,46.49 Z
          M44,46.5 A3.5,3.5 0 1,0 44,46.49 Z
          M52,46.5 A3.5,3.5 0 1,0 52,46.49 Z
        "
      />
    </svg>
  );
}
