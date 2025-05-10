/**
 * Widget Server Monitoring pour MaxLink
 * Version améliorée avec mécanisme de mise à jour et préparation pour MQTT
 */
window.servermonitoring = (function() {
    // Variables privées
    let widgetElement;
    let updateTimer;
    
    // Configuration des métriques
    const config = {
        updateInterval: 2000, // Intervalle de mise à jour en ms
        metrics: {
            "cpu-core1": { key: "cpu.core1", suffix: "%", max: 100, warning: 80, critical: 90 },
            "cpu-core2": { key: "cpu.core2", suffix: "%", max: 100, warning: 80, critical: 90 },
            "cpu-core3": { key: "cpu.core3", suffix: "%", max: 100, warning: 80, critical: 90 },
            "cpu-core4": { key: "cpu.core4", suffix: "%", max: 100, warning: 80, critical: 90 },
            "temp-cpu": { key: "temperature.cpu", suffix: "°C", max: 100, warning: 70, critical: 85 },
            "temp-gpu": { key: "temperature.gpu", suffix: "°C", max: 100, warning: 70, critical: 85 },
            "freq-cpu": { key: "frequency.cpu", suffix: " GHz", max: 2.5, warning: 2.2, critical: 2.4 },
            "freq-gpu": { key: "frequency.gpu", suffix: " MHz", max: 750, warning: 700, critical: 730 },
            "memory-ram": { key: "memory.ram", suffix: "%", max: 100, warning: 80, critical: 90 },
            "memory-swap": { key: "memory.swap", suffix: "%", max: 100, warning: 60, critical: 80 },
            "memory-disk": { key: "memory.disk", suffix: "%", max: 100, warning: 80, critical: 90 }
        }
    };
    
    // Données actuelles (valeurs par défaut)
    const currentData = {
        cpu: { core1: 0, core2: 0, core3: 0, core4: 0 },
        temperature: { cpu: 0, gpu: 0 },
        frequency: { cpu: 0, gpu: 0 },
        memory: { ram: 0, swap: 0, disk: 0 }
    };
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        // Nettoyage préventif
        destroy();
        
        widgetElement = element;
        
        // Fusion des configurations
        if (customConfig.metrics) {
            Object.keys(customConfig.metrics).forEach(key => {
                if (config.metrics[key]) {
                    Object.assign(config.metrics[key], customConfig.metrics[key]);
                }
            });
        }
        
        console.log('Widget Server Monitoring initialisé');
        
        // Afficher des valeurs initiales
        updateUI(currentData);
        
        // Préparer l'intégration MQTT
        setupMQTTListeners();
        
        // Démarrer les mises à jour périodiques (uniquement en mode démonstration)
        // startPeriodicUpdates();
    }
    
    /**
     * Configure les écouteurs MQTT pour recevoir les métriques système
     */
    function setupMQTTListeners() {
        // À implémenter quand MQTT sera disponible
        console.log('Préparation des écouteurs MQTT pour les métriques système');
        
        /* Exemple de code à implémenter:
        if (window.mqtt) {
            // S'abonner aux topics nécessaires
            window.mqtt.subscribe('weri/system/cpu/+');
            window.mqtt.subscribe('weri/system/temperature/+');
            window.mqtt.subscribe('weri/system/frequency/+');
            window.mqtt.subscribe('weri/system/memory/+');
            
            // Configurer le gestionnaire de messages
            window.mqtt.on('message', (topic, message) => {
                handleMQTTMessage(topic, message);
            });
        }
        */
    }
    
    /**
     * Traite un message MQTT reçu
     * @param {string} topic - Topic du message
     * @param {string} message - Contenu du message
     */
    function handleMQTTMessage(topic, message) {
        try {
            // Analyser le message (supposé être du JSON)
            const data = JSON.parse(message.toString());
            
            // Extraire les informations nécessaires du topic
            // Ex: "weri/system/cpu/core1" -> catégorie: "cpu", sous-catégorie: "core1"
            const parts = topic.split('/');
            if (parts.length >= 4) {
                const category = parts[2]; // ex: "cpu"
                const subCategory = parts[3]; // ex: "core1"
                
                // Mettre à jour les données actuelles
                if (currentData[category] && data.value !== undefined) {
                    currentData[category][subCategory] = data.value;
                    
                    // Mettre à jour uniquement la métrique spécifique concernée
                    updateSpecificMetric(`${category}-${subCategory}`);
                }
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message MQTT:', error);
        }
    }
    
    /**
     * Met à jour une métrique spécifique dans l'UI
     * @param {string} metricId - Identifiant de la métrique à mettre à jour
     */
    function updateSpecificMetric(metricId) {
        const metricConfig = config.metrics[metricId];
        if (!metricConfig) return;
        
        const element = widgetElement.querySelector(`[data-metric="${metricId}"]`);
        if (!element) return;
        
        // Récupérer la valeur depuis les données actuelles
        const keyParts = metricConfig.key.split('.');
        let value = currentData;
        
        // Navigation dans l'objet de données
        for (const part of keyParts) {
            if (value && value[part] !== undefined) {
                value = value[part];
            } else {
                value = undefined;
                break;
            }
        }
        
        // Mettre à jour l'UI pour cette métrique
        updateMetricUI(element, metricConfig, value);
    }
    
    /**
     * Met à jour l'élément UI d'une métrique
     * @param {HTMLElement} element - Élément DOM de la métrique
     * @param {Object} metricConfig - Configuration de la métrique
     * @param {number|undefined} value - Valeur à afficher
     */
    function updateMetricUI(element, metricConfig, value) {
        if (value === undefined) return;
        
        const progressBar = element.querySelector('.progress-bar');
        const progressValue = element.querySelector('.progress-value');
        
        // Mettre à jour la barre de progression
        if (progressBar) {
            // Calculer le pourcentage pour la largeur de la barre
            const percentage = (value / metricConfig.max) * 100;
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
            
            // Appliquer une classe en fonction du niveau (normal, warning, critical)
            progressBar.classList.remove('level-warning', 'level-critical');
            if (value >= metricConfig.critical) {
                progressBar.classList.add('level-critical');
            } else if (value >= metricConfig.warning) {
                progressBar.classList.add('level-warning');
            }
        }
        
        // Mettre à jour le texte de la valeur
        if (progressValue) {
            progressValue.textContent = `${value}${metricConfig.suffix}`;
        }
    }
    
    /**
     * Met à jour l'interface utilisateur avec les données fournies
     * @param {Object} data - Données à afficher
     */
    function updateUI(data) {
        if (!data || !widgetElement) return;
        
        try {
            // Mettre à jour toutes les métriques
            Object.keys(config.metrics).forEach(metricId => {
                const metricConfig = config.metrics[metricId];
                const element = widgetElement.querySelector(`[data-metric="${metricId}"]`);
                
                if (element) {
                    // Récupérer la valeur depuis les données
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
                    
                    // Mettre à jour l'UI pour cette métrique
                    updateMetricUI(element, metricConfig, value);
                }
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'UI:', error);
        }
    }
    
    /**
     * Appelé lorsque des données de métriques sont reçues
     * @param {Object} data - Nouvelles données de métriques
     */
    function updateMetrics(data) {
        // Fusionner les nouvelles données avec les données actuelles
        deepMerge(currentData, data);
        
        // Mettre à jour l'UI
        updateUI(currentData);
    }
    
    /**
     * Fusion profonde de deux objets
     * @param {Object} target - Objet cible
     * @param {Object} source - Objet source
     */
    function deepMerge(target, source) {
        if (!source) return target;
        
        Object.keys(source).forEach(key => {
            if (source[key] instanceof Object && key in target) {
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        });
        
        return target;
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Pas d'ajustement nécessaire pour ce widget
    }
    
    /**
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    }
    
    // API publique du widget
    return {
        init,
        updateMetrics,
        handleMQTTMessage,
        updateUI,
        onResize,
        destroy
    };
})();