import { QuizDeck } from "./types.js";

declare const Peer: any;

export interface PlayerState {
    id: string;
    name: string;
    score: number;
    streak: number;
    finished: boolean;
}

export class PeerMultiplayerManager {
    private peer: any = null;
    private hostConn: any = null;
    private clientConns: Map<string, any> = new Map();
    private players: Map<string, PlayerState> = new Map();
    private roomPin = "";
    private myName = "";
    private isHostMode = false;
    private hostedDeck: QuizDeck | null = null;
    private onStartClientGame: (deck: QuizDeck) => void;
    private onShowView: (viewId: string) => void;

    constructor(onStartClientGame: (deck: QuizDeck) => void, onShowView: (viewId: string) => void) {
        this.onStartClientGame = onStartClientGame;
        this.onShowView = onShowView;
    }

    public isActive(): boolean {
        return this.peer !== null;
    }

    public isHost(): boolean {
        return this.isHostMode;
    }

    public disconnect(): void {
        if (this.peer) {
            try { this.peer.destroy(); } catch {}
            this.peer = null;
        }
        this.hostConn = null;
        this.clientConns.clear();
        this.players.clear();
        this.isHostMode = false;
        this.roomPin = "";
    }

    public hostRoom(deck: QuizDeck): void {
        this.disconnect();
        if (typeof Peer === "undefined") {
            alert("PeerJS failed to load. Please refresh the page.");
            return;
        }

        this.isHostMode = true;
        this.hostedDeck = deck;
        this.roomPin = Math.floor(100000 + Math.random() * 900000).toString();
        const peerId = `sahih-quizz-${this.roomPin}`;

        this.onShowView("host-view");
        document.getElementById("host-pin-display")!.textContent = "Connecting...";
        document.getElementById("host-deck-name")!.textContent = deck.title;
        this.renderLeaderboard("host-players-list");

        this.peer = new Peer(peerId);

        this.peer.on("open", () => {
            document.getElementById("host-pin-display")!.textContent = this.roomPin;
        });

        this.peer.on("connection", (conn: any) => {
            conn.on("open", () => {
                this.clientConns.set(conn.peer, conn);
            });

            conn.on("data", (msg: any) => {
                if (msg?.type === "JOIN") {
                    this.players.set(conn.peer, {
                        id: conn.peer,
                        name: (msg.name || "Player").slice(0, 18),
                        score: 0,
                        streak: 0,
                        finished: false
                    });
                    this.renderLeaderboard("host-players-list");
                    this.broadcastLeaderboard();
                } else if (msg?.type === "SCORE_UPDATE") {
                    const p = this.players.get(conn.peer);
                    if (p) {
                        p.score = msg.score || 0;
                        p.streak = msg.streak || 0;
                        p.finished = Boolean(msg.finished);
                        this.renderLeaderboard("host-players-list");
                        this.broadcastLeaderboard();
                    }
                }
            });

            conn.on("close", () => {
                this.clientConns.delete(conn.peer);
                this.players.delete(conn.peer);
                this.renderLeaderboard("host-players-list");
                this.broadcastLeaderboard();
            });
        });

        this.peer.on("error", (err: any) => {
            alert(`Room error: ${err?.message || err}`);
        });
    }

    public startHostedMatch(): void {
        if (!this.isHostMode || !this.hostedDeck) return;
        if (this.clientConns.size === 0) {
            alert("Wait for at least 1 player to join using the 6-digit PIN!");
            return;
        }
        document.getElementById("host-start-btn")!.classList.add("hidden");
        document.getElementById("host-status-badge")!.textContent = "🟢 Live Match in Progress";

        this.clientConns.forEach(conn => {
            conn.send({ type: "START_GAME", deck: this.hostedDeck });
        });
    }

    public joinRoom(pinInput: string, playerName: string): void {
        this.disconnect();
        if (typeof Peer === "undefined") {
            alert("PeerJS failed to load. Please refresh the page.");
            return;
        }

        const cleanPin = pinInput.replace(/\D/g, "");
        if (cleanPin.length !== 6) {
            alert("Please enter a valid 6-digit Room PIN.");
            return;
        }

        this.isHostMode = false;
        this.myName = playerName.trim() || "Seeker";
        const statusEl = document.getElementById("join-status")!;
        statusEl.textContent = "Connecting to room...";

        this.peer = new Peer();

        this.peer.on("open", () => {
            const conn = this.peer.connect(`sahih-quizz-${cleanPin}`, { reliable: true });
            this.hostConn = conn;

            conn.on("open", () => {
                statusEl.textContent = `✅ Connected to Room ${cleanPin}! Waiting for host to start...`;
                conn.send({ type: "JOIN", name: this.myName });
            });

            conn.on("data", (msg: any) => {
                if (msg?.type === "START_GAME" && msg.deck) {
                    this.onStartClientGame(msg.deck as QuizDeck);
                } else if (msg?.type === "LEADERBOARD" && Array.isArray(msg.list)) {
                    this.renderRemoteLeaderboard("live-results-board", msg.list);
                }
            });

            conn.on("close", () => {
                statusEl.textContent = "❌ Disconnected from host.";
            });
        });

        this.peer.on("error", () => {
            statusEl.textContent = "❌ Could not find room. Check the 6-digit PIN and try again.";
        });
    }

    public sendScoreUpdate(score: number, streak: number, finished: boolean): void {
        if (!this.isHostMode && this.hostConn && this.hostConn.open) {
            this.hostConn.send({
                type: "SCORE_UPDATE",
                score,
                streak,
                finished
            });
        }
    }

    private broadcastLeaderboard(): void {
        const sorted = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
        this.clientConns.forEach(conn => {
            if (conn.open) {
                conn.send({ type: "LEADERBOARD", list: sorted });
            }
        });
    }

    private renderLeaderboard(containerId: string): void {
        const sorted = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
        this.renderRemoteLeaderboard(containerId, sorted);
    }

    private renderRemoteLeaderboard(containerId: string, list: PlayerState[]): void {
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
                <span><strong>${medal} ${p.name}</strong> ${p.finished ? "✅" : ""}</span>
                <span>🔥 ${p.streak}x • <strong>🪙 ${p.score}</strong></span>
            `;
            container.appendChild(row);
        });
    }
}
