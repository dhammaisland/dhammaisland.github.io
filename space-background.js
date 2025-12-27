
/**
 * Space Background with Exploding Star Effect
 * 
 * This script creates a canvas overlay that renders a starry background
 * and simulates an exploding star effect using particle systems.
 */

(function() {
    // Create and configure canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'space-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1'; // Behind everything
    canvas.style.pointerEvents = 'none'; // Don't block interactions
    canvas.style.background = 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    // --- Star Background ---
    const stars = [];
    const MAX_STARS = 200;

    class Star {
        constructor() {
            this.init();
        }

        init() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = Math.random() * 1.5;
            this.color = `rgba(255, 255, 255, ${Math.random()})`;
            this.velocity = Math.random() * 0.05;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            this.y -= this.velocity;
            // twinkle
            if (Math.random() > 0.99) {
                this.radius = Math.random() * 1.5;
                this.color = `rgba(255, 255, 255, ${Math.random()})`;
            }
            
            // wrap around
            if (this.y < 0) {
                this.y = height;
                this.x = Math.random() * width;
            }
        }
    }

    // --- Exploding Star Effect ---
    const particles = [];
    let explosionCenter = { x: 0, y: 0 };
    
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1; // Random speed
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.alpha = 1;
            this.decay = Math.random() * 0.01 + 0.005;
            this.size = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function createExplosion() {
        return;
        // Center the explosion roughly, or randomize it slightly
        explosionCenter.x = width * 0.7; // Position somewhat to the right
        explosionCenter.y = height * 0.3; // UPPER area

        // Create a burst of particles
        const colors = ['#ffeb3b', '#ff9800', '#ff5722', '#ffffff'];
        for (let i = 0; i < 100; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new Particle(explosionCenter.x, explosionCenter.y, color));
        }
    }

    // --- Main Loop ---
    
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        
        // Re-init stars on resize to fill screen
        stars.length = 0;
        for(let i=0; i<MAX_STARS; i++) {
            stars.push(new Star());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw stars
        stars.forEach(star => {
            star.update();
            star.draw();
        });

        // Draw explosion particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw();
            if (p.alpha <= 0) {
                particles.splice(i, 1);
            }
        }
        
        // Randomly trigger new explosions rarely
        if (Math.random() < 0.005 && particles.length === 0) { // Only if previous explosion is mostly gone or very rare
             createExplosion();
        }

        requestAnimationFrame(animate);
    }

    // Initialize
    window.addEventListener('resize', resize);
    resize();
    createExplosion(); // Trigger one immediately on load
    animate();

})();
