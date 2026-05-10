document.addEventListener('DOMContentLoaded', () => {
    const questionnaireForm = document.getElementById('questionnaire-form');
    const resultBox = document.getElementById('result-box');

    if (questionnaireForm) {
        questionnaireForm.addEventListener('submit', function(event) {
            // Prevent actual form submission
            event.preventDefault();

            // Validate that at least some options were selected
            // We'll just do a basic check to ensure they interacted with the form
            const checkedInputs = questionnaireForm.querySelectorAll('input:checked');
            
            if (checkedInputs.length === 0) {
                alert('אנא סמן לפחות תשובה אחת כדי שנוכל להתאים לך תוצאה!');
                return;
            }

            // Display the result box
            resultBox.style.display = 'block';

            // Calculate a fun "fake" result since we don't have a real matching algorithm
            // We can just show a generic encouraging message to look at the parties below
            resultBox.innerHTML = `
                <h3>מעולה! סיימת את השאלון.</h3>
                <p>לפי התשובות שלך, נראה שיש לך כיוון ברור למה שחשוב לך.</p>
                <p>עכשיו זה הזמן להסתכל ברשימת המפלגות למטה ולראות מי מהן עונה בדיוק על הקריטריונים שבחרת!</p>
            `;

            // Scroll smoothly to the result box
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
});

/* --- Mini Game Logic --- */

// YouTube API variables
let ytPlayer; 
let isMusicActive = false;

function onYouTubeIframeAPIReady() {
    if (!document.getElementById('player')) return; // Exit if not on the game page

    ytPlayer = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: '6FiqLKCVR8k', // נפלת חזק
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'loop': 1,
            'playlist': '6FiqLKCVR8k'
        },
        events: {
            'onReady': () => console.log("YT Player Ready"),
            'onError': (e) => console.log("YT Error", e)
        }
    });
}

function toggleMusic() {
    const musicBtn = document.getElementById('music-toggle');
    if (!ytPlayer || typeof ytPlayer.playVideo !== 'function') return;
    if (isMusicActive) {
        ytPlayer.pauseVideo();
        musicBtn.innerText = "🔇";
        isMusicActive = false;
    } else {
        ytPlayer.playVideo();
        musicBtn.innerText = "🔊";
        isMusicActive = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return; // Only run game logic if canvas exists

    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('final-score');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');

    // Resize handling
    function resize() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    let gameLoop;
    let running = false;
    let score = 0;
    let speed = 4;
    let frames = 0;

    const excuses = [
        "בזבוז זמן", "אין למי להצביע", "מה זה בכלל בחירות",
        "אני לא מבינ.ה בפוליטקה", "תור ארוך מדי", "זה רחוק ממני"
    ];

    const surfer = {
        x: canvas.width / 2,
        y: canvas.height - 150,
        targetX: canvas.width / 2,
        targetY: canvas.height - 150,
        width: 40,
        height: 100,
        update() {
            this.x += (this.targetX - this.x) * 0.15;
            this.y += (this.targetY - this.y) * 0.15;
            this.x = Math.max(20, Math.min(canvas.width - 20, this.x));
            this.y = Math.max(50, Math.min(canvas.height - 50, this.y));
        },
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            // גלשן
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 50, 0, 0, Math.PI * 2);
            ctx.fill();
            // דמות
            ctx.fillStyle = "#FF8C00";
            ctx.beginPath();
            ctx.arc(0, -10, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#00BFFF";
            ctx.fillRect(-12, 0, 24, 15);
            ctx.restore();
        }
    };

    let obstacles = [];
    let waveLines = [];

    window.startGame = function() {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        if (!isMusicActive && ytPlayer) {
            toggleMusic();
        }

        score = 0;
        speed = 4;
        frames = 0;
        obstacles = [];
        waveLines = [];
        running = true;
        loop();
    };

    function loop() {
        if (!running) return;
        frames++;

        // רקע ים
        ctx.fillStyle = "#0077be";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // גלים
        if (frames % 15 === 0) waveLines.push({ x: Math.random() * canvas.width, y: -20, l: 40 + Math.random() * 60 });
        waveLines.forEach((w, i) => {
            w.y += speed * 0.8;
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.beginPath();
            ctx.moveTo(w.x, w.y);
            ctx.lineTo(w.x + w.l, w.y);
            ctx.stroke();
            if (w.y > canvas.height) waveLines.splice(i, 1);
        });

        // יצירת תירוצים
        if (frames % Math.max(30, 80 - Math.floor(score/10)) === 0) {
            const text = excuses[Math.floor(Math.random() * excuses.length)];
            ctx.font = "bold 18px Heebo";
            const tw = ctx.measureText(text).width;
            obstacles.push({
                x: Math.random() * (canvas.width - tw) + tw/2,
                y: -40,
                t: text,
                w: tw + 30,
                h: 40
            });
        }

        // עדכון מכשולים ובדיקת פסילה
        for (let i = 0; i < obstacles.length; i++) {
            let o = obstacles[i];
            o.y += speed;

            // ציור תירוץ
            ctx.fillStyle = "white";
            ctx.strokeStyle = "#ff3366";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(o.x - o.w/2, o.y - o.h/2, o.w, o.h, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.fillText(o.t, o.x, o.y + 6);

            // התנגשות
            if (Math.abs(surfer.x - o.x) < (o.w/2 + 15) && Math.abs(surfer.y - o.y) < (o.h/2 + 40)) {
                running = false;
                finalScoreElement.innerText = Math.floor(score);
                gameOverScreen.classList.remove('hidden');
            }

            if (o.y > canvas.height + 50) obstacles.splice(i, 1);
        }

        surfer.update();
        surfer.draw();

        score += 0.1;
        scoreElement.innerText = Math.floor(score);
        if (frames % 500 === 0) speed += 0.5;

        gameLoop = requestAnimationFrame(loop);
    }

    function handleMove(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        surfer.targetX = clientX - rect.left;
        surfer.targetY = clientY - rect.top;
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', (e) => { 
        if(e.target === canvas) {
            e.preventDefault(); 
        }
        handleMove(e); 
    }, {passive: false});
});
