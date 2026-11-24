/**
 * PremiumUI.js - Premium UI transitions and micro-animations for Velocity Marble Run
 * Glass morphism, smooth transitions, button effects, and polish
 */

class PremiumUI {
    constructor() {
        this.initialized = false;
        this.activeAnimations = new Set();

        // Animation timing functions
        this.easings = {
            // Standard easings
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => t * (2 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

            // Cubic
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

            // Elastic
            easeOutElastic: t => {
                const p = 0.3;
                return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
            },

            // Back (overshoot)
            easeOutBack: t => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            },
            easeInBack: t => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return c3 * t * t * t - c1 * t * t;
            },

            // Bounce
            easeOutBounce: t => {
                if (t < 1 / 2.75) {
                    return 7.5625 * t * t;
                } else if (t < 2 / 2.75) {
                    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                } else if (t < 2.5 / 2.75) {
                    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                } else {
                    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
                }
            },

            // Spring
            spring: t => {
                return 1 - Math.cos(t * 4.5 * Math.PI) * Math.exp(-t * 6);
            }
        };

        // Screen transition queue
        this.transitionQueue = [];
        this.isTransitioning = false;
    }

    /**
     * Initialize premium UI system
     */
    init() {
        if (this.initialized) return;

        this.injectStyles();
        this.setupButtonEffects();
        this.setupScrollEffects();
        this.setupParallaxBackgrounds();

        this.initialized = true;
        console.log('Premium UI initialized');
    }

    /**
     * Inject CSS for premium effects
     */
    injectStyles() {
        const style = document.createElement('style');
        style.id = 'premium-ui-styles';
        style.textContent = `
            /* ========== GLASS MORPHISM ========== */
            .glass {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }

            .glass-dark {
                background: rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            /* ========== BUTTON EFFECTS ========== */
            .menu-btn, .game-btn {
                position: relative;
                overflow: hidden;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                            box-shadow 0.2s ease,
                            background 0.2s ease;
            }

            .menu-btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
                transform: translate(-50%, -50%);
                transition: width 0.4s ease, height 0.4s ease;
                pointer-events: none;
            }

            .menu-btn:active::before {
                width: 300%;
                height: 300%;
            }

            .menu-btn:active {
                transform: scale(0.95);
            }

            .menu-btn:hover:not(:active) {
                transform: scale(1.02) translateY(-2px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }

            /* Ripple effect */
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out forwards;
                pointer-events: none;
            }

            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            /* ========== SCREEN TRANSITIONS ========== */
            .screen {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }

            .screen.entering {
                animation: screen-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .screen.exiting {
                animation: screen-exit 0.3s ease-in forwards;
            }

            @keyframes screen-enter {
                from {
                    opacity: 0;
                    transform: scale(0.95) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @keyframes screen-exit {
                from {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: scale(0.95) translateY(-20px);
                }
            }

            /* Slide transitions */
            .screen.slide-in-right {
                animation: slide-in-right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }

            .screen.slide-out-left {
                animation: slide-out-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }

            .screen.slide-in-left {
                animation: slide-in-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }

            .screen.slide-out-right {
                animation: slide-out-right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }

            @keyframes slide-in-right {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }

            @keyframes slide-out-left {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(-100%); }
            }

            @keyframes slide-in-left {
                from { opacity: 0; transform: translateX(-100%); }
                to { opacity: 1; transform: translateX(0); }
            }

            @keyframes slide-out-right {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100%); }
            }

            /* ========== ELEMENT ANIMATIONS ========== */
            .pop-in {
                animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .pop-out {
                animation: pop-out 0.3s ease-in forwards;
            }

            @keyframes pop-in {
                from {
                    opacity: 0;
                    transform: scale(0.5);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes pop-out {
                from {
                    opacity: 1;
                    transform: scale(1);
                }
                to {
                    opacity: 0;
                    transform: scale(0.5);
                }
            }

            /* Staggered children */
            .stagger-children > * {
                opacity: 0;
                transform: translateY(20px);
            }

            .stagger-children.animate > * {
                animation: stagger-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .stagger-children.animate > *:nth-child(1) { animation-delay: 0ms; }
            .stagger-children.animate > *:nth-child(2) { animation-delay: 50ms; }
            .stagger-children.animate > *:nth-child(3) { animation-delay: 100ms; }
            .stagger-children.animate > *:nth-child(4) { animation-delay: 150ms; }
            .stagger-children.animate > *:nth-child(5) { animation-delay: 200ms; }
            .stagger-children.animate > *:nth-child(6) { animation-delay: 250ms; }
            .stagger-children.animate > *:nth-child(7) { animation-delay: 300ms; }
            .stagger-children.animate > *:nth-child(8) { animation-delay: 350ms; }
            .stagger-children.animate > *:nth-child(9) { animation-delay: 400ms; }
            .stagger-children.animate > *:nth-child(10) { animation-delay: 450ms; }

            @keyframes stagger-in {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* ========== ICON ANIMATIONS ========== */
            .icon-bounce {
                animation: icon-bounce 0.5s ease infinite;
            }

            @keyframes icon-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }

            .icon-pulse {
                animation: icon-pulse 1.5s ease-in-out infinite;
            }

            @keyframes icon-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }

            .icon-spin {
                animation: icon-spin 2s linear infinite;
            }

            @keyframes icon-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* ========== GLOW EFFECTS ========== */
            .glow {
                box-shadow: 0 0 20px currentColor;
            }

            .glow-pulse {
                animation: glow-pulse 2s ease-in-out infinite;
            }

            @keyframes glow-pulse {
                0%, 100% {
                    box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
                }
                50% {
                    box-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
                }
            }

            /* ========== STAR RATING ========== */
            .star-earned {
                animation: star-earned 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            @keyframes star-earned {
                0% {
                    transform: scale(0) rotate(-180deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.3) rotate(10deg);
                }
                100% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }

            /* ========== COUNTER ANIMATIONS ========== */
            .counter-increment {
                animation: counter-pop 0.3s ease;
            }

            @keyframes counter-pop {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }

            /* ========== SHIMMER LOADING ========== */
            .shimmer {
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0) 0%,
                    rgba(255, 255, 255, 0.2) 50%,
                    rgba(255, 255, 255, 0) 100%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }

            @keyframes shimmer {
                from { background-position: -200% 0; }
                to { background-position: 200% 0; }
            }

            /* ========== PARALLAX ========== */
            .parallax-layer {
                will-change: transform;
                transition: transform 0.1s ease-out;
            }

            /* ========== TOAST NOTIFICATIONS ========== */
            .toast-container {
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }

            .toast {
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                color: white;
                padding: 12px 24px;
                border-radius: 30px;
                font-size: 14px;
                font-weight: 500;
                animation: toast-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                pointer-events: auto;
            }

            .toast.success {
                background: rgba(46, 204, 113, 0.9);
            }

            .toast.error {
                background: rgba(231, 76, 60, 0.9);
            }

            .toast.warning {
                background: rgba(241, 196, 15, 0.9);
                color: #333;
            }

            .toast.exiting {
                animation: toast-out 0.3s ease-in forwards;
            }

            @keyframes toast-in {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes toast-out {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.8);
                }
            }

            /* ========== FLOATING LABELS ========== */
            .float-up {
                animation: float-up 1s ease-out forwards;
            }

            @keyframes float-up {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-50px) scale(1.2);
                }
            }

            /* ========== CONFETTI ========== */
            .confetti-piece {
                position: absolute;
                width: 10px;
                height: 10px;
                animation: confetti-fall linear forwards;
            }

            @keyframes confetti-fall {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }

            /* ========== REDUCED MOTION ========== */
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Setup button ripple effects
     */
    setupButtonEffects() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.menu-btn, .game-btn');
            if (!button) return;

            // Create ripple
            const ripple = document.createElement('span');
            ripple.className = 'ripple';

            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            button.appendChild(ripple);

            // Remove ripple after animation
            ripple.addEventListener('animationend', () => ripple.remove());

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        });
    }

    /**
     * Setup scroll-based effects
     */
    setupScrollEffects() {
        const scrollContainers = document.querySelectorAll('.scroll-container');

        scrollContainers.forEach(container => {
            container.addEventListener('scroll', () => {
                // Fade edges based on scroll position
                const scrollTop = container.scrollTop;
                const scrollHeight = container.scrollHeight - container.clientHeight;
                const scrollPercent = scrollTop / scrollHeight;

                container.style.setProperty('--scroll-percent', scrollPercent);
            });
        });
    }

    /**
     * Setup parallax backgrounds
     */
    setupParallaxBackgrounds() {
        const parallaxContainers = document.querySelectorAll('.parallax-container');

        window.addEventListener('deviceorientation', (e) => {
            if (e.gamma === null) return;

            const x = e.gamma / 30; // -30 to 30 degrees
            const y = e.beta / 30;  // -30 to 30 degrees

            parallaxContainers.forEach(container => {
                const layers = container.querySelectorAll('.parallax-layer');
                layers.forEach((layer, i) => {
                    const depth = (i + 1) * 0.5;
                    layer.style.transform = `translate(${x * depth * 20}px, ${y * depth * 20}px)`;
                });
            });
        });
    }

    /**
     * Transition between screens
     */
    async transitionScreen(fromId, toId, type = 'fade') {
        const from = document.getElementById(fromId);
        const to = document.getElementById(toId);

        if (!from || !to) return;

        return new Promise(resolve => {
            // Set transition classes based on type
            let fromClass, toClass;

            switch (type) {
                case 'slideLeft':
                    fromClass = 'slide-out-left';
                    toClass = 'slide-in-right';
                    break;
                case 'slideRight':
                    fromClass = 'slide-out-right';
                    toClass = 'slide-in-left';
                    break;
                case 'pop':
                    fromClass = 'pop-out';
                    toClass = 'pop-in';
                    break;
                default: // fade
                    fromClass = 'exiting';
                    toClass = 'entering';
            }

            // Animate out
            from.classList.add(fromClass);

            // Prepare incoming screen
            to.style.display = 'flex';
            to.classList.add('active', toClass);

            // Complete transition
            setTimeout(() => {
                from.classList.remove('active', fromClass);
                from.style.display = 'none';

                setTimeout(() => {
                    to.classList.remove(toClass);
                    resolve();
                }, 400);
            }, 300);
        });
    }

    /**
     * Animate elements in staggered sequence
     */
    staggerAnimate(container, delay = 50) {
        const children = container.children;

        Array.from(children).forEach((child, i) => {
            child.style.opacity = '0';
            child.style.transform = 'translateY(20px)';

            setTimeout(() => {
                child.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
            }, i * delay);
        });
    }

    /**
     * Animate a number counting up
     */
    animateCounter(element, target, duration = 1000, prefix = '', suffix = '') {
        const start = parseInt(element.textContent) || 0;
        const startTime = Date.now();

        const update = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);

            // Ease out
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * eased);

            element.textContent = `${prefix}${current.toLocaleString()}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.classList.add('counter-increment');
                setTimeout(() => element.classList.remove('counter-increment'), 300);
            }
        };

        update();
    }

    /**
     * Show star rating animation
     */
    animateStars(container, count, delay = 200) {
        const stars = container.querySelectorAll('.star');

        stars.forEach((star, i) => {
            star.classList.remove('earned', 'star-earned');

            if (i < count) {
                setTimeout(() => {
                    star.classList.add('earned', 'star-earned');

                    // Haptic feedback
                    if (navigator.vibrate) {
                        navigator.vibrate([20, 30, 20]);
                    }
                }, i * delay);
            }
        });
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        // Create container if needed
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('exiting');
            setTimeout(() => toast.remove(), 300);
        }, duration);

        return toast;
    }

    /**
     * Create floating score popup
     */
    createFloatingText(text, x, y, color = '#ffffff') {
        const float = document.createElement('div');
        float.className = 'float-up';
        float.textContent = text;
        float.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-size: 24px;
            font-weight: bold;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
            pointer-events: none;
            z-index: 9999;
        `;

        document.body.appendChild(float);

        setTimeout(() => float.remove(), 1000);
    }

    /**
     * Create confetti explosion
     */
    createConfetti(x, y, count = 50) {
        const colors = ['#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#e91e63'];

        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';

            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * Math.PI * 2;
            const velocity = 200 + Math.random() * 300;
            const duration = 1 + Math.random() * 2;

            piece.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                background: ${color};
                width: ${5 + Math.random() * 10}px;
                height: ${5 + Math.random() * 10}px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation-duration: ${duration}s;
                --vx: ${Math.cos(angle) * velocity}px;
                --vy: ${Math.sin(angle) * velocity}px;
            `;

            // Custom animation with physics
            const startX = x;
            const startY = y;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity - 200; // Initial upward boost
            const gravity = 500;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const px = startX + vx * elapsed;
                const py = startY + vy * elapsed + 0.5 * gravity * elapsed * elapsed;

                piece.style.left = `${px}px`;
                piece.style.top = `${py}px`;
                piece.style.opacity = Math.max(0, 1 - elapsed / duration);
                piece.style.transform = `rotate(${elapsed * 360 * (Math.random() > 0.5 ? 1 : -1)}deg)`;

                if (elapsed < duration && py < window.innerHeight) {
                    requestAnimationFrame(animate);
                } else {
                    piece.remove();
                }
            };

            document.body.appendChild(piece);
            requestAnimationFrame(animate);
        }
    }

    /**
     * Shake an element
     */
    shakeElement(element, intensity = 5, duration = 300) {
        const startTime = Date.now();
        const originalTransform = element.style.transform;

        const shake = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const decay = 1 - progress;
                const x = (Math.random() - 0.5) * 2 * intensity * decay;
                const y = (Math.random() - 0.5) * 2 * intensity * decay;
                element.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                element.style.transform = originalTransform;
            }
        };

        shake();
    }

    /**
     * Pulse an element
     */
    pulseElement(element, scale = 1.1, duration = 200) {
        element.style.transition = `transform ${duration / 2}ms ease-out`;
        element.style.transform = `scale(${scale})`;

        setTimeout(() => {
            element.style.transition = `transform ${duration / 2}ms ease-in`;
            element.style.transform = 'scale(1)';
        }, duration / 2);
    }

    /**
     * Animate value with custom easing
     */
    animate(from, to, duration, easing, callback) {
        const startTime = Date.now();
        const easingFn = this.easings[easing] || this.easings.easeOutCubic;

        const update = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            const easedProgress = easingFn(progress);
            const value = from + (to - from) * easedProgress;

            callback(value);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        update();
    }

    /**
     * Add glass morphism to element
     */
    addGlass(element, dark = false) {
        element.classList.add(dark ? 'glass-dark' : 'glass');
    }

    /**
     * Add shimmer loading effect
     */
    addShimmer(element) {
        element.classList.add('shimmer');
    }

    /**
     * Remove shimmer effect
     */
    removeShimmer(element) {
        element.classList.remove('shimmer');
    }
}

// Create global instance
const premiumUI = new PremiumUI();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => premiumUI.init());
} else {
    premiumUI.init();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PremiumUI;
}
