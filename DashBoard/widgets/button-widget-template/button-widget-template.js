/**
 * Template de Widget Bouton pour le Dashboard
 * Peut être facilement adapté à divers types de widgets bouton
 */

const ButtonWidgetTemplate = (function() {
    // Variables privées
    let widgetElement;
    let valueElement;
    let config = {
        // Configuration par défaut
        refreshInterval: 60000, // Intervalle de rafraîchissement en ms (1 minute)
        animateChanges: true    // Animer les changements de valeur
    };
    
    // Timer pour les mises à jour régulières
    let updateTimer;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        widgetElement = element;
        
        // Sélectionner l'élément qui affiche la valeur
        valueElement = widgetElement.querySelector('[data-metric="widget-value"]');
        
        // Fusionner la configuration personnalisée avec celle par défaut
        Object.assign(config, customConfig);
        
        console.log('Widget Bouton initialisé');
        
        // Charger les données initiales
        loadData();
        
        // Mettre en place l'intervalle de rafraîchissement si nécessaire
        if (config.refreshInterval > 0) {
            startUpdateInterval();
        }
        
        // Ajouter les écouteurs d'événements nécessaires
        setupEventListeners();
    }
    
    /**
     * Charge ou rafraîchit les données du widget
     */
    function loadData() {
        // À implémenter selon le type spécifique de widget
        // Par exemple, pour un uptime :
        // fetchUptimeData().then(data => updateValue(data.uptime));
        
        // Pour la démonstration, utilisons une valeur fictive
        updateValue("Exemple de valeur");
    }
    
    /**
     * Démarre l'intervalle de mise à jour
     */
    function startUpdateInterval() {
        // Nettoyer l'intervalle précédent si existant
        if (updateTimer) {
            clearInterval(updateTimer);
        }
        
        // Créer un nouvel intervalle
        updateTimer = setInterval(() => {
            loadData();
        }, config.refreshInterval);
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    function setupEventListeners() {
        // Peut être utilisé pour ajouter des interactivités comme un clic sur le bouton
        // Par exemple:
        /*
        widgetElement.querySelector('.button-widget-inset').addEventListener('click', () => {
            // Action à effectuer lors du clic
        });
        */
    }
    
    /**
     * Met à jour la valeur affichée
     * @param {string} value - Nouvelle valeur à afficher
     */
    function updateValue(value) {
        if (valueElement && value !== undefined) {
            // Ajouter une animation subtile si activée
            if (config.animateChanges) {
                valueElement.classList.add('value-update');
                setTimeout(() => {
                    valueElement.classList.remove('value-update');
                }, 500);
            }
            
            valueElement.textContent = value;
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Ajuster ce qui est nécessaire lors du redimensionnement
        // Dans la plupart des cas, le CSS responsive s'occupera de tout
    }
    
    /**
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        // Arrêter l'intervalle de mise à jour
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
        
        // Retirer les écouteurs d'événements
        // ...
    }
    
    // API publique
    return {
        init,
        loadData,
        updateValue,
        onResize,
        destroy
    };
})();

// Exporter pour utilisation (si module)
// export default ButtonWidgetTemplate;