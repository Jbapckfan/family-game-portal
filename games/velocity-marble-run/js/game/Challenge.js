/**
 * Challenge - race a friend's run from a link or a code
 *
 * A finished run becomes a compact code: the level, the marble, the time,
 * the sender's name, and the run itself as track coordinates sampled ten
 * times a second (distance along the chute, angle around it, height above
 * it). The samples are delta-coded as zigzag varints and sent as base64url,
 * so a 25-second run is well under a kilobyte. The receiving game rebuilds
 * the same chute from the level id (every chute is generated from its id)
 * and races that path as a ghost. No server is involved.
 *
 * Links carry the code after "#race-", which survives the trip through
 * messages, mail and the hosted page's address. Pasting the bare code into
 * the Challenges screen works everywhere, including the native app.
 */
const Challenge = {
    VERSION: 1,
    RATE: 10,          // samples per second
    PREFIX: 'race-',
    // Where links point when the game has no shareable address of its own
    // (the native app, or the page running inside the hosted frame)
    HOSTED_URL: 'https://claude.ai/artifact/7SNrECUjxgUPpQsHkmq54h',

    // Fixed-point units for the samples
    S_UNIT: 0.01,      // metres along the chute
    PHI_UNIT: 0.002,   // radians around it
    H_UNIT: 0.01,      // metres above the surface

    // --------------------------------------------------------------
    // Byte coding
    // --------------------------------------------------------------

    _writer() {
        const bytes = [];
        return {
            bytes,
            u8(v) { bytes.push(v & 255); },
            varint(v) {
                v = Math.max(0, Math.floor(v));
                while (v >= 128) { bytes.push((v & 127) | 128); v = Math.floor(v / 128); }
                bytes.push(v);
            },
            zigzag(v) { this.varint(v >= 0 ? v * 2 : -v * 2 - 1); },
            str(s, max = 40) {
                const enc = new TextEncoder().encode(String(s || '')).slice(0, max);
                this.varint(enc.length);
                for (const b of enc) bytes.push(b);
            }
        };
    },

    _reader(bytes) {
        let i = 0;
        return {
            get done() { return i >= bytes.length; },
            u8() { if (i >= bytes.length) throw new Error('short'); return bytes[i++]; },
            varint() {
                let v = 0, mul = 1, b;
                do {
                    if (i >= bytes.length) throw new Error('short');
                    b = bytes[i++];
                    v += (b & 127) * mul;
                    mul *= 128;
                } while (b & 128);
                return v;
            },
            zigzag() { const v = this.varint(); return v % 2 ? -(v + 1) / 2 : v / 2; },
            str() {
                const n = this.varint();
                if (i + n > bytes.length) throw new Error('short');
                const s = new TextDecoder().decode(new Uint8Array(bytes.slice(i, i + n)));
                i += n;
                return s;
            }
        };
    },

    _b64(bytes) {
        let s = '';
        for (const b of bytes) s += String.fromCharCode(b);
        return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },

    _unb64(str) {
        let s = str.replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4) s += '=';
        const bin = atob(s);
        const out = new Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    },

    // --------------------------------------------------------------
    // Runs
    // --------------------------------------------------------------

    /**
     * run = { level, marble, name, time, samples: [[s, phi, h], ...] }
     * Returns the code (base64url text).
     */
    encode(run) {
        const w = this._writer();
        w.u8(this.VERSION);
        w.str(run.level, 40);
        w.str(run.marble, 32);
        w.str(run.name, 24);
        w.varint(Math.round(run.time * 100));
        w.u8(this.RATE);
        const smp = run.samples || [];
        w.varint(smp.length);
        // Positions are accumulated in fixed point on both sides so nothing drifts
        let qs = 0, qds = 0, qphi = 0, qh = 0;
        for (const [s, phi, h] of smp) {
            const ts = Math.round(s / this.S_UNIT);
            const ds = ts - qs;
            w.zigzag(ds - qds);          // second difference of distance: small at steady speed
            qds = ds;
            qs = ts;
            let dphi = phi - qphi * this.PHI_UNIT;
            dphi = Math.atan2(Math.sin(dphi), Math.cos(dphi)); // spiral tubes wrap around
            const dq = Math.round(dphi / this.PHI_UNIT);
            w.zigzag(dq);
            qphi += dq;
            const th = Math.round(Math.max(-2, Math.min(60, h)) / this.H_UNIT);
            w.zigzag(th - qh);
            qh = th;
        }
        let sum = 0;
        for (const b of w.bytes) sum = (sum + b) & 255;
        w.u8(sum);
        return this._b64(w.bytes);
    },

    /** Code (or a whole link, or text containing either) to a run, or null */
    decode(text) {
        const code = this.extract(text);
        if (!code) return null;
        try {
            const bytes = this._unb64(code);
            if (bytes.length < 8) return null;
            let sum = 0;
            for (let i = 0; i < bytes.length - 1; i++) sum = (sum + bytes[i]) & 255;
            if (sum !== bytes[bytes.length - 1]) return null;
            const r = this._reader(bytes.slice(0, -1));
            const version = r.u8();
            if (version !== 1) return null;
            const run = { code, level: r.str(), marble: r.str(), name: r.str(), time: r.varint() / 100, rate: r.u8() };
            const n = r.varint();
            const s = new Float64Array(n), phi = new Float64Array(n), h = new Float64Array(n);
            let qs = 0, qds = 0, qphi = 0, qh = 0;
            for (let k = 0; k < n; k++) {
                qds += r.zigzag();
                qs += qds;
                qphi += r.zigzag();     // left unwrapped: the angle stays continuous for interpolation
                qh += r.zigzag();
                s[k] = qs * this.S_UNIT;
                phi[k] = qphi * this.PHI_UNIT;
                h[k] = qh * this.H_UNIT;
            }
            if (!run.level || !(run.time > 0) || n < 2 || !(run.rate > 0)) return null;
            run.s = s; run.phi = phi; run.h = h; run.count = n;
            return run;
        } catch (e) {
            return null;
        }
    },

    /** Find a code in pasted text: a full link, "#race-...", or the bare code */
    extract(text) {
        if (!text) return null;
        const t = String(text).trim();
        const m = t.match(/race-([A-Za-z0-9_-]{8,})/);
        if (m) return m[1];
        const bare = t.match(/^[A-Za-z0-9_-]{16,}$/);
        return bare ? bare[0] : null;
    },

    // --------------------------------------------------------------
    // Links and sharing
    // --------------------------------------------------------------

    shareBase() {
        let framed = false;
        try { framed = window.top !== window.self; } catch (e) { framed = true; }
        if (/^https?:$/.test(location.protocol) && !framed && !/^(localhost|127\.)/.test(location.hostname)) {
            return location.origin + location.pathname;
        }
        return this.HOSTED_URL;
    },

    link(code) {
        return `${this.shareBase()}#${this.PREFIX}${code}`;
    },

    /**
     * Share through the phone's share sheet where there is one, otherwise
     * copy to the clipboard. Resolves to 'shared', 'copied', 'cancelled' or
     * 'manual' (the caller then shows the link to copy by hand).
     */
    async share(code, title, text) {
        const url = this.link(code);
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return 'shared';
            } catch (e) {
                if (e && e.name === 'AbortError') return 'cancelled';
            }
        }
        try {
            await navigator.clipboard.writeText(`${text} ${url}`);
            return 'copied';
        } catch (e) {
            return 'manual';
        }
    }
};

window.Challenge = Challenge;
