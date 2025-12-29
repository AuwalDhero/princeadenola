/* -------------------------------------------------
   API CONFIG
------------------------------------------------- */
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:3000" 
    : "https://princeadenola.onrender.com"; // Your Render URL
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

    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => closeMenu());
    });
});

/* -------------------------------------------------
   MULTI-STEP FORM LOGIC
------------------------------------------------- */
function nextStep() {
    const currentStep = document.querySelector('.form-step.active');
    // Check for both visible inputs and hidden inputs (used by quiz cards)
    const inputs = currentStep.querySelectorAll('input[required], select[required]');

    let valid = true;
    inputs.forEach(input => {
        if (!input.value.trim()) {
            valid = false;
            // If it's a hidden input, highlight the container
            if (input.type === 'hidden') {
                const container = input.parentElement.querySelector('.quiz-options-container');
                if (container) container.style.border = '1px solid red';
            } else {
                input.style.borderColor = 'red';
            }
        } else {
            input.style.borderColor = '';
            const container = input.parentElement.querySelector('.quiz-options-container');
            if (container) container.style.border = 'none';
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
   CALCULATOR CONFIGURATION (UPDATED)
------------------------------------------------- */
// Keys updated to match the exact text strings in index.html
const SCORING_SYSTEM = {
    "q2_owner": { 
        "No clear owner yet": 0, 
        "Department head": 3, 
        "CTO / CIO": 7, 
        "Board / Executive": 8, 
        "Board / Executive leadership": 8, // Fallback
        "CEO / Founder": 10 
    },
    "q3_data": { 
        "Very Limited": 0,
        "Very limited usable data": 0, // Fallback
        "Fragmented / Siloed": 3,
        "Fragmented or siloed data": 3, // Fallback
        "High-quality & Governed": 10,
        "High-quality data with strong governance": 10 // Fallback
    },
    "q6_capability": { 
        "No AI usage yet": 0,
        "No AI usage": 0, // Fallback
        "Basic Automation/ChatGPT": 4,
        "Basic tools (ChatGPT, automation)": 4, // Fallback
        "Advanced AI/ML Systems": 10,
        "Advanced AI / ML systems": 10 // Fallback
    },
    "q7_budget": { 
        "Limited capacity": 0, 
        "Partial budget/skills": 5, 
        "Yes, fully ready": 10 
    },
    // Optional questions (if added back to HTML later)
    "q4_tech": { "Low digital maturity": 0, "Heavy legacy infrastructure": 3, "Mostly digital with some legacy systems": 7, "Cloud-based and well integrated": 10 },
    "q5_risk": { "Not yet considered": 0, "Partially considered": 5, "Yes, clearly addressed": 10 },
    "q8_success": { "No clear success metrics": 0, "Some KPIs, flexible goals": 5, "Clear KPIs & ROI targets": 10 }
};

/* -------------------------------------------------
   MAIN FORM SUBMISSION (SCORE + EMAIL)
------------------------------------------------- */
document.getElementById('leadForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = "Generating Your Report...";
    submitBtn.disabled = true;

    // 1. Calculate Score Dynamically
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const [questionId, answersMap] of Object.entries(SCORING_SYSTEM)) {
        const inputElement = document.getElementById(questionId);
        
        // Only calculate score for questions that actually exist in the DOM
        if (inputElement) {
            // Add the max possible score for this question to the denominator
            const maxQuestionScore = Math.max(...Object.values(answersMap));
            maxPossibleScore += maxQuestionScore;

            // Get user value
            const userSelection = inputElement.value;
            
            // Add to total if valid
            if (userSelection && answersMap[userSelection] !== undefined) {
                totalScore += answersMap[userSelection];
            }
        }
    }

    // Safety check to prevent divide by zero
    if (maxPossibleScore === 0) maxPossibleScore = 40; 

    let percentage = Math.round((totalScore / maxPossibleScore) * 100);
    if (percentage > 100) percentage = 100;

    // 2. Prepare Data for Backend
    const payload = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        readinessScore: percentage
    };

    try {
        const response = await fetch(`${API_BASE}/api/lead-submission`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Server error");

        // 3. Success UX
        let title = percentage < 40 ? "Early Stage Readiness" : (percentage < 75 ? "Strategic Builder" : "AI Market Leader");
        let message = percentage < 40 
            ? "Your assessment is complete! Check your email for your Strategic AI Report focused on building foundations."
            : "Your custom Strategic AI Report is in your inbox! You have a strong base for AI scaling.";

        // UI Transitions
        document.querySelectorAll('.form-step').forEach(step => step.style.display = 'none');
        document.querySelector('.progress-bar').style.display = 'none';
        document.querySelector('.form-header').style.display = 'none';

        const resultDiv = document.getElementById('resultState');
        resultDiv.style.display = 'block';
        document.getElementById('resultTitle').textContent = title;
        document.getElementById('resultMessage').textContent = message;

        animateScore(percentage);

    } catch (err) {
        console.error(err);
        alert("There was an issue sending your report. Please try again.");
        submitBtn.disabled = false;
        submitBtn.textContent = "GET MY CLARITY REPORT";
    }
});

function animateScore(targetPercentage) {
    const ring = document.getElementById('scoreRing');
    const text = document.getElementById('scorePercentage');
    let current = 0;
    
    // Set ring stroke offset
    if(ring) ring.style.strokeDasharray = `${targetPercentage}, 100`;
    
    const timer = setInterval(() => {
        if (current >= targetPercentage) {
            clearInterval(timer);
        } else {
            current++;
            if(text) text.textContent = current + "%";
        }
    }, 20);
}

/* -------------------------------------------------
   QUIZ OPTION HANDLERS
------------------------------------------------- */
document.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
        const parent = this.parentElement;
        
        // Remove active class from siblings
        parent.querySelectorAll('.quiz-option').forEach(sib => sib.classList.remove('selected'));
        
        // Add active class to clicked card
        this.classList.add('selected');
        
        // SYNC DATA: Find the hidden input in this section and update its value
        const hiddenInput = parent.parentElement.querySelector('input[type="hidden"]');
        if (hiddenInput) {
            hiddenInput.value = this.innerText.trim();
        }
        
        // Auto-scroll to full assessment if clicked from hero quiz widget
        if (this.closest('.hero-quiz') || this.closest('.assessment-widget')) {
             // If it's the widget at the bottom, we might want to start the form
             setTimeout(() => startFullAssessment(), 500);
        }
    });
});

/* -------------------------------------------------
   UTILITIES & EXTERNAL LIBRARIES
------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    // Typed Text
    if (typeof Typed !== 'undefined' && document.getElementById('typed-text')) {
        new Typed('#typed-text', {
            strings: ['Strategic AI Clarity', 'Business Transformation', 'AI Strategy That Works', 'Cross-Market Excellence'],
            typeSpeed: 60, backSpeed: 40, loop: true
        });
    }

    // Splide Slider
    if (typeof Splide !== "undefined" && document.getElementById('testimonial-slider')) {
        new Splide('#testimonial-slider', {
            type: 'loop', autoplay: true, interval: 5000, arrows: false, pagination: true, speed: 800,
        }).mount();
    }

    // Stat Counters
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

    // Reveal Animations
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.fade-up, .problem-item').forEach(el => revealObserver.observe(el));
});

function scrollToHome() {
    document.querySelector('.hero')?.scrollIntoView({ behavior: 'smooth' });
}

function startFullAssessment() {
    const formSection = document.querySelector('.hero-form');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstInput = document.getElementById('fullName');
        if (firstInput) setTimeout(() => firstInput.focus(), 800);
    }
}

/* -------------------------------------------------
   DOWNLOAD FORM (Resource Page)
------------------------------------------------- */
document.getElementById('downloadForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const emailInput = document.getElementById('downloadEmail');
    const formWrapper = document.getElementById('downloadFormWrapper');
    const successState = document.getElementById('downloadSuccess');
    const button = document.getElementById('downloadBtn');

    if (!emailInput.value) return;

    button.disabled = true;
    button.textContent = "Processing...";

    // 1. Trigger Direct Browser Download
    const link = document.createElement('a');
    link.href = 'resources/Strategic-AI-Clarity-Report.pdf'; 
    link.download = 'Strategic-AI-Clarity-Report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Send Email via Backend API
    // We use the existing 'lead-submission' endpoint. 
    // Since this form doesn't ask for a name, we send "Reader" as a placeholder to pass backend validation.
    try {
        await fetch(`${API_BASE}/api/lead-submission`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: emailInput.value,
                fullName: "Reader", 
                readinessScore: 100 // Placeholder score indicates a direct download
            })
        });
    } catch (err) {
        console.error("Email sending failed (Download still worked):", err);
    }

    // 3. Update UI to Success State
    setTimeout(() => {
        formWrapper.style.display = "none";
        successState.style.display = "block";
    }, 1000);
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
        if (res.ok) {
            formState.style.display = "none";
            successState.style.display = "block";
        }
    } catch (err) {
        alert("Subscription failed.");
    }
});