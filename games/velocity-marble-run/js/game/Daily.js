/**
 * Daily challenge and leaderboards
 *
 * The daily is one seeded chute for everyone: its id carries the date, so
 * Track.js generates the same course on every device that day, in a world
 * and at a difficulty that rotate with the calendar.
 *
 * Leaderboards are kept on the device (top ten times per day, with the
 * marble used). Real cross-player boards need a server or Game Center; the
 * native hook below posts to a Game Center plugin when one is installed.
 */
function dailyLevel(date = new Date()) {
    if (typeof date === 'string') {
        const [y, mo, da] = date.split('-').map(Number);
        date = new Date(y, mo - 1, da);
    }
    const y = date.getFullYear(), mo = date.getMonth() + 1, da = date.getDate();
    const key = `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
    const dayNum = Math.floor(Date.UTC(y, mo - 1, da) / 86400000);
    const worldId = 1 + (dayNum % 5);
    return {
        id: 'daily-' + key,
        dateKey: key,
        worldId,
        name: 'Daily Challenge',
        subtitle: 'Seeded for ' + key,
        difficulty: 3 + (dayNum % 3),
        trackDifficulty: 16 + ((dayNum * 7) % 30),
        daily: true,
        hint: 'One track for everyone today: set your best time',
        starThresholds: { three: 30, two: 40, one: 999 }
    };
}

class Leaderboards {
    constructor(state) {
        this.state = state;
    }

    board(id) {
        const d = this.state.data.daily;
        d.boards = d.boards || {};
        return d.boards[id] || (d.boards[id] = { entries: [], attempts: 0 });
    }

    /** Record a finished run; returns its rank on the local board and the day's best */
    submit(id, time, marble) {
        const b = this.board(id);
        const t = +time.toFixed(2);
        b.attempts++;
        b.entries.push({ time: t, marble, at: Date.now() });
        b.entries.sort((p, q) => p.time - q.time);
        b.entries.length = Math.min(10, b.entries.length);
        const rank = b.entries.findIndex(e => e.time === t) + 1;
        this.state.save();
        this.submitNative(id, t);
        return { rank, best: b.entries[0].time };
    }

    top(id, n = 10) {
        return this.board(id).entries.slice(0, n);
    }

    best(id) {
        const e = this.board(id).entries;
        return e.length ? e[0].time : null;
    }

    attempts(id) {
        return this.board(id).attempts;
    }

    /** Game Center via a Capacitor plugin, when the native app provides one */
    submitNative(id, time) {
        try {
            const gc = window.Capacitor?.Plugins?.GameCenter;
            if (gc && typeof gc.submitScore === 'function') {
                gc.submitScore({ leaderboardId: 'daily', score: Math.round(time * 100), context: id });
            }
        } catch (e) {
            // Not installed: local board only
        }
    }
}

window.dailyLevel = dailyLevel;
window.Leaderboards = Leaderboards;
