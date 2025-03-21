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
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
        
        // Desktop controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isGameRunning) {
                this.flap();
            }
        });

        // Mobile touch controls - updated to handle both touch and click events
        const handleTap = (e) => {
            if (e.type === 'touchstart') {
                e.preventDefault(); // Prevent scrolling
            }
            if (this.isGameRunning) {
                this.flap();
            }
        };

        // Add both touch and click event listeners
        this.game.addEventListener('touchstart', handleTap);
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
        this.pipes.forEach(pipe => pipe.remove());
        this.pipes = [];
        this.isGameRunning = true;

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

        // Start game loop and pipe generation
        this.gameLoop = setInterval(() => this.update(), 20);
        this.pipeIntervalId = setInterval(() => this.createPipe(), this.pipeInterval);
    }

    flap() {
        this.velocity = -10;
        this.bird.classList.add('flapping');
        this.sounds.flap.currentTime = 0;
        this.sounds.flap.play();
        setTimeout(() => this.bird.classList.remove('flapping'), 200);
    }

    updateLevel() {
        if (this.score > 0 && this.score % 5 === 0) {
            this.level++;
            this.pipeSpeed += 0.8;
            this.pipeInterval = Math.max(1200, this.pipeInterval - 250);
            
            // Update pipe interval
            clearInterval(this.pipeIntervalId);
            this.pipeIntervalId = setInterval(() => this.createPipe(), this.pipeInterval);
            
            // Update level display
            this.levelElement.textContent = this.level;
        }
    }

    update() {
        // Update bird position
        this.velocity += this.gravity;
        this.birdPosition += this.velocity;
        this.bird.style.top = `${this.birdPosition}px`;

        // Check collisions
        if (this.birdPosition < 0 || this.birdPosition > 720) {
            this.gameOver();
        }

        // Update pipes
        this.pipes.forEach((pipe, index) => {
            const pipeLeft = parseInt(pipe.style.left);
            pipe.style.left = `${pipeLeft - this.pipeSpeed}px`;

            // Check for score
            if (pipeLeft === 98) {
                this.score++;
                this.scoreElement.textContent = this.score;
                this.sounds.score.currentTime = 0;
                this.sounds.score.play();
                this.updateLevel();
            }

            // Check for collisions
            if (this.checkCollision(pipe)) {
                this.gameOver();
            }

            // Remove off-screen pipes
            if (pipeLeft < -100) {
                pipe.remove();
                this.pipes.splice(index, 1);
            }
        });
    }

    createPipe() {
        const gap = 250;
        const gapPosition = Math.random() * (700 - gap - 100) + 50;
        
        const topPipe = document.createElement('div');
        topPipe.className = 'pipe top';
        topPipe.style.height = `${gapPosition}px`;
        topPipe.style.left = '800px';

        const bottomPipe = document.createElement('div');
        bottomPipe.className = 'pipe bottom';
        bottomPipe.style.height = `${720 - gapPosition - gap}px`;
        bottomPipe.style.left = '800px';

        this.game.appendChild(topPipe);
        this.game.appendChild(bottomPipe);
        this.pipes.push(topPipe, bottomPipe);
    }

    checkCollision(pipe) {
        const birdRect = this.bird.getBoundingClientRect();
        const pipeRect = pipe.getBoundingClientRect();

        return (
            birdRect.right > pipeRect.left &&
            birdRect.left < pipeRect.right &&
            birdRect.top < pipeRect.bottom &&
            birdRect.bottom > pipeRect.top
        );
    }

    gameOver() {
        this.isGameRunning = false;
        clearInterval(this.gameLoop);
        clearInterval(this.pipeIntervalId);

        // Stop background music and play hit sound
        this.sounds.background.pause();
        this.sounds.background.currentTime = 0;
        this.sounds.hit.play();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyBirdHighScore', this.highScore);
        }

        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new FlappyBird();
}); 