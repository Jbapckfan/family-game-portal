/**
 * ScoreCard - a run as a picture, ready to send
 *
 * A finished run (a level, a daily chute, a race or a Music Run) is drawn
 * onto a 1080 x 1350 card in its world's colours: the level, the score, the
 * time, the stars or the grade, the marble and the player's name. Sharing
 * uses the phone's share sheet with the picture attached where that works
 * (iOS and Android browsers and the app), the share sheet with text and a
 * link where pictures cannot be attached, and the clipboard everywhere else.
 */
const ScoreCard = {
    W: 1080,
    H: 1350,

    /** The world's palette (Scene3D's table when it is loaded) */
    palette(world) {
        const pals = typeof WORLD_PALETTES !== 'undefined' ? WORLD_PALETTES : null;
        return (pals && pals[world]) || { skyTop: '#0a0a1a', skyMid: '#1e1e3f', skyBottom: '#2d2b55', accent: '#6366f1', accent2: '#a78bfa', sun: '#ffffff' };
    },

    worldName(world) {
        const w = (window.WORLDS || []).find(x => x.id === world);
        return w ? w.name : '';
    },

    /** Draw the card; returns the canvas */
    render(run) {
        const W = this.W, H = this.H;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        const pal = this.palette(run.scene || run.world);
        const music = run.kind === 'music';

        // Sky
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, pal.skyTop);
        g.addColorStop(0.55, pal.skyMid);
        g.addColorStop(1, pal.skyBottom);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        // Stars
        let seed = 7;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 160; i++) {
            const x = rnd() * W, y = rnd() * H * 0.7, r = 0.6 + rnd() * 1.6;
            ctx.globalAlpha = 0.3 + rnd() * 0.6;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // A neon chute sweeping through the lower half
        ctx.lineCap = 'round';
        for (const [w, a, col] of [[70, 0.12, pal.accent], [26, 0.5, pal.accent], [8, 1, '#ffffff']]) {
            ctx.strokeStyle = col;
            ctx.globalAlpha = a;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(-60, 860);
            ctx.bezierCurveTo(260, 800, 420, 1120, 640, 1040);
            ctx.bezierCurveTo(860, 960, 980, 1180, 1140, 1110);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Ribs across the chute
        ctx.strokeStyle = pal.accent2;
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.55;
        for (let i = 0; i < 14; i++) {
            const t = i / 13;
            const x = -60 + t * 1200;
            const y = 860 + Math.sin(t * Math.PI * 1.5) * 110 + t * 200;
            ctx.beginPath(); ctx.moveTo(x, y - 54); ctx.lineTo(x, y + 54); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Marble
        const mx = 360, my = 1080;
        const glow = ctx.createRadialGradient(mx, my, 10, mx, my, 150);
        glow.addColorStop(0, 'rgba(255,255,255,0.55)');
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(mx, my, 150, 0, Math.PI * 2); ctx.fill();
        const style = (window.Marble && Marble.STYLES[run.marble]) || null;
        const mg = ctx.createRadialGradient(mx - 20, my - 24, 8, mx, my, 62);
        mg.addColorStop(0, style ? style.highlightColor || '#ffffff' : '#ffffff');
        mg.addColorStop(0.55, style ? style.baseColor || '#dddddd' : '#dddddd');
        mg.addColorStop(1, style ? style.shadowColor || '#555555' : '#555555');
        ctx.fillStyle = mg;
        ctx.beginPath(); ctx.arc(mx, my, 62, 0, Math.PI * 2); ctx.fill();

        // Text
        const font = (px, weight = 800) => `${weight} ${px}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = pal.accent;
        ctx.font = font(30, 800);
        ctx.fillText('VELOCITY MARBLE RUN', 80, 92);
        ctx.fillStyle = '#ffffff';
        ctx.font = font(92, 900);
        this.fitText(ctx, (run.name || run.level || '').toUpperCase(), 80, 140, W - 160);
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.font = font(34, 600);
        const sub = music ? `Music Run · ${this.worldName(run.world)}` : `${run.level && run.level.includes('-') && !run.level.startsWith('daily') ? 'Level ' + run.level + ' · ' : ''}${run.kind === 'daily' ? 'Daily chute · ' : run.kind === 'race' ? 'Race · ' : ''}${this.worldName(run.world)}`;
        ctx.fillText(sub, 80, 252);

        ctx.fillStyle = pal.accent;
        ctx.font = font(30, 800);
        ctx.fillText(music ? 'SCORE' : 'SCORE', 80, 360);
        ctx.fillStyle = '#ffffff';
        ctx.font = font(170, 900);
        ctx.fillText(Number(run.score || 0).toLocaleString(), 72, 392);

        // Time, stars or grade, marble: three columns under the score
        let x = 80;
        const col = (label, value) => {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = font(26, 700);
            ctx.fillText(label, x, 640);
            ctx.fillStyle = '#ffffff';
            ctx.font = font(46, 800);
            ctx.fillText(value, x, 674);
            x += Math.max(300, ctx.measureText(value).width + 70);
        };
        if (music) col('GRADE', run.grade || '-');
        else col('STARS', '★'.repeat(Math.max(0, run.stars || 0)).padEnd(3, '☆'));
        if (run.time) col('TIME', `${Number(run.time).toFixed(2)} s`);
        if (style) col('MARBLE', style.name);

        // Footer: who and when, and where to play
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = font(30, 700);
        const who = run.player ? `${run.player} · ` : '';
        const when = run.t ? new Date(run.t).toLocaleDateString() : '';
        ctx.fillText(`${who}${when}`, 80, H - 150);
        ctx.fillStyle = pal.accent2;
        ctx.font = font(26, 700);
        ctx.fillText('Play it: ' + this.url().replace(/^https?:\/\//, ''), 80, H - 100);
        return c;
    },

    fitText(ctx, text, x, y, maxW) {
        let size = parseInt(ctx.font.match(/(\d+)px/)[1], 10);
        while (size > 40 && ctx.measureText(text).width > maxW) {
            size -= 4;
            ctx.font = ctx.font.replace(/\d+px/, size + 'px');
        }
        ctx.fillText(text, x, y);
    },

    url() {
        return window.Challenge ? Challenge.shareBase() : location.href.split('#')[0];
    },

    /** The words that go with the card */
    text(run) {
        const music = run.kind === 'music';
        const who = run.player ? `${run.player} scored` : 'I scored';
        const what = music ? `${run.name} (grade ${run.grade})` : `${run.name}${run.level && !String(run.level).startsWith('daily') ? ' (' + run.level + ')' : ''}`;
        const time = run.time ? ` in ${Number(run.time).toFixed(2)} s` : '';
        const stars = !music && run.stars ? `, ${run.stars} star${run.stars === 1 ? '' : 's'}` : '';
        return `${who} ${Number(run.score || 0).toLocaleString()} on ${what}${time}${stars} in Velocity Marble Run. Beat it: ${this.url()}`;
    },

    async toFile(run) {
        const canvas = this.render(run);
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        if (!blob) return null;
        const name = `velocity-${String(run.level || 'run').replace(/[^a-z0-9-]/gi, '')}-${run.score || 0}.png`;
        return new File([blob], name, { type: 'image/png' });
    },

    /**
     * Share the card. Resolves 'shared' (sent through the share sheet),
     * 'copied' (the text and link are on the clipboard), 'saved' (the card
     * was downloaded), 'cancelled' or 'failed'
     */
    async share(run) {
        const text = this.text(run);
        const title = 'Velocity Marble Run';
        let file = null;
        try { file = await this.toFile(run); } catch (e) { file = null; }
        if (navigator.share) {
            try {
                if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ title, text, files: [file] });
                } else {
                    await navigator.share({ title, text, url: this.url() });
                }
                return 'shared';
            } catch (e) {
                if (e && e.name === 'AbortError') return 'cancelled';
            }
        }
        // No share sheet: clipboard, and the picture as a download where the browser allows one
        let copied = false;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); copied = true; }
        } catch (e) { copied = false; }
        if (file && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) {
            try {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(file);
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
                return copied ? 'copied' : 'saved';
            } catch (e) { /* fall through */ }
        }
        return copied ? 'copied' : 'failed';
    }
};

window.ScoreCard = ScoreCard;
