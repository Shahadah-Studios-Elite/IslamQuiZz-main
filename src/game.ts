import { QuizDeck, QuizQuestion } from "./types.js";

const SHAPE_ICONS = ["▲", "◆", "●", "■"];

export class QuizGameEngine {
    private rawDeck: QuizDeck | null = null;
    private questions: QuizQuestion[] = [];
    private currentIdx = 0;
    private score = 0;
    private streak = 0;
    private bestStreak = 0;
    private timeLeft = 15;
    private timerInterval: number | null = null;
    private onShowView: (viewId: string) => void;
    private onProgress?: (score: number, streak: number, finished: boolean) => void;

    constructor(
        onShowView: (viewId: string) => void,
        onProgress?: (score: number, streak: number, finished: boolean) => void
    ) {
        this.onShowView = onShowView;
        this.onProgress = onProgress;
    }

    public start(deck: QuizDeck): void {
        this.rawDeck = deck;
        this.questions = this.shuffleDeck(deck.questions);
        this.currentIdx = 0;
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.onShowView("game-view");
        this.loadQuestion();
    }

    public nextQuestion(): void {
        this.currentIdx += 1;
        this.loadQuestion();
    }

    public restart(): void {
        if (this.rawDeck) {
            this.start(this.rawDeck);
        }
    }

    public stopTimer(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    private launchConfetti(): void {
        const canvas = document.createElement("canvas");
        canvas.style.position = "fixed";
        canvas.style.inset = "0";
        canvas.style.width = "100vw";
        canvas.style.height = "100vh";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "9999";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            canvas.remove();
            return;
        }

        const colors = ["#d4af37", "#16a34a", "#34d399", "#facc15", "#ffffff", "#0f5132"];
        const pieces = Array.from({ length: 85 }, () => ({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 140,
            w: 7 + Math.random() * 7,
            h: 5 + Math.random() * 6,
            vx: (Math.random() - 0.5) * 4,
            vy: 3.5 + Math.random() * 4.5,
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.2,
            color: colors[Math.floor(Math.random() * colors.length)]
        }));

        let frame = 0;
        const maxFrames = 110;

        const animate = () => {
            frame += 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            pieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.08;
                p.rot += p.vRot;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            if (frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        };

        requestAnimationFrame(animate);
    }

    private shuffleDeck(source: QuizQuestion[]): QuizQuestion[] {
        const shuffledQuestions = source.map(q => {
            const items = q.choices.map((text, idx) => ({
                text,
                isCorrect: idx === q.correctIndex
            }));

            for (let i = items.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = items.at(i)!;
                items[i] = items.at(j)!;
                items[j] = temp;
            }

            return {
                prompt: q.prompt,
                choices: items.map(item => item.text),
                correctIndex: items.findIndex(item => item.isCorrect),
                explanation: q.explanation
            };
        });

        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = shuffledQuestions.at(i)!;
            shuffledQuestions[i] = shuffledQuestions.at(j)!;
            shuffledQuestions[j] = temp;
        }

        return shuffledQuestions;
    }

    private loadQuestion(): void {
        if (this.currentIdx >= this.questions.length) {
            this.endGame();
            return;
        }

        const q = this.questions.at(this.currentIdx)!;
        document.getElementById("game-progress")!.textContent = `Question ${this.currentIdx + 1} / ${this.questions.length}`;
        document.getElementById("game-score")!.textContent = `🪙 ${this.score}`;
        document.getElementById("game-streak")!.textContent = `🔥 ${this.streak}x`;
        document.getElementById("question-prompt")!.textContent = q.prompt;

        const feedbackBox = document.getElementById("feedback-overlay")!;
        feedbackBox.classList.add("hidden");

        const answersGrid = document.getElementById("answers-grid")!;
        answersGrid.innerHTML = "";

        q.choices.forEach((choice, idx) => {
            const btn = document.createElement("button");
            btn.className = `answer-tile tile-${idx}`;
            btn.innerHTML = `<span class="shape">${SHAPE_ICONS.at(idx)}</span> <span>${choice}</span>`;
            btn.addEventListener("click", () => this.handleAnswer(idx));
            answersGrid.appendChild(btn);
        });

        this.startTimer();
    }

    private startTimer(): void {
        this.stopTimer();
        this.timeLeft = 15;
        const bar = document.getElementById("timer-bar")!;
        bar.style.width = "100%";

        this.timerInterval = window.setInterval(() => {
            this.timeLeft -= 0.1;
            const pct = Math.max(0, (this.timeLeft / 15) * 100);
            bar.style.width = `${pct}%`;

            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.handleAnswer(-1);
            }
        }, 100);
    }

    private handleAnswer(selectedIdx: number): void {
        this.stopTimer();
        const q = this.questions.at(this.currentIdx)!;
        const isCorrect = selectedIdx === q.correctIndex;

        const overlay = document.getElementById("feedback-overlay")!;
        const title = document.getElementById("feedback-title")!;
        const pointsEl = document.getElementById("feedback-points")!;
        const expEl = document.getElementById("feedback-explanation")!;

        if (isCorrect) {
            this.streak += 1;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            const multiplier = Math.min(3, 1 + (this.streak - 1) * 0.25);
            const earned = Math.round((100 + this.timeLeft * 10) * multiplier);
            this.score += earned;

            this.launchConfetti();
            this.playTone(587.33, "triangle", 0.15);
            setTimeout(() => this.playTone(880, "triangle", 0.25), 100);

            overlay.className = "feedback-overlay correct";
            title.textContent = this.streak >= 3 ? `🔥 UNSTOPPABLE! (${this.streak} Streak)` : "✅ CORRECT!";
            pointsEl.textContent = `+${earned} Points`;
        } else {
            this.streak = 0;
            this.playTone(196, "sawtooth", 0.3);

            overlay.className = "feedback-overlay wrong";
            title.textContent = selectedIdx === -1 ? "⏰ TIME'S UP!" : "❌ INCORRECT";
            pointsEl.textContent = `Correct Answer: ${q.choices.at(q.correctIndex)}`;
        }

        expEl.textContent = q.explanation;
        overlay.classList.remove("hidden");
        document.getElementById("game-score")!.textContent = `🪙 ${this.score}`;
        document.getElementById("game-streak")!.textContent = `🔥 ${this.streak}x`;

        if (this.onProgress) {
            this.onProgress(this.score, this.streak, false);
        }
    }

    private endGame(): void {
        this.onShowView("results-view");
        this.launchConfetti();
        this.playTone(523.25, "triangle", 0.15);
        setTimeout(() => this.playTone(659.25, "triangle", 0.15), 120);
        setTimeout(() => this.playTone(783.99, "triangle", 0.3), 240);

        document.getElementById("final-deck-title")!.textContent = this.rawDeck?.title || "Quiz Complete";
        document.getElementById("final-score")!.textContent = `${this.score}`;
        document.getElementById("final-streak")!.textContent = `${this.bestStreak}x`;

        if (this.onProgress) {
            this.onProgress(this.score, this.streak, true);
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number): void {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch {}
    }
}
