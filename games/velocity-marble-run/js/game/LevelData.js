/**
 * LevelData - worlds and levels for Velocity Marble Run
 *
 * Each level's half-pipe is generated from its id (js/three/Track.js), so a
 * level here is just its name, difficulty, star times and an optional hint.
 * Star times come from automated playtests of the generated chutes.
 */

const WORLDS = [
    {
        id: 1,
        name: 'Meadow Valley',
        description: 'Gentle chutes to learn the lines',
        icon: '🌿',
        backgroundColor: ['#0f172a', '#1e3a5f'],
        theme: 'grass',
        unlockStars: 0
    },
    {
        id: 2,
        name: 'Desert Dunes',
        description: 'Jumps, gaps and hurdles',
        icon: '🏜️',
        backgroundColor: ['#451a03', '#78350f'],
        theme: 'desert',
        unlockStars: 15
    },
    {
        id: 3,
        name: 'Frozen Peaks',
        description: 'Fast turns and sliding walls',
        icon: '❄️',
        backgroundColor: ['#0c4a6e', '#164e63'],
        theme: 'ice',
        unlockStars: 35
    },
    {
        id: 4,
        name: 'Volcanic Core',
        description: 'Gates and mines at speed',
        icon: '🌋',
        backgroundColor: ['#450a0a', '#7f1d1d'],
        theme: 'volcano',
        unlockStars: 55
    },
    {
        id: 5,
        name: 'Cosmic Void',
        description: 'Everything, flat out',
        icon: '🌌',
        backgroundColor: ['#0f0326', '#1e1b4b'],
        theme: 'space',
        unlockStars: 80
    },
    {
        id: 6,
        name: 'Neon Grid',
        description: 'Loops, plunges and launches',
        icon: '🔷',
        backgroundColor: ['#02101f', '#0a3d66'],
        theme: 'grid',
        unlockStars: 110
    },
    {
        id: 7,
        name: 'Grand Prix',
        description: 'Signature circuits on the EDM tracks',
        icon: '🏁',
        backgroundColor: ['#111111', '#3b3b3b'],
        theme: 'prix',
        unlockStars: 0,
        // Every circuit is open from the start: pick any
        open: true
    }
];

const LEVELS = [
    { id: '1-1', worldId: 1, name: "First Roll", subtitle: "1176 m", difficulty: 1, starThresholds: { three: 28.2, two: 29.2, one: 999 }, hint: "Drag left and right to steer" },
    { id: '1-2', worldId: 1, name: "Gentle Curves", subtitle: "hurdles \u00b7 1199 m", difficulty: 1, starThresholds: { three: 28.1, two: 29.3, one: 999 }, hint: "Orange bars: tap to jump over them" },
    { id: '1-3', worldId: 1, name: "Funnel Fun", subtitle: "Cliff drop \u00b7 hurdles \u00b7 walls \u00b7 1206 m", difficulty: 1, starThresholds: { three: 28.2, two: 29.5, one: 999 }, hint: "Cliff drop: the chute falls away below you; jump at the crest for a long flight" },
    { id: '1-4', worldId: 1, name: "Bouncy Bumper", subtitle: "Cliff drop \u00b7 gaps \u00b7 hurdles \u00b7 1242 m", difficulty: 2, starThresholds: { three: 29.1, two: 30.3, one: 999 }, hint: "Gaps: tap to jump from the red ledge; tap again in the air for a longer leap" },
    { id: '1-5', worldId: 1, name: "Speed Boost", subtitle: "Cliff drop \u00b7 gaps \u00b7 hurdles \u00b7 1256 m", difficulty: 2, starThresholds: { three: 29.8, two: 30.9, one: 999 }, hint: "Red walls: steer around them" },
    { id: '1-6', worldId: 1, name: "Warp Zone", subtitle: "Cliff drop \u00b7 gaps \u00b7 hurdles \u00b7 1303 m", difficulty: 2, starThresholds: { three: 31.7, two: 33, one: 999 } },
    { id: '1-7', worldId: 1, name: "Spin City", subtitle: "Cliff drop \u00b7 grooves \u00b7 gaps \u00b7 1509 m", difficulty: 3, starThresholds: { three: 35.1, two: 36.5, one: 999 }, hint: "Whisper grooves: faint lines that nudge you back to the centre" },
    { id: '1-8', worldId: 1, name: "Moving Target", subtitle: "Cliff drop \u00b7 grooves \u00b7 gaps \u00b7 1340 m", difficulty: 3, starThresholds: { three: 32.1, two: 33.5, one: 999 } },
    { id: '1-9', worldId: 1, name: "Zigzag Valley", subtitle: "Loop-the-loop \u00b7 Cliff drop \u00b7 grooves \u00b7 1522 m", difficulty: 3, starThresholds: { three: 35.2, two: 36.2, one: 999 } },
    { id: '1-10', worldId: 1, name: "Valley Master", subtitle: "Loop-the-loop \u00b7 Cliff drop \u00b7 gaps \u00b7 1410 m", difficulty: 4, starThresholds: { three: 33.8, two: 34.9, one: 999 } },
    { id: '2-1', worldId: 2, name: "Sandy Start", subtitle: "Cliff drop \u00b7 grooves \u00b7 ice \u00b7 1438 m", difficulty: 2, starThresholds: { three: 32.6, two: 33.6, one: 999 }, hint: "Spikes: jump early, they are wide" },
    { id: '2-2', worldId: 2, name: "Dune Slide", subtitle: "Loop-the-loop \u00b7 Cliff drop \u00b7 sidewind \u00b7 1463 m", difficulty: 2, starThresholds: { three: 34.8, two: 36.4, one: 999 }, hint: "Ice (pale blue): slippery, steer early and gently" },
    { id: '2-3', worldId: 2, name: "Oasis Jump", subtitle: "Cliff drop \u00b7 sand \u00b7 gaps \u00b7 1461 m", difficulty: 3, starThresholds: { three: 33.8, two: 35, one: 999 }, hint: "Sand (gold, matte): it drags you down, keep your speed up" },
    { id: '2-4', worldId: 2, name: "Sandstorm", subtitle: "Cliff drop \u00b7 gravity well \u00b7 sand \u00b7 1494 m", difficulty: 3, starThresholds: { three: 34.1, two: 35.6, one: 999 }, hint: "Barrels roll up at you: jump as they arrive" },
    { id: '2-5', worldId: 2, name: "Pyramid Path", subtitle: "Loop-the-loop \u00b7 Cliff drop \u00b7 gravity well \u00b7 1538 m", difficulty: 3, starThresholds: { three: 36.4, two: 38.1, one: 999 }, hint: "Sidewind: the chevrons push you up one wall, lean against them" },
    { id: '2-6', worldId: 2, name: "Scorpion Trail", subtitle: "Plunge shaft \u00b7 Cliff drop \u00b7 sand \u00b7 1572 m", difficulty: 4, starThresholds: { three: 34.8, two: 35.8, one: 999 } },
    { id: '2-7', worldId: 2, name: "Quicksand", subtitle: "Loop-the-loop \u00b7 Cliff drop \u00b7 gravity well \u00b7 1605 m", difficulty: 4, starThresholds: { three: 37.4, two: 38.4, one: 999 }, hint: "Ripple bumps: every ridge hops you, time your jumps between them" },
    { id: '2-8', worldId: 2, name: "Mirage", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Cliff drop \u00b7 1609 m", difficulty: 4, starThresholds: { three: 37.3, two: 39, one: 999 } },
    { id: '2-9', worldId: 2, name: "Ancient Temple", subtitle: "Cliff drop \u00b7 gravity well \u00b7 gaps \u00b7 1634 m", difficulty: 5, starThresholds: { three: 36.2, two: 37.3, one: 999 }, hint: "Gravity well: the vortex pulls you toward it, hold your line" },
    { id: '2-10', worldId: 2, name: "Desert Master", subtitle: "Launch ramp \u00b7 Cliff drop \u00b7 ice \u00b7 1655 m", difficulty: 5, starThresholds: { three: 36.1, two: 37.1, one: 999 } },
    { id: '3-1', worldId: 3, name: "Ice Slide", subtitle: "Loop-the-loop \u00b7 Cliff drop \u00b7 ice \u00b7 1687 m", difficulty: 3, starThresholds: { three: 38.6, two: 39.8, one: 999 }, hint: "Lasers pulse with the beat: jump them while they are lit, or wait" },
    { id: '3-2', worldId: 3, name: "Frozen Falls", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Cliff drop \u00b7 1730 m", difficulty: 3, starThresholds: { three: 41.1, two: 42.1, one: 999 }, hint: "Rubber (dark, dotted): grippy and bouncy, jumps go higher" },
    { id: '3-3', worldId: 3, name: "Glacier Gap", subtitle: "Launch ramp \u00b7 Cliff drop \u00b7 magnetic rail \u00b7 1744 m", difficulty: 3, starThresholds: { three: 38.4, two: 40, one: 999 }, hint: "Metal (silver): fast and slick" },
    { id: '3-4', worldId: 3, name: "Snowstorm", subtitle: "Launch ramp \u00b7 Cliff drop \u00b7 magnetic rail \u00b7 1756 m", difficulty: 4, starThresholds: { three: 40, two: 41, one: 999 }, hint: "Spinners sweep the floor with the beat: jump as the bar comes round" },
    { id: '3-5', worldId: 3, name: "Crystal Cavern", subtitle: "Plunge shaft \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 1808 m", difficulty: 4, starThresholds: { three: 40.6, two: 41.6, one: 999 }, hint: "Zero-g tunnel: a quarter of the gravity, jumps float for ages" },
    { id: '3-6', worldId: 3, name: "Avalanche", subtitle: "Plunge shaft \u00b7 Cliff drop \u00b7 magnetic rail \u00b7 1795 m", difficulty: 4, starThresholds: { three: 40.1, two: 41.6, one: 999 }, hint: "Red rims are low: too fast and you fly off" },
    { id: '3-7', worldId: 3, name: "Frostbite", subtitle: "Launch ramp \u00b7 Cliff drop \u00b7 sidewind \u00b7 1865 m", difficulty: 4, starThresholds: { three: 41.5, two: 42.5, one: 999 } },
    { id: '3-8', worldId: 3, name: "Blizzard", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Launch ramp \u00b7 1869 m", difficulty: 5, starThresholds: { three: 41.8, two: 42.8, one: 999 }, hint: "Spiral funnel: the chute becomes a corkscrew tube; stay low as it turns" },
    { id: '3-9', worldId: 3, name: "Permafrost", subtitle: "Plunge shaft \u00b7 Cliff drop \u00b7 sidewind \u00b7 1919 m", difficulty: 5, starThresholds: { three: 42.1, two: 44, one: 999 }, hint: "Magnetic rail: ride the glowing line for a speed boost" },
    { id: '3-10', worldId: 3, name: "Frozen Master", subtitle: "Helix tower \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 2216 m", difficulty: 5, starThresholds: { three: 48.6, two: 50.6, one: 999 }, hint: "Wood planks: a little slow and steady" },
    { id: '4-1', worldId: 4, name: "Lava Flow", subtitle: "Plunge shaft \u00b7 Cliff drop \u00b7 spiral funnel \u00b7 1927 m", difficulty: 4, starThresholds: { three: 44, two: 45.2, one: 999 }, hint: "Mines: keep clear of the spikes" },
    { id: '4-2', worldId: 4, name: "Magma Chamber", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Cliff drop \u00b7 1955 m", difficulty: 4, starThresholds: { three: 42.8, two: 43.8, one: 999 }, hint: "Gates: thread the open window" },
    { id: '4-3', worldId: 4, name: "Eruption", subtitle: "Helix tower \u00b7 Cliff drop \u00b7 ice \u00b7 2027 m", difficulty: 4, starThresholds: { three: 43.5, two: 44.5, one: 999 } },
    { id: '4-4', worldId: 4, name: "Inferno", subtitle: "Plunge shaft \u00b7 Cliff drop \u00b7 magnetic rail \u00b7 2040 m", difficulty: 5, starThresholds: { three: 43.3, two: 44.7, one: 999 } },
    { id: '4-5', worldId: 4, name: "Molten Core", subtitle: "Plunge shaft \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 2055 m", difficulty: 5, starThresholds: { three: 44.3, two: 45.3, one: 999 } },
    { id: '4-6', worldId: 4, name: "Pyroclasm", subtitle: "Helix tower \u00b7 Loop-the-loop \u00b7 Launch ramp \u00b7 2107 m", difficulty: 5, starThresholds: { three: 47.3, two: 48.4, one: 999 } },
    { id: '4-7', worldId: 4, name: "Hellfire", subtitle: "Loop-the-loop \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 2113 m", difficulty: 5, starThresholds: { three: 45.6, two: 46.6, one: 999 } },
    { id: '4-8', worldId: 4, name: "Caldera", subtitle: "Helix tower \u00b7 Loop-the-loop \u00b7 Launch ramp \u00b7 2134 m", difficulty: 6, starThresholds: { three: 46.7, two: 47.7, one: 999 } },
    { id: '4-9', worldId: 4, name: "Cataclysm", subtitle: "Helix tower \u00b7 Plunge shaft \u00b7 Cliff drop \u00b7 2153 m", difficulty: 6, starThresholds: { three: 46, two: 47, one: 999 } },
    { id: '4-10', worldId: 4, name: "Volcanic Master", subtitle: "Helix tower \u00b7 Cliff drop \u00b7 gravity well \u00b7 2200 m", difficulty: 6, starThresholds: { three: 46.6, two: 47.6, one: 999 } },
    { id: '5-1', worldId: 5, name: "Zero Gravity", subtitle: "Launch ramp \u00b7 Cliff drop \u00b7 sidewind \u00b7 2198 m", difficulty: 5, starThresholds: { three: 45.7, two: 46.9, one: 999 } },
    { id: '5-2', worldId: 5, name: "Asteroid Belt", subtitle: "Loop-the-loop \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 2221 m", difficulty: 5, starThresholds: { three: 48.3, two: 49.3, one: 999 }, hint: "Sliding walls move with the beat" },
    { id: '5-3', worldId: 5, name: "Nebula", subtitle: "Plunge shaft \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 2287 m", difficulty: 5, starThresholds: { three: 49.1, two: 50.1, one: 999 } },
    { id: '5-4', worldId: 5, name: "Wormhole", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Cliff drop \u00b7 2294 m", difficulty: 5, starThresholds: { three: 48.2, two: 49.2, one: 999 } },
    { id: '5-5', worldId: 5, name: "Pulsar", subtitle: "Launch ramp \u00b7 Cliff drop \u00b7 ice \u00b7 2494 m", difficulty: 6, starThresholds: { three: 51.6, two: 52.6, one: 999 } },
    { id: '5-6', worldId: 5, name: "Supernova", subtitle: "Launch ramp \u00b7 Cliff drop \u00b7 gravity well \u00b7 2338 m", difficulty: 6, starThresholds: { three: 49.2, two: 50.7, one: 999 } },
    { id: '5-7', worldId: 5, name: "Dark Matter", subtitle: "Plunge shaft \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 2363 m", difficulty: 6, starThresholds: { three: 49.8, two: 50.8, one: 999 } },
    { id: '5-8', worldId: 5, name: "Event Horizon", subtitle: "Plunge shaft \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 2425 m", difficulty: 6, starThresholds: { three: 50.3, two: 51.3, one: 999 } },
    { id: '5-9', worldId: 5, name: "Singularity", subtitle: "Launch ramp \u00b7 Cliff drop \u00b7 spiral funnel \u00b7 2603 m", difficulty: 7, starThresholds: { three: 54.1, two: 55.1, one: 999 } },
    { id: '5-10', worldId: 5, name: "Cosmic Master", subtitle: "Helix tower \u00b7 Cliff drop \u00b7 magnetic rail \u00b7 2786 m", difficulty: 7, starThresholds: { three: 58.1, two: 59.5, one: 999 } },
    { id: '6-1', worldId: 6, name: "Boot Sequence", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Cliff drop \u00b7 2625 m", difficulty: 7, starThresholds: { three: 55.1, two: 56.1, one: 999 }, hint: "The Grid: longest runs in the game, every set piece, flat out" },
    { id: '6-2', worldId: 6, name: "Light Cycle", subtitle: "Helix tower \u00b7 Loop-the-loop \u00b7 Cliff drop \u00b7 2659 m", difficulty: 7, starThresholds: { three: 55.8, two: 56.8, one: 999 } },
    { id: '6-3', worldId: 6, name: "Loop Core", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Launch ramp \u00b7 2687 m", difficulty: 7, starThresholds: { three: 56, two: 57, one: 999 } },
    { id: '6-4', worldId: 6, name: "Data Stream", subtitle: "Helix tower \u00b7 Loop-the-loop \u00b7 Cliff drop \u00b7 2738 m", difficulty: 8, starThresholds: { three: 58.3, two: 59.3, one: 999 } },
    { id: '6-5', worldId: 6, name: "Firewall", subtitle: "Helix tower \u00b7 Loop-the-loop \u00b7 Plunge shaft \u00b7 2569 m", difficulty: 8, starThresholds: { three: 53.9, two: 55.1, one: 999 } },
    { id: '6-6', worldId: 6, name: "Plunge Protocol", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Launch ramp \u00b7 2764 m", difficulty: 8, starThresholds: { three: 57.8, two: 58.8, one: 999 } },
    { id: '6-7', worldId: 6, name: "Launch Vector", subtitle: "Loop-the-loop \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 2682 m", difficulty: 8, starThresholds: { three: 58.2, two: 59.2, one: 999 } },
    { id: '6-8', worldId: 6, name: "Overclock", subtitle: "Loop-the-loop \u00b7 Cliff drop \u00b7 magnetic rail \u00b7 2691 m", difficulty: 9, starThresholds: { three: 57.2, two: 58.2, one: 999 } },
    { id: '6-9', worldId: 6, name: "Kernel Panic", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Cliff drop \u00b7 2686 m", difficulty: 9, starThresholds: { three: 57.7, two: 58.7, one: 999 } },
    { id: '6-10', worldId: 6, name: "Grid Master", subtitle: "Helix tower \u00b7 Loop-the-loop \u00b7 Launch ramp \u00b7 2744 m", difficulty: 9, starThresholds: { three: 59.9, two: 60.9, one: 999 } },
    // World 7, the Grand Prix: hand-designed circuits (js/three/Track.js
    // designSegments), each on one of the EDM or world tracks and set in one
    // of the six worlds. Segments: ['straight', m], ['drop', m], ['flat', m],
    // ['turn', m, dir, radius], ['s', m, radius, dir], ['cliff', drop],
    // ['loop', radius], ['plunge', m], ['kicker', chasm]. Features by metre.
    { id: '7-1', worldId: 7, scene: 6, music: 7, trackDifficulty: 18, name: "Pole Position", subtitle: "Loop-the-loop \u00b7 Launch ramp \u00b7 Cliff drop \u00b7 1323 m", difficulty: 5, starThresholds: { three: 33.1, two: 34.1, one: 999 }, hint: "The Grand Prix: eight signature circuits, all open. Skyline plays this one", design: { segments: [['straight', 60], ['turn', 80, 1, 45], ['drop', 50], ['loop', 10], ['straight', 50], ['s', 30, 40, -1], ['cliff'], ['turn', 70, -1, 40], ['kicker'], ['straight', 60], ['turn', 90, 1, 50], ['drop', 60], ['loop', 10], ['straight', 50]], features: [['groove', 70, 40], ['rail', 350, 40], ['zerog', 895, 40], ['ice', 960, 40]] } },
    { id: '7-2', worldId: 7, scene: 1, music: 8, trackDifficulty: 22, name: "Triple Loop", subtitle: "Loop-the-loop \u00b7 Cliff drop \u00b7 magnetic rail \u00b7 1512 m", difficulty: 6, starThresholds: { three: 36.1, two: 37.1, one: 999 }, hint: "Three loops, each bigger than the last. Breakneck drum and bass", design: { segments: [['straight', 60], ['drop', 50], ['loop', 9], ['straight', 40], ['turn', 90, -1, 50], ['drop', 50], ['loop', 11], ['straight', 40], ['s', 30, 44, 1], ['cliff'], ['turn', 80, 1, 45], ['drop', 60], ['loop', 12], ['straight', 50], ['turn', 60, -1, 40], ['straight', 40], ['straight', 60], ['turn', 70, 1, 50]], features: [['rail', 300, 50], ['bumps', 600, 24], ['zerog', 1215, 40], ['rubber', 1325, 30]] } },
    { id: '7-3', worldId: 7, scene: 4, music: 10, trackDifficulty: 26, name: "Plunge Line", subtitle: "Plunge shaft \u00b7 Launch ramp \u00b7 magnetic rail \u00b7 1429 m", difficulty: 6, starThresholds: { three: 32.8, two: 33.8, one: 999 }, hint: "Three plunge shafts into the volcano, each deeper. Ironclad hardstyle", design: { segments: [['straight', 60], ['turn', 70, 1, 40], ['plunge', 70], ['straight', 40], ['s', 30, 44, -1], ['drop', 50], ['plunge', 90], ['turn', 90, -1, 50], ['straight', 50], ['kicker', 20], ['straight', 50], ['turn', 80, 1, 45], ['plunge', 110], ['straight', 50], ['turn', 60, -1, 40], ['straight', 40]], features: [['metal', 295, 30], ['sidewind', 625, 40], ['well', 932, 30], ['groove', 1260, 40]] } },
    { id: '7-4', worldId: 7, scene: 2, music: 9, trackDifficulty: 24, name: "Launch Pad", subtitle: "Launch ramp \u00b7 Cliff drop \u00b7 magnetic rail \u00b7 1376 m", difficulty: 6, starThresholds: { three: 32, two: 33, one: 999 }, hint: "Three launch ramps over the dunes, each chasm wider. Lowlight garage", design: { segments: [['straight', 60], ['turn', 80, -1, 45], ['kicker', 18], ['straight', 40], ['turn', 70, 1, 40], ['drop', 40], ['kicker', 22], ['s', 30, 44, 1], ['straight', 40], ['cliff'], ['turn', 90, -1, 50], ['kicker', 26], ['straight', 60], ['turn', 60, 1, 40], ['straight', 40]], features: [['sand', 310, 30], ['zerog', 688, 36], ['rail', 1200, 50], ['bumps', 1318, 24]] } },
    { id: '7-5', worldId: 7, scene: 3, music: 11, trackDifficulty: 28, name: "Corkscrew Canyon", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Launch ramp \u00b7 1702 m", difficulty: 7, starThresholds: { three: 39.2, two: 40.2, one: 999 }, hint: "Three spiral funnels through the ice, plus every set piece. Mantra psytrance", design: { segments: [['straight', 60], ['turn', 90, 1, 50], ['straight', 100], ['drop', 50], ['loop', 11], ['s', 32, 46, -1], ['straight', 110], ['turn', 80, -1, 45], ['cliff'], ['straight', 50], ['plunge', 90], ['turn', 90, 1, 50], ['kicker', 20], ['straight', 110], ['drop', 50], ['turn', 70, -1, 40], ['straight', 40]], features: [['spiral', 158, 80], ['spiral', 535, 85], ['ice', 640, 40], ['spiral', 1420, 85]] } },
    { id: '7-6', worldId: 7, scene: 5, music: 6, trackDifficulty: 32, name: "Night Circuit", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Launch ramp \u00b7 1941 m", difficulty: 8, starThresholds: { three: 45, two: 46, one: 999 }, hint: "Two loops, a plunge, a launch and a cliff through the void. The Grid's own track", design: { segments: [['straight', 60], ['s', 30, 46, 1], ['drop', 50], ['loop', 12], ['turn', 90, -1, 50], ['straight', 50], ['kicker', 22], ['turn', 80, 1, 45], ['straight', 40], ['plunge', 100], ['s', 30, 46, -1], ['straight', 40], ['cliff'], ['turn', 100, -1, 55], ['drop', 50], ['loop', 12], ['straight', 60], ['turn', 70, 1, 40], ['straight', 100], ['drop', 60], ['straight', 40]], features: [['rail', 345, 50], ['metal', 735, 30], ['sidewind', 1280, 40], ['zerog', 1595, 40], ['spiral', 1728, 80, 2]] } },
    { id: '7-7', worldId: 7, scene: 4, music: 4, trackDifficulty: 34, name: "Lava Loop", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Launch ramp \u00b7 2005 m", difficulty: 8, starThresholds: { three: 47.2, two: 48.2, one: 999 }, hint: "Back-to-back loops over the lava, then the plunge, the launch and a third loop", design: { segments: [['straight', 60], ['turn', 80, 1, 45], ['drop', 50], ['loop', 12], ['straight', 40], ['loop', 10], ['turn', 90, -1, 50], ['straight', 50], ['cliff'], ['s', 30, 46, 1], ['straight', 40], ['plunge', 100], ['turn', 80, 1, 45], ['kicker', 24], ['straight', 50], ['turn', 100, -1, 55], ['drop', 50], ['loop', 13], ['straight', 60], ['turn', 60, 1, 40], ['straight', 40]], features: [['groove', 65, 40], ['metal', 648, 30], ['rail', 1200, 50], ['well', 1452, 30], ['zerog', 1828, 40]] } },
    { id: '7-8', worldId: 7, scene: 6, music: 11, trackDifficulty: 40, name: "Marathon", subtitle: "Loop-the-loop \u00b7 Plunge shaft \u00b7 Launch ramp \u00b7 3517 m", difficulty: 9, starThresholds: { three: 77.2, two: 78.2, one: 999 }, hint: "The longest run in the game: three and a half kilometres, three loops, two plunges, two launches, two cliffs", design: { segments: [['straight', 60], ['turn', 80, 1, 45], ['drop', 50], ['loop', 11], ['straight', 50], ['s', 30, 50, -1], ['straight', 100], ['cliff'], ['turn', 90, -1, 50], ['straight', 40], ['plunge', 100], ['turn', 80, 1, 45], ['straight', 50], ['kicker', 24], ['s', 30, 50, 1], ['straight', 100], ['drop', 50], ['loop', 12], ['turn', 100, -1, 55], ['straight', 50], ['cliff', 70], ['turn', 80, 1, 45], ['straight', 100], ['plunge', 80], ['s', 30, 50, -1], ['straight', 50], ['kicker', 26], ['turn', 90, 1, 50], ['drop', 60], ['loop', 13], ['straight', 60], ['turn', 80, -1, 45], ['straight', 100], ['drop', 50], ['turn', 60, 1, 40], ['straight', 50]], features: [['spiral', 468, 85, 2], ['rail', 785, 50], ['sidewind', 1104, 40], ['zerog', 1468, 40], ['metal', 1885, 30], ['spiral', 2224, 85, 2], ['groove', 2550, 30], ['rail', 3100, 50], ['bumps', 3240, 24], ['zerog', 3275, 40]] } },
    { id: '7-9', worldId: 7, scene: 5, music: 14, trackDifficulty: 36, name: "Helix Tower", subtitle: "Helix tower \u00b7 Loop-the-loop \u00b7 Launch ramp \u00b7 1795 m", difficulty: 8, starThresholds: { three: 40.4, two: 41.4, one: 999 }, hint: "Two helix towers: wide spirals round a column, ride the bank. Afterglow plays this one", design: { segments: [['straight', 60], ['turn', 80, 1, 45], ['drop', 50], ['helix', 18, 2.25, 1], ['straight', 60], ['s', 30, 46, -1], ['cliff'], ['straight', 50], ['loop', 12], ['turn', 90, -1, 50], ['helix', 16, 1.75, -1], ['straight', 80], ['kicker', 22], ['turn', 70, 1, 40], ['straight', 50]], features: [['rail', 70, 50], ['zerog', 400, 40], ['spiral', 1160, 80, 2]] } }
];

window.WORLDS = WORLDS;
window.LEVELS = LEVELS;
