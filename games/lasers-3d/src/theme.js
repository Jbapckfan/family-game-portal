/* Lasers 3D - visual tokens (transcribed from VISUAL-DIRECTION.md sections B..G).
 * Global: window.LaserTheme (also CommonJS module.exports for node tooling).
 * Pure data + three tiny pure helpers. NO DOM, NO Three.js. ES2019 (Safari 15).
 *
 * Every number here is the art director's; render/ui/input/audio READ these,
 * never re-decide them. Units: 1 grid cell = 1 world unit = 1 altitude level.
 * Colors are sRGB hex strings; pass them to `new THREE.Color(hex)`.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.LaserTheme = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------------------------------------------------------- B. palette */
  var palette = {
    background: '#050817',
    floor: '#172544',
    blockTopFlat: '#172544',      /* deliberately identical to floor */
    blockTopLit: '#2B4777',
    blockSide: '#0B1530',
    gridOutline: '#334766',
    mirror: '#45E7FF',
    wedge: '#FFC857',
    dip: '#FF4FA3',
    /* DESIGN.md 14: the FLOOR plate is a mirror LYING DOWN, so it is the one piece whose accent is a metal
     * rather than a hue. A fourth saturated colour beside cyan/amber/pink would read as a fourth direction;
     * polished silver reads as "the same mirror, laid flat", which is exactly what it is. It sits in the
     * palette's existing metal family (metalLight #A8C0CE, commonFlatPiece #B7CEDB) two steps brighter, so it
     * is never mistaken for the grey glyph the FLAT view paints on the other three. */
    floorPlate: '#D6ECF7',
    emitter: '#FF2F92',
    targetUnlit: '#6D7896',
    targetLit: '#78FFD8',
    beamLevel0: '#2CB5A8',
    beamLevel1: '#39D4C2',
    beamLevel2: '#64EFDA',
    beamLevel3: '#C4FFF5',
    uiText: '#F4F8FF',
    uiTextMuted: '#A9B5CE',
    uiAccent: '#00FFCC',
    danger: '#FF5C70',
    success: '#69F0AE',
    /* supporting */
    backgroundRadialMid: '#101A50',
    backgroundRadialLight: '#243F90',
    panelFill: 'rgba(12, 20, 52, 0.78)',
    panelFillStrong: 'rgba(8, 14, 38, 0.94)',
    panelFillFallback: '#0C1434',   /* when backdrop-filter is unsupported */
    panelBorder: 'rgba(183, 226, 255, 0.22)',
    metalLight: '#A8C0CE',
    metalMid: '#7893A6',
    metalDark: '#243647',
    commonFlatPiece: '#B7CEDB',
    star: '#FFD75A',
    starEmpty: '#65718E',
    badgeFill: '#071020',
    /* DESIGN.md 15: the ground of a cell no beam has reached yet. Darker than the floor (#172544) and lighter
     * than the page (#050817), so an unexplored board reads as unlit board rather than as a hole in the page. */
    darkUnknown: '#070D1F'
  };

  /* Beam color by integer level z in 0..3 (index = z). */
  var beamColors = [palette.beamLevel0, palette.beamLevel1, palette.beamLevel2, palette.beamLevel3];
  /* Piece accent by type. */
  var pieceAccent = { MIRROR: palette.mirror, WEDGE: palette.wedge, DIP: palette.dip, FLOOR: palette.floorPlate };

  var pageBackground =
    'radial-gradient(circle at 20% 78%, rgba(0, 255, 204, 0.07), transparent 45%), ' +
    'radial-gradient(circle at 82% 20%, rgba(255, 47, 146, 0.07), transparent 42%), ' +
    'radial-gradient(circle at 50% 38%, #243F90 0%, #101A50 47%, #050817 100%)';

  /* -------------------------------------------------------------- C. materials */
  var renderer = {
    outputColorSpace: 'SRGBColorSpace',      /* THREE.SRGBColorSpace */
    toneMapping: 'ACESFilmicToneMapping',    /* THREE.ACESFilmicToneMapping */
    toneMappingExposure: 1.05,
    shadowMapType: 'PCFSoftShadowMap',
    maxDevicePixelRatio: 2,
    maxDrawCalls: 600
  };

  /* One entry per surface. `material` names the THREE class. Absent keys = THREE default. */
  var materials = {
    floor: { material: 'MeshPhysicalMaterial', color: palette.floor, metalness: 0.15, roughness: 0.78,
      emissive: '#050817', emissiveIntensity: 0.08, opacity: 1.0, transparent: false,
      clearcoat: 0.12, clearcoatRoughness: 0.75, receiveShadow: true },
    blockTopLit: { material: 'MeshPhysicalMaterial', color: palette.blockTopLit, metalness: 0.22, roughness: 0.56,
      emissive: '#08152B', emissiveIntensity: 0.10, opacity: 1.0, transparent: false,
      clearcoat: 0.20, clearcoatRoughness: 0.62, receiveShadow: true, castShadow: true },
    /* Block sides used to render as flat black silhouettes under the tilt rig (only the key light reaches them and
     * half of them face away from it), so large faces merged into one shape. A self-lit floor of the side's OWN
     * colour keeps them reading as smoked gunmetal and lets the key light modulate on top of it instead of up from
     * black. Intensity measured on a tilted 20x20 screenshot, darkest side-face pixel: 0 -> rgb(0,0,8) (black),
     * 0.65 -> rgb(0,4,30) (still crushed), 1.2 -> rgb(0,9,45), 1.5 -> ~rgb(1,13,52), 2.6 -> starts to flatten
     * against the lit faces (median rgb(28,40,85)). 1.5 puts an unlit face on its own token colour #0B1530 with the
     * lit/unlit gradient intact. */
    blockSide: { material: 'MeshStandardMaterial', color: palette.blockSide, metalness: 0.38, roughness: 0.48,
      emissive: palette.blockSide, emissiveIntensity: 1.5, opacity: 1.0, transparent: true /* opacity follows reveal */,
      receiveShadow: true, castShadow: true },
    /* FLAT-only stand-in for a dormant target: the physical orb is glass, so with the lights at zero it reads as a
     * black hole in the floor. This screen-facing reticle marks the cell in the flat view and cross-fades out as the
     * physical orb fades in. It carries NO height information (a screen-facing sprite at the cell's own top projects
     * to the cell centre under the top-down ortho camera whatever the terrain height). */
    targetFlatProxy: { material: 'MeshBasicMaterial', color: palette.targetUnlit, opacity: 1.0, transparent: true, toneMapped: false },
    gridOutline: { material: 'MeshBasicMaterial', color: palette.gridOutline, opacity: 1.0, transparent: false, toneMapped: false },
    pieceHousing: { material: 'MeshPhysicalMaterial', color: palette.metalMid, metalness: 0.82, roughness: 0.27,
      emissive: '#06131C', emissiveIntensity: 0.05, opacity: 1.0, transparent: false,
      clearcoat: 0.55, clearcoatRoughness: 0.30, castShadow: true, brushedGrain: true },
    flatPieceGlyph: { material: 'MeshBasicMaterial', color: palette.commonFlatPiece, opacity: 1.0, transparent: true /* opacity = 1 - reveal */,
      toneMapped: false },
    mirrorFace: { material: 'MeshPhysicalMaterial', color: palette.mirror, metalness: 0.28, roughness: 0.08,
      emissive: '#0D7C8A', emissiveIntensity: 0.42, opacity: 0.84, transparent: true,
      transmission: 0.48, ior: 1.46, clearcoat: 1.0, side: 'DoubleSide' },
    wedgeFace: { material: 'MeshPhysicalMaterial', color: palette.wedge, metalness: 0.46, roughness: 0.19,
      emissive: '#6B3C00', emissiveIntensity: 0.34, opacity: 0.94, transparent: true,
      clearcoat: 0.90, side: 'DoubleSide' },
    dipFace: { material: 'MeshPhysicalMaterial', color: palette.dip, metalness: 0.42, roughness: 0.22,
      emissive: '#67123D', emissiveIntensity: 0.38, opacity: 0.94, transparent: true,
      clearcoat: 0.85, side: 'DoubleSide' },
    /* DESIGN.md 14.1: the FLOOR plate. It is the only piece whose face is HORIZONTAL, so it is the only one the key
     * light hits square on; a near-mirror finish (low roughness, high metalness, no transmission) is what makes it
     * read as a puddle of silver rather than as a lid. Opaque, because a beam bounces OFF it and never through. */
    floorFace: { material: 'MeshPhysicalMaterial', color: palette.floorPlate, metalness: 0.92, roughness: 0.07,
      emissive: '#20323F', emissiveIntensity: 0.30, opacity: 1.0, transparent: true /* opacity = reveal */,
      clearcoat: 1.0, clearcoatRoughness: 0.06 },
    edgeFilament: { material: 'MeshStandardMaterial', color: 'accent' /* pieceAccent[type] */, metalness: 0.0, roughness: 0.3,
      emissive: 'accent', emissiveIntensity: 3.0, opacity: 1.0, transparent: true /* opacity = reveal */ },
    emitterBody: { material: 'MeshPhysicalMaterial', color: palette.metalLight, metalness: 0.88, roughness: 0.22,
      emissive: '#140715', emissiveIntensity: 0.05, opacity: 1.0, transparent: false, clearcoat: 0.60, castShadow: true },
    emitterFilament: { material: 'MeshStandardMaterial', color: palette.emitter, metalness: 0.05, roughness: 0.25,
      emissive: palette.emitter, emissiveIntensity: 4.80, opacity: 1.0, transparent: false, halo: true },
    emitterHalo: { material: 'MeshBasicMaterial', color: palette.emitter, opacity: 0.22, transparent: true,
      blending: 'AdditiveBlending', depthWrite: false, toneMapped: false },
    targetUnlit: { material: 'MeshPhysicalMaterial', color: palette.targetUnlit, metalness: 0.0, roughness: 0.16,
      emissive: '#18213C', emissiveIntensity: 0.25, opacity: 0.58, transparent: true,
      transmission: 0.52, ior: 1.42, clearcoat: 1.0 },
    targetLit: { material: 'MeshPhysicalMaterial', color: palette.targetLit, metalness: 0.05, roughness: 0.10,
      emissive: palette.targetLit, emissiveIntensity: 5.50, opacity: 0.82, transparent: true,
      transmission: 0.25, ior: 1.42, clearcoat: 1.0 },
    targetSocket: { material: 'MeshPhysicalMaterial', color: palette.targetUnlit, metalness: 0.6, roughness: 0.4,
      emissive: '#000000', emissiveIntensity: 0.0, opacity: 1.0, transparent: false },
    beamCore: { material: 'MeshStandardMaterial', color: 'beam' /* beamColors[z] */, metalness: 0.0, roughness: 0.30,
      emissive: 'beam', emissiveIntensity: 'beam' /* beam.levels[z].coreEmissive */, opacity: 1.0, transparent: false, toneMapped: true },
    beamGlow: { material: 'MeshBasicMaterial', color: 'beam', opacity: 'beam' /* beam.levels[z].glowOpacity */, transparent: true,
      blending: 'AdditiveBlending', depthTest: true, depthWrite: false },
    beamFilament: { material: 'MeshBasicMaterial', color: '#FFFFFF', opacity: 0.65, transparent: true,
      blending: 'AdditiveBlending', depthWrite: false, toneMapped: false }
  };

  var brushedGrain = { width: 64, height: 2, bandA: palette.metalLight, bandB: palette.metalMid, maxLuminanceContrast: 0.08, repeatX: 12 };

  var terrain = {
    cellTop: 0.96,            /* top square side, centered on integer (x,y) */
    gridStrip: 0.012,         /* outline strip width, every cell incl. floor */
    sideFrom: 0,              /* sides span world z=0 .. z=t */
    flatColorVec4: [0.0902, 0.1451, 0.2667, 1.0],   /* #172544 for the uReveal mix */
    revealShader: 'finalColor = mix(vec4(0.0902, 0.1451, 0.2667, 1.0), pbrColor, uReveal);',

    /* ---- ARCHES AND WINDOWS: the light leak (DESIGN.md 13.3) --------------------------------------------------
     * A column with an `openings` entry is drawn per solid voxel, so the hole is real; from directly above it is
     * still pixel-identical to a solid column, because the top surface is unchanged. That is the whole feature and
     * it would make the no-tilt star a guessing game, so 13.3 buys the fairness back with ONE deliberate exception
     * to the flat lie: a faint mark of light on the floor of that cell.
     *
     * Design constraints, in the order they decided the numbers:
     *  - It must say "this column is not solid" and NOT say at which level. Hence a shape with no vertical reading
     *    and no direction: a four-point gleam over a soft halo, symmetric under a quarter turn. A single slit would
     *    invite "the beam goes THAT way" (an opening is open in all four headings); a ring or a dot would collide
     *    with the FLAT target reticle (render-pieces proxyRing/proxyDot); crossed bars of even thickness came out
     *    reading as a drawn "+" icon rather than as light, which is why the spikes taper.
     *  - It must survive the phone floor of theme.camera.minCellPx = 34 CSS px. At 34 px the gleam is 13.6 px tip
     *    to tip inside a 22 px halo - findable when you know to look, ignorable when you do not.
     *  - Colour comes from the palette, not a new hue: `mirror` cyan is the coolest "instrument light" token and is
     *    the one accent that appears NOWHERE on the FLAT board (pieces show the common grey glyph, the target proxy
     *    is target-unlit grey, beams are teal), so it cannot be mistaken for a piece, a target or a beam.
     *  - Additive over #172544, so it reads as light spilling out rather than as paint on the floor.
     *  - It belongs to the FLAT lie only: opacity is multiplied by (1 - reveal), so it is gone by the time the
     *    tilted view shows the hole itself. Tilting must not be rewarded with two tells at once, and
     *    VISUAL-DIRECTION C forbids decals on lit terrain tops. */
    lightLeak: {
      color: palette.mirror,        /* '#45E7FF' */
      quadCells: 0.66,              /* side of the sprite quad, in cells (0.66 * 34 px = 22.4 px on a phone) */
      spanCells: 0.40,              /* tip to tip of the gleam (13.6 px at the 34 px cell floor) */
      waistCells: 0.052,            /* its waist, i.e. how fat the four spikes are where they meet */
      coreDotCells: 0.036,          /* the bright point the spikes radiate from */
      softPx: 5,                    /* canvas blur, so the spikes glow rather than draw a hard icon */
      haloOpacity: 0.42,            /* alpha of the radial halo at the centre of the texture */
      coreOpacity: 0.62,            /* alpha of the gleam itself in the texture */
      opacity: 0.30,                /* material opacity in FLAT; x (1 - reveal) as the board tilts */
      zOffset: 0.006,               /* above the column top (grid outline sits at +0.004) */
      texturePx: 128,
      renderOrder: 3
    },

    /* ---- DARKNESS (DESIGN.md 15) -----------------------------------------------------------------------------
     * A level may set `dark: true`. Until a beam has entered a cell, that cell's terrain, pieces, targets and
     * openings are not drawn; the grid outline over the board's ground plane always is. The tokens below describe
     * only the FOG - what an unknown cell looks like and how a newly known one arrives. What a KNOWN cell looks
     * like is not decided here and never can be: 15.1 fixes it as "exactly as it would on a lit board", so the
     * whole feature is a gate on WHEN, never a second look.
     *
     *  - `unknownColorVec3` is plain sRGB in 0..1, NOT a linear colour, because the mix happens after tone mapping
     *    and the colour-space conversion (the same place terrain.flatColorVec4 is used, and for the same reason:
     *    at reveal 0 the FLAT board must land on EXACTLY #172544, and at fog 0 on exactly #070D1F).
     *  - `gridKnownAt` is where the outline of an unknown cell sits relative to a known one: 0 = the board's ground
     *    plane. That is the whole of "darkness hides what is IN the world, never WHERE it is" - the outline is
     *    always drawn, it simply lies flat until the cell is known and then rises to the column's own top.
     *  - `revealMs` is per cell and deliberately short. The stagger comes free from the beam: a cell is learned as
     *    the travelling head reaches its centre, so a shot peels the board open along its own path.
     *  - `unknownGridLevel` keeps the outline of an unknown cell clearly visible (it is the player's only way to
     *    aim a tap) while still letting a revealed strip read as brighter. It is never 0.
     */
    darkness: {
      unknownColor: palette.darkUnknown,                  /* '#070D1F' - also the CSS token --color-dark */
      unknownColorVec3: [0.0275, 0.0510, 0.1216],         /* #070D1F / 255, sRGB, for the post-tone-map mix */
      unknownGridLevel: 0.62,   /* an unknown cell's outline, as a fraction of the lit outline's colour */
      gridKnownAt: 0.004,       /* world height the outline rests at while a cell is unknown (the ground plane) */
      revealMs: 420,            /* one cell, unknown -> fully known */
      minVisible: 0.004,        /* below this a cell's terrain is discarded outright */
      leakFadePower: 1.0        /* the light leak (13.3) arrives with the cell, never before it */
    }
  };

  var piece = {
    housing: { w: 0.72, d: 0.72, h: 0.10, chamfer: 0.02 },
    flatGlyph: { length: 0.64, width: 0.085 },     /* diagonal strip, rotated / or \ only */
    mirrorPanel: { size: 0.66, zFrom: 0.12, zTo: 0.78 },  /* vertical glass panel */
    wedgeFace: { lowZ: 0.12, highZ: 0.78 },        /* upward 45deg ramp across the diagonal */
    dipFace: { nearZ: 0.78, farZ: 0.12 },          /* inverse: near lip high, recessed edge low */
    edgeFilament: 0.025,
    /* DESIGN.md 14: the FLOOR plate. A DISC, not a square: the piece's two orientations are indistinguishable in the
     * rules (LaserPieces.TURN_KEEP), so a shape that changes with the rotate tap would be a lie about the rules. It
     * sits just proud of the housing lid, i.e. in the cell's top surface, and carries the same edge filament as the
     * upright faces so the family still reads as one set. */
    floorPlate: { radius: 0.30, thickness: 0.030, segments: 32, rimFilament: 0.026, glyphRadius: 0.26 },
    trayIconElevationDeg: 35,          /* DEPRECATED: superseded by trayIcon below (see INTERFACES-FRONTEND.md Changes) */
    /* Tray icon camera (DESIGN.md 3.3 needs the three pieces to be told apart by silhouette).
     * The panel's hinge (its `/` diagonal) runs along world (0.707, 0, -0.707) = azimuth 135 deg, so a camera at
     * azimuth 45 looks straight INTO the panel and every piece renders as a plain rectangle. Standing ~40 deg off
     * the hinge at a low elevation shows the panel as a narrow parallelogram whose slope is the whole story:
     * MIRROR upright, WEDGE rising to the right, DIP falling to the right. One camera for all three so the two
     * ramps read as mirror images of each other rather than as two unrelated shapes. */
    trayIcon: { azimuthDeg: 88, elevationDeg: 18, marginPct: 0.06, lookAtY: 0.40 }
  };

  /* -------------------------------------------------------------- D. light rig */
  var lightRig = {
    /* FLAT: every non-emissive light x0, shadow maps off, no AO/fog/vignette. */
    flat: { intensityMultiplier: 0, shadows: false, elevationDeg: 90 },
    tilt: {
      hemisphere: { skyColor: '#B7EEFF', groundColor: '#071020', intensity: 0.75, direction: 'worldUp', shadows: false },
      key: { type: 'DirectionalLight', color: '#D8F7FF', position: [-5, -7, 10], target: 'boardCenter', intensity: 2.80, shadows: true },
      rim: { type: 'DirectionalLight', color: '#FF4FA3', position: [6, 4, 5], target: 'boardCenter', intensity: 0.55, shadows: false },
      fill: { type: 'PointLight', color: '#45E7FF', position: [-3, 5, 3], intensity: 7.00, distance: 16, decay: 2, shadows: false },
      ambient: { type: 'AmbientLight', color: '#152B50', intensity: 0.18, shadows: false }
    },
    /* Positions above are in SPEC space (x east, y north, z up). World mapping is
     * (x, y, z)spec -> (x, z, -y)three; see INTERFACES-FRONTEND.md section 1.2. */
    shadow: { mapSizeHighMem: 2048, mapSizeLowMem: 1024, deviceMemoryThresholdGB: 4, bias: -0.0004, normalBias: 0.025,
      cameraPaddingCells: 1, opacity: 'smoothstep(0.25, 0.65, reveal)', updateAboveReveal: 0.15 },
    /* Reveal blend of camera elevation e (degrees):
     *   q = clamp((90 - e - 2) / 32, 0, 1);  reveal = q*q*(3 - 2*q)
     * reveal == 0 for e in [88, 90]; reveal == 1 for e <= 56. */
    reveal: { deadBandDeg: 2, rampDeg: 32, flatUntilDeg: 88, fullAtDeg: 56,
      sideOpacityFullAt: 0.35, physicalPieceOpacity: 'reveal', flatGlyphOpacity: '1 - reveal' }
  };

  function revealBlend(elevationDeg) {
    var q = (90 - elevationDeg - 2) / 32;
    q = q < 0 ? 0 : (q > 1 ? 1 : q);
    return q * q * (3 - 2 * q);
  }

  /* ---------------------------------------------------------------- E. camera */
  var camera = {
    projection: 'orthographic',
    presets: {
      /* DEPRECATED (DESIGN.md 11.2): paddingCells / minPaddingCells / fitHeights are no longer read by the renderer.
       * The frustum is fitted to the board's projected bounding box in the CURRENT orientation with `fitMarginPct`
       * of uniform margin. The keys stay so node tooling that still imports them keeps loading. */
      flat: { azimuthDeg: 0, elevationDeg: 90, paddingCells: 0.65, minPaddingCells: 0.15, fitHeights: [0] },
      tilt: { azimuthDeg: -45, elevationDeg: 35, paddingCells: 1.10, fitHeights: [0, 4] }
    },
    fit: 'boundingBox',                   /* project every silhouette point, fit the box; preserve board center */
    fitMarginPct: 0.04,                   /* uniform margin per side, as a fraction of the limiting canvas dimension
                                           * -> the board fills 1 - 2*0.04 = 92% of that dimension (DESIGN.md 11.2) */
    fitSmoothingMs: 170,                  /* the fit eases to its new value while orbiting so it never visibly pumps */
    minCellPx: 34,                        /* DESIGN.md 11.2: cells are never shrunk below this; the board overflows instead */
    panMinVisiblePct: 0.25,               /* at least this much of the board's projected box stays inside the canvas */
    orbit: { elevationMinDeg: 25, elevationMaxDeg: 90, azimuthLimited: false, interpolate: 'spherical' },
    zoom: { minFactorOfFit: 1, maxCellPxMultiple: 3 },   /* absolute zoom in [fit-to-board, 3x the minCellPx zoom] */
    flatEpsilonDeg: 2,                    /* render.isFlat(): elevation >= 88 */
    motion: {
      flatToTiltMs: 720, tiltToFlatMs: 620, fitMs: 420,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)', easingName: 'easeOutQuint-ish'
    },
    /* First-failure reveal (levels 4 and 5 only, once per level). */
    revealChoreography: {
      holdAfterTraceMs: 280, toTiltMs: 900, holdAtTiltMs: 1300, pulseOutlineMs: 500, pulseColor: palette.uiAccent, backToFlatMs: 650,
      consumesBlindStar: false
    }
  };

  /* cubic-bezier(0.22, 1, 0.36, 1) evaluated numerically (t in 0..1 -> eased 0..1). */
  function easeCamera(t) {
    if (t <= 0) return 0; if (t >= 1) return 1;
    var x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1, lo = 0, hi = 1, u = t, i;
    for (i = 0; i < 24; i++) {
      var x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
      if (x < t) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  }

  /* ------------------------------------------------------------------ G. beam */
  var beam = {
    heightOffset: 0.5,                     /* world height = z + 0.5 */
    tubeSides: 6,
    levels: [
      { z: 0, color: palette.beamLevel0, coreDiameter: 0.055, glowDiameter: 0.150, coreEmissive: 2.0, glowOpacity: 0.16, filament: false },
      { z: 1, color: palette.beamLevel1, coreDiameter: 0.072, glowDiameter: 0.195, coreEmissive: 3.0, glowOpacity: 0.21, filament: false },
      { z: 2, color: palette.beamLevel2, coreDiameter: 0.092, glowDiameter: 0.250, coreEmissive: 4.5, glowOpacity: 0.28, filament: true },
      { z: 3, color: palette.beamLevel3, coreDiameter: 0.118, glowDiameter: 0.315, coreEmissive: 6.5, glowOpacity: 0.36, filament: true }
    ],
    filament: { diameterRatio: 0.35, opacity: 0.65, color: '#FFFFFF' },
    /* Travel timing. `cellsPerSecond` is the base rate, but the DURATION is what the player feels: boards run to
     * 24x24, so a 60-cell route at a fixed 5.5 c/s would lock the controls for 11 seconds on EVERY probe. The
     * duration is therefore clamped to [minDurationMs, maxDurationMs] and the speed derived from it, so a short beam
     * still reads and a long one never outstays its welcome. A tap or any key finishes the animation instantly;
     * `skipGraceMs` is how long after FIRE such an input is ignored, so the very gesture that pressed FIRE (or the
     * `f` key, which reaches the document listener in the same event) cannot skip its own beam. */
    travel: { cellsPerSecond: 5.5, minDurationMs: 340, maxDurationMs: 2200, skipGraceMs: 140, liveRetraceMs: 140 },
    badge: {
      labels: ['Z0', 'Z1', 'Z2', 'Z3'], widthPx: 28, heightPx: 22, radius: 'pill', font: 'var(--font-data)', fontSizePx: 11, fontWeight: 800,
      borderPx: 2, borderColor: 'beam', fill: 'rgba(7, 16, 32, 0.88)', glowPx: 4, offsetAbovePx: 10, showOnlyAfterFire: true
    },
    endStates: {
      blocked: { cap: 'octagon', capColor: palette.danger, capDiameter: 0.18, sparks: 3, sparkSize: 0.08, sparkFadeMs: 260 },
      /* DEPARTURE - the owner's report, 2026-09-03: "after the wedge moves the beam up it eventually stops... the
       * beam should keep going up or at least look like its going farther". A beam that leaves the world must read
       * as CONTINUING and fading out, never as stopping dead in mid-air. The simulation is untouched (trace() still
       * ends where it ends); every token below describes only how the LAST STRETCH OF THE DRAWING behaves past
       * result.endPoint:
       *   departCells      how far the tube is carried beyond endPoint, in cells
       *   departMode       'ray'  - along the beam's own direction, so a 45-degree climb keeps climbing. Never bent.
       *                    'skim' - along the ground heading from the floor contact point. A lost-floor beam already
       *                             meets the floor EXACTLY at endPoint (level 0 travels at height 0.5 and the stub
       *                             drops half a cell over the half cell to the boundary), so continuing the
       *                             descending ray would only bury the tube; the departure scatters forward along
       *                             the floor instead, which is what striking a surface looks like.
       *   departSteps      sub-tubes the departure is cut into, so the taper reads as a curve and not a cone
       *   radiusPower      core and glow radius = startScale * (1 - t)^radiusPower across the departure
       *   fadePower        opacity = (1 - t)^fadePower across the departure (higher = fades out sooner)
       *   taperBackCells   narrowing applied INSIDE the beam over the last cells BEFORE endPoint (floor only)
       *   startScale       radius at endPoint as a fraction of full, i.e. where taperBackCells lands
       *   floorClearance   how far above the floor plane a 'skim' departure is centred, so it never sinks through
       *   markerAlongCells where the marker ring sits along the departure (0 = on endPoint, as before). The rings
       *                    still say WHY the beam was lost and all keep ringDiameter 0.20, but at level 3 the beam's
       *                    own glow is 0.315 wide, so a lost-SKY ring left on endPoint is swallowed by the tube it
       *                    is meant to mark; sliding it up the departure puts it where the tube has tapered.
       * departCells is set by eye at the shipping board sizes (12x12 to 24x24 - see DESIGN.md 11.1): the old 0.22
       * cell edge taper was invisible once a cell is ~34 px. The departure is part of the beam's ARC LENGTH, so the
       * travel sweep reveals it instead of popping it in at the end, and it carries no animation of its own - there
       * is nothing extra to gate on prefers-reduced-motion, and the sweep that reveals it already obeys
       * reducedMotion.beamTravel*. */
      lostEdge: { departCells: 2.4, departMode: 'ray', departSteps: 6, radiusPower: 1.25, fadePower: 1.05,
        taperBackCells: 0, startScale: 1, markerAlongCells: 0,
        ring: 'hollow', ringColor: palette.danger, ringDiameter: 0.20, ringStroke: 0.025 },
      lostFloor: { departCells: 1.7, departMode: 'skim', departSteps: 6, radiusPower: 1.40, fadePower: 1.20,
        taperBackCells: 0.55, startScale: 0.72, floorClearance: 0.02, markerAlongCells: 0,
        ring: 'flatOnFloor', ringColor: palette.danger, ringDiameter: 0.20, ringStroke: 0.025, notch: 'down' },
      lostSky: { departCells: 2.8, departMode: 'ray', departSteps: 6, radiusPower: 1.30, fadePower: 1.10,
        taperBackCells: 0, startScale: 1, markerAlongCells: 1.10,
        ring: 'screenFacing', ringColor: palette.danger, ringDiameter: 0.20, ringStroke: 0.025, notch: 'up' },
      loop: { ring: 'double', ringColor: palette.wedge, rotateOnceMs: 500 },
      target: { litFadeMs: 160, rings: 2, ringFrom: 0.18, ringTo: 0.75, ringMs: 420, streaks: 8, haloDiameter: 0.42, haloOpacity: 0.22 }
    }
  };

  /* -------------------------------------------------------------------- F. ui */
  var fonts = {
    ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    data: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'
  };

  /* Exact :root custom properties. Order matters only for readability. */
  var cssVars = {
    '--font-ui': fonts.ui,
    '--font-data': fonts.data,
    '--space-1': '4px', '--space-2': '8px', '--space-3': '12px', '--space-4': '16px', '--space-5': '24px', '--space-6': '32px',
    '--radius-sm': '8px', '--radius-md': '12px', '--radius-lg': '16px', '--radius-pill': '999px',
    '--type-xs': '11px', '--type-sm': '13px', '--type-md': '15px', '--type-lg': '18px', '--type-xl': '24px', '--type-2xl': '32px',
    '--line-tight': '1.15', '--line-body': '1.45',
    '--color-bg': palette.background,
    '--color-floor': palette.floor,
    '--color-text': palette.uiText,
    '--color-text-muted': palette.uiTextMuted,
    '--color-accent': palette.uiAccent,
    '--color-emitter': palette.emitter,
    '--color-danger': palette.danger,
    '--color-success': palette.success,
    '--color-mirror': palette.mirror,
    '--color-wedge': palette.wedge,
    '--color-dip': palette.dip,
    /* One accent token per PIECE TYPE, named after the type. The three above are kept because the help diagram and
     * the tray stylesheet already reference them, but nothing new should: a fifth piece must be able to get its
     * colour without anyone editing a stylesheet, and `--color-floor` was already taken by the terrain floor, which
     * would have painted the FLOOR piece's label in the board's own near-black navy. */
    '--color-piece-mirror': pieceAccent.MIRROR,
    '--color-piece-wedge': pieceAccent.WEDGE,
    '--color-piece-dip': pieceAccent.DIP,
    '--color-piece-floor': pieceAccent.FLOOR,
    /* DESIGN.md 15: the ground of a cell no beam has reached. */
    '--color-dark': palette.darkUnknown,
    /* Terrain tokens, so the how-to-play diagrams can draw a wall, a floor cell and the light leak of DESIGN.md 13.3
     * in the board's own colours instead of inventing hues. */
    '--color-block-side': palette.blockSide,
    '--color-block-top': palette.blockTopLit,
    '--color-grid-outline': palette.gridOutline,
    '--color-leak': palette.mirror,
    '--color-star': palette.star,
    '--color-star-empty': palette.starEmpty,
    '--color-target-lit': palette.targetLit,
    '--color-beam-0': palette.beamLevel0, '--color-beam-1': palette.beamLevel1, '--color-beam-2': palette.beamLevel2, '--color-beam-3': palette.beamLevel3,
    '--color-panel': palette.panelFill,
    '--color-panel-strong': palette.panelFillStrong,
    '--color-panel-fallback': palette.panelFillFallback,
    '--color-panel-border': palette.panelBorder,
    '--color-backdrop': 'rgba(2, 5, 17, 0.74)',
    '--touch-min': '44px',
    '--shadow-panel': '0 12px 32px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.13)',
    '--shadow-raised': '0 6px 16px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
    '--shadow-focus': '0 0 0 3px rgba(0, 255, 204, 0.42)',
    '--shadow-cyan-glow': '0 0 18px rgba(0, 255, 204, 0.30)',
    '--shadow-pink-glow': '0 0 18px rgba(255, 47, 146, 0.34)',
    '--z-hud': '100', '--z-backdrop': '900', '--z-modal': '910', '--z-menu': '9999',
    '--page-bg': pageBackground,
    '--ease-camera': 'cubic-bezier(0.22, 1, 0.36, 1)'
  };

  var ui = {
    fonts: fonts,
    cssVars: cssVars,
    panel: { backdropFilter: 'blur(18px) saturate(145%)', borderPx: 1, highlight: 'static diagonal, upper-left', shimmer: false },
    zIndex: { menu: 9999, hud: 100, backdrop: 900, modal: 910, pieceControls: 120, toast: 150, badge: 50 },
    menuLink: { href: '../../', minW: 64, minH: 44, position: 'top-left', zIndex: 9999 },
    hud: { center: true, smallScreenMaxPx: 600, smallLeftPx: 76, smallRightPx: 68, minHeightPx: 52,
      levelNumber: { sizePx: 13, weight: 600 }, levelName: { sizePx: 18, weight: 700 },
      piecesLine: { sizePx: 11, weight: 700, font: 'data', format: 'PIECES used/par' },
      soundButton: { w: 48, h: 44, position: 'top-right' } },
    tray: { paddingPx: 12, gapPx: 8, card: { w: 72, h: 72, minW: 64, minH: 64, iconH: 44 },
      label: { sizePx: 11, weight: 800, uppercase: true }, count: { sizePx: 11, font: 'data' },
      selected: { borderPx: 2, translateY: -3, glow: '0 0 18px', glowOpacity: 0.35 },
      zeroCountOpacity: 0.38, twoRowBelowPx: 390,
      fire: { w: 72, h: 56 }, secondary: { minW: 56, minH: 44 } },
    button: {
      base: { border: '1px solid rgba(255,255,255,0.20)', fontSizePx: 15, weight: 700, radiusPx: 12 },
      primary: { background: 'rgba(255,47,146,0.18)', border: palette.emitter, color: palette.emitter, glow: 'var(--shadow-pink-glow)' },
      selected: { background: 'rgba(0,255,204,0.16)', border: palette.uiAccent, color: palette.uiAccent },
      hover: { mediaQuery: '(hover: hover) and (pointer: fine)', translateY: -1, glowOpacity: 0.45 },
      active: { transform: 'translateY(1px) scale(0.97)', ms: 90 },
      focus: 'outline: none; box-shadow: var(--shadow-focus), var(--shadow-raised)',
      disabled: { opacity: 0.38, glow: false, transform: false },
      invalid: { shakes: 2, shakeMs: 70, shakePx: 4, dangerBorderMs: 400 },
      minHit: 44
    },
    modal: { backdrop: 'rgba(2,5,17,0.74)', width: 'min(520px, calc(100vw - 32px))', maxHeight: 'calc(100dvh - 32px)', paddingPx: 24, radiusPx: 16,
      close: { w: 44, h: 44, position: 'top-right' }, heading: { sizePx: 24, weight: 750 }, body: { sizePx: 15, line: 1.45 }, caption: { sizePx: 13, line: 1.45 } },
    levelSelect: { grid: 'repeat(auto-fit, minmax(64px, 1fr))', gapPx: 8, tileMin: 64,
      completed: 'cyan top edge', current: '2px cyan border', locked: { color: palette.starEmpty, opacity: 0.45, icon: 'metal padlock' } },
    star: { sizePx: 24, strokePx: 1.5, earnedGradient: ['#FFF1A6', '#FFD75A'], earnedStroke: '#FFE28A', earnedGlow: '0 0 8px rgba(255,215,90,0.45)',
      emptyFill: '#0B1330', emptyStroke: palette.starEmpty, blindDot: { px: 4, color: palette.uiAccent } },
    victory: { riseFromPx: 12, fadeMs: 360, title: 'Beam Connected', titleSizePx: 28, titleWeight: 800,
      starDelaysMs: [0, 180, 360], starScale: [0.72, 1.12, 1.0], lightRing: true, confetti: false, nextColor: palette.success },
    hintGhostMs: 2000,
    toastMs: 2600,
    /* Post-FIRE result readout (DESIGN.md 3.6's blind star only rewards deduction if a FIRE actually tells the
     * player something). It is its own grid row between the HUD and the stage, so it can never cover the board or
     * the Menu link. Altitude is stated as a caret plus a NUMBER, never colour alone. */
    readout: { minHeightPx: 26, gapPx: 8, chipRadiusPx: 999, altitudePrefix: '^' }
  };

  /* ---------------------------------------------------- reduced motion */
  var reducedMotion = {
    mediaQuery: '(prefers-reduced-motion: reduce)',
    cameraMs: 140, easing: 'linear',
    maxHoldMs: 500, overshoot: false, particles: false,
    /* multiply any timing above by this when reduce is on (camera uses fixed 140ms instead) */
    durationScale: 0.35,
    beamTravelCellsPerSecond: 40,
    beamTravelMinDurationMs: 120,
    beamTravelMaxDurationMs: 700
  };

  /* ------------------------------------------------------------- helpers */
  function cssVariables() {
    var out = ':root{', k;
    for (k in cssVars) if (Object.prototype.hasOwnProperty.call(cssVars, k)) out += k + ':' + cssVars[k] + ';';
    return out + '}';
  }
  function beamLevel(z) { var i = z < 0 ? 0 : (z > 3 ? 3 : Math.round(z)); return beam.levels[i]; }

  return {
    version: 1,
    palette: palette, beamColors: beamColors, pieceAccent: pieceAccent, pageBackground: pageBackground,
    renderer: renderer, materials: materials, brushedGrain: brushedGrain, terrain: terrain, piece: piece,
    lightRig: lightRig, camera: camera, beam: beam, ui: ui, reducedMotion: reducedMotion,
    revealBlend: revealBlend, easeCamera: easeCamera, beamLevel: beamLevel, cssVariables: cssVariables
  };
}));
