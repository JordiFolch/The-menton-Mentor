// Enhanced functionality for The Menton Mentor website

// Language management with enhanced features
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'ca';
        this.translations = {
            ca: {
                contactTitle: 'Contacta amb el Mentor',
                contactButton: '✉️',
                name: 'Nom',
                email: 'Correu electrònic',
                projectType: 'Tipus de projecte',
                message: 'Missatge',
                send: 'Enviar',
                cancel: 'Cancel·lar',
                selectProject: 'Selecciona un tipus...',
                residential: 'Residencial',
                commercial: 'Comercial',
                industrial: 'Industrial',
                renovation: 'Rehabilitació',
                infrastructure: 'Infraestructures',
                thankYou: 'Gràcies pel teu missatge!',
                messageSent: 'El teu missatge s\'ha enviat correctament. Et respondrem aviat.',
                requiredFields: 'Si us plau, omple tots els camps obligatoris.'
            },
            es: {
                contactTitle: 'Contacta con el Mentor',
                contactButton: '✉️',
                name: 'Nombre',
                email: 'Correo electrónico',
                projectType: 'Tipo de proyecto',
                message: 'Mensaje',
                send: 'Enviar',
                cancel: 'Cancelar',
                selectProject: 'Selecciona un tipo...',
                residential: 'Residencial',
                commercial: 'Comercial',
                industrial: 'Industrial',
                renovation: 'Rehabilitación',
                infrastructure: 'Infraestructuras',
                thankYou: '¡Gracias por tu mensaje!',
                messageSent: 'Tu mensaje se ha enviado correctamente. Te responderemos pronto.',
                requiredFields: 'Por favor, completa todos los campos obligatorios.'
            },
            en: {
                contactTitle: 'Contact the Mentor',
                contactButton: '✉️',
                name: 'Name',
                email: 'Email',
                projectType: 'Project type',
                message: 'Message',
                send: 'Send',
                cancel: 'Cancel',
                selectProject: 'Select a type...',
                residential: 'Residential',
                commercial: 'Commercial',
                industrial: 'Industrial',
                renovation: 'Renovation',
                infrastructure: 'Infrastructure',
                thankYou: 'Thank you for your message!',
                messageSent: 'Your message has been sent successfully. We will respond soon.',
                requiredFields: 'Please fill in all required fields.'
            }
        };
    }

    getCurrentTranslations() {
        return this.translations[this.currentLanguage];
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('selectedLanguage', lang);
        this.updateUI();
    }

    updateUI() {
        // Update language-dependent elements
        const translations = this.getCurrentTranslations();
        
        // Update contact form if it exists
        const contactTitle = document.getElementById('contactModalTitle');
        if (contactTitle) {
            contactTitle.textContent = translations.contactTitle;
        }

        // Update floating button tooltip
        const floatingBtn = document.getElementById('floatingContactBtn');
        if (floatingBtn) {
            floatingBtn.title = translations.contactTitle;
        }
    }
}

// Initialize language manager
const langManager = new LanguageManager();

// Enhanced language switching function
function mostraIdioma(idioma) {
    // Remove active class from all language sections
    document.querySelectorAll('.idioma').forEach(el => el.classList.remove('active'));
    
    // Remove active class from all language buttons
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active-lang'));
    
    // Add active class to selected language section
    document.getElementById(idioma).classList.add('active');
    
    // Add active class to selected language button
    document.getElementById('btn-' + idioma).classList.add('active-lang');
    
    // Update language manager
    langManager.setLanguage(idioma);
}

// Contact modal functionality
class ContactModal {
    constructor() {
        this.modal = null;
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div id="contactModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2 id="contactModalTitle">Contacta amb el Mentor</h2>
                    <form id="contactForm" class="contact-form">
                        <div class="form-group">
                            <label for="name">Nom *</label>
                            <input type="text" id="name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Correu electrònic *</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="projectType">Tipus de projecte</label>
                            <select id="projectType" name="projectType">
                                <option value="">Selecciona un tipus...</option>
                                <option value="residential">Residencial</option>
                                <option value="commercial">Comercial</option>
                                <option value="industrial">Industrial</option>
                                <option value="renovation">Rehabilitació</option>
                                <option value="infrastructure">Infraestructures</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="message">Missatge *</label>
                            <textarea id="message" name="message" rows="5" required placeholder="Descriu el teu projecte o consulta..."></textarea>
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" class="btn btn-secondary" onclick="contactModal.close()">Cancel·lar</button>
                            <button type="submit" class="btn btn-primary">Enviar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('contactModal');
    }

    setupEventListeners() {
        // Close modal when clicking the X
        document.querySelector('.close').onclick = () => this.close();
        
        // Close modal when clicking outside of it
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.close();
            }
        };

        // Handle form submission
        document.getElementById('contactForm').onsubmit = (e) => this.handleSubmit(e);
    }

    open() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.updateModalLanguage();
    }

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    updateModalLanguage() {
        const translations = langManager.getCurrentTranslations();
        
        document.getElementById('contactModalTitle').textContent = translations.contactTitle;
        document.querySelector('label[for="name"]').textContent = translations.name + ' *';
        document.querySelector('label[for="email"]').textContent = translations.email + ' *';
        document.querySelector('label[for="projectType"]').textContent = translations.projectType;
        document.querySelector('label[for="message"]').textContent = translations.message + ' *';
        
        const selectElement = document.getElementById('projectType');
        selectElement.innerHTML = `
            <option value="">${translations.selectProject}</option>
            <option value="residential">${translations.residential}</option>
            <option value="commercial">${translations.commercial}</option>
            <option value="industrial">${translations.industrial}</option>
            <option value="renovation">${translations.renovation}</option>
            <option value="infrastructure">${translations.infrastructure}</option>
        `;
        
        document.querySelector('.btn-secondary').textContent = translations.cancel;
        document.querySelector('.btn-primary').textContent = translations.send;
    }

    handleSubmit(e) {
        e.preventDefault();
        const translations = langManager.getCurrentTranslations();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Validate required fields
        if (!data.name || !data.email || !data.message) {
            alert(translations.requiredFields);
            return;
        }

        // Simulate form submission
        this.simulateSubmission(data, translations);
    }

    simulateSubmission(data, translations) {
        // Show loading state
        const submitBtn = document.querySelector('.btn-primary');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Enviant...';
        submitBtn.disabled = true;

        setTimeout(() => {
            alert(translations.thankYou + ' ' + translations.messageSent);
            this.close();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    resetForm() {
        document.getElementById('contactForm').reset();
    }
}

// Statistics animation
function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const finalValue = parseInt(stat.getAttribute('data-value'));
        let currentValue = 0;
        const increment = finalValue / 50;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(currentValue) + (stat.getAttribute('data-suffix') || '');
        }, 30);
    });
}

// Intersection Observer for animations
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Trigger stats animation if it's a stats container
                if (entry.target.classList.contains('stats')) {
                    animateStats();
                }
            }
        });
    }, { threshold: 0.1 });

    // Observe elements for animation
    document.querySelectorAll('.phase, .tool, .expertise-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize contact modal
let contactModal;

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Load saved language
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'ca';
    mostraIdioma(savedLanguage);
    
    // Initialize contact modal
    contactModal = new ContactModal();
    
    // Create floating contact button
    const floatingContactHTML = `
        <div class="floating-contact">
            <button id="floatingContactBtn" class="btn btn-primary" onclick="contactModal.open()" title="Contacta amb el Mentor">
                ✉️
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', floatingContactHTML);
    
    // Setup intersection observer for animations
    setupIntersectionObserver();
    
    // Add smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        // ESC key closes modal
        if (e.key === 'Escape' && contactModal && contactModal.modal.style.display === 'block') {
            contactModal.close();
        }
        
        // Number keys for language switching
        if (e.key === '1') mostraIdioma('ca');
        if (e.key === '2') mostraIdioma('es');
        if (e.key === '3') mostraIdioma('en');
    });

    // Add page loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Utility functions
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

// Add scroll-to-top functionality
function addScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '↑';
    scrollBtn.className = 'scroll-to-top btn btn-secondary';
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: none;
        z-index: 99;
        font-size: 1.2em;
    `;
    
    scrollBtn.onclick = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    document.body.appendChild(scrollBtn);
    
    // Show/hide scroll button
    window.addEventListener('scroll', debounce(() => {
        if (window.pageYOffset > 300) {
            scrollBtn.style.display = 'block';
        } else {
            scrollBtn.style.display = 'none';
        }
    }, 10));
}

// Initialize scroll to top after DOM is loaded
document.addEventListener('DOMContentLoaded', addScrollToTop);

// Export functions for global use
window.mostraIdioma = mostraIdioma;