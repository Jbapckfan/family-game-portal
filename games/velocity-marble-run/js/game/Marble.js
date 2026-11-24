/**
 * Marble - the 24 gemstone marbles (from Marble POV: Velocity on the family game portal)
 *
 * Look: colours, surface pattern and material (rendered by js/three/MarbleLooks.js).
 * Feel: mass, friction and restitution change how each marble handles
 * (see Game.applyMarbleStats): heavy marbles hold speed, grippy ones steer
 * harder but roll slower, bouncy ones hop on hard landings.
 * Price: coins in the store (Opal is free).
 */
class Marble {
    static STYLES = {
        opal: {"name": "Opal", "description": "Milky white with pearlescent internal shimmer.", "pattern": "CLOUDY", "baseColor": "#fffdf5", "highlightColor": "#b0e0e6", "midColor": "#fffdf8", "shadowColor": "#72716e", "glowColor": "#00ffff", "trailColor": "#00ffff", "roughness": 0.1, "metalness": 0.1, "clearcoat": 1, "transmission": 0.6, "ior": 1.45, "iridescence": 1, "sheen": 0, "mass": 5, "friction": 0.1, "restitution": 0.3, "price": 0},
        black_bone: {"name": "Black Bone", "description": "Dark gray with fine silvery speckles (Sunstone).", "pattern": "SPECKLED", "baseColor": "#1a1a1a", "highlightColor": "#a0a0a0", "midColor": "#6a6a6a", "shadowColor": "#0b0b0b", "glowColor": "#ffffff", "trailColor": "#ffffff", "roughness": 0.4, "metalness": 0.6, "clearcoat": 0.3, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0.5, "mass": 8, "friction": 0.2, "restitution": 0.1, "price": 500},
        amazonia: {"name": "Amazonia", "description": "Blue-green turquoise with cloudy white mottling.", "pattern": "CLOUDY", "baseColor": "#4dc2b8", "highlightColor": "#ffffff", "midColor": "#8bd7d0", "shadowColor": "#225752", "glowColor": "#00dbc4", "trailColor": "#00dbc4", "roughness": 0.3, "metalness": 0, "clearcoat": 0.4, "transmission": 0.1, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 4, "friction": 0.08, "restitution": 0.4, "price": 300},
        clear_crystal: {"name": "Clear Crystal", "description": "Flawless, transparent quartz glass.", "pattern": "CRYSTAL", "baseColor": "#ffffff", "highlightColor": "#eefeff", "midColor": "#ffffff", "shadowColor": "#727272", "glowColor": "#ffffff", "trailColor": "#ffffff", "roughness": 0, "metalness": 0, "clearcoat": 1, "transmission": 1, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 4.5, "friction": 0.01, "restitution": 0.5, "price": 800},
        red_crystal: {"name": "Red Crystal", "description": "Clear quartz infused with red fibrous hematite wisps.", "pattern": "CRYSTAL", "baseColor": "#ffcccc", "highlightColor": "#8b0000", "midColor": "#ffdddd", "shadowColor": "#725b5b", "glowColor": "#ff0000", "trailColor": "#ff0000", "roughness": 0, "metalness": 0, "clearcoat": 1, "transmission": 0.85, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 5, "friction": 0.1, "restitution": 0.7, "price": 600},
        auspicious_jade: {"name": "Auspicious Jade", "description": "Soft creamy green, waxy and opaque.", "pattern": "CLOUDY", "baseColor": "#9bc472", "highlightColor": "#e8f5e9", "midColor": "#bed8a3", "shadowColor": "#455833", "glowColor": "#aaffaa", "trailColor": "#aaffaa", "roughness": 0.2, "metalness": 0, "clearcoat": 0.6, "transmission": 0.3, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 6, "friction": 0.5, "restitution": 0.1, "price": 450},
        pink_crystal: {"name": "Pink Crystal", "description": "Rose Quartz. Pale pink, milky and translucent.", "pattern": "CLOUDY", "baseColor": "#f8bbd0", "highlightColor": "#fce4ec", "midColor": "#fad2e0", "shadowColor": "#6f545d", "glowColor": "#ffb7d5", "trailColor": "#ffb7d5", "roughness": 0.1, "metalness": 0, "clearcoat": 0.8, "transmission": 0.6, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 4.8, "friction": 0.15, "restitution": 0.4, "price": 350},
        blue_point_stone: {"name": "Blue Point Stone", "description": "Deep blue with star-like white specks.", "pattern": "SPECKLED", "baseColor": "#1a237e", "highlightColor": "#ffffff", "midColor": "#6a70ab", "shadowColor": "#0b0f38", "glowColor": "#6688cc", "trailColor": "#6688cc", "roughness": 0.4, "metalness": 0.1, "clearcoat": 0.2, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0.2, "mass": 6.5, "friction": 0.3, "restitution": 0.2, "price": 400},
        granite: {"name": "Granite", "description": "Grainy mix of gray, white, and black particles.", "pattern": "SPECKLED", "baseColor": "#9e9e9e", "highlightColor": "#212121", "midColor": "#bfbfbf", "shadowColor": "#474747", "glowColor": "#aaaaaa", "trailColor": "#aaaaaa", "roughness": 0.8, "metalness": 0, "clearcoat": 0, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 7.5, "friction": 0.9, "restitution": 0.05, "price": 250},
        white_turquoise: {"name": "White Turquoise", "description": "Porcelain white with gray spiderweb veining.", "pattern": "VEINED", "baseColor": "#f5f5f5", "highlightColor": "#616161", "midColor": "#f8f8f8", "shadowColor": "#6e6e6e", "glowColor": "#ffffff", "trailColor": "#ffffff", "roughness": 0.2, "metalness": 0, "clearcoat": 0.5, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 5.2, "friction": 0.12, "restitution": 0.3, "price": 300},
        green_aventurine: {"name": "Green Aventurine", "description": "Medium green with subtle sparkly mineral flecks.", "pattern": "SPECKLED", "baseColor": "#43a047", "highlightColor": "#a5d6a7", "midColor": "#84c187", "shadowColor": "#1e481f", "glowColor": "#44ff88", "trailColor": "#44ff88", "roughness": 0.3, "metalness": 0.1, "clearcoat": 0.4, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0.3, "mass": 5.5, "friction": 0.2, "restitution": 0.35, "price": 400},
        topaz: {"name": "Topaz", "description": "Clear honey-gold, bright and glassy.", "pattern": "CRYSTAL", "baseColor": "#ffecb3", "highlightColor": "#ffca28", "midColor": "#fff2cd", "shadowColor": "#726a50", "glowColor": "#ffcc00", "trailColor": "#ffcc00", "roughness": 0, "metalness": 0, "clearcoat": 1, "transmission": 0.95, "ior": 1.6, "iridescence": 0, "sheen": 0, "mass": 4.5, "friction": 0.05, "restitution": 0.6, "price": 550},
        purple_aventurine: {"name": "Purple Aventurine", "description": "Lavender to deep purple, opaque with shimmer.", "pattern": "NOISE", "baseColor": "#5e35b1", "highlightColor": "#9575cd", "midColor": "#967bcc", "shadowColor": "#2a174f", "glowColor": "#aa44ff", "trailColor": "#aa44ff", "roughness": 0.3, "metalness": 0.1, "clearcoat": 0.3, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0.3, "mass": 5.8, "friction": 0.2, "restitution": 0.3, "price": 420},
        red_webstone: {"name": "Red Webstone", "description": "Pinkish-red with dramatic dark veining.", "pattern": "VEINED", "baseColor": "#e53935", "highlightColor": "#3e2723", "midColor": "#ee7e7b", "shadowColor": "#671917", "glowColor": "#ff4444", "trailColor": "#ff4444", "roughness": 0.4, "metalness": 0, "clearcoat": 0.2, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 6.2, "friction": 0.25, "restitution": 0.2, "price": 380},
        labradorite: {"name": "Labradorite", "description": "Dark gray with strong iridescent blue/gold flashes.", "pattern": "NOISE", "baseColor": "#263238", "highlightColor": "#37474f", "midColor": "#71797d", "shadowColor": "#111619", "glowColor": "#00897b", "trailColor": "#00897b", "roughness": 0.2, "metalness": 0.5, "clearcoat": 0.8, "transmission": 0.1, "ior": 1.7, "iridescence": 1, "sheen": 0, "mass": 6, "friction": 0.18, "restitution": 0.3, "price": 650},
        red_agate: {"name": "Red Agate", "description": "Brick red to orange with curved banding.", "pattern": "BANDED", "baseColor": "#d84315", "highlightColor": "#ffab91", "midColor": "#e58466", "shadowColor": "#611e09", "glowColor": "#ff5722", "trailColor": "#ff5722", "roughness": 0.1, "metalness": 0, "clearcoat": 0.7, "transmission": 0.2, "ior": 1.54, "iridescence": 0, "sheen": 0, "mass": 5.5, "friction": 0.2, "restitution": 0.4, "price": 320},
        blue_aventurine: {"name": "Blue Aventurine", "description": "Deep blue with lighter mottling.", "pattern": "NOISE", "baseColor": "#0d47a1", "highlightColor": "#42a5f5", "midColor": "#6187c1", "shadowColor": "#051f48", "glowColor": "#2979ff", "trailColor": "#2979ff", "roughness": 0.3, "metalness": 0, "clearcoat": 0.4, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0.2, "mass": 5.6, "friction": 0.2, "restitution": 0.3, "price": 420},
        red_jasper: {"name": "Red Jasper", "description": "Opaque earthy red with brown patches.", "pattern": "CLOUDY", "baseColor": "#b71c1c", "highlightColor": "#5d4037", "midColor": "#d06b6b", "shadowColor": "#520c0c", "glowColor": "#d32f2f", "trailColor": "#d32f2f", "roughness": 0.6, "metalness": 0, "clearcoat": 0.1, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 7, "friction": 0.6, "restitution": 0.1, "price": 350},
        obsidian: {"name": "Obsidian", "description": "Jet black, glossy, volcanic glass.", "pattern": "SOLID", "baseColor": "#050505", "highlightColor": "#212121", "midColor": "#212121", "shadowColor": "#020202", "glowColor": "#444444", "trailColor": "#444444", "roughness": 0, "metalness": 0.1, "clearcoat": 1, "transmission": 0.8, "ior": 1.48, "iridescence": 0, "sheen": 0, "mass": 5, "friction": 0.02, "restitution": 0.2, "price": 700},
        amethyst: {"name": "Amethyst", "description": "Transparent deep violet crystal.", "pattern": "CRYSTAL", "baseColor": "#4a148c", "highlightColor": "#7b1fa2", "midColor": "#8966b4", "shadowColor": "#21093f", "glowColor": "#e040fb", "trailColor": "#e040fb", "roughness": 0, "metalness": 0, "clearcoat": 1, "transmission": 0.8, "ior": 1.54, "iridescence": 0, "sheen": 0, "mass": 5, "friction": 0.15, "restitution": 0.4, "price": 500},
        turquoise: {"name": "Turquoise", "description": "Cyan-blue with dark spiderweb matrix.", "pattern": "VEINED", "baseColor": "#00acc1", "highlightColor": "#263238", "midColor": "#59c9d6", "shadowColor": "#004d56", "glowColor": "#80deea", "trailColor": "#80deea", "roughness": 0.5, "metalness": 0, "clearcoat": 0.1, "transmission": 0, "ior": 1.6, "iridescence": 0, "sheen": 0, "mass": 5.5, "friction": 0.3, "restitution": 0.2, "price": 350},
        yellow_tigers_eye: {"name": "Yellow Tiger's Eye", "description": "Golden yellow/brown with silky bands.", "pattern": "BANDED", "baseColor": "#3e2723", "highlightColor": "#ffb300", "midColor": "#817270", "shadowColor": "#1b110f", "glowColor": "#ffca28", "trailColor": "#ffca28", "roughness": 0.2, "metalness": 0.1, "clearcoat": 0.6, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 1, "mass": 6.8, "friction": 0.3, "restitution": 0.25, "price": 550},
        purple_jade: {"name": "Purple Jade", "description": "Mauve, opaque, smooth and waxy.", "pattern": "CLOUDY", "baseColor": "#7b1fa2", "highlightColor": "#e1bee7", "midColor": "#a96dc2", "shadowColor": "#370d48", "glowColor": "#e1bee7", "trailColor": "#e1bee7", "roughness": 0.4, "metalness": 0, "clearcoat": 0.5, "transmission": 0.2, "ior": 1.66, "iridescence": 0, "sheen": 0, "mass": 6, "friction": 0.4, "restitution": 0.2, "price": 600},
        picture_stone: {"name": "Picture Stone", "description": "Tan/brown landscape patterns.", "pattern": "BANDED", "baseColor": "#795548", "highlightColor": "#d7ccc8", "midColor": "#a79088", "shadowColor": "#362620", "glowColor": "#d7ccc8", "trailColor": "#d7ccc8", "roughness": 0.7, "metalness": 0, "clearcoat": 0, "transmission": 0, "ior": 1.5, "iridescence": 0, "sheen": 0, "mass": 6.5, "friction": 0.7, "restitution": 0.1, "price": 280}
    };

    static get DEFAULT() {
        return 'opal';
    }
}

/**
 * Abilities: one per marble, on a cooldown button next to Jump
 * (see Game.useAbility). Duration and cooldown in seconds.
 */
Marble.ABILITIES = {
    burst: { name: 'Burst', icon: '⚡', desc: 'A surge of speed', duration: 1.6, cooldown: 9, color: '#ffb02e' },
    float: { name: 'Float', icon: '☁', desc: 'Light as air: long, slow jumps', duration: 3, cooldown: 9, color: '#9fe8ff' },
    phase: { name: 'Phase', icon: '◌', desc: 'Pass straight through obstacles', duration: 1.6, cooldown: 10, color: '#e040fb' },
    magnet: { name: 'Magnet', icon: '⦿', desc: 'Pulls in every coin nearby', duration: 4, cooldown: 8, color: '#ff4f8b' },
    stick: { name: 'Stick', icon: '⬡', desc: 'Glued to the chute: no sliding, no flying off', duration: 3, cooldown: 9, color: '#44ff88' }
};

/**
 * Spin retention (how much speed a marble keeps through landings and bumps,
 * 0..1) and the ability each stone carries
 */
Marble.EXTRA = {
    opal: { spin: 0.7, ability: 'float' },
    black_bone: { spin: 0.5, ability: 'magnet' },
    amazonia: { spin: 0.55, ability: 'stick' },
    clear_crystal: { spin: 0.95, ability: 'float' },
    red_crystal: { spin: 0.85, ability: 'phase' },
    auspicious_jade: { spin: 0.35, ability: 'burst' },
    pink_crystal: { spin: 0.75, ability: 'float' },
    blue_point_stone: { spin: 0.45, ability: 'magnet' },
    granite: { spin: 0.25, ability: 'magnet' },
    white_turquoise: { spin: 0.65, ability: 'float' },
    green_aventurine: { spin: 0.5, ability: 'stick' },
    topaz: { spin: 0.9, ability: 'float' },
    purple_aventurine: { spin: 0.5, ability: 'stick' },
    red_webstone: { spin: 0.45, ability: 'magnet' },
    labradorite: { spin: 0.6, ability: 'phase' },
    red_agate: { spin: 0.6, ability: 'burst' },
    blue_aventurine: { spin: 0.5, ability: 'stick' },
    red_jasper: { spin: 0.3, ability: 'burst' },
    obsidian: { spin: 0.9, ability: 'phase' },
    amethyst: { spin: 0.8, ability: 'phase' },
    turquoise: { spin: 0.4, ability: 'burst' },
    yellow_tigers_eye: { spin: 0.45, ability: 'burst' },
    purple_jade: { spin: 0.4, ability: 'phase' },
    picture_stone: { spin: 0.3, ability: 'magnet' }
};
for (const [id, extra] of Object.entries(Marble.EXTRA)) Object.assign(Marble.STYLES[id], extra);

/**
 * Every marble is an instrument: it plays the soundtrack's lead hook, the
 * arpeggios and the coin notes with its own voice (see MusicEngine.setVoice).
 * Clear crystals ring like glass bells an octave up, heavy stones growl an
 * octave down through a driven filter, metallic stones play a hard-edged
 * chrome lead, iridescent ones shimmer, the rest sing a warm wide saw.
 *   lead/pluck  oscillator shapes
 *   oct         octave shift of the lead
 *   bell        add inharmonic bell partials with a fast decay
 *   chorus      add two more detuned voices for width
 *   shimmer     add a soft partial two octaves up
 *   bright      filter brightness multiplier
 *   drive       run the lead through a soft clipper
 */
Marble.VOICES = {
    glass: { name: 'Glass bells', lead: 'sine', pluck: 'sine', oct: 1, bell: true, shimmer: 0.35, bright: 1.25 },
    crystal: { name: 'Crystal pluck', lead: 'triangle', pluck: 'triangle', oct: 1, shimmer: 0.25, bright: 1.15 },
    opal: { name: 'Opal shimmer', lead: 'sawtooth', pluck: 'triangle', oct: 0, chorus: true, shimmer: 0.45, bright: 1.05 },
    chrome: { name: 'Chrome lead', lead: 'square', pluck: 'square', oct: 0, chorus: false, bright: 1.0, drive: true },
    stone: { name: 'Deep stone', lead: 'sawtooth', pluck: 'square', oct: -1, drive: true, bright: 0.75 },
    silk: { name: 'Silk saw', lead: 'sawtooth', pluck: 'sawtooth', oct: 0, chorus: true, bright: 1.0 }
};

Marble.voiceFor = (style) => {
    if (!style) return Marble.VOICES.silk;
    if (style.voice && Marble.VOICES[style.voice]) return Marble.VOICES[style.voice];
    const tr = style.transmission || 0;
    if (tr >= 0.8) return Marble.VOICES.glass;
    if (tr >= 0.5) return Marble.VOICES.crystal;
    if (style.iridescence) return Marble.VOICES.opal;
    if ((style.metalness || 0) >= 0.5) return Marble.VOICES.chrome;
    if ((style.mass || 5) >= 6.8) return Marble.VOICES.stone;
    return Marble.VOICES.silk;
};

window.Marble = Marble;
