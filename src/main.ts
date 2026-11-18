import { QuizDeck, QuizQuestion } from "./types.js";
import { PREMADE_DECKS } from "./presets.js";
import { QuizGameEngine } from "./game.js";
import { PeerMultiplayerManager } from "./multiplayer.js";

let builderQuestions: QuizQuestion[] = [];

function showView(viewId: string): void {
    document.querySelectorAll(".view").forEach(el => el.classList.add("hidden"));
    document.getElementById(viewId)?.classList.remove("hidden");
}

const multiplayer = new PeerMultiplayerManager(
    (deck: QuizDeck) => {
        document.getElementById("live-board-box")?.classList.remove("hidden");
        game.start(deck);
    },
    showView
);

const game = new QuizGameEngine(showView, (score, streak, finished) => {
    multiplayer.sendScoreUpdate(score, streak, finished);
});

function encodeDeckToUrl(deck: QuizDeck): string {
    const json = JSON.stringify(deck);
    const base64 = btoa(encodeURIComponent(json));
    return `${window.location.origin}${window.location.pathname}#quiz=${base64}`;
}

function decodeDeckFromUrl(): QuizDeck | null {
    const hash = window.location.hash;
    if (!hash.startsWith("#quiz=")) return null;
    try {
        const base64 = hash.replace("#quiz=", "");
        const json = decodeURIComponent(atob(base64));
        const parsed = JSON.parse(json) as QuizDeck;
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return parsed;
        }
    } catch (e) {
        console.error("Invalid shared quiz link:", e);
    }
    return null;
}

function renderLobby(): void {
    multiplayer.disconnect();
    document.getElementById("live-board-box")?.classList.add("hidden");
    showView("lobby-view");

    const grid = document.getElementById("deck-grid")!;
    grid.innerHTML = "";

    const sharedDeck = decodeDeckFromUrl();
    const allDecks = sharedDeck ? [sharedDeck, ...PREMADE_DECKS] : PREMADE_DECKS;

    allDecks.forEach((deck, index) => {
        const isShared = sharedDeck && index === 0;
        const card = document.createElement("div");
        card.className = "deck-card";
        card.innerHTML = `
            <div class="deck-top">
                <span class="deck-cat">${isShared ? "🔗 Shared Quiz" : deck.category}</span>
                <span class="deck-count">${deck.questions.length} Qs</span>
            </div>
            <h3>${deck.title}</h3>
            <p class="deck-author">By ${deck.author}</p>
            <div class="deck-actions">
                <button class="btn-play" data-idx="${index}">▶ Solo</button>
                <button class="btn-host" data-idx="${index}">📡 Host Live</button>
                <button class="btn-share" data-idx="${index}">🔗</button>
            </div>
        `;
        grid.appendChild(card);
    });

    grid.querySelectorAll(".btn-play").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = parseInt((e.currentTarget as HTMLElement).dataset.idx || "0", 10);
            game.start(allDecks.at(idx)!);
        });
    });

    grid.querySelectorAll(".btn-host").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = parseInt((e.currentTarget as HTMLElement).dataset.idx || "0", 10);
            document.getElementById("host-start-btn")!.classList.remove("hidden");
            document.getElementById("host-status-badge")!.textContent = "🟡 Waiting for Players";
            multiplayer.hostRoom(allDecks.at(idx)!);
        });
    });

    grid.querySelectorAll(".btn-share").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = parseInt((e.currentTarget as HTMLElement).dataset.idx || "0", 10);
            const url = encodeDeckToUrl(allDecks.at(idx)!);
            navigator.clipboard.writeText(url);
            (e.currentTarget as HTMLElement).textContent = "✅";
            setTimeout(() => {
                (e.currentTarget as HTMLElement).textContent = "🔗";
            }, 2000);
        });
    });
}

function renderBuilderList(): void {
    const list = document.getElementById("builder-list")!;
    list.innerHTML = "";
    builderQuestions.forEach((q, idx) => {
        const item = document.createElement("div");
        item.className = "builder-item";
        item.innerHTML = `
            <span><strong>Q${idx + 1}:</strong> ${q.prompt}</span>
            <button type="button" class="btn-del" data-idx="${idx}">Remove</button>
        `;
        list.appendChild(item);
    });

    list.querySelectorAll(".btn-del").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = parseInt((e.currentTarget as HTMLElement).dataset.idx || "0", 10);
            builderQuestions.splice(idx, 1);
            renderBuilderList();
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("nav-lobby-btn")?.addEventListener("click", () => {
        game.stopTimer();
        renderLobby();
    });

    document.getElementById("nav-join-btn")?.addEventListener("click", () => {
        game.stopTimer();
        multiplayer.disconnect();
        document.getElementById("join-status")!.textContent = "";
        showView("join-view");
    });

    document.getElementById("nav-create-btn")?.addEventListener("click", () => {
        game.stopTimer();
        multiplayer.disconnect();
        builderQuestions = [];
        renderBuilderList();
        showView("builder-view");
    });

    document.getElementById("host-start-btn")?.addEventListener("click", () => multiplayer.startHostedMatch());
    document.getElementById("host-close-btn")?.addEventListener("click", () => renderLobby());

    document.getElementById("join-submit-btn")?.addEventListener("click", () => {
        const pin = (document.getElementById("join-pin-input") as HTMLInputElement).value;
        const name = (document.getElementById("join-name-input") as HTMLInputElement).value;
        multiplayer.joinRoom(pin, name);
    });

    document.getElementById("next-q-btn")?.addEventListener("click", () => game.nextQuestion());
    document.getElementById("play-again-btn")?.addEventListener("click", () => {
        if (multiplayer.isActive()) {
            renderLobby();
        } else {
            game.restart();
        }
    });
    document.getElementById("back-home-btn")?.addEventListener("click", () => renderLobby());

    document.getElementById("add-q-btn")?.addEventListener("click", () => {
        const prompt = (document.getElementById("b-prompt") as HTMLInputElement).value.trim();
        const c0 = (document.getElementById("b-c0") as HTMLInputElement).value.trim();
        const c1 = (document.getElementById("b-c1") as HTMLInputElement).value.trim();
        const c2 = (document.getElementById("b-c2") as HTMLInputElement).value.trim();
        const c3 = (document.getElementById("b-c3") as HTMLInputElement).value.trim();
        const correctIndex = parseInt((document.getElementById("b-correct") as HTMLSelectElement).value, 10);
        const explanation = (document.getElementById("b-exp") as HTMLInputElement).value.trim() || "Verified via SahihFinder.";

        if (!prompt || !c0 || !c1 || !c2 || !c3) {
            alert("Please fill in the question and all 4 answer choices.");
            return;
        }

        builderQuestions.push({ prompt, choices: [c0, c1, c2, c3], correctIndex, explanation });

        (document.getElementById("b-prompt") as HTMLInputElement).value = "";
        (document.getElementById("b-c0") as HTMLInputElement).value = "";
        (document.getElementById("b-c1") as HTMLInputElement).value = "";
        (document.getElementById("b-c2") as HTMLInputElement).value = "";
        (document.getElementById("b-c3") as HTMLInputElement).value = "";
        (document.getElementById("b-exp") as HTMLInputElement).value = "";

        renderBuilderList();
    });

    document.getElementById("publish-quiz-btn")?.addEventListener("click", () => {
        const title = (document.getElementById("b-title") as HTMLInputElement).value.trim() || "Custom Islamic Quiz";
        const author = (document.getElementById("b-author") as HTMLInputElement).value.trim() || "Community Member";

        if (builderQuestions.length === 0) {
            alert("Add at least 1 question before publishing!");
            return;
        }

        const newDeck: QuizDeck = {
            id: "custom-" + Date.now(),
            title,
            author,
            category: "Custom Deck",
            questions: builderQuestions
        };

        const shareUrl = encodeDeckToUrl(newDeck);
        window.location.hash = shareUrl.split("#").at(1) || "";
        navigator.clipboard.writeText(shareUrl);
        alert("🎉 Quiz Created! Your shareable link has been copied to your clipboard.");
        renderLobby();
    });

    renderLobby();
});
