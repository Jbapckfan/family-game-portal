/**
 * Shop - skins and upgrades sold in the store, next to the marbles
 *
 * Skins are looks that go on any marble, one per slot:
 *   finish  the marble's surface, drawn from that marble's own colours and
 *           pattern (js/three/MarbleLooks.js), so every marble/finish pair
 *           looks different
 *   trail   what the marble leaves behind it (js/three/MarbleFX.js)
 *   aura    what travels with it (js/three/MarbleFX.js)
 * Most cost coins; the rarest cost gems, which come from daily rewards,
 * first three-star finishes, first S grades, first wins over a friend and the
 * first daily run of each day.
 *
 * Upgrades are permanent bonuses bought in tiers. The performance ones (perf)
 * are switched off in the daily chute and in friend races so times stay
 * comparable; Head Start is also off in Music Runs, whose courses are timed
 * to the song from a standing start.
 */
const Shop = {
    SLOTS: ['finish', 'trail', 'aura'],
    DEFAULTS: { finish: 'stone', trail: 'stock', aura: 'none' },

    FINISHES: {
        stone: { name: 'Natural', desc: "The stone's own surface", coins: 0 },
        chrome: { name: 'Chrome', desc: 'Mirror polish, tinted by the stone', coins: 400 },
        carbon: { name: 'Carbon Weave', desc: 'Woven carbon fibre under a deep clear coat, threaded in the stone\'s colour', coins: 500 },
        frost: { name: 'Frostbite', desc: 'A crust of ice crystals that glints as it rolls', coins: 650 },
        gold: { name: '24K Gold', desc: "Solid gold, with the stone's own pattern engraved in it", coins: 900 },
        circuit: { name: 'Neon Circuit', desc: 'Glowing traces in the stone\'s colour that pulse with the beat', coins: 1100, pulse: true },
        molten: { name: 'Molten Core', desc: 'Cracked crust over a burning core that flares on the beat', coins: 1300, pulse: true },
        holo: { name: 'Holo Foil', desc: 'Rainbow foil that shifts with every turn', gems: 8 },
        galaxy: { name: 'Galaxy', desc: 'A nebula and its stars inside the marble', gems: 12, pulse: true }
    },

    TRAILS: {
        stock: { name: 'Ribbon', desc: 'A short glow in the marble\'s colour', coins: 0 },
        comet: { name: 'Comet', desc: 'A long white-hot tail fading to the marble\'s colour', coins: 450 },
        light: { name: 'Light Wall', desc: 'A wall of light stands up behind you', coins: 700 },
        stardust: { name: 'Stardust', desc: 'Sparkles that hang in the air and twinkle out', coins: 850 },
        lightning: { name: 'Lightning', desc: 'Twin bolts crackling behind the marble', coins: 1000 },
        inferno: { name: 'Inferno', desc: 'Fire pours off the marble and rises behind it', coins: 1200 },
        rainbow: { name: 'Rainbow', desc: 'A wide band of every colour, always moving', gems: 10 }
    },

    AURAS: {
        none: { name: 'None', desc: 'Just the marble', coins: 0 },
        halo: { name: 'Halo', desc: 'Two rings of light spin around the marble', coins: 500 },
        moons: { name: 'Twin Moons', desc: 'Two glowing moons in orbit', coins: 700 },
        shell: { name: 'Geo Shell', desc: 'A wireframe shell that turns and swells with the beat', coins: 900 },
        flame: { name: 'Flame', desc: 'The marble burns as it rolls', coins: 1100 },
        storm: { name: 'Storm', desc: 'Arcs of electricity crawl over it', coins: 1300 },
        crown: { name: 'Crystal Crown', desc: 'Five crystals circle above the marble', gems: 12 }
    },

    /**
     * values[i] is the effect at level i + 1; base is the effect with none.
     * fmt turns an effect into the line shown in the store.
     */
    UPGRADES: {
        shield: {
            name: 'Bubble Shield', desc: 'A bubble that takes a hit for you: hit an obstacle and you lose some speed instead of the run. Not for falls',
            base: 0, values: [1, 2, 3], costs: [800, 1600, 2800], perf: true, color: '#5ee7ff',
            fmt: (v) => v ? `${v} shield${v > 1 ? 's' : ''} per run` : 'No shield'
        },
        triple: {
            name: 'Triple Jump', desc: 'One more jump in mid-air',
            base: 0, values: [1], costs: [2400], perf: true, color: '#b388ff',
            fmt: (v) => v ? '3 jumps in a row' : '2 jumps in a row'
        },
        head_start: {
            name: 'Head Start', desc: 'Leave the gate faster',
            base: 0, values: [4, 8, 12], costs: [500, 1100, 2000], perf: true, music: false, color: '#ff8a3d',
            fmt: (v) => v ? `+${Math.round(v * 3.6)} km/h off the drop` : 'Standing start'
        },
        recharge: {
            name: 'Quick Charge', desc: 'Your ability recharges faster',
            base: 1, values: [0.88, 0.76, 0.64], costs: [350, 800, 1500], perf: true, color: '#ffd166',
            fmt: (v) => v < 1 ? `-${Math.round((1 - v) * 100)}% cooldown` : 'Normal cooldown'
        },
        overcharge: {
            name: 'Overcharge', desc: 'Your ability lasts longer',
            base: 1, values: [1.2, 1.4, 1.6], costs: [350, 800, 1500], perf: true, color: '#e040fb',
            fmt: (v) => v > 1 ? `+${Math.round((v - 1) * 100)}% duration` : 'Normal duration'
        },
        magnet: {
            name: 'Coin Magnet', desc: 'Coins come to you from further away',
            base: 1.15, values: [1.5, 1.9, 2.4], costs: [250, 600, 1100], color: '#ff4f8b',
            fmt: (v) => `${v.toFixed(1)} m pickup reach`
        },
        lucky: {
            name: 'Lucky Coins', desc: 'More coins from every finish',
            base: 1, values: [1.25, 1.5, 1.75, 2], costs: [400, 900, 1600, 2600], color: '#ffc93c',
            fmt: (v) => v > 1 ? `x${v} coin rewards` : 'Normal rewards'
        },
        combo: {
            name: 'Combo Keeper', desc: 'Your combo waits longer for the next trick',
            base: 2.2, values: [2.8, 3.4, 4], costs: [300, 700, 1300], color: '#22f0c8',
            fmt: (v) => `${v.toFixed(1)} s combo window`
        }
    },

    /** Icons for the upgrades (24x24 strokes, currentColor) */
    ICONS: {
        shield: '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><path d="M9 11.5l2 2 4-4"/>',
        triple: '<path d="M6 20l3-4 3 4"/><path d="M6 14l3-4 3 4"/><path d="M6 8l3-4 3 4"/><circle cx="17" cy="18" r="2"/>',
        head_start: '<path d="M5 19c1-3 3-5 5-6"/><path d="M13 4c3.5 0 6 2.5 7 7l-6 6-7-7z"/><circle cx="15" cy="9" r="1.5"/><path d="M8 12l-3 1-1 4 4-1"/>',
        recharge: '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>',
        overcharge: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4"/><path d="M7 10v4M11 10v4M15 10v4"/>',
        magnet: '<path d="M6 4v8a6 6 0 0012 0V4"/><path d="M6 8h4M14 8h4"/><path d="M10 4v8a2 2 0 004 0V4"/>',
        lucky: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c0-1.2 1.1-2 2.5-2s2.5.8 2.5 2c0 2.8-5 2-5 5 0 1.2 1.1 2 2.5 2s2.5-.8 2.5-2"/>',
        combo: '<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>'
    },

    catalog(slot) {
        return slot === 'finish' ? Shop.FINISHES : slot === 'trail' ? Shop.TRAILS : Shop.AURAS;
    },

    item(slot, id) {
        return Shop.catalog(slot)[id] || null;
    },

    /** The effect of an upgrade at a level (0 = not bought) */
    value(id, level) {
        const u = Shop.UPGRADES[id];
        if (!u) return 0;
        return level > 0 ? u.values[Math.min(level, u.values.length) - 1] : u.base;
    },

    nextCost(id, level) {
        const u = Shop.UPGRADES[id];
        return u && level < u.values.length ? u.costs[level] : null;
    },

    icon(id) {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${Shop.ICONS[id] || ''}</svg>`;
    }
};

window.Shop = Shop;
