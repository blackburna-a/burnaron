document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const progressFill = document.querySelector('.progress-fill');
    const replayBtn = document.getElementById('replay');
    
    let currentIndex = 0;

    function updatePage() {
        // 1. Update Slides
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentIndex);
        });

        // 2. Update Theme
        const theme = slides[currentIndex].getAttribute('data-theme');
        document.body.setAttribute('data-current-theme', theme);

        // 3. Update Progress
        const percent = ((currentIndex + 1) / slides.length) * 100;
        progressFill.style.width = percent + '%';

        // 4. Update Button State
        prevBtn.disabled = (currentIndex === 0);
        
        if (currentIndex === slides.length - 1) {
            nextBtn.style.visibility = 'hidden';
        } else {
            nextBtn.style.visibility = 'visible';
        }
    }

    // Event Listeners
    nextBtn.addEventListener('click', () => {
        if (currentIndex < slides.length - 1) {
            currentIndex++;
            updatePage();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updatePage();
        }
    });

    replayBtn.addEventListener('click', () => {
        currentIndex = 0;
        updatePage();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') nextBtn.click();
        if (e.key === 'ArrowLeft') prevBtn.click();
    });

    // Initial load
    updatePage();
});
