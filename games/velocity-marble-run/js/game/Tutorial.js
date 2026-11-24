/**
 * Tutorial System - Interactive tutorial for new players
 * Guides players through each game mechanic with hands-on learning
 */

class Tutorial {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.currentStep = 0;
        this.steps = [];
        this.overlay = null;
        this.messageBox = null;
        this.pointer = null;
        this.completedTutorials = this.loadProgress();

        this.init();
    }

    init() {
        this.createOverlay();
        this.defineTutorialSteps();
    }

    createOverlay() {
        // Tutorial overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-message">
                <div class="tutorial-icon"></div>
                <h3 class="tutorial-title"></h3>
                <p class="tutorial-text"></p>
                <div class="tutorial-actions">
                    <button class="tutorial-skip">Skip Tutorial</button>
                    <button class="tutorial-next">Got it!</button>
                </div>
                <div class="tutorial-progress">
                    <span class="tutorial-step-current">1</span>
                    <span class="tutorial-step-divider">/</span>
                    <span class="tutorial-step-total">5</span>
                </div>
            </div>
            <div class="tutorial-pointer">
                <div class="tutorial-pointer-arrow"></div>
                <div class="tutorial-pointer-pulse"></div>
            </div>
            <div class="tutorial-highlight"></div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            #tutorial-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }

            .tutorial-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
            }

            .tutorial-message {
                position: absolute;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                border: 2px solid #6366f1;
                border-radius: 16px;
                padding: 24px 32px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: tutorialSlideUp 0.4s ease;
            }

            @keyframes tutorialSlideUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }

            .tutorial-icon {
                font-size: 48px;
                text-align: center;
                margin-bottom: 12px;
            }

            .tutorial-title {
                color: #fff;
                font-size: 22px;
                font-weight: bold;
                text-align: center;
                margin: 0 0 12px 0;
            }

            .tutorial-text {
                color: #c7d2fe;
                font-size: 16px;
                text-align: center;
                line-height: 1.5;
                margin: 0 0 20px 0;
            }

            .tutorial-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
            }

            .tutorial-skip {
                background: transparent;
                border: 1px solid #6366f1;
                color: #a5b4fc;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .tutorial-skip:hover {
                background: rgba(99, 102, 241, 0.2);
            }

            .tutorial-next {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                border: none;
                color: #fff;
                padding: 12px 32px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .tutorial-next:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
            }

            .tutorial-progress {
                text-align: center;
                margin-top: 16px;
                color: #818cf8;
                font-size: 14px;
            }

            .tutorial-pointer {
                position: absolute;
                width: 60px;
                height: 60px;
                pointer-events: none;
                display: none;
            }

            .tutorial-pointer.active {
                display: block;
            }

            .tutorial-pointer-arrow {
                width: 0;
                height: 0;
                border-left: 20px solid transparent;
                border-right: 20px solid transparent;
                border-bottom: 30px solid #6366f1;
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                animation: pointerBounce 1s ease-in-out infinite;
            }

            @keyframes pointerBounce {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                50% { transform: translateX(-50%) translateY(-10px); }
            }

            .tutorial-pointer-pulse {
                position: absolute;
                top: 30px;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(99, 102, 241, 0.3);
                animation: pointerPulse 1.5s ease-in-out infinite;
            }

            @keyframes pointerPulse {
                0% { transform: translateX(-50%) scale(1); opacity: 0.5; }
                50% { transform: translateX(-50%) scale(1.5); opacity: 0; }
                100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
            }

            .tutorial-highlight {
                position: absolute;
                border: 3px solid #6366f1;
                border-radius: 12px;
                box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
                pointer-events: none;
                display: none;
                animation: highlightPulse 2s ease-in-out infinite;
            }

            .tutorial-highlight.active {
                display: block;
            }

            @keyframes highlightPulse {
                0%, 100% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.5); }
                50% { box-shadow: 0 0 50px rgba(99, 102, 241, 0.8); }
            }

            .tutorial-hand {
                position: absolute;
                font-size: 48px;
                animation: handTilt 1s ease-in-out infinite;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
            }

            @keyframes handTilt {
                0%, 100% { transform: rotate(-15deg); }
                50% { transform: rotate(15deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.overlay);

        // Event listeners
        this.overlay.querySelector('.tutorial-skip').addEventListener('click', () => this.skip());
        this.overlay.querySelector('.tutorial-next').addEventListener('click', () => this.next());
    }

    defineTutorialSteps() {
        this.steps = [
            {
                id: 'welcome',
                icon: '🎱',
                title: 'Welcome to Velocity!',
                text: 'Guide your marble through exciting tracks to reach the goal. Collect coins and stars for bonus points!',
                highlight: null,
                pointer: null
            },
            {
                id: 'tilt',
                icon: '📱',
                title: 'Tilt to Move',
                text: 'Tilt your device left and right to control the marble. The more you tilt, the faster you roll!',
                highlight: null,
                pointer: null,
                showHand: true
            },
            {
                id: 'coins',
                icon: '🪙',
                title: 'Collect Coins',
                text: 'Roll through coins to collect them. Each coin adds to your score!',
                highlight: null,
                pointer: null
            },
            {
                id: 'stars',
                icon: '⭐',
                title: 'Earn Stars',
                text: 'Complete levels quickly to earn up to 3 stars. Stars unlock new worlds!',
                highlight: null,
                pointer: null
            },
            {
                id: 'goal',
                icon: '🏁',
                title: 'Reach the Goal',
                text: 'Guide your marble to the glowing goal at the bottom of each level. Good luck!',
                highlight: null,
                pointer: null
            }
        ];
    }

    start(tutorialId = 'basic') {
        if (this.completedTutorials.includes(tutorialId)) {
            return false;
        }

        this.isActive = true;
        this.currentStep = 0;
        this.overlay.classList.add('active');
        this.showStep(0);

        // Pause game if running
        if (this.game && this.game.pause) {
            this.game.pause();
        }

        return true;
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[index];

        // Update message box
        this.overlay.querySelector('.tutorial-icon').textContent = step.icon;
        this.overlay.querySelector('.tutorial-title').textContent = step.title;
        this.overlay.querySelector('.tutorial-text').textContent = step.text;
        this.overlay.querySelector('.tutorial-step-current').textContent = index + 1;
        this.overlay.querySelector('.tutorial-step-total').textContent = this.steps.length;

        // Update button text for last step
        const nextBtn = this.overlay.querySelector('.tutorial-next');
        if (index === this.steps.length - 1) {
            nextBtn.textContent = "Let's Go!";
        } else {
            nextBtn.textContent = 'Got it!';
        }

        // Show/hide pointer
        const pointer = this.overlay.querySelector('.tutorial-pointer');
        if (step.pointer) {
            pointer.classList.add('active');
            pointer.style.left = step.pointer.x + 'px';
            pointer.style.top = step.pointer.y + 'px';
        } else {
            pointer.classList.remove('active');
        }

        // Show/hide highlight
        const highlight = this.overlay.querySelector('.tutorial-highlight');
        if (step.highlight) {
            highlight.classList.add('active');
            highlight.style.left = step.highlight.x + 'px';
            highlight.style.top = step.highlight.y + 'px';
            highlight.style.width = step.highlight.width + 'px';
            highlight.style.height = step.highlight.height + 'px';
        } else {
            highlight.classList.remove('active');
        }

        // Add tilt hand animation for tilt step
        if (step.showHand) {
            this.showTiltAnimation();
        } else {
            this.hideTiltAnimation();
        }

        // Haptic feedback
        if (this.game && this.game.haptics) {
            this.game.haptics.light();
        }
    }

    showTiltAnimation() {
        let hand = this.overlay.querySelector('.tutorial-hand');
        if (!hand) {
            hand = document.createElement('div');
            hand.className = 'tutorial-hand';
            hand.textContent = '👆';
            hand.style.left = '50%';
            hand.style.top = '35%';
            hand.style.transform = 'translateX(-50%)';
            this.overlay.appendChild(hand);
        }
        hand.style.display = 'block';
    }

    hideTiltAnimation() {
        const hand = this.overlay.querySelector('.tutorial-hand');
        if (hand) {
            hand.style.display = 'none';
        }
    }

    next() {
        this.currentStep++;

        if (this.currentStep >= this.steps.length) {
            this.complete();
        } else {
            // Animate transition
            const message = this.overlay.querySelector('.tutorial-message');
            message.style.animation = 'none';
            message.offsetHeight; // Trigger reflow
            message.style.animation = 'tutorialSlideUp 0.4s ease';

            this.showStep(this.currentStep);
        }
    }

    skip() {
        this.complete();
    }

    complete() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        this.hideTiltAnimation();

        // Mark tutorial as completed
        if (!this.completedTutorials.includes('basic')) {
            this.completedTutorials.push('basic');
            this.saveProgress();
        }

        // Resume game
        if (this.game && this.game.resume) {
            this.game.resume();
        }

        // Dispatch event
        window.dispatchEvent(new CustomEvent('tutorialComplete', {
            detail: { tutorialId: 'basic' }
        }));
    }

    // Contextual hints during gameplay
    showHint(hintId, options = {}) {
        const hints = {
            bumper: {
                icon: '🔴',
                title: 'Bumper!',
                text: 'Bumpers bounce your marble. Use them to change direction!'
            },
            booster: {
                icon: '⚡',
                title: 'Speed Boost!',
                text: 'Boosters launch you forward. Point toward them for maximum speed!'
            },
            portal: {
                icon: '🌀',
                title: 'Portal!',
                text: 'Enter the portal to teleport to a new location!'
            },
            spinner: {
                icon: '💫',
                title: 'Spinner!',
                text: 'Time your approach to slip through the spinning arms!'
            },
            movingPlatform: {
                icon: '↔️',
                title: 'Moving Platform!',
                text: 'Wait for the right moment to land on the platform!'
            },
            ice: {
                icon: '🧊',
                title: 'Icy Surface!',
                text: 'Ice is slippery! You\'ll slide further than normal.'
            },
            lowGravity: {
                icon: '🚀',
                title: 'Low Gravity!',
                text: 'Gravity is weaker here. You\'ll float more than usual!'
            }
        };

        const hint = hints[hintId];
        if (!hint) return;

        // Check if already shown
        const shownHints = JSON.parse(localStorage.getItem('velocity_hints_shown') || '[]');
        if (shownHints.includes(hintId)) return;

        // Show quick hint notification
        this.showQuickHint(hint);

        // Mark as shown
        shownHints.push(hintId);
        localStorage.setItem('velocity_hints_shown', JSON.stringify(shownHints));
    }

    showQuickHint(hint) {
        const notification = document.createElement('div');
        notification.className = 'tutorial-quick-hint';
        notification.innerHTML = `
            <span class="hint-icon">${hint.icon}</span>
            <div class="hint-content">
                <strong>${hint.title}</strong>
                <span>${hint.text}</span>
            </div>
        `;

        // Add styles if not already added
        if (!document.querySelector('#quick-hint-styles')) {
            const style = document.createElement('style');
            style.id = 'quick-hint-styles';
            style.textContent = `
                .tutorial-quick-hint {
                    position: fixed;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%) translateY(-20px);
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                    border: 2px solid #6366f1;
                    border-radius: 12px;
                    padding: 12px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 9999;
                    opacity: 0;
                    animation: hintSlideIn 0.4s ease forwards, hintSlideOut 0.4s ease 3s forwards;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
                }

                @keyframes hintSlideIn {
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                @keyframes hintSlideOut {
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                }

                .hint-icon {
                    font-size: 32px;
                }

                .hint-content {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .hint-content strong {
                    color: #fff;
                    font-size: 14px;
                }

                .hint-content span {
                    color: #c7d2fe;
                    font-size: 12px;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            notification.remove();
        }, 3500);
    }

    loadProgress() {
        try {
            return JSON.parse(localStorage.getItem('velocity_tutorials') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveProgress() {
        localStorage.setItem('velocity_tutorials', JSON.stringify(this.completedTutorials));
    }

    reset() {
        this.completedTutorials = [];
        localStorage.removeItem('velocity_tutorials');
        localStorage.removeItem('velocity_hints_shown');
    }
}

// Export
window.Tutorial = Tutorial;
