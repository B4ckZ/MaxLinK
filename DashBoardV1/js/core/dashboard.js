/**
 * Script principal du dashboard MAXLINK
 * Version adaptée pour fonctionner avec la détection automatique des widgets
 */

const Dashboard = (function() {
    /**
     * Initialise le dashboard
     */
    function init() {
        console.log('Dashboard MAXLINK initialisé');
        
        // Mettre en place les écouteurs d'événements globaux
        setupEventListeners();
        
        // Configuration supplémentaire du dashboard si nécessaire
        setupDashboardConfiguration();
    }
    
    /**
     * Configure les écouteurs d'événements globaux
     */
    function setupEventListeners() {
        // Écouteur pour l'événement de chargement des widgets
        document.addEventListener('widgets-loaded', onWidgetsLoaded);
        
        // Ajustement lors du redimensionnement
        window.addEventListener('resize', Utils.debounce(() => {
            // Informer tous les widgets du redimensionnement en utilisant le gestionnaire de widgets
            const widgets = WidgetManager.getWidgets();
            Object.keys(widgets).forEach(widgetId => {
                const widget = widgets[widgetId];
                if (widget && typeof widget.onResize === 'function') {
                    widget.onResize();
                }
            });
        }, 250));
        
        // Autres écouteurs d'événements si nécessaire
        window.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    /**
     * Gestionnaire d'événement appelé lorsque tous les widgets sont chargés
     * @param {CustomEvent} event - L'événement de chargement des widgets
     */
    function onWidgetsLoaded(event) {
        console.log('Tous les widgets sont chargés et initialisés');
        
        // Obtenir tous les widgets chargés
        const loadedWidgets = WidgetManager.getWidgets();
        console.log('Widgets chargés:', Object.keys(loadedWidgets));
        
        // Actions supplémentaires après le chargement complet des widgets
        initializeInterWidgetCommunication();
        
        // Déclencher un événement personnalisé pour indiquer que le dashboard est prêt
        const dashboardReadyEvent = new CustomEvent('dashboard-ready');
        document.dispatchEvent(dashboardReadyEvent);
    }
    
    /**
     * Configure les communications entre widgets si nécessaire
     */
    function initializeInterWidgetCommunication() {
        // Cette fonction peut être utilisée pour établir des liens entre widgets
        // Par exemple, faire en sorte qu'un widget réagisse aux événements d'un autre
        
        const widgets = WidgetManager.getWidgets();
        
        // Exemple : si le widget mqtt-logs a besoin de communiquer avec server-monitoring
        if (widgets.mqttlogs509511 && widgets.servermonitoring) {
            // Établir la communication entre ces widgets
            console.log('Communication établie entre mqttlogs509511 et servermonitoring');
        }
    }
    
    /**
     * Configure les paramètres globaux du dashboard
     */
    function setupDashboardConfiguration() {
        // Configurer les paramètres globaux du dashboard
        // Par exemple, le mode d'affichage, les thèmes, etc.
        
        // Récupérer les préférences utilisateur du localStorage si elles existent
        const savedTheme = localStorage.getItem('dashboard-theme');
        if (savedTheme) {
            document.body.classList.add(savedTheme);
        }
    }
    
    /**
     * Gère les raccourcis clavier globaux
     * @param {KeyboardEvent} event - L'événement clavier
     */
    function handleKeyboardShortcuts(event) {
        // Exemple : Ctrl+R pour rafraîchir tous les widgets
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault(); // Empêcher le rechargement de la page
            refreshAllWidgets();
        }
        
        // Exemple : Échap pour sortir d'un mode plein écran ou fermer une modale
        if (event.key === 'Escape') {
            // Code pour sortir du mode plein écran ou fermer une modale
        }
    }
    
    /**
     * Rafraîchit tous les widgets qui supportent le rechargement des données
     */
    function refreshAllWidgets() {
        console.log('Rafraîchissement de tous les widgets...');
        
        const widgets = WidgetManager.getWidgets();
        Object.keys(widgets).forEach(widgetId => {
            const widget = widgets[widgetId];
            if (widget && typeof widget.loadData === 'function') {
                console.log(`Rafraîchissement du widget ${widgetId}`);
                widget.loadData();
            }
        });
    }
    
    /**
     * Obtient l'état actuel du dashboard
     * @returns {Object} L'état actuel du dashboard et des widgets
     */
    function getDashboardState() {
        const widgets = WidgetManager.getWidgets();
        const widgetStates = {};
        
        // Recueillir l'état de chaque widget s'il expose une méthode getState
        Object.keys(widgets).forEach(widgetId => {
            const widget = widgets[widgetId];
            if (widget && typeof widget.getState === 'function') {
                widgetStates[widgetId] = widget.getState();
            }
        });
        
        return {
            timestamp: new Date().toISOString(),
            widgets: widgetStates,
            // Autres informations d'état du dashboard
        };
    }
    
    /**
     * Sauvegarde l'état actuel du dashboard
     * @returns {boolean} True si la sauvegarde a réussi, false sinon
     */
    function saveDashboardState() {
        try {
            const state = getDashboardState();
            localStorage.setItem('dashboard-state', JSON.stringify(state));
            console.log('État du dashboard sauvegardé');
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'état du dashboard:', error);
            return false;
        }
    }
    
    /**
     * Restaure l'état précédemment sauvegardé du dashboard
     * @returns {boolean} True si la restauration a réussi, false sinon
     */
    function restoreDashboardState() {
        try {
            const savedState = localStorage.getItem('dashboard-state');
            if (!savedState) {
                console.warn('Aucun état sauvegardé trouvé pour le dashboard');
                return false;
            }
            
            const state = JSON.parse(savedState);
            
            // Restaurer l'état de chaque widget
            const widgets = WidgetManager.getWidgets();
            Object.keys(state.widgets).forEach(widgetId => {
                const widget = widgets[widgetId];
                if (widget && typeof widget.setState === 'function') {
                    widget.setState(state.widgets[widgetId]);
                }
            });
            
            console.log('État du dashboard restauré');
            return true;
        } catch (error) {
            console.error('Erreur lors de la restauration de l\'état du dashboard:', error);
            return false;
        }
    }
    
    // Initialisation au chargement de la page
    document.addEventListener('DOMContentLoaded', init);
    
    // API publique
    return {
        init,
        refreshAllWidgets,
        getDashboardState,
        saveDashboardState,
        restoreDashboardState
    };
})();