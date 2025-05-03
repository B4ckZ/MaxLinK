/**
 * Widget Logo pour MAXLINK Dashboard
 * Affiche le logo et le switch de thème
 */

const logoWidget = (function() {
    // Variables privées du widget
    let widgetElement;
    let themeToggle;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        
        // Initialiser les composants du widget
        setupEventListeners();
        
        console.log('Widget Logo initialisé');
    }
    
    /**
     * Configure les écouteurs d'événements spécifiques au widget
     */
    function setupEventListeners() {
        // Récupérer le toggle de thème
        themeToggle = widgetElement.querySelector('#theme-toggle');
        
        // Si le thème est déjà initialisé (via ThemeSwitcher), pas besoin de réattacher les événements
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