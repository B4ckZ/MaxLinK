/**
 * Script principal du dashboard MAXLINK
 */

class DashboardApp {
    constructor() {
        // Initialiser le gestionnaire de thème
        this.themeSwitcher = new ThemeSwitcher();
        
        // Initialisation et configuration du dashboard
        this.init();
    }
    
    /**
     * Initialise le dashboard
     */
    init() {
        console.log('Dashboard MAXLINK initialisé');
        
        // Animation initiale des barres de progression
        this.animateProgressBars();
        
        // Ajuster la taille des conteneurs de logs MQTT
        this.adjustMqttLogsHeight();
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Ajustement lors du redimensionnement
        window.addEventListener('resize', this.debounce(() => {
            this.adjustMqttLogsHeight();
        }, 250));
    }
    
    /**
     * Animation des barres de progression
     */
    animateProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar');
        
        progressBars.forEach(bar => {
            const targetWidth = bar.style.width;
            bar.style.width = '0';
            
            setTimeout(() => {
                bar.style.transition = 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
                bar.style.width = targetWidth;
            }, 300);
        });
    }
    
    /**
     * Ajuste la hauteur du conteneur des logs MQTT
     */
    adjustMqttLogsHeight() {
        const mqttLogsContainer = document.getElementById('mqtt-logs');
        if (mqttLogsContainer) {
            const logsContainer = mqttLogsContainer.querySelector('.logs-container');
            if (logsContainer) {
                const titleHeight = mqttLogsContainer.querySelector('.widget-title').offsetHeight;
                const containerHeight = mqttLogsContainer.offsetHeight;
                const padding = parseInt(getComputedStyle(mqttLogsContainer).paddingTop) * 2;
                const marginTop = parseInt(getComputedStyle(logsContainer).marginTop) || 0;
                
                const availableHeight = containerHeight - titleHeight - padding - marginTop;
                
                logsContainer.style.height = `${availableHeight}px`;
            }
        }
    }
    
    /**
     * Fonction debounce pour limiter les appels fréquents
     */
    debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
}

// Initialise le dashboard lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Fonction globale pour modifier les styles d'un widget
    window.updateWidget = function(widgetId, properties) {
        const element = document.getElementById(widgetId);
        if (!element) {
            console.error(`Widget ${widgetId} non trouvé`);
            return;
        }
        
        // Appliquer les nouvelles propriétés
        Object.keys(properties).forEach(prop => {
            element.style.setProperty(prop, properties[prop], 'important');
        });
        
        console.log(`Widget ${widgetId} mis à jour:`, properties);
        
        // Ajuster la hauteur des logs MQTT si nécessaire
        if (widgetId === 'mqtt-logs') {
            setTimeout(() => window.dashboardApp.adjustMqttLogsHeight(), 100);
        }
    };
    
    // Rendre l'instance accessible globalement
    window.dashboardApp = new DashboardApp();
});