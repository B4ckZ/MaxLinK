/**
 * Widget Logo pour MAXLINK Dashboard
 * Affiche le logo
 */

const logoWidget = (function() {
    // Variables privées du widget
    let widgetElement;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        console.log('Widget Logo initialisé');
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