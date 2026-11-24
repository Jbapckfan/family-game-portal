/**
 * MusicThemes - the soundtrack's compositions, shared by the game and the
 * offline renderer (tools/music/render.mjs)
 *
 * The game plays a pre-rendered backing track for each world (drums, bass,
 * chords, pads, effects; music/<theme>-<section>.mp3) and plays the lead
 * hook live on top, in the voice of the marble you are rolling, so both
 * must agree on the harmony written here. Each world:
 *   bpm, root (MIDI), scale (semitones from the root)
 *   progression  four chords, two bars each: an 8-bar cycle. root is the
 *                chord's root (bass), notes a voicing around middle C
 *   hooks.A/B    8-bar lead melodies: [16th step 0..127, scale degree, length in 16ths]
 *   leadOct      octave the hooks are played in, above the root
 *   peakShift    semitones the peak (the climax) is lifted by: a key change up
 *   plan         the song's form, from the marble's release: segments of
 *                [kind, bars, hook], kinds rise (the way in), drop, build,
 *                peak (the climax: the key lifts by peakShift) and break.
 *                Every world has its own form, groove and builds (see
 *                tools/music/render.mjs); MUSIC_PLAN.compile reads a plan
 *                for the engine, the renderer and the Music Run course
 *
 * The remaining fields drive the procedural fallback (MusicEngine), used
 * while the backing tracks load or if they cannot.
 */
(function (root) {
    const MINOR = [0, 2, 3, 5, 7, 8, 10];
    const PHRYGIAN_DOMINANT = [0, 1, 4, 5, 7, 8, 10];
    const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];
    const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
    const ch = (r, notes) => ({ root: r, notes });
    const BASS = {
        offbeat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        rolling: [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
        bigroom: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0.9, 0, 0.9],
        trance: [0, 1, 0.8, 0.8, 0, 1, 0.8, 0.8, 0, 1, 0.8, 0.8, 0, 1, 0.8, 0.8]
    };

    /** Hook A from a one-bar cell repeated over the chords (a scale-degree offset per bar), hook B written out */
    const riffHooks = ({ cell, chords, B }) => {
        const A = [];
        chords.forEach((cd, bar) => { for (const [st, deg, len] of cell) A.push([bar * 16 + st, deg + cd, len]); });
        return { A, B };
    };

    const THEMES = {
        menu: {
            name: 'Lobby', bpm: 118, root: 57, scale: MINOR, leadOct: 1, kickPitch: 50,
            progression: [ch(57, [55, 59, 60, 64]), ch(53, [55, 57, 60, 64]), ch(48, [55, 59, 62, 64]), ch(55, [55, 59, 62, 64])],
            hooks: {
                A: [[0, 4, 4], [6, 2, 2], [8, 0, 6], [16, 4, 4], [22, 6, 2], [24, 7, 8], [32, 5, 4], [38, 4, 2], [40, 2, 6], [48, 4, 4], [54, 5, 2], [56, 4, 8],
                    [64, 4, 4], [70, 6, 2], [72, 7, 6], [80, 9, 4], [86, 7, 2], [88, 6, 8], [96, 6, 4], [102, 4, 2], [104, 1, 6], [112, 1, 4], [116, 4, 4], [120, 0, 8]]
            },
            stabs: [], bass: BASS.offbeat, arpPattern: [0, 1, 2, 3],
            padWave: 'triangle', pluckWave: 'triangle', leadWave: 'sawtooth', spread: 1,
            bassCutoff: 300, bassDrive: false, buildBars: 2
        },
        1: { // Meadow Valley: dark progressive electro, A harmonic minor, Am F Dm E (the major V pulls)
            name: 'Meadow Valley', bpm: 128, root: 57, scale: HARMONIC_MINOR, leadOct: 1, kickPitch: 50, peakShift: 2,
            // Progressive house: a drop, a second drop, a long melodic breakdown, a four-bar climb, the peak
            plan: [['rise', 4, 'A'], ['drop', 8, 'A'], ['build', 2], ['drop', 8, 'B'], ['break', 8, 'B'], ['build', 4], ['peak', 8, 'A']],
            progression: [ch(57, [57, 60, 64, 69]), ch(53, [57, 60, 65, 69]), ch(50, [57, 62, 65, 69]), ch(52, [56, 59, 64, 68])],
            hooks: {
                A: [[0, 4, 2], [2, 2, 1], [3, 0, 1], [4, 4, 2], [6, 2, 1], [7, 0, 1], [8, 4, 2], [10, 5, 2], [12, 4, 4], [16, 4, 2], [18, 2, 1], [19, 0, 1], [20, 4, 2],
                    [22, 2, 1], [23, 0, 1], [24, 7, 3], [27, 6, 1], [28, 4, 4], [32, 5, 2], [34, 4, 1], [35, 2, 1], [36, 5, 2], [38, 4, 1], [39, 2, 1], [40, 5, 2], [42, 7, 2],
                    [44, 5, 4], [48, 5, 2], [50, 4, 1], [51, 2, 1], [52, 5, 2], [54, 4, 1], [55, 2, 1], [56, 9, 3], [59, 7, 1], [60, 5, 4], [64, 3, 2], [66, 2, 1], [67, 0, 1],
                    [68, 3, 2], [70, 2, 1], [71, 0, 1], [72, 3, 2], [74, 5, 2], [76, 3, 4], [80, 3, 2], [82, 2, 1], [83, 0, 1], [84, 3, 2], [86, 2, 1], [87, 0, 1], [88, 8, 3],
                    [91, 7, 1], [92, 5, 4], [96, 4, 2], [98, 6, 1], [99, 1, 1], [100, 4, 2], [102, 6, 1], [103, 1, 1], [104, 4, 2], [106, 6, 2], [108, 8, 4], [112, 6, 2], [114, 7, 1],
                    [115, 8, 1], [116, 9, 2], [118, 8, 2], [120, 6, 4], [124, 4, 4]],
                B: [[0, 7, 4], [4, 9, 4], [8, 11, 6], [14, 9, 2], [16, 7, 4], [20, 6, 2], [22, 7, 2], [24, 4, 8], [32, 9, 4], [36, 7, 4], [40, 5, 6], [46, 7, 2], [48, 9, 4],
                    [52, 10, 2], [54, 9, 2], [56, 7, 8], [64, 10, 4], [68, 9, 4], [72, 8, 6], [78, 7, 2], [80, 5, 4], [84, 7, 2], [86, 8, 2], [88, 10, 8], [96, 11, 4], [100, 13, 4],
                    [104, 11, 4], [108, 8, 4], [112, 6, 8], [120, 8, 4], [124, 11, 4]]
            },
            stabs: [0, 3, 6, 10, 12], bass: BASS.rolling, arpPattern: [0, 2, 1, 3, 2, 4, 3, 5],
            padWave: 'sawtooth', pluckWave: 'sawtooth', leadWave: 'sawtooth', spread: 1,
            bassCutoff: 420, bassDrive: true, buildBars: 1
        },
        2: { // Desert Dunes: tribal tech house in D phrygian dominant, D Eb Cm D
            name: 'Desert Dunes', bpm: 124, root: 50, scale: PHRYGIAN_DOMINANT, leadOct: 1, kickPitch: 48, peakShift: 2,
            // Tribal: a long percussion rise, drops with percussion breaks between, the peak straightens the beat
            plan: [['rise', 8, 'A'], ['drop', 8, 'A'], ['break', 4, 'B'], ['drop', 8, 'B'], ['build', 2], ['peak', 8, 'A'], ['break', 4, 'B']],
            progression: [ch(50, [54, 57, 62, 66]), ch(51, [55, 58, 63, 67]), ch(48, [55, 60, 63, 67]), ch(50, [54, 57, 62, 66])],
            hooks: {
                A: [[0, 0, 2], [2, 1, 1], [3, 2, 2], [5, 1, 1], [6, 0, 2], [8, 4, 3], [11, 3, 1], [12, 2, 2], [14, 1, 2], [16, 0, 2], [18, 1, 1], [19, 2, 2], [21, 3, 1], [22, 4, 2], [24, 5, 3], [27, 4, 1], [28, 2, 2], [30, 1, 2],
                    [32, 1, 3], [35, 3, 1], [36, 5, 2], [38, 4, 2], [40, 3, 3], [43, 1, 1], [44, 0, 4], [48, 1, 2], [50, 3, 2], [52, 5, 2], [54, 7, 2], [56, 5, 3], [59, 4, 1], [60, 3, 4],
                    [64, 6, 2], [66, 5, 1], [67, 4, 1], [68, 5, 2], [70, 6, 2], [72, 4, 4], [76, 3, 2], [78, 1, 2], [80, 6, 2], [82, 5, 1], [83, 4, 1], [84, 5, 2], [86, 7, 2], [88, 8, 4], [92, 6, 2], [94, 5, 2],
                    [96, 0, 2], [98, 1, 1], [99, 2, 2], [101, 1, 1], [102, 0, 2], [104, 4, 3], [107, 3, 1], [108, 2, 2], [110, 1, 2], [112, 0, 4], [116, 2, 2], [118, 1, 2], [120, 0, 8]],
                B: [[0, 7, 6], [6, 8, 2], [8, 9, 4], [12, 8, 2], [14, 7, 2], [16, 4, 8], [24, 5, 2], [26, 4, 2], [28, 2, 4],
                    [32, 8, 6], [38, 7, 2], [40, 5, 4], [44, 4, 2], [46, 3, 2], [48, 1, 8], [56, 3, 2], [58, 4, 2], [60, 5, 4],
                    [64, 6, 6], [70, 5, 2], [72, 4, 4], [76, 5, 2], [78, 6, 2], [80, 8, 8], [88, 7, 2], [90, 6, 2], [92, 5, 4],
                    [96, 4, 6], [102, 5, 2], [104, 4, 2], [106, 2, 2], [108, 2, 4], [112, 0, 8], [120, 1, 2], [122, 2, 2], [124, 4, 4]]
            },
            stabs: [2, 6, 10, 14], bass: BASS.bigroom, arpPattern: [0, 1, 2, 1, 3, 2, 1, 0],
            padWave: 'triangle', pluckWave: 'sawtooth', leadWave: 'square', spread: 0.8,
            bassCutoff: 340, bassDrive: true, buildBars: 1
        },
        3: { // Frozen Peaks: driving tech trance, F# harmonic minor, F#m D Bm C#
            name: 'Frozen Peaks', bpm: 138, root: 54, scale: HARMONIC_MINOR, leadOct: 1, kickPitch: 52, peakShift: 2,
            // Trance: the drop, a long breakdown with the anthem, an eight-bar snare-roll climb, the peak
            plan: [['rise', 4, 'A'], ['drop', 8, 'A'], ['break', 8, 'B'], ['build', 8], ['peak', 8, 'A'], ['break', 4, 'B']],
            progression: [ch(54, [54, 57, 61, 66]), ch(50, [54, 57, 62, 66]), ch(59, [54, 59, 62, 66]), ch(49, [53, 56, 61, 65])],
            hooks: {
                A: [[0, 7, 2], [2, 4, 1], [3, 7, 2], [5, 4, 1], [6, 7, 2], [8, 4, 1], [9, 2, 2], [11, 4, 1], [12, 9, 2], [14, 7, 2], [16, 7, 2], [18, 4, 1], [19, 7, 2],
                    [21, 4, 1], [22, 9, 2], [24, 7, 1], [25, 4, 2], [27, 2, 1], [28, 10, 2], [30, 9, 2], [32, 7, 2], [34, 5, 1], [35, 7, 2], [37, 5, 1], [38, 7, 2], [40, 5, 1],
                    [41, 2, 2], [43, 5, 1], [44, 9, 2], [46, 7, 2], [48, 7, 2], [50, 5, 1], [51, 7, 2], [53, 5, 1], [54, 9, 2], [56, 7, 1], [57, 5, 2], [59, 2, 1], [60, 10, 2],
                    [62, 9, 2], [64, 7, 2], [66, 5, 1], [67, 7, 2], [69, 5, 1], [70, 7, 2], [72, 5, 1], [73, 3, 2], [75, 5, 1], [76, 10, 2], [78, 7, 2], [80, 7, 2], [82, 5, 1],
                    [83, 7, 2], [85, 5, 1], [86, 10, 2], [88, 7, 1], [89, 5, 2], [91, 3, 1], [92, 11, 2], [94, 10, 2], [96, 8, 2], [98, 6, 1], [99, 8, 2], [101, 6, 1], [102, 8, 2],
                    [104, 6, 1], [105, 4, 2], [107, 6, 1], [108, 11, 2], [110, 8, 2], [112, 8, 2], [114, 6, 1], [115, 8, 2], [117, 6, 1], [118, 11, 2], [120, 8, 1], [121, 6, 2], [123, 4, 1],
                    [124, 12, 2], [126, 11, 2]],
                B: [[0, 11, 8], [8, 9, 4], [12, 7, 4], [16, 9, 8], [24, 11, 8], [32, 12, 8], [40, 9, 4], [44, 7, 4], [48, 9, 8], [56, 12, 8], [64, 10, 8], [72, 12, 4], [76, 14, 4],
                    [80, 12, 8], [88, 10, 8], [96, 11, 8], [104, 13, 4], [108, 11, 4], [112, 8, 8], [120, 6, 4], [124, 8, 4]]
            },
            stabs: [0, 3, 6, 8, 11, 14], bass: BASS.trance, arpPattern: [0, 1, 2, 4, 2, 1, 2, 4],
            padWave: 'sawtooth', pluckWave: 'sawtooth', leadWave: 'sawtooth', spread: 1.2,
            bassCutoff: 420, bassDrive: true, buildBars: 1
        },
        4: { // Volcanic Core: dark big room, E phrygian, Em F Em Dm
            name: 'Volcanic Core', bpm: 140, root: 52, scale: PHRYGIAN, leadOct: 1, kickPitch: 46, peakShift: 2,
            // Heavy: big-room rise, half-time drops on a wobbling bass, a drone break, then the peak doubles the time
            plan: [['rise', 4, 'A'], ['drop', 8, 'A'], ['build', 2], ['drop', 8, 'B'], ['break', 4, 'B'], ['build', 4], ['peak', 8, 'A']],
            progression: [ch(52, [55, 59, 64, 67]), ch(53, [53, 57, 60, 65]), ch(52, [55, 59, 64, 67]), ch(50, [53, 57, 62, 65])],
            hooks: {
                A: [[0, 7, 2], [3, 7, 2], [6, 7, 2], [8, 8, 2], [10, 7, 2], [12, 5, 2], [14, 7, 2], [16, 7, 2], [19, 7, 2], [22, 7, 2], [24, 8, 2], [26, 10, 2], [28, 7, 4],
                    [32, 8, 2], [35, 8, 2], [38, 8, 2], [40, 9, 2], [42, 8, 2], [44, 5, 2], [46, 8, 2], [48, 8, 2], [51, 8, 2], [54, 8, 2], [56, 10, 2], [58, 12, 2], [60, 8, 4],
                    [64, 7, 2], [67, 7, 2], [70, 7, 2], [72, 8, 2], [74, 7, 2], [76, 5, 2], [78, 7, 2], [80, 7, 2], [83, 7, 2], [86, 7, 2], [88, 8, 2], [90, 10, 2], [92, 11, 4],
                    [96, 6, 2], [99, 6, 2], [102, 6, 2], [104, 8, 2], [106, 6, 2], [108, 3, 2], [110, 6, 2], [112, 6, 2], [115, 6, 2], [118, 6, 2], [120, 8, 2], [122, 10, 2], [124, 13, 4]],
                B: [[0, 0, 4], [4, 1, 2], [6, 0, 2], [8, 3, 4], [12, 1, 4], [16, 0, 4], [20, 1, 2], [22, 0, 2], [24, -1, 4], [28, 0, 4], [32, 1, 4], [36, 3, 2], [38, 1, 2],
                    [40, 5, 4], [44, 3, 4], [48, 1, 4], [52, 3, 2], [54, 5, 2], [56, 8, 4], [60, 5, 4], [64, 0, 4], [68, 2, 2], [70, 0, 2], [72, 4, 4], [76, 2, 4], [80, 0, 4],
                    [84, 2, 2], [86, 4, 2], [88, 7, 4], [92, 4, 4], [96, 6, 4], [100, 5, 2], [102, 6, 2], [104, 8, 4], [108, 6, 4], [112, 3, 4], [116, 5, 2], [118, 6, 2], [120, 8, 8]]
            },
            stabs: [0, 6, 8, 14], bass: BASS.bigroom, arpPattern: [0, 0, 2, 0, 1, 0, 3, 0],
            padWave: 'sawtooth', pluckWave: 'square', leadWave: 'sawtooth', spread: 1.3,
            bassCutoff: 520, bassDrive: true, buildBars: 1
        },
        5: { // Cosmic Void: darksynth, C harmonic minor, Cm Ab Fm G
            name: 'Cosmic Void', bpm: 104, root: 48, scale: HARMONIC_MINOR, leadOct: 2, kickPitch: 48, peakShift: 2,
            // Synthwave, slow: verse, tom-fill build, chorus; an arpeggio alone; verse and chorus again
            plan: [['rise', 4, 'A'], ['drop', 8, 'A'], ['build', 2], ['peak', 8, 'B'], ['break', 4, 'B'], ['drop', 8, 'A'], ['build', 2], ['peak', 8, 'B']],
            progression: [ch(48, [55, 60, 63, 67]), ch(56, [56, 60, 63, 68]), ch(53, [56, 60, 65, 68]), ch(55, [55, 59, 62, 67])],
            hooks: {
                A: [[0, 4, 2], [2, 7, 2], [4, 9, 2], [6, 7, 2], [8, 4, 2], [10, 7, 2], [12, 9, 4], [16, 4, 2], [18, 7, 2], [20, 9, 2], [22, 11, 2], [24, 9, 4], [28, 7, 4],
                    [32, 5, 2], [34, 7, 2], [36, 9, 2], [38, 7, 2], [40, 5, 2], [42, 7, 2], [44, 9, 4], [48, 5, 2], [50, 7, 2], [52, 9, 2], [54, 12, 2], [56, 9, 4], [60, 7, 4],
                    [64, 3, 2], [66, 5, 2], [68, 7, 2], [70, 5, 2], [72, 3, 2], [74, 5, 2], [76, 7, 4], [80, 3, 2], [82, 5, 2], [84, 7, 2], [86, 10, 2], [88, 7, 4], [92, 5, 4],
                    [96, 4, 2], [98, 6, 2], [100, 8, 2], [102, 6, 2], [104, 4, 2], [106, 6, 2], [108, 8, 4], [112, 11, 2], [114, 8, 2], [116, 6, 2], [118, 4, 2], [120, 6, 4], [124, 8, 4]],
                B: [[0, 7, 6], [6, 9, 2], [8, 11, 8], [16, 9, 4], [20, 7, 4], [24, 6, 4], [28, 7, 4], [32, 12, 6], [38, 11, 2], [40, 9, 8], [48, 7, 4], [52, 9, 4], [56, 12, 8],
                    [64, 10, 6], [70, 9, 2], [72, 7, 8], [80, 8, 4], [84, 10, 4], [88, 12, 8], [96, 13, 6], [102, 11, 2], [104, 13, 4], [108, 15, 4], [112, 13, 8], [120, 11, 8]]
            },
            stabs: [0, 4, 6, 10, 12], bass: BASS.rolling, arpPattern: [0, 2, 4, 2, 1, 3, 5, 3],
            padWave: 'sawtooth', pluckWave: 'sawtooth', leadWave: 'sawtooth', spread: 1.1,
            bassCutoff: 380, bassDrive: true, buildBars: 1
        }
        ,
        6: { // Neon Grid: a sci-fi film score, D minor, Dm Bb F C (the sequencer drives brass, strings and timpani)
            name: 'Neon Grid', bpm: 124, root: 50, scale: MINOR, leadOct: 1, kickPitch: 50, peakShift: 2,
            // A score: the sequencer alone, the drums arriving one by one, the drop, strings and piano, a timpani climb, the peak
            plan: [['rise', 8, 'A'], ['drop', 8, 'A'], ['break', 4, 'B'], ['build', 4], ['peak', 8, 'A'], ['break', 4, 'B']],
            progression: [ch(50, [50, 53, 57, 62]), ch(46, [53, 58, 62, 65]), ch(53, [53, 57, 60, 65]), ch(48, [52, 55, 60, 64])],
            hooks: (() => {
                // Hook A: a sequencer riff that follows the chords, an octave jump every bar
                const cell = [[0, 0, 1], [2, 0, 1], [4, 7, 1], [6, 0, 1], [8, 0, 1], [10, 4, 1], [12, 7, 1], [14, 4, 1]];
                const chordDeg = [0, 0, -2, -2, 2, 2, -1, -1];
                const A = [];
                chordDeg.forEach((cd, bar) => {
                    for (const [st, deg, len] of cell) A.push([bar * 16 + st, deg + cd, len]);
                    if (bar % 2 === 1) A[A.length - 1] = [bar * 16 + 14, cd + 9, 2];
                });
                // Hook B: the anthem, long notes climbing to the peak
                const B = [[0, 4, 8], [8, 7, 4], [12, 4, 4], [16, 2, 8], [24, 4, 8],
                    [32, 5, 8], [40, 4, 4], [44, 2, 4], [48, 0, 16],
                    [64, 2, 8], [72, 4, 4], [76, 7, 4], [80, 9, 16],
                    [96, 6, 8], [104, 7, 4], [108, 9, 4], [112, 11, 8], [120, 9, 8]];
                return { A, B };
            })(),
            stabs: [0, 4, 8, 12], bass: BASS.rolling, arpPattern: [0, 2, 1, 3, 2, 4, 3, 5],
            padWave: 'sawtooth', pluckWave: 'square', leadWave: 'square', spread: 1,
            bassCutoff: 400, bassDrive: true, buildBars: 1
        }
        ,
        // ---- EDM tracks: Music Run songs of their own (their world picks the scenery)
        7: { // Skyline: a festival anthem, E minor, Em C G D
            name: 'Skyline', genre: 'Festival anthem', bpm: 128, root: 52, scale: MINOR, leadOct: 1, kickPitch: 50, peakShift: 2, world: 1,
            progression: [ch(52, [55, 59, 64, 67]), ch(48, [55, 60, 64, 67]), ch(55, [55, 59, 62, 67]), ch(50, [54, 57, 62, 66])],
            plan: [['rise', 4, 'A'], ['drop', 8, 'A'], ['build', 2], ['break', 8, 'B'], ['build', 8], ['peak', 8, 'A'], ['break', 4, 'B']],
            hooks: riffHooks({
                cell: [[0, 0, 2], [2, 4, 1], [3, 7, 1], [4, 4, 2], [6, 0, 1], [7, 2, 1], [8, 4, 2], [10, 7, 2], [12, 9, 2], [14, 7, 2]],
                chords: [0, 0, -2, -2, 2, 2, -1, -1],
                B: [[0, 7, 6], [6, 9, 2], [8, 11, 8], [16, 9, 4], [20, 7, 4], [24, 4, 8], [32, 9, 6], [38, 11, 2], [40, 12, 8], [48, 11, 4], [52, 9, 4], [56, 7, 8],
                    [64, 7, 6], [70, 9, 2], [72, 11, 8], [80, 12, 4], [84, 14, 4], [88, 11, 8], [96, 9, 6], [102, 11, 2], [104, 13, 4], [108, 14, 4], [112, 12, 8], [120, 11, 8]]
            }),
            stabs: [0, 3, 6, 10, 12], bass: BASS.bigroom, arpPattern: [0, 2, 1, 3, 2, 4, 3, 5],
            padWave: 'sawtooth', pluckWave: 'sawtooth', leadWave: 'sawtooth', spread: 1.2,
            bassCutoff: 420, bassDrive: true, buildBars: 1
        },
        8: { // Breakneck: drum and bass at 174, F minor, Fm Db Ab Eb
            name: 'Breakneck', genre: 'Drum and bass', bpm: 174, root: 53, scale: MINOR, leadOct: 1, kickPitch: 52, peakShift: 2, world: 5,
            progression: [ch(53, [56, 60, 65, 68]), ch(49, [56, 61, 65, 68]), ch(56, [56, 60, 63, 68]), ch(51, [55, 58, 63, 67])],
            plan: [['rise', 8, 'A'], ['drop', 16, 'A'], ['break', 8, 'B'], ['build', 4], ['peak', 16, 'A']],
            hooks: riffHooks({
                cell: [[0, 0, 3], [3, 0, 1], [4, 2, 2], [6, 4, 2], [8, 0, 3], [11, 0, 1], [12, 4, 2], [14, 7, 2]],
                chords: [0, 0, -2, -2, 2, 2, -1, -1],
                B: [[0, 4, 8], [8, 7, 8], [16, 9, 12], [28, 7, 4], [32, 4, 8], [40, 2, 8], [48, 0, 16], [64, 7, 8], [72, 9, 8], [80, 11, 12], [92, 9, 4], [96, 7, 8], [104, 5, 8], [112, 4, 16]]
            }),
            stabs: [0, 6, 10], bass: BASS.offbeat, arpPattern: [0, 2, 4, 2, 1, 3, 5, 3],
            padWave: 'sawtooth', pluckWave: 'square', leadWave: 'sawtooth', spread: 1,
            bassCutoff: 380, bassDrive: true, buildBars: 1
        },
        9: { // Lowlight: UK garage, two-step at 134, G minor, Gm Eb Bb F
            name: 'Lowlight', genre: 'UK garage', bpm: 134, root: 55, scale: MINOR, leadOct: 1, kickPitch: 48, peakShift: 2, world: 2,
            progression: [ch(55, [58, 62, 67, 70]), ch(51, [58, 63, 67, 70]), ch(58, [58, 62, 65, 70]), ch(53, [57, 60, 65, 69])],
            plan: [['rise', 4, 'A'], ['drop', 8, 'A'], ['break', 4, 'B'], ['drop', 8, 'B'], ['build', 2], ['peak', 8, 'A'], ['break', 4, 'B']],
            hooks: riffHooks({
                cell: [[0, 4, 1], [1, 4, 1], [3, 7, 2], [6, 4, 1], [7, 2, 1], [8, 0, 2], [11, 2, 1], [12, 4, 2], [14, 2, 1], [15, 0, 1]],
                chords: [0, 0, -2, -2, 2, 2, -1, -1],
                B: [[0, 9, 3], [3, 7, 1], [4, 9, 4], [10, 7, 2], [12, 4, 4], [16, 7, 3], [19, 9, 1], [20, 7, 4], [26, 4, 2], [28, 2, 4],
                    [32, 9, 3], [35, 11, 1], [36, 9, 4], [42, 7, 2], [44, 4, 4], [48, 5, 3], [51, 4, 1], [52, 2, 4], [58, 4, 2], [60, 0, 4],
                    [64, 7, 3], [67, 9, 1], [68, 7, 4], [74, 4, 2], [76, 7, 4], [80, 9, 3], [83, 11, 1], [84, 9, 4], [90, 7, 2], [92, 9, 4],
                    [96, 11, 3], [99, 9, 1], [100, 7, 4], [106, 9, 2], [108, 11, 4], [112, 9, 3], [115, 7, 1], [116, 6, 4], [122, 4, 2], [124, 2, 4]]
            }),
            stabs: [2, 6, 10, 14], bass: BASS.offbeat, arpPattern: [0, 1, 2, 1, 3, 2, 1, 0],
            padWave: 'triangle', pluckWave: 'square', leadWave: 'square', spread: 0.9,
            bassCutoff: 340, bassDrive: true, buildBars: 1
        },
        10: { // Ironclad: hardstyle at 150, C sharp minor, C#m A E B
            name: 'Ironclad', genre: 'Hardstyle', bpm: 150, root: 49, scale: MINOR, leadOct: 1, kickPitch: 49, peakShift: 2, world: 4,
            progression: [ch(49, [56, 61, 64, 68]), ch(57, [57, 61, 64, 69]), ch(52, [56, 59, 64, 68]), ch(47, [54, 59, 63, 66])],
            plan: [['rise', 8, 'B'], ['build', 4], ['drop', 8, 'A'], ['break', 8, 'B'], ['build', 4], ['peak', 8, 'A']],
            hooks: riffHooks({
                cell: [[0, 0, 2], [2, 0, 1], [3, 4, 1], [4, 0, 2], [6, 7, 2], [8, 0, 2], [10, 0, 1], [11, 4, 1], [12, 9, 2], [14, 7, 2]],
                chords: [0, 0, -2, -2, 2, 2, -1, -1],
                B: [[0, 7, 8], [8, 9, 4], [12, 11, 4], [16, 12, 8], [24, 11, 4], [28, 9, 4], [32, 7, 8], [40, 4, 4], [44, 7, 4], [48, 9, 16],
                    [64, 7, 8], [72, 9, 4], [76, 11, 4], [80, 14, 8], [88, 12, 4], [92, 11, 4], [96, 9, 8], [104, 11, 4], [108, 12, 4], [112, 14, 16]]
            }),
            stabs: [0, 4, 8, 12], bass: BASS.offbeat, arpPattern: [0, 0, 2, 0, 1, 0, 3, 0],
            padWave: 'sawtooth', pluckWave: 'sawtooth', leadWave: 'sawtooth', spread: 1.3,
            bassCutoff: 500, bassDrive: true, buildBars: 1
        },
        11: { // Mantra: psytrance at 142, B minor, Bm Bm G A
            name: 'Mantra', genre: 'Psytrance', bpm: 142, root: 47, scale: MINOR, leadOct: 2, kickPitch: 50, peakShift: 2, world: 6,
            progression: [ch(47, [50, 54, 59, 62]), ch(47, [54, 57, 62, 66]), ch(43, [50, 55, 59, 62]), ch(45, [49, 52, 57, 61])],
            plan: [['rise', 8, 'A'], ['drop', 8, 'A'], ['build', 2], ['drop', 8, 'B'], ['break', 4, 'B'], ['build', 4], ['peak', 8, 'A']],
            hooks: riffHooks({
                cell: [[0, 0, 1], [2, 7, 1], [3, 0, 1], [4, 0, 1], [6, 9, 1], [7, 7, 1], [8, 0, 1], [10, 7, 1], [11, 0, 1], [12, 0, 1], [13, 11, 1], [14, 9, 1], [15, 7, 1]],
                chords: [0, 0, 0, 0, -2, -2, -1, -1],
                B: [[0, 7, 2], [4, 7, 2], [8, 9, 2], [12, 7, 2], [16, 7, 2], [20, 11, 2], [24, 9, 2], [28, 7, 4], [32, 7, 2], [36, 7, 2], [40, 9, 2], [44, 7, 2], [48, 12, 2], [52, 11, 2], [56, 9, 2], [60, 7, 4],
                    [64, 5, 2], [68, 5, 2], [72, 7, 2], [76, 5, 2], [80, 4, 2], [84, 7, 2], [88, 5, 2], [92, 4, 4], [96, 6, 2], [100, 6, 2], [104, 8, 2], [108, 6, 2], [112, 9, 2], [116, 8, 2], [120, 6, 2], [124, 4, 4]]
            }),
            stabs: [0, 6, 10], bass: BASS.rolling, arpPattern: [0, 2, 4, 2, 1, 3, 5, 3],
            padWave: 'sawtooth', pluckWave: 'sawtooth', leadWave: 'square', spread: 1,
            bassCutoff: 300, bassDrive: true, buildBars: 1
        },
        12: { // Recognizer: a Grid score, electro at 120 in F minor, Fm Db Ab C (the major V pulls home)
            name: 'Recognizer', genre: 'Grid score', bpm: 120, root: 53, scale: MINOR, leadOct: 1, kickPitch: 48, peakShift: 2, world: 6,
            progression: [ch(53, [56, 60, 65, 68]), ch(49, [53, 56, 61, 65]), ch(56, [60, 63, 68, 72]), ch(48, [52, 55, 60, 64])],
            plan: [['rise', 8, 'A'], ['drop', 8, 'A'], ['build', 2], ['drop', 8, 'B'], ['break', 8, 'B'], ['build', 4], ['peak', 8, 'A']],
            hooks: riffHooks({
                cell: [[0, 0, 1], [2, 0, 1], [3, 7, 1], [4, 0, 1], [6, 5, 1], [7, 7, 1], [8, 0, 1], [10, 0, 1], [11, 10, 1], [12, 12, 2], [14, 10, 1], [15, 7, 1]],
                chords: [0, 0, -2, -2, 2, 2, -3, -3],
                B: [[0, 7, 4], [4, 9, 2], [6, 7, 2], [8, 5, 4], [12, 4, 4], [16, 2, 4], [20, 4, 2], [22, 5, 2], [24, 7, 6], [32, 7, 4], [36, 9, 2], [38, 11, 2], [40, 12, 4], [44, 11, 4], [48, 9, 4], [52, 7, 2], [54, 5, 2], [56, 7, 6],
                    [64, 5, 4], [68, 7, 2], [70, 9, 2], [72, 10, 4], [76, 9, 4], [80, 7, 4], [84, 5, 2], [86, 4, 2], [88, 5, 6], [96, 4, 4], [100, 5, 2], [102, 7, 2], [104, 9, 4], [108, 11, 4], [112, 12, 4], [116, 11, 2], [118, 9, 2], [120, 7, 8]]
            }),
            stabs: [0, 6, 10], bass: BASS.offbeat, arpPattern: [0, 2, 1, 3, 2, 4, 3, 5],
            padWave: 'sawtooth', pluckWave: 'square', leadWave: 'sawtooth', spread: 1,
            bassCutoff: 420, bassDrive: true, buildBars: 2
        },
        13: { // Furnace: industrial at 112 in E phrygian, Em C Em F (the flat second grinds)
            name: 'Furnace', genre: 'Industrial', bpm: 112, root: 52, scale: PHRYGIAN, leadOct: 1, kickPitch: 46, peakShift: 1, world: 4,
            progression: [ch(52, [55, 59, 64, 67]), ch(48, [52, 55, 60, 64]), ch(52, [55, 59, 64, 67]), ch(53, [57, 60, 65, 69])],
            plan: [['rise', 4, 'A'], ['drop', 8, 'A'], ['build', 2], ['drop', 8, 'B'], ['break', 8, 'B'], ['build', 4], ['peak', 8, 'A']],
            hooks: riffHooks({
                cell: [[0, 0, 2], [2, 0, 1], [3, 1, 1], [4, 0, 2], [6, 7, 1], [7, 6, 1], [8, 0, 2], [10, 1, 1], [11, 0, 1], [12, 3, 2], [14, 2, 1], [15, 1, 1]],
                chords: [0, 0, -2, -2, 0, 0, 1, 1],
                B: [[0, 4, 6], [6, 3, 2], [8, 2, 8], [16, 0, 4], [20, 1, 4], [24, 0, 8], [32, 4, 6], [38, 5, 2], [40, 4, 8], [48, 2, 4], [52, 1, 4], [56, 0, 8],
                    [64, 7, 6], [70, 6, 2], [72, 5, 8], [80, 4, 4], [84, 3, 4], [88, 2, 8], [96, 1, 4], [100, 0, 4], [104, -1, 4], [108, 0, 4], [112, 1, 8], [120, 0, 8]]
            }),
            stabs: [0, 3, 6, 10], bass: BASS.bigroom, arpPattern: [0, 0, 2, 0, 1, 0, 3, 0],
            padWave: 'sawtooth', pluckWave: 'square', leadWave: 'square', spread: 1,
            bassCutoff: 260, bassDrive: true, buildBars: 2
        },
        14: { // Afterglow: melodic techno at 124 in A minor, Am F C G
            name: 'Afterglow', genre: 'Melodic techno', bpm: 124, root: 57, scale: MINOR, leadOct: 1, kickPitch: 48, peakShift: 2, world: 5,
            progression: [ch(57, [60, 64, 69, 72]), ch(53, [57, 60, 65, 69]), ch(48, [52, 55, 60, 64]), ch(55, [59, 62, 67, 71])],
            plan: [['rise', 8, 'A'], ['drop', 8, 'A'], ['break', 8, 'B'], ['build', 4], ['drop', 8, 'B'], ['build', 2], ['peak', 8, 'A']],
            hooks: riffHooks({
                cell: [[0, 0, 1], [1, 4, 1], [2, 7, 1], [3, 4, 1], [4, 0, 1], [5, 4, 1], [6, 7, 1], [7, 9, 1], [8, 0, 1], [9, 4, 1], [10, 7, 1], [11, 4, 1], [12, 2, 1], [13, 4, 1], [14, 7, 1], [15, 11, 1]],
                chords: [0, 0, -2, -2, 2, 2, -1, -1],
                B: [[0, 9, 6], [6, 7, 2], [8, 5, 8], [16, 7, 6], [22, 5, 2], [24, 4, 8], [32, 5, 6], [38, 4, 2], [40, 2, 8], [48, 4, 4], [52, 5, 4], [56, 7, 8],
                    [64, 9, 6], [70, 11, 2], [72, 12, 8], [80, 11, 6], [86, 9, 2], [88, 7, 8], [96, 9, 4], [100, 7, 4], [104, 5, 8], [112, 4, 4], [116, 5, 4], [120, 7, 8]]
            }),
            stabs: [2, 6, 10, 14], bass: BASS.rolling, arpPattern: [0, 1, 2, 3, 4, 3, 2, 1],
            padWave: 'sawtooth', pluckWave: 'triangle', leadWave: 'sawtooth', spread: 1,
            bassCutoff: 380, bassDrive: false, buildBars: 2
        }
    };
    for (const th of Object.values(THEMES)) {
        th.hookBars = 8;
        if (!th.hooks.B) th.hooks.B = th.hooks.A;
    }

    /**
     * A plan compiled: its segments with start bars, where the drops land,
     * the last bar of each build (the one that stops for a beat), the total,
     * and the harmony offset that puts the first drop on the first chord
     */
    const compile = (plan) => {
        const segs = [];
        const counts = {};
        let start = 0;
        for (const [kind, len, hook] of plan) {
            counts[kind] = (counts[kind] || 0) + 1;
            segs.push({ kind, start, len, hook: hook || 'A', n: counts[kind], dropNo: 0 });
            start += len;
        }
        const total = start;
        const drops = [], lastBuilds = [];
        let dropNo = 0;
        segs.forEach((sg, i) => {
            if (sg.kind !== 'drop' && sg.kind !== 'peak') return;
            sg.dropNo = ++dropNo;
            drops.push(sg.start);
            const prev = segs[i - 1];
            if (prev && (prev.kind === 'build' || prev.kind === 'rise')) lastBuilds.push(sg.start - 1);
        });
        const segAt = (bar) => { const b = ((bar % total) + total) % total; return segs.find(sg => b >= sg.start && b < sg.start + sg.len); };
        /** Everything about a bar: its segment, position in it, and what it is for */
        const pos = (bar) => {
            const b = ((bar % total) + total) % total;
            const seg = segAt(b);
            const i = b - seg.start;
            return { b, seg, kind: seg.kind, hook: seg.hook, n: seg.n, dropNo: seg.dropNo, i, len: seg.len, u: i / seg.len, first: i === 0, last: i === seg.len - 1, lastBuild: lastBuilds.includes(b), dropStart: drops.includes(b) };
        };
        return { segs, total, drops, lastBuilds, segAt, kindAt: (bar) => segAt(bar).kind, pos, harmOffset: (8 - (drops[0] || 0) % 8) % 8, dropCount: dropNo };
    };
    /** The form every track had before each got its own: rise 4, drop 8 (its last bar a build), drop 8 (its last two a build), peak 8, break 4 */
    const CLASSIC = [['rise', 4, 'A'], ['drop', 7, 'A'], ['build', 1], ['drop', 6, 'B'], ['build', 2], ['peak', 8, 'A'], ['break', 4, 'A']];
    for (const th of Object.values(THEMES)) if (!th.plan && th.name !== 'Lobby') th.plan = CLASSIC;

    root.MUSIC_THEMES = THEMES;
    root.MUSIC_BASS = BASS;
    root.MUSIC_PLAN = { compile, CLASSIC };
})(typeof window !== 'undefined' ? window : globalThis);
