import { QuizDeck } from "./types.js";
import {
    PlayerState,
    renderPodium,
    renderRemoteLeaderboard,
    downloadResultsCSV,
    playJoinChime
} from "./player.js";

declare const Peer: any;

const PEER_CONFIG = {
    debug: 1,
    config: {
        iceServers: [
            { urls: "stun:://google.com" },
            { urls: "stun:://google.com" },
            { urls: "stun:://google.com" },
            { urls: "stun:://twilio.com" }
        ],
        iceCandidatePoolSize: 10
    }
};

export class PeerMultiplayerManager {
    private peer: any = null;
    private hostConn: any = null;
    private clientConns: Map<string, any> = new Map();
    private players: Map<string, PlayerState> = new Map();
    private roomPin = "";
    private myName = "";
    private myAvatar = "🕌";
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

    public getSortedPlayers(): PlayerState[] {
        return Array.from(this.players.values()).sort((a, b) => b.score - a.score);
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
        document.getElementById("host-podium")?.classList.add("hidden");
        document.getElementById("host-export-btn")?.classList.add("hidden");
        renderRemoteLeaderboard("host-players-list", []);

        this.peer = new Peer(peerId, PEER_CONFIG);

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
                        avatar: msg.avatar || "🕌",
                        score: 0,
                        streak: 0,
                        finished: false
                    });
                    playJoinChime();
                    this.refreshHostStandings();
                    this.broadcastLeaderboard();
                } else if (msg?.type === "SCORE_UPDATE") {
                    const p = this.players.get(conn.peer);
                    if (p) {
                        p.score = msg.score || 0;
                        p.streak = msg.streak || 0;
                        p.finished = Boolean(msg.finished);
                        this.refreshHostStandings();
                        this.broadcastLeaderboard();
                    }
                }
            });

            conn.on("close", () => {
                this.clientConns.delete(conn.peer);
                this.players.delete(conn.peer);
                this.refreshHostStandings();
                this.broadcastLeaderboard();
            });
        });

        this.peer.on("error", (err: any) => {
            alert(`Room error: ${err?.type || err?.message || err}`);
        });
    }

    public startHostedMatch(): void {
        if (!this.isHostMode || !this.hostedDeck) return;
        if (this.clientConns.size === 0) {
            alert("Wait for at least 1 player to join using the 6-digit PIN!");
            return;
        }
        document.getElementById("host-start-btn")!.classList.add("hidden");
        document.getElementById("host-export-btn")?.classList.remove("hidden");
        document.getElementById("host-status-badge")!.textContent = "🟢 Live Match in Progress";

        this.clientConns.forEach(conn => {
            conn.send({ type: "START_GAME", deck: this.hostedDeck });
        });
    }

    public joinRoom(pinInput: string, playerName: string, avatar: string): void {
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
        this.myAvatar = avatar || "🕌";
        const statusEl = document.getElementById("join-status")!;
        statusEl.textContent = "Step 1/2: Registering on PeerJS network...";

        this.peer = new Peer(PEER_CONFIG);

        const timeout = window.setTimeout(() => {
            if (!this.hostConn || !this.hostConn.open) {
                statusEl.textContent = "⚠️ Connection timed out. One of your networks may be blocking peer-to-peer WebRTC (try switching off VPN/school Wi-Fi).";
            }
        }, 12000);

        this.peer.on("open", () => {
            statusEl.textContent = `Step 2/2: Handshaking with Room ${cleanPin}...`;
            const conn = this.peer.connect(`sahih-quizz-${cleanPin}`, {
                reliable: true,
                serialization: "json"
            });
            this.hostConn = conn;

            conn.on("open", () => {
                clearTimeout(timeout);
                statusEl.textContent = `✅ Connected as ${this.myAvatar} ${this.myName}! Waiting for host to start...`;
                conn.send({ type: "JOIN", name: this.myName, avatar: this.myAvatar });
            });

            conn.on("data", (msg: any) => {
                if (msg?.type === "START_GAME" && msg.deck) {
                    this.onStartClientGame(msg.deck as QuizDeck);
                } else if (msg?.type === "LEADERBOARD" && Array.isArray(msg.list)) {
                    renderPodium("client-podium", msg.list);
                    renderRemoteLeaderboard("live-results-board", msg.list);
                }
            });

            conn.on("close", () => {
                clearTimeout(timeout);
                statusEl.textContent = "❌ Disconnected from host.";
            });

            conn.on("error", (err: any) => {
                clearTimeout(timeout);
                statusEl.textContent = `❌ Data channel error: ${err?.message || err}`;
            });
        });

        this.peer.on("error", (err: any) => {
            clearTimeout(timeout);
            if (err?.type === "peer-unavailable") {
                statusEl.textContent = `❌ Room ${cleanPin} not found. Make sure the host still has the PIN screen open.`;
            } else {
                statusEl.textContent = `❌ Network error (${err?.type || "unknown"}).`;
            }
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

    public exportCSV(soloScore?: number, soloStreak?: number, soloTitle?: string): void {
        const players = this.isActive() ? this.getSortedPlayers() : [];
        const title = this.hostedDeck?.title || soloTitle || "islamquizz-results";
        downloadResultsCSV(players, title, soloScore, soloStreak);
    }

    private refreshHostStandings(): void {
        const sorted = this.getSortedPlayers();
        renderRemoteLeaderboard("host-players-list", sorted);
        if (sorted.length > 0 && sorted.some(p => p.score > 0)) {
            document.getElementById("host-podium")?.classList.remove("hidden");
            renderPodium("host-podium", sorted);
        }
    }

    private broadcastLeaderboard(): void {
        const sorted = this.getSortedPlayers();
        this.clientConns.forEach(conn => {
            if (conn.open) {
                conn.send({ type: "LEADERBOARD", list: sorted });
            }
        });
    }
}
