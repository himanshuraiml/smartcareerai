// SmartCareerAI Pitch Deck - JavaScript

document.addEventListener('DOMContentLoaded', function () {
    initSlides();
    initKeyboardNav();
    initCounterAnimations();
});

// ===== Slide Management =====
let currentSlide = 1;
const totalSlides = 14;

function initSlides() {
    document.getElementById('totalSlides').textContent = totalSlides;
    updateSlide(currentSlide);
}

function updateSlide(slideNumber) {
    // Update current slide number
    currentSlide = slideNumber;
    document.getElementById('currentSlide').textContent = currentSlide;

    // Update progress bar
    const progress = (currentSlide / totalSlides) * 100;
    document.getElementById('progress').style.width = `${progress}%`;

    // Update slides visibility
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide, index) => {
        const slideNum = index + 1;
        slide.classList.remove('active', 'exit');

        if (slideNum === currentSlide) {
            slide.classList.add('active');
            // Trigger counter animations when traction slide is shown
            if (slideNum === 8) {
                animateCounters();
            }
        } else if (slideNum < currentSlide) {
            slide.classList.add('exit');
        }
    });

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentSlide === 1;
    document.getElementById('nextBtn').disabled = currentSlide === totalSlides;
}

function nextSlide() {
    if (currentSlide < totalSlides) {
        updateSlide(currentSlide + 1);
    }
}

function prevSlide() {
    if (currentSlide > 1) {
        updateSlide(currentSlide - 1);
    }
}

function goToSlide(slideNumber) {
    if (slideNumber >= 1 && slideNumber <= totalSlides) {
        updateSlide(slideNumber);
    }
}

// ===== Keyboard Navigation =====
function initKeyboardNav() {
    document.addEventListener('keydown', function (e) {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(1);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(totalSlides);
                break;
            case 'Escape':
                // Could implement fullscreen toggle
                break;
        }
    });

    // Touch/Swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        const minSwipeDistance = 50;

        if (Math.abs(diff) > minSwipeDistance) {
            if (diff > 0) {
                nextSlide(); // Swipe left = next
            } else {
                prevSlide(); // Swipe right = prev
            }
        }
    }
}

// ===== Counter Animations =====
function initCounterAnimations() {
    // Initialize counters to 0
    const counters = document.querySelectorAll('.number[data-count]');
    counters.forEach(counter => {
        counter.textContent = '0';
    });
}

function animateCounters() {
    const counters = document.querySelectorAll('.number[data-count]');

    counters.forEach(counter => {
        const target = parseInt(counter.dataset.count);
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString();
            }
        };

        updateCounter();
    });
}

// ===== Utility Functions =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== Optional: Presentation Mode =====
let isFullscreen = false;

function toggleFullscreen() {
    if (!isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    isFullscreen = !isFullscreen;
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;
});

// ===== Auto-play Timer (Optional) =====
let autoPlayInterval = null;

function startAutoPlay(intervalSeconds = 10) {
    stopAutoPlay();
    autoPlayInterval = setInterval(() => {
        if (currentSlide < totalSlides) {
            nextSlide();
        } else {
            stopAutoPlay();
        }
    }, intervalSeconds * 1000);
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

// ===== Print/Export Support =====
function printDeck() {
    window.print();
}

// Add print styles dynamically
const printStyles = document.createElement('style');
printStyles.textContent = `
    @media print {
        .nav, .progress-bar, .keyboard-hint {
            display: none !important;
        }
        
        .slides-container {
            padding-top: 0;
        }
        
        .slide {
            position: static !important;
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
            page-break-after: always;
            height: 100vh;
            padding: 2rem;
        }
        
        .slide-content {
            max-height: none;
            overflow: visible;
        }
    }
`;
document.head.appendChild(printStyles);
