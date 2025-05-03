/**
 * Gestionnaire de thème pour le dashboard MAXLINK
 */

const ThemeSwitcher = (function() {
    // Variables privées
    let body;
    let themeToggle;
    let prefersDarkScheme;
    
    /**
     * Initialise le gestionnaire de thème
     */
    function init() {
        body = document.body;
        prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Chargement du thème
        loadTheme();
        
        // Configuration des écouteurs d'événements après le chargement des widgets
        document.addEventListener('widgets-loaded', setupEventListeners);
    }
    
    /**
     * Charge le thème depuis localStorage ou utilise les préférences système
     */
    function loadTheme() {
        try {
            // Vérifier s'il y a un thème sauvegardé
            const savedTheme = localStorage.getItem('theme');
            
            if (savedTheme) {
                body.setAttribute('data-theme', savedTheme);
            } else if (prefersDarkScheme.matches) {
                body.setAttribute('data-theme', 'dark');
            } else {
                body.setAttribute('data-theme', 'light');
            }
        } catch (error) {
            // En cas d'erreur, utiliser les préférences système
            if (prefersDarkScheme.matches) {
                body.setAttribute('data-theme', 'dark');
            } else {
                body.setAttribute('data-theme', 'light');
            }
        }
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    function setupEventListeners() {
        themeToggle = document.getElementById('theme-toggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        // Écouter les changements de préférences système
        prefersDarkScheme.addEventListener('change', (e) => {
            body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            saveTheme();
        });
    }
    
    /**
     * Bascule entre les thèmes clair et sombre
     */
    function toggleTheme() {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        saveTheme();
    }
    
    /**
     * Sauvegarde le thème actuel dans localStorage
     */
    function saveTheme() {
        try {
            const currentTheme = body.getAttribute('data-theme');
            localStorage.setItem('theme', currentTheme);
        } catch (error) {
            console.warn('Impossible de sauvegarder le thème dans localStorage', error);
        }
    }
    
    // API publique
    return {
        init,
        toggleTheme
    };
})();