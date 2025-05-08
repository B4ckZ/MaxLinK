/**
 * Widget Uptime pour MAXLINK Dashboard
 * Affiche l'uptime du système avec un design de bouton
 */

const uptimeWidget = (function() {
    // Variables privées
    let widgetElement;
    let uptimeElement;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        uptimeElement = widgetElement.querySelector('[data-metric="uptime"]');
        
        console.log('Widget Uptime initialisé');
    }
    
    /**
     * Met à jour l'affichage de l'uptime
     * @param {string} uptime - Valeur de l'uptime au format "Xd XXh XXm XXs"
     */
    function updateUptime(uptime) {
        if (uptimeElement && uptime) {
            uptimeElement.textContent = uptime;
        }
    }
    
    // API publique du widget
    return {
        init,
        updateUptime
    };
})();