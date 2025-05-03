/**
 * Gestionnaire de thème pour le dashboard MAXLINK
 */

class ThemeSwitcher {
    constructor() {
        this.body = document.body;
        this.themeToggle = document.getElementById('theme-toggle');
        this.prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.init();
    }
    
    /**
     * Initialise le gestionnaire de thème
     */
    init() {
        this.loadTheme();
        this.setupEventListeners();
    }
    
    /**
     * Charge le thème depuis localStorage ou utilise les préférences système
     */
    loadTheme() {
        try {
            // Vérifier s'il y a un thème sauvegardé
            const savedTheme = localStorage.getItem('theme');
            
            if (savedTheme) {
                this.body.setAttribute('data-theme', savedTheme);
            } else if (this.prefersDarkScheme.matches) {
                this.body.setAttribute('data-theme', 'dark');
            } else {
                this.body.setAttribute('data-theme', 'light');
            }
        } catch (error) {
            // En cas d'erreur, utiliser les préférences système
            if (this.prefersDarkScheme.matches) {
                this.body.setAttribute('data-theme', 'dark');
            } else {
                this.body.setAttribute('data-theme', 'light');
            }
        }
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Écouter les changements de préférences système
        this.prefersDarkScheme.addEventListener('change', (e) => {
            this.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            this.saveTheme();
        });
    }
    
    /**
     * Bascule entre les thèmes clair et sombre
     */
    toggleTheme() {
        const currentTheme = this.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.body.setAttribute('data-theme', newTheme);
        this.saveTheme();
    }
    
    /**
     * Sauvegarde le thème actuel dans localStorage
     */
    saveTheme() {
        try {
            const currentTheme = this.body.getAttribute('data-theme');
            localStorage.setItem('theme', currentTheme);
        } catch (error) {
            console.warn('Impossible de sauvegarder le thème dans localStorage', error);
        }
    }
}