/**
 * LogicGame.js
 * Logic for "Logic Flow" (Path connection puzzle).
 */

class LogicGame {
    constructor(config = {}) {
        this.difficulty = config.difficulty || { level: 'medium' };
        this.gridSize = 5;
        this.grid = [];
        this.startPoint = { x: 0, y: 0 };
        this.endPoint = { x: 4, y: 4 };
        this.isPlaying = false;

        // Callbacks
        this.onGridUpdate = config.onGridUpdate || (() => { });
        this.onGameOver = config.onGameOver || (() => { });
    }

    start() {
        this.isPlaying = true;
        this.gridSize = this.difficulty.level === 'hard' ? 7 : 5;
        this.startPoint = { x: 0, y: 0 };
        this.endPoint = { x: this.gridSize - 1, y: this.gridSize - 1 };

        // Initialize empty grid
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));

        // Set obstacles (simple random)
        const obstacleCount = this.difficulty.level === 'hard' ? 10 : 5;
        for (let i = 0; i < obstacleCount; i++) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            if ((x !== 0 || y !== 0) && (x !== this.gridSize - 1 || y !== this.gridSize - 1)) {
                this.grid[y][x] = -1; // -1 is obstacle
            }
        }

        this.onGridUpdate(this.grid, this.startPoint, this.endPoint);
    }

    // Simple BFS to check connectivity
    checkWin() {
        // In a real implementation, this would check the user's drawn path.
        // For this simplified version, we'll just simulate a "Verify" action.
        // Let's assume the UI handles the drawing and passes the path here.
        return true;
    }

    // For this iteration, we will make it a "Click path" game.
    // User clicks adjacent cells to build a path.
    toggleCell(x, y) {
        if (!this.isPlaying) return;
        if (this.grid[y][x] === -1) return; // Obstacle
        if ((x === this.startPoint.x && y === this.startPoint.y) ||
            (x === this.endPoint.x && y === this.endPoint.y)) return;

        // Toggle path (1 is path, 0 is empty)
        this.grid[y][x] = this.grid[y][x] === 1 ? 0 : 1;
        this.onGridUpdate(this.grid, this.startPoint, this.endPoint);

        if (this._validatePath()) {
            this.end();
        }
    }

    _validatePath() {
        // Check if there is a continuous path of 1s from start to end
        const visited = new Set();
        const queue = [`${this.startPoint.x},${this.startPoint.y}`];
        visited.add(`${this.startPoint.x},${this.startPoint.y}`);

        while (queue.length > 0) {
            const curr = queue.shift();
            const [cx, cy] = curr.split(',').map(Number);

            if (cx === this.endPoint.x && cy === this.endPoint.y) return true;

            const neighbors = [
                { x: cx + 1, y: cy }, { x: cx - 1, y: cy },
                { x: cx, y: cy + 1 }, { x: cx, y: cy - 1 }
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < this.gridSize && n.y >= 0 && n.y < this.gridSize) {
                    // It's a valid neighbor if it's the end point OR it's a path cell (1)
                    const isEnd = n.x === this.endPoint.x && n.y === this.endPoint.y;
                    const isPath = this.grid[n.y][n.x] === 1;

                    if ((isPath || isEnd) && !visited.has(`${n.x},${n.y}`)) {
                        visited.add(`${n.x},${n.y}`);
                        queue.push(`${n.x},${n.y}`);
                    }
                }
            }
        }
        return false;
    }

    end() {
        this.isPlaying = false;
        this.onGameOver({ score: 100 }); // Fixed score for solving
    }
}
