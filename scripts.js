class NarrativeSite {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.progressFill = document.querySelector('.progress-fill');
        this.body = document.body;
        this.btnNext = document.getElementById('next');
        this.btnPrev = document.getElementById('prev');
        this.btnReplay = document.getElementById('replay');
        
        this.currentIndex = 0;
        this.totalSlides = this.slides.length;
        this.isAnimating = false;

        this.init();
    }

    init() {
        if (!this.btnNext || !this.btnPrev) {
            console.error("Navigation buttons not found. Check HTML IDs.");
            return;
        }
        this.updateUI();
        this.addEventListeners();
    }

    addEventListeners() {
        // Navigation Buttons
        this.btnNext.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextSlide();
        });

        this.btnPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevSlide();
        });

        if (this.btnReplay) {
            this.btnReplay.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goToSlide(0);
            });
        }

        // Global Click (Advance slide)
        // We filter out clicks on links (A) and buttons (BUTTON) so they work normally
        document.body.addEventListener('click', (e) => {
            const isInteractive = e.target.closest('a') || e.target.closest('button') || e.target.closest('.replay-btn');
            if (isInteractive) return;

            if (this.currentIndex < this.totalSlides - 1) {
                this.nextSlide();
            }
        });

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
                this.nextSlide();
            } else if (e.key === 'ArrowLeft') {
                this.prevSlide();
            }
        });
    }

    nextSlide() {
        if (this.currentIndex < this.totalSlides - 1 && !this.isAnimating) {
            this.goToSlide(this.currentIndex + 1);
        }
    }

    prevSlide() {
        if (this.currentIndex > 0 && !this.isAnimating) {
            this.goToSlide(this.currentIndex - 1);
        }
    }

    goToSlide(index) {
        if (index === this.currentIndex) return;
        
        this.isAnimating = true;
        
        // Remove active class from current
        this.slides[this.currentIndex].classList.remove('active');
        
        // Update index
        this.currentIndex = index;
        
        // Add active class to new
        this.slides[this.currentIndex].classList.add('active');

        // Update UI components
        this.updateUI();

        // Animation debounce
        setTimeout(() => {
            this.isAnimating = false;
        }, 600); 
    }

    updateUI() {
        // Update Progress Bar
        const progress = ((this.currentIndex + 1) / this.totalSlides) * 100;
        if(this.progressFill) this.progressFill.style.width = `${progress}%`;

        // Update Background Theme (Signal)
        const currentTheme = this.slides[this.currentIndex].getAttribute('data-theme');
        this.body.setAttribute('data-current-theme', currentTheme);

        // Update Buttons State
        this.btnPrev.disabled = this.currentIndex === 0;
        
        // Hide "Next" arrow on final slide
        if (this.currentIndex === this.totalSlides - 1) {
            this.btnNext.style.opacity = '0';
            this.btnNext.style.pointerEvents = 'none';
        } else {
            this.btnNext.style.opacity = '1';
            this.btnNext.style.pointerEvents = 'auto';
        }
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    new NarrativeSite();
});
