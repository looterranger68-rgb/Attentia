/**
 * SequenceGame.js
 * Logic for "Sequence Recall" (Simon Says style).
 */

class SequenceGame {
    constructor(config = {}) {
        this.difficulty = config.difficulty || { level: 'medium' };
        this.colors = ['red', 'cyan', 'green', 'yellow'];
        this.sequence = [];
        this.playerSequence = [];
        this.round = 0;
        this.isPlaying = false;
        this.isInputBlocked = false;

        // Callbacks
        this.onSequenceStep = config.onSequenceStep || (() => { }); // Called when showing a step
        this.onRoundStart = config.onRoundStart || (() => { });
        this.onGameOver = config.onGameOver || (() => { });
        this.onScoreUpdate = config.onScoreUpdate || (() => { });
    }

    start() {
        this.sequence = [];
        this.playerSequence = [];
        this.round = 0;
        this.isPlaying = true;
        this.nextRound();
    }

    nextRound() {
        if (!this.isPlaying) return;
        this.round++;
        this.playerSequence = [];
        this.onScoreUpdate(this.round - 1); // Score is completed rounds
        this.onRoundStart(this.round);

        // Add new step
        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.sequence.push(randomColor);

        // Play sequence
        this.playSequence();
    }

    async playSequence() {
        this.isInputBlocked = true;
        // Speed increases with difficulty/rounds
        let speed = 1000;
        if (this.difficulty.level === 'hard') speed = 600;
        if (this.round > 5) speed *= 0.8;

        for (const color of this.sequence) {
            await new Promise(r => setTimeout(r, speed / 2));
            this.onSequenceStep(color);
            await new Promise(r => setTimeout(r, speed));
        }
        this.isInputBlocked = false;
    }

    input(color) {
        if (!this.isPlaying || this.isInputBlocked) return;

        this.playerSequence.push(color);
        const index = this.playerSequence.length - 1;

        if (this.playerSequence[index] !== this.sequence[index]) {
            this.end();
            return;
        }

        if (this.playerSequence.length === this.sequence.length) {
            this.isInputBlocked = true;
            setTimeout(() => this.nextRound(), 1000);
        }
    }

    end() {
        this.isPlaying = false;
        this.onGameOver({ score: this.round - 1 });
    }
}
