/**
 * Widget theme-toggle avec deux icônes
 */

const themeToggleWidget = (function() {
    // Variables privées du widget
    let widgetElement;
    let themeToggleBtn;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        widgetElement.id = 'theme-toggle-widget';
        
        // Récupérer le bouton
        themeToggleBtn = widgetElement.querySelector('#theme-toggle-btn');
        
        if (themeToggleBtn) {
            // Ajouter l'écouteur d'événement
            themeToggleBtn.addEventListener('click', toggleTheme);
            console.log('Bouton de thème initialisé avec succès');
        } else {
            console.error('Bouton de thème non trouvé');
        }
    }
    
    /**
     * Bascule entre les thèmes clair et sombre
     */
    function toggleTheme() {
        console.log('Toggle theme appelé');
        
        // Utiliser ThemeSwitcher s'il est disponible
        if (typeof ThemeSwitcher !== 'undefined' && ThemeSwitcher.toggleTheme) {
            ThemeSwitcher.toggleTheme();
        } else {
            // Implémentation de secours
            const body = document.body;
            const currentTheme = body.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            body.setAttribute('data-theme', newTheme);
            
            // Sauvegarder dans localStorage
            try {
                localStorage.setItem('theme', newTheme);
            } catch (error) {
                console.warn('Impossible de sauvegarder le thème dans localStorage', error);
            }
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Pas d'ajustement nécessaire pour ce widget
    }
    
    // API publique du widget
    return {
        init,
        onResize
    };
})();