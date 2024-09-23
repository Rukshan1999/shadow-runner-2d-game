const characterElm = document.querySelector('#character');
const enemyElm = document.getElementById('enemy');
const scoreElm = document.getElementById('score');
const gameOverElm = document.getElementById('game-over');
const finalScoreElm = document.getElementById('final-score');
const restartButton = document.getElementById('restart');
const exitButton = document.getElementById('exit');
const gameOverSound = document.getElementById('game-over-sound');

let score = 0;
let gameInterval;
let scoreInterval;
let isGameOver = false;

// Wait for the start screen button click to proceed
await new Promise((resolve) => {
    document.querySelector("#start-screen > button")
        .addEventListener('click', async () => {
            await document.querySelector("html").requestFullscreen({
                navigationUI: 'hide'
            });
            document.querySelector("#start-screen").remove();
            startGame();
            resolve();
        });
});

function startGame() {
    isGameOver = false;
    score = 0;
    scoreElm.textContent = score;
    gameOverElm.classList.add('hide');
    gameOverElm.style.display = 'none'; // Ensure it is hidden

    // Start scoring
    scoreInterval = setInterval(() => {
        if (!isGameOver) {
            score++;
            scoreElm.textContent = score;
        }
    }, 100);

    // Start enemy movement
    moveEnemy();

}

// Preload images and update the progress bar
await new Promise((resolve) => {
    const images = [
        '/image/BG.jpg',
        '/image/tile/Tile (1).png',
        '/image/tile/Tile (2).png',
        '/image/tile/Tile (3).png',
        ...Array(10).fill('/image/character')
            .flatMap((v, i) => [
                `${v}/Jump__00${i}.png`,
                `${v}/Idle__00${i}.png`,
                `${v}/Run__00${i}.png`
            ])
    ];
    let loadedImages = 0;
    const totalImages = images.length;
    const barElm = document.getElementById('bar');

    function updateProgress() {
        loadedImages++;
        barElm.style.width = `${(loadedImages / totalImages) * 100}%`;
        if (loadedImages === totalImages) {
            setTimeout(() => {
                document.getElementById('overlay').classList.add('hide');
                resolve();
            }, 1000);
        }
    }

    images.forEach((image) => {
        const img = new Image();
        img.src = image;
        img.addEventListener('load', updateProgress);
        img.addEventListener('error', updateProgress);  // Also count failed loads to ensure progress
    });
});

let dx = 0; // Run
let i = 0; // Rendering
let t = 0;
let run = false;
let jump = false;
let angle = 0;
let tmr4Jump;
let tmr4Run;
let previousTouch;

/* Rendering Function */
setInterval(() => {
    if (jump) {
        characterElm.style.backgroundImage =
            `url('/image/character/Jump__00${i++}.png')`;
        if (i === 10) i = 0;
    } else if (!run) {
        characterElm.style.backgroundImage =
            `url('/image/character/Idle__00${i++}.png')`;
        if (i === 10) i = 0;
    } else {
        characterElm.style.backgroundImage =
            `url('/image/character/Run__00${i++}.png')`;
        if (i === 10) i = 0;
    }
}, 1000 / 30);

// Initially Fall Down
const tmr4InitialFall = setInterval(() => {
    const top = characterElm.offsetTop + (t++ * 0.2);
    if (characterElm.offsetTop >= (innerHeight - 128 - characterElm.offsetHeight)) {
        clearInterval(tmr4InitialFall);
        return;
    }
    characterElm.style.top = `${top}px`
}, 20);

// Jump
function doJump() {
    if (tmr4Jump) return;
    i = 0;
    jump = true;
    const initialTop = characterElm.offsetTop;
    tmr4Jump = setInterval(() => {
        const top = initialTop - (Math.sin(toRadians(angle++))) * 150;
        characterElm.style.top = `${top}px`
        if (angle === 181) {
            clearInterval(tmr4Jump);
            tmr4Jump = undefined;
            jump = false;
            angle = 0;
            i = 0;
        }
    }, 1);
}

// Utility Fn (Degrees to Radians)
function toRadians(angle) {
    return angle * Math.PI / 180;
}

// Run
function doRun(left) {
    if (tmr4Run) return;
    run = true;
    i = 0;
    if (left) {
        dx = -10;
        characterElm.classList.add('rotate');
    } else {
        dx = 10;
        characterElm.classList.remove('rotate');
    }
    tmr4Run = setInterval(() => {
        if (dx === 0) {
            clearInterval(tmr4Run);
            tmr4Run = undefined;
            run = false;
            i = 0;
            return;
        }
        const left = characterElm.offsetLeft + dx;
        if (left + characterElm.offsetWidth >= innerWidth ||
            left <= 0) {
            if (left <= 0) {
                characterElm.style.left = '0';
            } else {
                characterElm.style.left = `${innerWidth - characterElm.offsetWidth - 1}px`
            }
            dx = 0;
            return;
        }
        characterElm.style.left = `${left}px`;
    }, 20);
}

// Event Listeners
addEventListener('keydown', (e) => {
    switch (e.code) {
        case "ArrowLeft":
        case "ArrowRight":
            doRun(e.code === "ArrowLeft");
            break;
        case "Space":
            doJump();
    }
});

addEventListener('keyup', (e) => {
    switch (e.code) {
        case "ArrowLeft":
        case "ArrowRight":
            dx = 0;
    }
});

const resizeFn = () => {
    // Recalculate and adjust the character's position
    characterElm.style.top = `${innerHeight - 128 - characterElm.offsetHeight}px`;
    if (characterElm.offsetLeft < 0) {
        characterElm.style.left = '0';
    } else if (characterElm.offsetLeft >= innerWidth) {
        characterElm.style.left = `${innerWidth - characterElm.offsetWidth - 1}px`
    }
}

// Adjust the position on exiting full screen mode
document.addEventListener('fullscreenchange', resizeFn);
document.addEventListener('webkitfullscreenchange', resizeFn);
document.addEventListener('mozfullscreenchange', resizeFn);
document.addEventListener('MSFullscreenChange', resizeFn);

addEventListener('resize', resizeFn);
/* Fix screen orientation issue in mobile devices */
screen.orientation.addEventListener('change', resizeFn);

characterElm.addEventListener('touchmove', (e) => {
    if (!previousTouch) {
        previousTouch = e.touches.item(0);
        return;
    }
    const currentTouch = e.touches.item(0);
    doRun((currentTouch.clientX - previousTouch.clientX) < 0);
    if (currentTouch.clientY < previousTouch.clientY) doJump();
    previousTouch = currentTouch;
});

characterElm.addEventListener('touchend', (e) => {
    previousTouch = null;
    dx = 0;
});

const bgMusic = document.getElementById('bg-music');
const volumeControl = document.getElementById('volume-control');
const musicIcon = document.getElementById('music-icon');

// Play background music
bgMusic.volume = 0.5; // Set initial volume
bgMusic.play();

// Adjust volume
volumeControl.addEventListener('input', (e) => {
    bgMusic.volume = e.target.value;
});

// Toggle music play/pause
musicIcon.addEventListener('click', () => {
    if (bgMusic.paused) {
        bgMusic.play();
        musicIcon.src = '/image/icon/music.png'; // Assuming this is the play icon
    } else {
        bgMusic.pause();
        musicIcon.src = '/image/icon/music-off.png'; // Assuming this is the pause icon
    }
});

// Function to animate enemy movement
function moveEnemy() {
    let posX = window.innerWidth; // Start position outside the viewport on the right
    let speed = 7; // Adjust speed as needed

    const moveInterval = setInterval(() => {
        if (isGameOver) {
            clearInterval(moveInterval);
            return;
        }

        posX -= speed; // Move left
        enemyElm.style.left = `${posX}px`;

        // Check if enemy moves completely across the platform and then reset
        if (posX < -enemyElm.offsetWidth) {
            posX = window.innerWidth; // Reset position outside the viewport
        }

        // Check for collision with character
        if (isCollision(characterElm, enemyElm)) {
            gameOver();
            clearInterval(moveInterval);
        }
    }, 20); // Adjust interval as needed
}

// Collision detection function
function isCollision(elm1, elm2) {
    const rect1 = elm1.getBoundingClientRect();
    const rect2 = elm2.getBoundingClientRect();

    return !(rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom);
}

// Game over function
function gameOver() {
    isGameOver = true;
    clearInterval(scoreInterval);
    finalScoreElm.textContent = score;
    gameOverElm.classList.remove('hide');
    gameOverElm.style.display = 'flex'; // Ensure it is displayed
    gameOverSound.currentTime = 0; // Reset audio to start
    gameOverSound.play(); // Play game over sound
    bgMusic.pause();
}

// Restart game function
restartButton.addEventListener('click', () => {
    // Reset game state
    score = 0;
    isGameOver = false;
    scoreElm.textContent = score;
    gameOverElm.classList.add('hide');
    gameOverElm.style.display = 'none'; // Ensure it is hidden
    characterElm.style.left = '20px';
    characterElm.style.top = `${innerHeight - 128 - characterElm.offsetHeight}px`;
    moveEnemy();
    startGame();
    // Play background music again
    bgMusic.currentTime = 0; // Reset music to start
    bgMusic.play();
});

// Exit game function
exitButton.addEventListener('click', () => {
    location.reload(); // Refresh the page
});