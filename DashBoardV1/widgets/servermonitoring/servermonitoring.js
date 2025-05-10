window.servermonitoring = (function() {
    // Variables privées
    let widgetElement;
    
    // Configuration simplifiée
    const config = {
        // Configuration des différentes métriques affichées
        metrics: {
            "cpu-core1": { key: "cpu.core1", suffix: "%", max: 100 },
            "cpu-core2": { key: "cpu.core2", suffix: "%", max: 100 },
            "cpu-core3": { key: "cpu.core3", suffix: "%", max: 100 },
            "cpu-core4": { key: "cpu.core4", suffix: "%", max: 100 },
            "temp-cpu": { key: "temperature.cpu", suffix: "°C", max: 100 },
            "temp-gpu": { key: "temperature.gpu", suffix: "°C", max: 100 },
            "freq-cpu": { key: "frequency.cpu", suffix: " GHz", max: 2.5 },
            "freq-gpu": { key: "frequency.gpu", suffix: " MHz", max: 750 },
            "memory-ram": { key: "memory.ram", suffix: "%", max: 100 },
            "memory-swap": { key: "memory.swap", suffix: "%", max: 100 },
            "memory-disk": { key: "memory.disk", suffix: "%", max: 100 }
        }
    };
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
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
                // Récupérer la valeur depuis les données avec la clé
                const keyParts = metricConfig.key.split('.');
                let value = data;
                
                // Navigation dans l'objet de données
                for (const part of keyParts) {
                    if (value && value[part] !== undefined) {
                        value = value[part];
                    } else {
                        value = undefined;
                        break;
                    }
                }
                
                if (value !== undefined) {
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
        });
    }
    
    // API publique du widget - simplifiée au minimum nécessaire
    return {
        init,
        updateUI
    };
})();