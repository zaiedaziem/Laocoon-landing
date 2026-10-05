// The editorial overlay: per-letter titles, slides + stories progress, grid dots, nav.

// Split each .slide-title into per-character spans with a staggered delay.
export function splitTitlesIntoChars() {
    const titles = document.querySelectorAll('.slide-title');
    titles.forEach(title => {
        const text = title.innerHTML;
        let newHTML = '';
        let delayCounter = 0;
        const parts = text.split(/(<br\s*\/?>)/i);
        parts.forEach(part => {
            if (part.toLowerCase().startsWith('<br')) {
                newHTML += part;
            } else {
                for (let i = 0; i < part.length; i++) {
                    if (part[i] === ' ') {
                        newHTML += ' ';
                    } else {
                        newHTML += `<span class="char" style="transition-delay: ${delayCounter * 0.035}s">${part[i]}</span>`;
                        delayCounter++;
                    }
                }
            }
        });
        title.innerHTML = newHTML;
    });
}

// Grid dots drift along their lines as the page scrolls.
export function updateGridDots(scroll) {
    const dots = document.querySelectorAll('.grid-dot');
    dots.forEach((dot, i) => {
        const startY = (i * 17) % 80 + 10;
        let speed = 90 + (i * 55) % 180;
        if (i % 2 === 0) speed = -speed;
        let y = startY + scroll * speed;
        y = ((y % 100) + 100) % 100;
        dot.style.top = `${y}%`;
    });
}

// Slides fade in at scroll milestones; the stories dashes fill as you pass them.
export function updateSlides(scroll) {
    const slide1 = document.getElementById('slide-1');
    const slide2 = document.getElementById('slide-2');
    const slide3 = document.getElementById('slide-3');
    const slide4 = document.getElementById('slide-4');

    for (let i = 1; i <= 4; i++) {
        const fill = document.getElementById(`dash-fill-${i}`);
        if (fill) {
            const start = (i - 1) * 0.25;
            const end = i * 0.25;
            let progress = (scroll - start) / (end - start);
            progress = Math.max(0, Math.min(1, progress));
            fill.style.height = `${progress * 100}%`;
        }
    }

    function isActive(val, start, end) { return val >= start && val <= end; }

    if (slide1) slide1.classList.toggle('active', isActive(scroll, -0.10, 0.12));
    if (slide2) {
        const active2 = isActive(scroll, 0.28, 0.40);
        slide2.classList.toggle('active', active2);
        const slide2Img = document.getElementById('slide-2-img');
        if (slide2Img) slide2Img.classList.toggle('active', active2);
    }
    if (slide3) slide3.classList.toggle('active', isActive(scroll, 0.56, 0.68));
    if (slide4) slide4.classList.toggle('active', isActive(scroll, 0.84, 1.05));
}

// Nav click → smooth scroll to that slide's milestone.
export function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const targetScrolls = [0.0, 0.34, 0.62, 0.94];
    navLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const targetY = maxScroll * targetScrolls[index];
            window.scrollTo({ top: targetY, behavior: 'smooth' });
        });
    });
}
