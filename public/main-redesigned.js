/* -------------------------------------------------
   MOBILE NAVIGATION
------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

    const hamburger = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('overlay');

    if (!hamburger || !mobileMenu || !overlay) return;

    function openMenu() {
        mobileMenu.classList.add('active');
        overlay.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu.classList.contains('active') ? closeMenu() : openMenu();
    });

    overlay.addEventListener('click', closeMenu);
    mobileMenu.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });

    // --- NEW FIX STARTS HERE ---
    // Close menu when a link inside it is clicked
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });
    // --- NEW FIX ENDS HERE ---

});
/* -------------------------------------------------
   MULTI-STEP FORM LOGIC
------------------------------------------------- */
function nextStep() {
    const currentStep = document.querySelector('.form-step.active');
    const inputs = currentStep.querySelectorAll('input[required], select[required], textarea[required]');

    let valid = true;
    inputs.forEach(input => {
        if (!input.value.trim()) {
            valid = false;
            input.style.borderColor = 'red';
        } else {
            input.style.borderColor = '';
        }
    });

    if (!valid) return;

    const next = currentStep.nextElementSibling;
    if (next && next.classList.contains('form-step')) {
        currentStep.classList.remove('active');
        next.classList.add('active');
        updateProgressBar(parseInt(next.dataset.step, 10));
    }
}

function updateProgressBar(step) {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = (step / 6) * 100 + '%';
    }
}

function scrollToForm() {
    const form = document.querySelector('.hero-form');
    if (!form) return;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* -------------------------------------------------
   API CONFIG
------------------------------------------------- */
const API_BASE = "http://localhost:3000";


/* -------------------------------------------------
   LEAD FORM SUBMISSION
------------------------------------------------- */
document.getElementById('leadForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = document.getElementById('leadForm');
    const submitBtn = document.getElementById('submitBtn');
    const thankYouState = document.getElementById('thankYouState');

    submitBtn.disabled = true;
    submitBtn.textContent = "Generating your AI Strategy Report...";
    submitBtn.style.opacity = "0.7";

    const payload = {
        fullName: document.getElementById("fullName")?.value.trim(),
        email: document.getElementById("email")?.value.trim(),
        country: document.getElementById("country")?.value,
        businessStage: document.getElementById("businessStage")?.value,
        q1_problem: document.getElementById("q1_problem")?.value,
        q2_owner: document.getElementById("q2_owner")?.value,
        q3_data: document.getElementById("q3_data")?.value,
        q4_tech: document.getElementById("q4_tech")?.value,
        q5_risk: document.getElementById("q5_risk")?.value,
        q6_capability: document.getElementById("q6_capability")?.value,
        q7_budget: document.getElementById("q7_budget")?.value,
        q8_success: document.getElementById("q8_success")?.value
    };

    for (const key in payload) {
        if (!payload[key]) {
            submitBtn.disabled = false;
            submitBtn.textContent = "GENERATE MY AI STRATEGY REPORT";
            submitBtn.style.opacity = "1";
            alert("Please complete all fields.");
            return;
        }
    }

    try {
        const res = await fetch("http://localhost:3000/api/lead-submission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!data.success) throw new Error();

        // Hide form completely
        form.style.display = "none";

        // Show thank you state
        thankYouState.style.display = "block";

    } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = "GENERATE MY AI STRATEGY REPORT";
        submitBtn.style.opacity = "1";
        alert("Something went wrong. Please try again.");
    }
});


/* -------------------------------------------------
   DOWNLOAD FORM
------------------------------------------------- */
document.getElementById('downloadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('downloadEmail');
    const email = emailInput?.value.trim();
    const formWrapper = document.getElementById('downloadFormWrapper');
    const successState = document.getElementById('downloadSuccess');
    const button = document.getElementById('downloadBtn');

    if (!email) return;

    button.disabled = true;
    button.textContent = "Sending...";
    button.style.opacity = "0.7";

    try {
        const response = await fetch(`${API_BASE}/api/lead-submission`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Report Download User",
                email,
                country: "Nigeria",
                businessStage: "Exploring",
                q1_problem: "Not specified",
                q2_owner: "Not specified",
                q3_data: "Not specified",
                q4_tech: "Not specified",
                q5_risk: "Not specified",
                q6_capability: "Not specified",
                q7_budget: "Not specified",
                q8_success: "Not specified"
            })
        });

        const data = await response.json();
        if (!data.success) throw new Error();

        /* ✅ SUCCESS UX */
        formWrapper.style.display = "none";
        successState.style.display = "block";

    } catch (error) {
        button.disabled = false;
        button.textContent = "DOWNLOAD MY STRATEGIC AI REPORT";
        button.style.opacity = "1";
        alert("Something went wrong. Please try again.");
    }
});


/* -------------------------------------------------
   NEWSLETTER
------------------------------------------------- */
document.getElementById('newsletterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('newsletterEmail');
    const email = emailInput?.value.trim();

    if (!email) return;

    const formState = document.getElementById('newsletterFormState');
    const successState = document.getElementById('newsletterSuccessState');

    try {
        const res = await fetch(`${API_BASE}/api/newsletter`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (!data.success) throw new Error();

        // Hide form
        formState.style.display = "none";

        // Show success message
        successState.style.display = "block";

    } catch (err) {
        alert("Subscription failed. Please try again.");
    }
});


/* -------------------------------------------------
   TYPED TEXT
------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Typed !== 'undefined' && document.getElementById('typed-text')) {
        new Typed('#typed-text', {
            strings: [
                'Strategic AI Clarity',
                'Business Transformation',
                'AI Strategy That Works',
                'Cross-Market Excellence'
            ],
            typeSpeed: 60,
            backSpeed: 40,
            loop: true,
            showCursor: true
        });
    }
});


/* -------------------------------------------------
   SPLIDE SLIDER
------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Splide !== "undefined") {
        new Splide('#testimonial-slider', {
            type: 'loop',
            autoplay: true,
            interval: 5000,
            arrows: false,
            pagination: true,
            speed: 800,
        }).mount();
    }
});


/* -------------------------------------------------
   REVEAL ANIMATIONS
------------------------------------------------- */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-up, .problem-item').forEach(el => revealObserver.observe(el));


/* -------------------------------------------------
   STAT COUNTERS
------------------------------------------------- */
const statObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        let current = 0;
        const increment = target / 50;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current);
            }
        }, 40);

        statObserver.unobserve(el);
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => statObserver.observe(el));

/* -------------------------------------------------
   logo scroll to homepage
------------------------------------------------- */

function scrollToHome() {
    document.querySelector('.hero')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

/* -------------------------------------------------
   vIDEOS TESTIOMIAL HANDLER
------------------------------------------------- */
document.querySelectorAll('.testimonial-video').forEach(video => {
    video.addEventListener('play', () => {
        document.querySelector('#testimonial-slider')?.splide?.pause();
    });

    video.addEventListener('pause', () => {
        document.querySelector('#testimonial-slider')?.splide?.play();
    });
});


/* Add this to main-redesigned.js */
function startFullAssessment() {

    // Scroll to the main form
    const formSection = document.querySelector('.hero-form');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Optional: Focus on the first input
        const firstInput = document.getElementById('fullName');
        if (firstInput) setTimeout(() => firstInput.focus(), 800);
    }
}
/* Add to main-redesigned.js inside DOMContentLoaded or standalone */
document.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
        // Remove active class from siblings
        const parent = this.parentElement;
        parent.querySelectorAll('.quiz-option').forEach(sib => sib.classList.remove('selected'));
        
        // Add active class to clicked
        this.classList.add('selected');
        
        // Optional: Auto-scroll to full assessment after a delay
        setTimeout(() => {
            startFullAssessment();
        }, 500);
    });
});