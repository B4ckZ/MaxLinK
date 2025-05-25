/**
 * Registre des widgets pour le dashboard MAXLINK
 * Version simplifiée - Less is More
 */
const WidgetRegistry = (function() {
    // Liste statique des widgets disponibles
    const AVAILABLE_WIDGETS = [
        'clock',
        'downloadbutton', 
        'logo',
        'mqttlogs509511',
        'mqttstats',
        'rebootbutton',
        'servermonitoring',
        'uptime',
        'wifistats'
    ];
    
    /**
     * Retourne la liste des widgets disponibles
     * @returns {Promise} Promise qui résout avec la liste des widgets
     */
    function detectWidgets() {
        return new Promise((resolve) => {
            console.log("Chargement des widgets...");
            
            // Convertir la liste simple en format attendu par WidgetManager
            const widgets = AVAILABLE_WIDGETS.map(id => ({ id: id }));
            
            console.log(`${widgets.length} widgets disponibles:`, AVAILABLE_WIDGETS);
            
            // Retourner la liste après un court délai (simule le chargement)
            setTimeout(() => {
                resolve(widgets);
            }, 100);
        });
    }
    
    /**
     * Vérifie si un widget existe
     * @param {string} id - ID du widget à vérifier
     * @returns {Promise<boolean>} True si le widget existe
     */
    function widgetExists(id) {
        return Promise.resolve(AVAILABLE_WIDGETS.includes(id));
    }
    
    /**
     * Obtient la liste des widgets disponibles
     * @returns {Array} Liste des widgets disponibles
     */
    function getAvailableWidgets() {
        return AVAILABLE_WIDGETS.map(id => ({ id: id }));
    }
    
    // API publique
    return {
        detectWidgets,
        widgetExists,
        getAvailableWidgets
    };
})();