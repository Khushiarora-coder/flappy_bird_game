class FlappyBird {
    constructor() {
        try {
            this.game = document.getElementById('game');
            this.bird = document.getElementById('bird');
            this.startScreen = document.getElementById('start-screen');
            this.gameOverScreen = document.getElementById('game-over');
            this.startButton = document.getElementById('start-button');
            this.restartButton = document.getElementById('restart-button');
            this.scoreElement = document.getElementById('score');
            this.levelElement = document.getElementById('level');
            this.highScoreElement = document.getElementById('highScore');
            this.finalScoreElement = document.getElementById('final-score');

            // Initialize sounds with error handling
            this.sounds = {
                flap: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
                score: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'),
                hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'),
                background: new Audio('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3')
            };

            // Set volumes for all sounds and handle errors
            Object.values(this.sounds).forEach(sound => {
                sound.volume = 0.2;
                sound.onerror = () => {
                    console.log('Sound failed to load');
                    sound.play = () => {}; // Disable play if sound fails to load
                };
            });

            // Set background music to loop
            this.sounds.background.loop = true;

            this.birdPosition = 400;
            this.gravity = 0.6;
            this.velocity = 0;
            this.pipes = [];
            this.score = 0;
            this.level = 1;
            this.pipeSpeed = 4;
            this.pipeInterval = 2000;
            this.highScore = localStorage.getItem('flappyBirdHighScore') || 0;
            this.gameLoop = null;
            this.pipeIntervalId = null;
            this.isGameRunning = false;
            this.isGameOver = false;

            this.init();
        } catch (error) {
            console.error('Error initializing game:', error);
            alert('Error loading game. Please refresh the page.');
        }
    }

    init() {
        this.highScoreElement.textContent = this.highScore;
        this.levelElement.textContent = this.level;
        
        // Add event listeners for both desktop and mobile
        const startGameHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startGame();
        };

        // Add both click and touch events for buttons
        this.startButton.addEventListener('click', startGameHandler);
        this.startButton.addEventListener('touchstart', startGameHandler);

        this.restartButton.addEventListener('click', startGameHandler);
        this.restartButton.addEventListener('touchstart', startGameHandler);
        
        // Desktop controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isGameRunning) {
                this.flap();
            }
        });

        // Mobile touch controls for game area
        const handleTap = (e) => {
            e.preventDefault(); // Always prevent default to avoid scrolling
            e.stopPropagation(); // Stop event from bubbling up
            
            // Only handle the first touch
            if (e.touches && e.touches.length > 1) return;
            
            if (this.isGameRunning) {
                this.flap();
            }
        };

        // Add touch event listeners to the game area
        this.game.addEventListener('touchstart', handleTap, { passive: false });
        this.game.addEventListener('click', handleTap);

        // Add floating animation to bird on start screen
        this.bird.classList.add('floating');
    }

    startGame() {
        // Reset game state
        this.birdPosition = 400;
        this.velocity = 0;
        this.score = 0;
        this.level = 1;
        this.pipeSpeed = 4;
        this.pipeInterval = 2000;
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.pipes.forEach(pipe => {
            if (pipe.top && pipe.bottom) {
                pipe.top.remove();
                pipe.bottom.remove();
            }
        });
        this.pipes = [];
        this.isGameRunning = true;
        this.isGameOver = false;

        // Hide screens and mobile controls
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        const mobileControls = document.querySelector('.mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'none';
        }

        // Start background music
        this.sounds.background.play();

        // Remove floating animation
        this.bird.classList.remove('floating');

        // Clear any existing intervals
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.pipeIntervalId) clearInterval(this.pipeIntervalId);
        
        // Start game loop and pipe generation
        this.gameLoop = setInterval(() => this.update(), 20);
        this.pipeIntervalId = setInterval(() => this.createPipe(), this.pipeInterval);
    }

    flap() {
        if (!this.isGameRunning || this.isGameOver) return;
        this.velocity = -10;
        this.sounds.flap.play();
    }

    createPipe() {
        if (!this.isGameRunning || this.isGameOver) return;
        
        const gap = 200;
        const minHeight = 50;
        const maxHeight = 400;
        const height = Math.random() * (maxHeight - minHeight) + minHeight;
        
        const topPipe = document.createElement('div');
        topPipe.className = 'pipe top';
        topPipe.style.height = `${height}px`;
        topPipe.style.left = '500px';
        
        const bottomPipe = document.createElement('div');
        bottomPipe.className = 'pipe bottom';
        bottomPipe.style.height = `${600 - height - gap}px`;
        bottomPipe.style.left = '500px';
        
        this.game.appendChild(topPipe);
        this.game.appendChild(bottomPipe);
        this.pipes.push({ top: topPipe, bottom: bottomPipe, passed: false });
    }

    update() {
        if (!this.isGameRunning || this.isGameOver) return;

        // Update bird position
        this.velocity += this.gravity;
        this.birdPosition += this.velocity;
        this.bird.style.top = `${this.birdPosition}px`;

        // Check for collisions with ground and ceiling
        if (this.birdPosition > 550 || this.birdPosition < 0) {
            this.gameOver();
            return;
        }

        // Update pipes
        this.pipes.forEach((pipe, index) => {
            const topLeft = parseInt(pipe.top.style.left);
            const bottomLeft = parseInt(pipe.bottom.style.left);
            
            // Move pipes
            pipe.top.style.left = `${topLeft - this.pipeSpeed}px`;
            pipe.bottom.style.left = `${bottomLeft - this.pipeSpeed}px`;
            
            // Check for collisions
            if (this.checkCollision(pipe)) {
                this.gameOver();
                return;
            }
            
            // Score point when passing pipe
            if (!pipe.passed && topLeft < 100) {
                this.score++;
                this.scoreElement.textContent = this.score;
                pipe.passed = true;
                this.sounds.score.play();
                
                // Level up every 5 points
                if (this.score % 5 === 0) {
                    this.level++;
                    this.levelElement.textContent = this.level;
                    this.pipeSpeed += 0.5;
                    this.pipeInterval = Math.max(1000, this.pipeInterval - 100);
                }
            }
            
            // Remove pipes that are off screen
            if (topLeft < -60) {
                pipe.top.remove();
                pipe.bottom.remove();
                this.pipes.splice(index, 1);
            }
        });
    }

    checkCollision(pipe) {
        const birdRect = this.bird.getBoundingClientRect();
        const topPipeRect = pipe.top.getBoundingClientRect();
        const bottomPipeRect = pipe.bottom.getBoundingClientRect();

        return (
            birdRect.right > topPipeRect.left &&
            birdRect.left < topPipeRect.right &&
            (birdRect.top < topPipeRect.bottom || birdRect.bottom > bottomPipeRect.top)
        );
    }

    gameOver() {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        this.isGameRunning = false;
        
        // Stop background music and play hit sound
        this.sounds.background.pause();
        this.sounds.hit.play();
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyBirdHighScore', this.highScore);
        }
        
        // Show game over screen
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
        
        // Clear intervals
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.pipeIntervalId) clearInterval(this.pipeIntervalId);
        
        // Reset game state
        this.birdPosition = 400;
        this.velocity = 0;
        this.bird.style.top = `${this.birdPosition}px`;
        
        // Remove all pipes
        this.pipes.forEach(pipe => {
            if (pipe.top && pipe.bottom) {
                pipe.top.remove();
                pipe.bottom.remove();
            }
        });
        this.pipes = [];
    }
}

// Initialize game when window loads
window.onload = () => {
    new FlappyBird();
}; 