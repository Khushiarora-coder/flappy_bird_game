class FlappyBird {
    constructor() {
        this.game = document.getElementById('game');
        this.bird = document.getElementById('bird');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over');
        this.startButton = document.getElementById('start-button');
        this.restartButton = document.getElementById('restart-button');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.finalScoreElement = document.getElementById('final-score');

        // Initialize sounds with softer effects
        this.sounds = {
            flap: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
            score: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'),
            hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'),
            background: new Audio('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3')
        };

        // Set volumes for all sounds
        this.sounds.flap.volume = 0.3;
        this.sounds.score.volume = 0.4;
        this.sounds.hit.volume = 0.3;
        this.sounds.background.volume = 0.2;

        // Set background music to loop
        this.sounds.background.loop = true;

        this.birdPosition = 400;
        this.gravity = 0.6;
        this.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.highScore = localStorage.getItem('flappyBirdHighScore') || 0;
        this.gameLoop = null;
        this.pipeInterval = null;
        this.isGameRunning = false;

        this.init();
    }

    init() {
        this.highScoreElement.textContent = this.highScore;
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isGameRunning) {
                this.flap();
            }
        });

        // Add floating animation to bird on start screen
        this.bird.classList.add('floating');
    }

    startGame() {
        // Reset game state
        this.birdPosition = 400;
        this.velocity = 0;
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.pipes.forEach(pipe => pipe.remove());
        this.pipes = [];
        this.isGameRunning = true;

        // Hide screens
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');

        // Start background music
        this.sounds.background.play();

        // Remove floating animation
        this.bird.classList.remove('floating');

        // Start game loop and pipe generation
        this.gameLoop = setInterval(() => this.update(), 20);
        this.pipeInterval = setInterval(() => this.createPipe(), 2500);
    }

    flap() {
        this.velocity = -10;
        this.bird.classList.add('flapping');
        this.sounds.flap.currentTime = 0;
        this.sounds.flap.play();
        setTimeout(() => this.bird.classList.remove('flapping'), 200);
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
            pipe.style.left = `${pipeLeft - 3}px`;

            // Check for score
            if (pipeLeft === 98) {
                this.score++;
                this.scoreElement.textContent = this.score;
                this.sounds.score.currentTime = 0;
                this.sounds.score.play();
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
        clearInterval(this.pipeInterval);

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