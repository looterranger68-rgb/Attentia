class JigsawGame {
    constructor(config) {
        this.config = config;
        this.difficulty = config.difficulty || { level: 'easy' };
        this.category = config.category || 'nature';
        this.canvas = null;
        this.ctx = null;
        this.pieces = [];
        this.selectedPiece = null;

        // Viewport state
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDraggingBoard = false;

        // Image Library
        this.images = {
            'nature': 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1000&auto=format&fit=crop',
            'abstract': 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop',
            'animals': 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=1000&auto=format&fit=crop',
            'space': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop'
        };

        this.imageSrc = this.images[this.category] || this.images['nature'];

        // Difficulty Settings
        const levels = {
            'easy': 3,   // 3x3
            'medium': 4, // 4x4
            'hard': 5    // 5x5
        };
        this.gridSize = levels[this.difficulty.level] || 3;
        this.isGameOver = false;
    }

    start(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Resize canvas to full screen
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Load Image
        this.image = new Image();
        this.image.crossOrigin = "Anonymous";
        this.image.src = this.imageSrc;
        this.image.onload = () => {
            this.createPieces();
            this.shufflePieces();
            this.loop();
        };

        // Event Listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));

        // Touch support
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        window.addEventListener('touchend', this.handleMouseUp.bind(this));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.render();
    }

    createPieces() {
        this.pieces = [];
        const rows = this.gridSize;
        const cols = this.gridSize;

        // Calculate piece size based on image aspect ratio, fitting within 60% of screen
        const maxW = this.canvas.width * 0.6;
        const maxH = this.canvas.height * 0.6;

        const imgRatio = this.image.width / this.image.height;
        let pWidth, pHeight;

        if (maxW / maxH > imgRatio) {
            pHeight = maxH / rows;
            pWidth = pHeight * imgRatio;
        } else {
            pWidth = maxW / cols;
            pHeight = pWidth / imgRatio;
        }

        this.pieceWidth = pWidth;
        this.pieceHeight = pHeight;

        // Center the puzzle solution on screen
        this.boardX = (this.canvas.width - cols * pWidth) / 2;
        this.boardY = (this.canvas.height - rows * pHeight) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tabs = {
                    top: r === 0 ? 0 : -this.pieces[(r - 1) * cols + c].tabs.bottom,
                    right: c === cols - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
                    bottom: r === rows - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
                    left: c === 0 ? 0 : -this.pieces[r * cols + (c - 1)].tabs.right
                };

                this.pieces.push({
                    id: r * cols + c,
                    r, c,
                    correctX: this.boardX + c * pWidth,
                    correctY: this.boardY + r * pHeight,
                    currentX: 0,
                    currentY: 0,
                    width: pWidth,
                    height: pHeight,
                    tabs: tabs,
                    isLocked: false,
                    isSnapping: false
                });
            }
        }
    }

    shufflePieces() {
        this.pieces.forEach(piece => {
            // Scatter around the edges
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            const margin = 100;

            if (side === 0) { // Top
                piece.currentX = Math.random() * this.canvas.width;
                piece.currentY = Math.random() * margin;
            } else if (side === 1) { // Right
                piece.currentX = this.canvas.width - Math.random() * margin;
                piece.currentY = Math.random() * this.canvas.height;
            } else if (side === 2) { // Bottom
                piece.currentX = Math.random() * this.canvas.width;
                piece.currentY = this.canvas.height - Math.random() * margin;
            } else { // Left
                piece.currentX = Math.random() * margin;
                piece.currentY = Math.random() * this.canvas.height;
            }
        });
    }

    drawPiecePath(ctx, x, y, w, h, tabs) {
        ctx.beginPath();
        ctx.moveTo(x, y);

        // Top
        if (tabs.top !== 0) {
            this.drawTab(ctx, x, y, w, 0, tabs.top);
        } else {
            ctx.lineTo(x + w, y);
        }

        // Right
        if (tabs.right !== 0) {
            this.drawTab(ctx, x + w, y, h, 1, tabs.right);
        } else {
            ctx.lineTo(x + w, y + h);
        }

        // Bottom
        if (tabs.bottom !== 0) {
            this.drawTab(ctx, x + w, y + h, w, 2, tabs.bottom);
        } else {
            ctx.lineTo(x, y + h);
        }

        // Left
        if (tabs.left !== 0) {
            this.drawTab(ctx, x, y + h, h, 3, tabs.left);
        } else {
            ctx.lineTo(x, y);
        }

        ctx.closePath();
    }

    drawTab(ctx, x, y, size, side, type) {
        // Simple bezier tab
        const tabSize = size * 0.25;
        const neck = size * 0.1;

        // Transform based on side (0: top, 1: right, 2: bottom, 3: left)
        // This is a simplified placeholder for the complex bezier logic
        // For a true professional look, we'd use full bezier curves here.
        // Implementing a basic "bump" for now.

        const cx = x + (side === 0 || side === 2 ? size / 2 : 0);
        const cy = y + (side === 1 || side === 3 ? size / 2 : 0);

        const dir = type; // 1 = out, -1 = in

        if (side === 0) { // Top
            ctx.lineTo(cx - neck, y);
            ctx.bezierCurveTo(cx - neck, y - tabSize * dir, cx + neck, y - tabSize * dir, cx + neck, y);
        } else if (side === 1) { // Right
            ctx.lineTo(x, cy - neck);
            ctx.bezierCurveTo(x + tabSize * dir, cy - neck, x + tabSize * dir, cy + neck, x, cy + neck);
        } else if (side === 2) { // Bottom
            ctx.lineTo(cx + neck, y);
            ctx.bezierCurveTo(cx + neck, y + tabSize * dir, cx - neck, y + tabSize * dir, cx - neck, y);
        } else { // Left
            ctx.lineTo(x, cy + neck);
            ctx.bezierCurveTo(x - tabSize * dir, cy + neck, x - tabSize * dir, cy - neck, x, cy - neck);
        }
    }

    render() {
        if (!this.ctx || !this.image) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();

        // Apply Viewport Transform
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(-this.canvas.width / 2 + this.offsetX, -this.canvas.height / 2 + this.offsetY);

        // Draw Solution Outline (Faint)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.boardX, this.boardY, this.gridSize * this.pieceWidth, this.gridSize * this.pieceHeight);

        // Draw Pieces
        // Sort: Locked pieces first (bottom), then loose pieces, then selected (top)
        const sortedPieces = [...this.pieces].sort((a, b) => {
            if (a === this.selectedPiece) return 1;
            if (b === this.selectedPiece) return -1;
            if (a.isLocked && !b.isLocked) return -1;
            if (!a.isLocked && b.isLocked) return 1;
            return 0;
        });

        sortedPieces.forEach(piece => {
            this.ctx.save();

            // Path
            this.drawPiecePath(this.ctx, piece.currentX, piece.currentY, piece.width, piece.height, piece.tabs);

            // Clip & Draw Image
            this.ctx.clip();

            // Calculate source rect
            const srcX = (piece.c * (this.image.width / this.gridSize));
            const srcY = (piece.r * (this.image.height / this.gridSize));
            const srcW = this.image.width / this.gridSize;
            const srcH = this.image.height / this.gridSize;

            this.ctx.drawImage(this.image,
                srcX, srcY, srcW, srcH,
                piece.currentX, piece.currentY, piece.width, piece.height
            );

            // Stroke / Bevel
            this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Highlight if selected
            if (piece === this.selectedPiece) {
                this.ctx.strokeStyle = '#00bfff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                // Shadow
                this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowOffsetX = 5;
                this.ctx.shadowOffsetY = 5;
            }

            // Ghost Preview
            if (piece.isSnapping && !piece.isLocked) {
                this.ctx.globalAlpha = 0.5;
                this.ctx.fillStyle = '#00ff88';
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
            }

            this.ctx.restore();
        });

        this.ctx.restore();
    }

    loop() {
        this.render();
        requestAnimationFrame(() => this.loop());
    }

    // Interaction Handlers
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);

        // Transform screen coords to world coords
        const x = (clientX - rect.left - this.canvas.width / 2) / this.scale + this.canvas.width / 2 - this.offsetX;
        const y = (clientY - rect.top - this.canvas.height / 2) / this.scale + this.canvas.height / 2 - this.offsetY;

        return { x, y };
    }

    handleMouseDown(e) {
        if (this.isGameOver) return;
        const pos = this.getMousePos(e);

        // Check pieces (reverse order to click top ones first)
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const piece = this.pieces[i];
            if (piece.isLocked) continue;

            if (pos.x > piece.currentX && pos.x < piece.currentX + piece.width &&
                pos.y > piece.currentY && pos.y < piece.currentY + piece.height) {

                this.selectedPiece = piece;
                this.dragStartX = pos.x;
                this.dragStartY = pos.y;
                this.pieceStartX = piece.currentX;
                this.pieceStartY = piece.currentY;
                return;
            }
        }

        // If no piece clicked, drag board
        this.isDraggingBoard = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    handleMouseMove(e) {
        if (this.selectedPiece) {
            e.preventDefault();
            const pos = this.getMousePos(e);

            this.selectedPiece.currentX = this.pieceStartX + (pos.x - this.dragStartX);
            this.selectedPiece.currentY = this.pieceStartY + (pos.y - this.dragStartY);

            // Snap Check
            const dist = Math.hypot(this.selectedPiece.currentX - this.selectedPiece.correctX,
                this.selectedPiece.currentY - this.selectedPiece.correctY);

            if (dist < 20) {
                this.selectedPiece.isSnapping = true;
            } else {
                this.selectedPiece.isSnapping = false;
            }

        } else if (this.isDraggingBoard) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.offsetX += dx / this.scale;
            this.offsetY += dy / this.scale;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }

    handleMouseUp(e) {
        if (this.selectedPiece) {
            if (this.selectedPiece.isSnapping) {
                this.selectedPiece.currentX = this.selectedPiece.correctX;
                this.selectedPiece.currentY = this.selectedPiece.correctY;
                this.selectedPiece.isLocked = true;
                this.selectedPiece.isSnapping = false;
                this.checkWin();
            }
            this.selectedPiece = null;
        }
        this.isDraggingBoard = false;
    }

    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(delta);
    }

    zoom(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.5, Math.min(3, this.scale));
    }

    resetView() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    showHint() {
        // Flash a loose piece's correct location
        const loose = this.pieces.find(p => !p.isLocked);
        if (loose) {
            // In a real implementation, we'd animate a ghost or arrow
            // For now, just move it near its spot
            loose.currentX = loose.correctX + 50;
            loose.currentY = loose.correctY + 50;
        }
    }

    // Touch handlers
    handleTouchStart(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.handleMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => { }
            });
        }
    }

    handleTouchMove(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.handleMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: e.preventDefault.bind(e)
            });
        }
    }

    checkWin() {
        if (this.pieces.every(p => p.isLocked)) {
            this.isGameOver = true;
            if (this.config.onGameOver) {
                this.config.onGameOver({ score: 1000 });
            }
        }
    }
}
