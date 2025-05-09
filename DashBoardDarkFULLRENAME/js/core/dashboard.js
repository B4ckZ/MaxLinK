/**
 * Script principal du dashboard MAXLINK
 */

const Dashboard = (function() {
    /**
     * Initialise le dashboard
     */
    function init() {
        console.log('Dashboard MAXLINK initialisé');
        
        // Mettre en place les écouteurs d'événements globaux
        setupEventListeners();
    }
    
    /**
     * Configure les écouteurs d'événements globaux
     */
    function setupEventListeners() {
        // Ajustement lors du redimensionnement
        window.addEventListener('resize', Utils.debounce(() => {
            // Informer tous les widgets du redimensionnement
            // Correction: Utiliser getWidget pour chaque widget connu
            const widgetIds = ['logo', 'mqtt-logs-509-511', 'server-monitoring', 'wifi-stats', 'mqtt-server', 'mqtt-logs-999'];
            widgetIds.forEach(widgetId => {
                const widget = WidgetManager.getWidget(widgetId);
                if (widget && typeof widget.onResize === 'function') {
                    widget.onResize();
                }
            });
        }, 250));
    }
    
    // Initialisation au chargement de la page
    document.addEventListener('DOMContentLoaded', init);
    
    // API publique
    return {
        init
    };
})();