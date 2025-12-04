class SudokuGame {
    constructor(config) {
        this.config = config;
        this.difficulty = config.difficulty || 'medium';
        this.board = [];
        this.initialBoard = [];
        this.solution = [];
        this.selectedCell = null;
        this.score = 0;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.startTime = Date.now();
        this.timerInterval = null;
        this.hintsUsed = 0;
    }

    start(containerId) {
        this.container = document.getElementById(containerId);
        this.generateBoard();
        this.render();
        this.startTimer();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const secs = (elapsed % 60).toString().padStart(2, '0');
            const timerEl = document.getElementById('timer');
            if (timerEl) timerEl.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    generateBoard() {
        // Backtracking algorithm to generate a valid board
        const board = Array(9).fill().map(() => Array(9).fill(0));
        this.solveSudoku(board);
        this.solution = JSON.parse(JSON.stringify(board));

        // Remove numbers based on difficulty
        let attempts = 40;
        if (this.difficulty === 'easy') attempts = 30;
        if (this.difficulty === 'hard') attempts = 50;

        this.board = JSON.parse(JSON.stringify(this.solution));
        this.initialBoard = JSON.parse(JSON.stringify(this.solution));

        while (attempts > 0) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);
            while (this.board[row][col] === 0) {
                row = Math.floor(Math.random() * 9);
                col = Math.floor(Math.random() * 9);
            }
            this.board[row][col] = 0;
            this.initialBoard[row][col] = 0;
            attempts--;
        }
    }

    solveSudoku(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    this.shuffleArray(nums);

                    for (let num of nums) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.solveSudoku(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValid(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) if (board[row][x] === num) return false;

        // Check col
        for (let x = 0; x < 9; x++) if (board[x][col] === num) return false;

        // Check 3x3 box
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }
        return true;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    render() {
        this.container.innerHTML = '';
        this.container.className = 'sudoku-grid';

        const conflicts = this.checkConflicts();

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';

                // Borders for 3x3 boxes
                if (r % 3 === 0 && r !== 0) cell.style.borderTop = '2px solid #00bfff';
                if (c % 3 === 0 && c !== 0) cell.style.borderLeft = '2px solid #00bfff';

                if (this.initialBoard[r][c] !== 0) {
                    cell.textContent = this.initialBoard[r][c];
                    cell.classList.add('fixed');
                } else {
                    if (this.board[r][c] !== 0) {
                        cell.textContent = this.board[r][c];
                        cell.classList.add('user-input');
                        if (this.board[r][c] !== this.solution[r][c]) {
                            // cell.classList.add('error'); // Optional: Instant error feedback
                        }
                    }
                    cell.onclick = () => this.selectCell(r, c, cell);
                }

                if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
                    cell.classList.add('selected');
                }

                // Highlight same numbers
                if (this.selectedCell && this.board[this.selectedCell.r][this.selectedCell.c] !== 0) {
                    const selectedVal = this.board[this.selectedCell.r][this.selectedCell.c];
                    if (this.board[r][c] === selectedVal) {
                        cell.classList.add('highlight-same');
                    }
                }

                // Highlight conflicts
                if (conflicts.has(`${r},${c}`)) {
                    cell.classList.add('conflict');
                }

                this.container.appendChild(cell);
            }
        }

        // Update HUD
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
        const mistakesEl = document.getElementById('mistakes');
        if (mistakesEl) mistakesEl.textContent = `Mistakes: ${this.mistakes}/${this.maxMistakes}`;
    }

    selectCell(r, c, el) {
        const prev = this.container.querySelector('.selected');
        if (prev) prev.classList.remove('selected');
        this.selectedCell = { r, c };
        this.render();
    }

    input(num) {
        if (!this.selectedCell) return;
        const { r, c } = this.selectedCell;

        if (this.initialBoard[r][c] === 0) {
            // Check correctness
            if (num !== 0 && num !== this.solution[r][c]) {
                this.mistakes++;
                this.score = Math.max(0, this.score - 50);
                if (this.mistakes >= this.maxMistakes) {
                    this.gameOver(false);
                }
            } else if (num !== 0) {
                this.score += 100;
            }

            this.board[r][c] = num;
            this.render();
            this.checkWin();
        }
    }

    getHint() {
        // Professional Hint: Find a Naked Single
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0) {
                    const candidates = [];
                    for (let n = 1; n <= 9; n++) {
                        if (this.isValid(this.board, r, c, n)) candidates.push(n);
                    }
                    if (candidates.length === 1) {
                        this.board[r][c] = candidates[0];
                        this.selectedCell = { r, c };
                        this.render();
                        alert(`Hint: Cell (${r + 1}, ${c + 1}) must be ${candidates[0]} (Naked Single)`);
                        return;
                    }
                }
            }
        }

        // Fallback: Reveal random cell
        const empty = [];
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (this.board[r][c] === 0) empty.push({ r, c });

        if (empty.length > 0) {
            const { r, c } = empty[Math.floor(Math.random() * empty.length)];
            this.board[r][c] = this.solution[r][c];
            this.selectedCell = { r, c };
            this.render();
        }
    }

    checkConflicts() {
        const conflicts = new Set();
        const board = this.board;

        // Check Rows
        for (let r = 0; r < 9; r++) {
            const seen = {};
            for (let c = 0; c < 9; c++) {
                const val = board[r][c];
                if (val !== 0) {
                    if (seen[val]) {
                        conflicts.add(`${r},${c}`);
                        conflicts.add(`${r},${seen[val]}`);
                    } else {
                        seen[val] = c;
                    }
                }
            }
        }

        // Check Cols
        for (let c = 0; c < 9; c++) {
            const seen = {};
            for (let r = 0; r < 9; r++) {
                const val = board[r][c];
                if (val !== 0) {
                    if (seen[val]) {
                        conflicts.add(`${r},${c}`);
                        conflicts.add(`${seen[val]},${c}`);
                    } else {
                        seen[val] = r;
                    }
                }
            }
        }

        // Check 3x3 Boxes
        for (let boxR = 0; boxR < 3; boxR++) {
            for (let boxC = 0; boxC < 3; boxC++) {
                const seen = {};
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const r = boxR * 3 + i;
                        const c = boxC * 3 + j;
                        const val = board[r][c];
                        if (val !== 0) {
                            if (seen[val]) {
                                conflicts.add(`${r},${c}`);
                                const [pr, pc] = seen[val].split(',');
                                conflicts.add(`${pr},${pc}`);
                            } else {
                                seen[val] = `${r},${c}`;
                            }
                        }
                    }
                }
            }
        }

        return conflicts;
    }

    checkWin() {
        let isFull = true;
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (this.board[r][c] === 0) isFull = false;

        if (isFull && this.mistakes < this.maxMistakes) {
            let correct = true;
            for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (this.board[r][c] !== this.solution[r][c]) correct = false;

            if (correct) {
                clearInterval(this.timerInterval);
                if (this.config.onGameOver) {
                    this.config.onGameOver({ score: this.score });
                }
            }
        }
    }

    gameOver(win) {
        clearInterval(this.timerInterval);
        if (!win) {
            alert("Game Over! Too many mistakes.");
            location.reload();
        }
    }
}
