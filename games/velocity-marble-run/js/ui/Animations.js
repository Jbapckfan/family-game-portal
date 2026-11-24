/**
 * Animations - UI animation utilities
 */
class Animations {
    static easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    static easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 :
            Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    static easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }

    static animate(options) {
        const {
            duration = 300,
            easing = Animations.easeOutCubic,
            onUpdate,
            onComplete
        } = options;

        const startTime = performance.now();

        const tick = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);

            if (onUpdate) {
                onUpdate(easedProgress);
            }

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else if (onComplete) {
                onComplete();
            }
        };

        requestAnimationFrame(tick);
    }

    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = '';

        this.animate({
            duration,
            onUpdate: (progress) => {
                element.style.opacity = progress;
            }
        });
    }

    static fadeOut(element, duration = 300) {
        this.animate({
            duration,
            onUpdate: (progress) => {
                element.style.opacity = 1 - progress;
            },
            onComplete: () => {
                element.style.display = 'none';
            }
        });
    }

    static slideIn(element, direction = 'up', duration = 400) {
        const translations = {
            up: { start: '100%', end: '0' },
            down: { start: '-100%', end: '0' },
            left: { start: '100%', end: '0' },
            right: { start: '-100%', end: '0' }
        };

        const isVertical = direction === 'up' || direction === 'down';
        const trans = translations[direction];

        element.style.transform = isVertical
            ? `translateY(${trans.start})`
            : `translateX(${trans.start})`;
        element.style.opacity = '0';

        this.animate({
            duration,
            easing: this.easeOutCubic,
            onUpdate: (progress) => {
                const value = isVertical
                    ? `translateY(${100 - progress * 100}%)`
                    : `translateX(${100 - progress * 100}%)`;
                element.style.transform = direction === 'up' || direction === 'left'
                    ? value : `translate${isVertical ? 'Y' : 'X'}(${-100 + progress * 100}%)`;
                element.style.opacity = progress;
            }
        });
    }

    static pop(element, duration = 400) {
        element.style.transform = 'scale(0)';
        element.style.opacity = '0';

        this.animate({
            duration,
            easing: this.easeOutElastic,
            onUpdate: (progress) => {
                element.style.transform = `scale(${progress})`;
                element.style.opacity = Math.min(1, progress * 2);
            }
        });
    }

    static shake(element, intensity = 10, duration = 500) {
        const startTime = performance.now();

        const tick = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const decay = 1 - progress;
                const x = (Math.random() - 0.5) * intensity * decay;
                const y = (Math.random() - 0.5) * intensity * decay;
                element.style.transform = `translate(${x}px, ${y}px)`;
                requestAnimationFrame(tick);
            } else {
                element.style.transform = '';
            }
        };

        requestAnimationFrame(tick);
    }

    static countUp(element, start, end, duration = 1000, prefix = '', suffix = '') {
        this.animate({
            duration,
            onUpdate: (progress) => {
                const value = Math.floor(start + (end - start) * progress);
                element.textContent = `${prefix}${value}${suffix}`;
            }
        });
    }

    static typewriter(element, text, speed = 50) {
        element.textContent = '';
        let index = 0;

        const type = () => {
            if (index < text.length) {
                element.textContent += text[index];
                index++;
                setTimeout(type, speed);
            }
        };

        type();
    }

    static pulse(element, scale = 1.1, duration = 200) {
        element.style.transition = `transform ${duration}ms ease-out`;
        element.style.transform = `scale(${scale})`;

        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, duration);
    }

    static ripple(element, x, y, color = 'rgba(255, 255, 255, 0.3)') {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: ${color};
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;

        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x - rect.left - size / 2}px`;
        ripple.style.top = `${y - rect.top - size / 2}px`;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    static confetti(container, count = 50) {
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: ${5 + Math.random() * 10}px;
                height: ${5 + Math.random() * 10}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -20px;
                opacity: 1;
                transform: rotate(${Math.random() * 360}deg);
            `;

            container.appendChild(confetti);

            const duration = 1500 + Math.random() * 1500;
            const delay = Math.random() * 500;

            this.animate({
                duration,
                onUpdate: (progress) => {
                    const y = progress * (container.clientHeight + 50);
                    const x = Math.sin(progress * Math.PI * 4) * 50;
                    const rotation = progress * 720;
                    confetti.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
                    confetti.style.opacity = 1 - progress;
                },
                onComplete: () => confetti.remove()
            });
        }
    }
}

// Add CSS animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export
window.Animations = Animations;
