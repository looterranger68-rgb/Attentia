/**
 * ReflexGame.js
 * Logic for the "Reflex x Dash" game.
 * Decoupled from the DOM.
 */

class ReflexGame {
    constructor(config = {}) {
        this.duration = config.duration || 30; // seconds
        this.difficulty = config.difficulty || { speed: 1.0, complexity: 1 }; // speed multiplier, concurrent targets

        this.score = 0;
        this.timeLeft = this.duration;
        this.isPlaying = false;
        this.timerInterval = null;
        this.spawnInterval = null;

        // Callbacks for UI
        this.onTick = config.onTick || (() => { });
        this.onSpawnTarget = config.onSpawnTarget || (() => { });
        this.onGameOver = config.onGameOver || (() => { });
        this.onScoreUpdate = config.onScoreUpdate || (() => { });
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.score = 0;
        this.timeLeft = this.duration;

        this.onScoreUpdate(this.score);
        this.onTick(this.timeLeft);

        // Game Timer
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.onTick(this.timeLeft);
            if (this.timeLeft <= 0) {
                this.end();
            }
        }, 1000);

        // Spawn Loop
        // Spawn rate depends on difficulty speed. Higher speed = lower interval.
        const baseInterval = 1000;
        const spawnRate = baseInterval / this.difficulty.speed;

        this.spawnInterval = setInterval(() => {
            if (this.isPlaying) {
                this._spawn();
            }
        }, spawnRate);

        // Initial spawn
        this._spawn();
    }

    _spawn() {
        // Generate random position (0-100%)
        const x = Math.random() * 90; // Avoid edge
        const y = Math.random() * 90;

        // Random type based on complexity
        const types = ['circle', 'square'];
        if (this.difficulty.complexity > 1) types.push('triangle');
        if (this.difficulty.complexity > 2) types.push('hexagon');

        const type = types[Math.floor(Math.random() * types.length)];

        // Target ID to track clicks
        const id = Date.now() + Math.random();

        this.onSpawnTarget({ id, x, y, type });
    }

    hitTarget(id, type) {
        if (!this.isPlaying) return;

        // Basic scoring
        let points = 10;
        if (type === 'triangle') points = 15;
        if (type === 'hexagon') points = 20;

        this.score += points;
        this.onScoreUpdate(this.score);
    }

    end() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        clearInterval(this.spawnInterval);
        this.onGameOver({ score: this.score });
    }
}
