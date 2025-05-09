const servermonitoring = (function() {
    // Variables privées
    let widgetElement;
    
    // Configuration simplifiée
    const config = {
        // Configuration des différentes métriques affichées
        metrics: {
            "cpu-core1": { path: ["cpu", "core1"], suffix: "%", max: 100 },
            "cpu-core2": { path: ["cpu", "core2"], suffix: "%", max: 100 },
            "cpu-core3": { path: ["cpu", "core3"], suffix: "%", max: 100 },
            "cpu-core4": { path: ["cpu", "core4"], suffix: "%", max: 100 },
            "temp-cpu": { path: ["temperature", "cpu"], suffix: "°C", max: 100 },
            "temp-gpu": { path: ["temperature", "gpu"], suffix: "°C", max: 100 },
            "freq-cpu": { path: ["frequency", "cpu"], suffix: " GHz", max: 2.5 },
            "freq-gpu": { path: ["frequency", "gpu"], suffix: " MHz", max: 750 },
            "memory-ram": { path: ["memory", "ram"], suffix: "%", max: 100 },
            "memory-swap": { path: ["memory", "swap"], suffix: "%", max: 100 },
            "memory-disk": { path: ["memory", "disk"], suffix: "%", max: 100 }
        }
    };
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        widgetElement = element;
        
        // Fusionner la configuration personnalisée
        if (customConfig) {
            Object.assign(config, customConfig);
        }
        
        console.log('Widget Server Monitoring initialisé');
    }
    
    /**
     * Met à jour l'interface utilisateur avec les données fournies
     * @param {Object} data - Données à afficher
     */
    function updateUI(data) {
        if (!data) return;
        
        // Parcourir toutes les métriques
        Object.keys(config.metrics).forEach(metricId => {
            const metricConfig = config.metrics[metricId];
            const element = widgetElement.querySelector(`[data-metric="${metricId}"]`);
            
            if (element) {
                // Récupérer la valeur depuis les données
                let value = getNestedValue(data, metricConfig.path);
                
                if (value !== undefined) {
                    // Si c'est un texte simple (comme l'uptime)
                    if (metricConfig.isText) {
                        element.textContent = value;
                    } else {
                        // Sinon c'est une barre de progression
                        const progressBar = element.querySelector('.progress-bar');
                        const progressValue = element.querySelector('.progress-value');
                        
                        if (progressBar) {
                            // Calculer le pourcentage pour la largeur de la barre
                            const percentage = (value / metricConfig.max) * 100;
                            progressBar.style.width = `${Math.min(percentage, 100)}%`;
                        }
                        
                        if (progressValue) {
                            // Mettre à jour le texte de la valeur
                            progressValue.textContent = `${value}${metricConfig.suffix}`;
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Récupère une valeur imbriquée dans un objet
     * @param {Object} obj - Objet source
     * @param {Array} path - Chemin d'accès à la valeur
     * @returns {*} La valeur ou undefined si non trouvée
     */
    function getNestedValue(obj, path) {
        return path.reduce((prev, curr) => {
            return prev && prev[curr] !== undefined ? prev[curr] : undefined;
        }, obj);
    }
    
    /**
     * Mises à jour de configuration
     * @param {Object} newConfig - Nouvelles configurations
     */
    function setConfig(newConfig) {
        // Fusion simple
        Object.assign(config, newConfig);
    }
    
    // API publique du widget - simplifiée au minimum nécessaire
    return {
        init,
        updateUI,
        setConfig
    };
})();