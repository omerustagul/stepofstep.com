
export interface BrandProfile {
    name: string;
    slogan?: string;
    industry: string;
    spirit: string; // "Bold", "Calm", "Tech", "Organic", "Gold", "Blue" etc.
    geometry: string; // "Sharp", "Round", "Abstract"
    vibe: string; // "Minimal", "Luxury", "Playful"
    details?: string; // New field for specific visual requests (e.g. "Teknik Direktör")
}

export interface LogoResult {
    id: string;
    svg: string;
    description: string;
}

// Helper to generate unique IDs
const uuid = () => Math.random().toString(36).substring(2, 9);

// --- COMPLEX ASSET LIBRARY v3 (STRICT CONTEXT) ---
export const COMPLEX_ASSETS = {
    defs: `
        <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#F5D061;stop-opacity:1" />
                <stop offset="40%" style="stop-color:#E1B32E;stop-opacity:1" />
                <stop offset="60%" style="stop-color:#E5C365;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#B38510;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#F0F0F0;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#A0A0A0;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#E0E0E0;stop-opacity:1" />
            </linearGradient>
             <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#E6AC75;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#A66D3D;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#CD7F32;stop-opacity:1" />
            </linearGradient>
            <filter id="dropshadow" height="130%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="2" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge> 
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
    `,

    // Pro Figures
    managerSilhouettePro: `
        <g transform="translate(60, 45) scale(0.6)">
            <path d="M50 0 C30 0 15 15 15 35 C15 50 25 60 30 65 L30 75 L70 75 L70 65 C75 60 85 50 85 35 C85 15 70 0 50 0 Z" fill="#111" stroke="none" />
            <path d="M10 80 Q50 70 90 80 L100 90 L100 180 L0 180 L0 90 Z" fill="#1a1a1a" />
            <path d="M30 80 L50 140 L70 80" fill="#fff" />
            <path d="M45 80 L55 80 L52 130 L48 130 Z" fill="#D4AF37" />
            <path d="M10 90 L30 140 L30 80" fill="#222" />
            <path d="M90 90 L70 140 L70 80" fill="#222" />
        </g>
    `,

    footballPlayerPro: `
         <g transform="translate(60, 40) scale(0.6)">
            <circle cx="50" cy="20" r="15" fill="#111" />
            <path d="M40 40 L60 40 L70 90 L30 90 Z" fill="#1a1a1a" /> 
            <path d="M35 90 L20 130 L40 130 L50 100" fill="#111" />
            <path d="M65 90 L85 120 L75 130 L55 100" fill="#111" />
            <path d="M40 45 L10 70" stroke="#111" stroke-width="8" stroke-linecap="round"/>
            <path d="M60 45 L90 70" stroke="#111" stroke-width="8" stroke-linecap="round"/>
         </g>
    `,

    // New: Winged Ball (Club Crest Element)
    wingedBall: `
        <g transform="translate(50, 60) scale(0.5)">
             <!-- Wings -->
             <path d="M20 60 Q-20 0 80 20" fill="#111" />
             <path d="M180 60 Q220 0 120 20" fill="#111" />
             <!-- Ball -->
             <circle cx="100" cy="60" r="40" fill="white" stroke="#111" stroke-width="4"/>
             <path d="M100 40 L100 80 M80 60 L120 60" stroke="#111" stroke-width="4"/>
        </g>
    `,

    // New: Tactics Board (Coach Element)
    tacticsBoard: `
        <rect x="50" y="50" width="100" height="100" rx="5" fill="#2E7D32" stroke="white" stroke-width="4"/>
        <path d="M100 50 L100 150" stroke="white" stroke-width="2"/>
        <circle cx="100" cy="100" r="15" fill="none" stroke="white" stroke-width="2"/>
        <path d="M50 80 L70 90 L50 100" fill="none" stroke="white" stroke-width="2" stroke-dasharray="4 4"/>
        <circle cx="70" cy="90" r="4" fill="white"/>
    `,

    shieldHeraldic: `
        <path d="M25 40 Q100 10 175 40 L175 60 C175 160 100 190 100 190 C100 190 25 160 25 60 Z" fill="none" stroke="url(#goldGrad)" stroke-width="6" filter="url(#dropshadow)"/>
        <path d="M35 50 Q100 25 165 50 L165 65 C165 150 100 175 100 175 C100 175 35 150 35 65 Z" fill="#1a1a1a" stroke="none"/>
    `,

    gearPro: `
        <path d="M100 30 L110 10 L130 20 L125 40 C135 45 145 55 150 65 L170 60 L180 80 L160 90 C162 100 160 110 155 120 L175 130 L165 150 L145 140 C135 150 125 155 115 160 L120 180 L100 190 L90 170 C80 168 70 160 60 150 L40 160 L30 140 L50 130 C48 120 50 110 55 100 L35 90 L45 70 L65 80 C75 70 85 65 95 60 L90 40 Z" fill="none" stroke="#D4AF37" stroke-width="4"/>
        <circle cx="100" cy="100" r="30" fill="none" stroke="white" stroke-width="2"/>
    `
};

export const generateLogos = (profile: BrandProfile): LogoResult[] => {
    const logos: LogoResult[] = [];
    const seedName = profile.name.toUpperCase();
    const initials = seedName.substring(0, 2).replace(/[^A-Z]/g, '') || "X";

    // Determine context
    const isFootball = profile.industry.toLowerCase().includes('futbol') || profile.industry.toLowerCase().includes('spor') || profile.industry.toLowerCase().includes('kulüp');
    const isTech = profile.industry.toLowerCase().includes('tekno') || profile.industry.toLowerCase().includes('yazılım');
    const visualDetail = profile.details?.toLowerCase() || '';

    // --- STRICT CONTEXT BRANCHING ---
    // If user is Football/Manager, we do NOT use generic concepts. 
    // We generate 4 distinct FOOTBALL/MANAGER concepts.

    if (isFootball || visualDetail.includes('menajer') || visualDetail.includes('teknik')) {

        // C1: ELITE MANAGER (The "Club Saga" Reference)
        const c1_svg = `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                ${COMPLEX_ASSETS.defs}
                ${COMPLEX_ASSETS.shieldHeraldic}
                <path d="M45 140 Q35 100 55 70" fill="none" stroke="url(#goldGrad)" stroke-width="2" opacity="0.5"/>
                <path d="M155 140 Q165 100 145 70" fill="none" stroke="url(#goldGrad)" stroke-width="2" opacity="0.5"/>
                ${visualDetail.includes('futbol') ? COMPLEX_ASSETS.footballPlayerPro : COMPLEX_ASSETS.managerSilhouettePro}
                <path d="M20 150 L180 150 L160 180 L40 180 Z" fill="url(#goldGrad)" filter="url(#dropshadow)" />
                <rect x="40" y="155" width="120" height="20" fill="#111" />
                <text x="100" y="170" font-family="sans-serif" font-weight="900" font-size="12" fill="white" text-anchor="middle" letter-spacing="2">EST. 2024</text>
                <path d="M30 65 Q100 0 170 65" fill="none" id="curveTopPro" />
                 <text font-family="serif" font-weight="900" font-size="28" fill="url(#goldGrad)" text-anchor="middle" filter="url(#dropshadow)">
                    <textPath href="#curveTopPro" startOffset="50%">${profile.name}</textPath>
                </text>
            </svg>
        `;
        logos.push({ id: uuid(), svg: c1_svg, description: 'Elite Manager Emblem' });

        // C2: CLUB CREST (Traditional)
        // Round badge with "Winged Ball" or Star
        const c2_svg = `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                ${COMPLEX_ASSETS.defs}
                <circle cx="100" cy="100" r="90" fill="#111" stroke="url(#silverGrad)" stroke-width="4" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="white" stroke-width="1" />
                
                ${COMPLEX_ASSETS.wingedBall}
                
                <text x="100" y="160" font-family="sans-serif" font-weight="bold" font-size="16" fill="white" text-anchor="middle" letter-spacing="2">${profile.name}</text>
                <path d="M60 40 L70 20 L80 40" fill="url(#goldGrad)"/>
                <path d="M120 40 L130 20 L140 40" fill="url(#goldGrad)"/>
            </svg>
        `;
        logos.push({ id: uuid(), svg: c2_svg, description: 'Traditional Club Crest' });

        // C3: THE TACTICIAN (Modern Icon)
        // Focus on the strategy aspect (since it is a Manager game)
        const c3_svg = `
             <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                ${COMPLEX_ASSETS.defs}
                <rect width="200" height="200" rx="30" fill="#1a1a1a" />
                <g transform="translate(0, -10)">
                    ${COMPLEX_ASSETS.tacticsBoard}
                </g>
                <text x="100" y="180" font-family="monospace" font-weight="bold" font-size="24" fill="white" text-anchor="middle">MANAGER</text>
            </svg>
        `;
        logos.push({ id: uuid(), svg: c3_svg, description: 'Tactician Icon' });

        // C4: VARSITY HERO (Typography)
        // Collegiate style font simulation
        const c4_svg = `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                ${COMPLEX_ASSETS.defs}
                
                <text x="100" y="120" font-family="serif" font-weight="900" font-size="140" fill="none" stroke="url(#bronzeGrad)" stroke-width="4" text-anchor="middle">${initials.charAt(0)}</text>
                <text x="105" y="125" font-family="serif" font-weight="900" font-size="140" fill="url(#goldGrad)" text-anchor="middle" filter="url(#dropshadow)">${initials.charAt(0)}</text>
                
                <path d="M20 140 L180 140 L160 180 L40 180 Z" fill="#111" />
                <text x="100" y="170" font-family="sans-serif" font-weight="bold" font-size="18" fill="white" text-anchor="middle" letter-spacing="4">${profile.name}</text>
            </svg>
        `;
        logos.push({ id: uuid(), svg: c4_svg, description: 'Varsity Style' });

        return logos;
    }

    // --- TECH / GENERIC CONTEXT ---
    // (Only used if NOT sports/manager)

    // Concept 1: Tech Monogram
    const c1_svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            ${COMPLEX_ASSETS.defs}
            <circle cx="100" cy="100" r="90" fill="none" stroke="url(#goldGrad)" stroke-width="10" />
            <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-weight="900" font-size="100" fill="url(#silverGrad)" filter="url(#dropshadow)">${initials}</text>
        </svg>
    `;
    logos.push({ id: uuid(), svg: c1_svg, description: 'Royal Monogram' });

    // Concept 2: Metallic Badge
    const c2_svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
             ${COMPLEX_ASSETS.defs}
             <circle cx="100" cy="100" r="80" fill="#222" stroke="url(#silverGrad)" stroke-width="8" filter="url(#metallic)" />
             <center>
             ${isTech ? `<rect x="70" y="70" width="60" height="60" fill="url(#goldGrad)" />` : `<circle cx="100" cy="100" r="30" fill="url(#goldGrad)" />`}
             </center>
             <text x="100" y="105" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="40" fill="#111">${initials}</text>
             <text x="100" y="160" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="14" fill="white" letter-spacing="3">${profile.name.substring(0, 10)}</text>
        </svg>
    `;
    logos.push({ id: uuid(), svg: c2_svg, description: 'Metallic Badge' });

    // Concept 3: Modern Abstract
    const c3_svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            ${COMPLEX_ASSETS.defs}
            ${COMPLEX_ASSETS.gearPro}
        </svg>
    `;
    logos.push({ id: uuid(), svg: c3_svg, description: 'Modern Abstract' });

    // Concept 4: Minimalist
    const c4_svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#111" />
            <path d="M100 20 L100 180" stroke="#333" stroke-width="1"/>
            <path d="M20 100 L180 100" stroke="#333" stroke-width="1"/>
            <text x="100" y="100" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="40" fill="white" letter-spacing="-2">${profile.name}</text>
            <circle cx="170" cy="30" r="10" fill="#D4AF37" />
        </svg>
    `;
    logos.push({ id: uuid(), svg: c4_svg, description: 'Ultra Minimal' });

    return logos;
};
