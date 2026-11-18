export interface PlayerState {
    id: string;
    name: string;
    avatar: string;
    score: number;
    streak: number;
    finished: boolean;
}

export function renderPodium(containerId: string, list: PlayerState[]): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const first = list.at(0);
    const second = list.at(1);
    const third = list.at(2);

    container.innerHTML = `
        <div class="podium-stage">
            <div class="podium-col second">
                <div class="podium-avatar">${second ? second.avatar : "—"}</div>
                <div class="podium-name">${second ? second.name : "2nd"}</div>
                <div class="podium-pts">${second ? `🪙 ${second.score}` : ""}</div>
                <div class="podium-step">🥈 2</div>
            </div>
            <div class="podium-col first">
                <div class="podium-crown">👑</div>
                <div class="podium-avatar">${first ? first.avatar : "—"}</div>
                <div class="podium-name">${first ? first.name : "1st"}</div>
                <div class="podium-pts">${first ? `🪙 ${first.score}` : ""}</div>
                <div class="podium-step">🥇 1</div>
            </div>
            <div class="podium-col third">
                <div class="podium-avatar">${third ? third.avatar : "—"}</div>
                <div class="podium-name">${third ? third.name : "3rd"}</div>
                <div class="podium-pts">${third ? `🪙 ${third.score}` : ""}</div>
                <div class="podium-step">🥉 3</div>
            </div>
        </div>
    `;
}

export function renderRemoteLeaderboard(containerId: string, list: PlayerState[]): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `<p class="empty-msg">Waiting for players to enter the 6-digit PIN...</p>`;
        return;
    }

    container.innerHTML = "";
    list.forEach((p, idx) => {
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
        const row = document.createElement("div");
        row.className = "player-row";
        row.innerHTML = `
            <span><strong>${medal} ${p.avatar} ${p.name}</strong> ${p.finished ? "✅" : ""}</span>
            <span>🔥 ${p.streak}x • <strong>🪙 ${p.score}</strong></span>
        `;
        container.appendChild(row);
    });
}

export function downloadResultsCSV(
    players: PlayerState[],
    deckTitle: string,
    soloScore?: number,
    soloStreak?: number
): void {
    const rows: string[] = ["Rank,Avatar,Player Name,Streak,Score,Status"];

    if (players.length > 0) {
        players.forEach((p, idx) => {
            const safeName = `"${p.name.replace(/"/g, '""')}"`;
            rows.push(`${idx + 1},${p.avatar},${safeName},${p.streak}x,${p.score},${p.finished ? "Finished" : "Playing"}`);
        });
    } else {
        rows.push(`1,🕌,"Solo Player",${soloStreak || 0}x,${soloScore || 0},Finished`);
    }

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
    const link = document.createElement("a");
    const cleanTitle = (deckTitle || "islamquizz-results")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${cleanTitle}-scores.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function playJoinChime(): void {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(783.99, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
    } catch {}
}
