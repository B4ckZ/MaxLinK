/**
 * Widget Template pour MAXLINK Dashboard
 * Sert de base pour créer de nouveaux widgets
 */

const TemplateWidget = (function() {
    // Variables privées du widget
    let widgetElement;
    let config = {
        // Configuration par défaut du widget
    };
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        widgetElement = element;
        
        // Fusionner la configuration personnalisée avec les valeurs par défaut
        config = {...config, ...customConfig};
        
        // Initialiser les composants du widget
        setupEventListeners();
        
        console.log('Widget Template initialisé');
        
        // Premier chargement des données
        loadData();
    }
    
    /**
     * Configure les écouteurs d'événements spécifiques au widget
     */
    function setupEventListeners() {
        // Exemple d'écouteur d'événement sur un élément du widget
        const exampleButton = widgetElement.querySelector('.example-button');
        if (exampleButton) {
            exampleButton.addEventListener('click', handleButtonClick);
        }
    }
    
    /**
     * Exemple de gestionnaire d'événement
     * @param {Event} event - L'événement déclencheur
     */
    function handleButtonClick(event) {
        console.log('Bouton cliqué dans le widget template');
        // Actions spécifiques
    }
    
    /**
     * Charge ou rafraîchit les données du widget
     */
    function loadData() {
        // Simuler un chargement de données
        setTimeout(() => {
            updateUI();
        }, 500);
    }
    
    /**
     * Met à jour l'interface utilisateur avec les nouvelles données
     */
    function updateUI() {
        // Mise à jour de l'interface avec les données
        const content = widgetElement.querySelector('.template-content');
        if (content) {
            content.innerHTML = '<p>Données mises à jour: ' + new Date().toLocaleTimeString() + '</p>';
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Ajuster les éléments si nécessaire lors du redimensionnement
        console.log('Widget Template redimensionné');
    }
    
    /**
     * Définit une nouvelle configuration
     * @param {Object} newConfig - Nouvelle configuration
     */
    function setConfig(newConfig) {
        config = {...config, ...newConfig};
        // Réagir aux changements de configuration
        loadData();
    }
    
    // API publique du widget
    return {
        init,
        loadData,
        setConfig,
        onResize
    };
})();