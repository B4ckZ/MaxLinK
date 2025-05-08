/**
 * Widget Server Monitoring pour MAXLINK Dashboard
 * Version simplifiée avec mode simulation (préparé pour MQTT ultérieurement)
 */

const serverMonitoringWidget = (function() {
    // Variables privées
    let widgetElement;
    let updateTimer;
    
    // Configuration
    const config = {
        updateInterval: 1000, // Rafraîchissement à 1 seconde
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
            "memory-disk": { path: ["memory", "disk"], suffix: "%", max: 100 },
            "uptime": { path: ["uptime", "value"], isText: true }
        },
        // Configuration MQTT (pour utilisation future)
        mqtt: {
            enabled: false,
            broker: "ws://raspberrypi.local:9001",
            clientId: "dashboard-server-monitor-" + Math.random().toString(16).substr(2, 8),
            topicBase: "maxlink/system/stats/"
        }
    };
    
    // Données courantes (commençons avec des valeurs simulées)
    let currentData = {
        cpu: {
            core1: 45,
            core2: 30,
            core3: 60,
            core4: 20
        },
        temperature: {
            cpu: 55,
            gpu: 50
        },
        frequency: {
            cpu: 1.8,
            gpu: 400
        },
        memory: {
            ram: 62,
            swap: 10,
            disk: 45
        },
        uptime: {
            value: "0d 12h 34m 56s"
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
            // Fusion récursive pour les sous-objets
            if (customConfig.mqtt) {
                Object.assign(config.mqtt, customConfig.mqtt);
                delete customConfig.mqtt;
            }
            
            // Fusion du reste de la configuration
            Object.assign(config, customConfig);
        }
        
        // Animation initiale des barres
        animateProgressBars();
        
        // Démarrer le mode simulation en attendant d'avoir MQTT
        startSimulation();
        
        console.log('Widget Server Monitoring initialisé en mode simulation');
    }
    
    /**
     * Animation des barres de progression
     */
    function animateProgressBars() {
        const progressBars = widgetElement.querySelectorAll('.progress-bar');
        
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
     * Démarre le mode simulation
     */
    function startSimulation() {
        console.log("Mode simulation activé pour le widget Server Monitoring");
        
        // Mettre à jour l'interface avec les données initiales
        updateUI();
        
        // Mettre à jour régulièrement avec des données simulées
        updateTimer = setInterval(function() {
            simulateDataChanges();
            updateUI();
        }, config.updateInterval);
    }
    
    /**
     * Simule des changements de données pour le mode de démonstration
     */
    function simulateDataChanges() {
        // Fonction utilitaire pour générer des variations aléatoires
        const randomVariation = (value, maxVariation, min, max) => {
            const variation = (Math.random() - 0.5) * 2 * maxVariation;
            return Math.min(Math.max(value + variation, min), max);
        };
        
        // CPU
        currentData.cpu.core1 = Math.round(randomVariation(currentData.cpu.core1, 5, 10, 95));
        currentData.cpu.core2 = Math.round(randomVariation(currentData.cpu.core2, 5, 10, 95));
        currentData.cpu.core3 = Math.round(randomVariation(currentData.cpu.core3, 5, 10, 95));
        currentData.cpu.core4 = Math.round(randomVariation(currentData.cpu.core4, 5, 10, 95));
        
        // Température
        currentData.temperature.cpu = Math.round(randomVariation(currentData.temperature.cpu, 1, 45, 85));
        currentData.temperature.gpu = Math.round(randomVariation(currentData.temperature.gpu, 1, 40, 80));
        
        // Fréquence
        currentData.frequency.cpu = parseFloat(randomVariation(currentData.frequency.cpu, 0.1, 1.2, 2.2).toFixed(1));
        currentData.frequency.gpu = Math.round(randomVariation(currentData.frequency.gpu, 10, 300, 650));
        
        // Mémoire
        currentData.memory.ram = Math.round(randomVariation(currentData.memory.ram, 2, 20, 95));
        currentData.memory.swap = Math.round(randomVariation(currentData.memory.swap, 1, 0, 50));
        currentData.memory.disk = Math.round(randomVariation(currentData.memory.disk, 0.5, 30, 90));
        
        // Simuler l'écoulement du temps pour l'uptime
        let matches = currentData.uptime.value.match(/(\d+)d (\d+)h (\d+)m (\d+)s/);
        if (matches) {
            let [, days, hours, minutes, seconds] = matches.map(Number);
            seconds += 1;
            if (seconds >= 60) {
                minutes += Math.floor(seconds / 60);
                seconds %= 60;
            }
            if (minutes >= 60) {
                hours += Math.floor(minutes / 60);
                minutes %= 60;
            }
            if (hours >= 24) {
                days += Math.floor(hours / 24);
                hours %= 24;
            }
            currentData.uptime.value = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
        }
    }
    
    /**
     * Met à jour l'interface utilisateur avec les données actuelles
     */
    function updateUI() {
        // Parcourir toutes les métriques
        Object.keys(config.metrics).forEach(metricId => {
            const metricConfig = config.metrics[metricId];
            const element = widgetElement.querySelector(`[data-metric="${metricId}"]`);
            
            if (element) {
                // Récupérer la valeur depuis les données
                let value = getNestedValue(currentData, metricConfig.path);
                
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
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    }
    
    /**
     * Mises à jour de configuration
     * @param {Object} newConfig - Nouvelles configurations
     */
    function setConfig(newConfig) {
        // Fusion récursive pour les sous-objets
        if (newConfig.mqtt) {
            Object.assign(config.mqtt, newConfig.mqtt);
            delete newConfig.mqtt;
        }
        
        // Fusion du reste
        Object.assign(config, newConfig);
        
        // Si l'intervalle a changé, redémarrer la simulation
        if (newConfig.updateInterval && updateTimer) {
            clearInterval(updateTimer);
            updateTimer = setInterval(function() {
                simulateDataChanges();
                updateUI();
            }, config.updateInterval);
        }
    }
    
    /**
     * Fonction pour activer le mode MQTT (préparé pour l'utilisation future)
     * @param {Object} mqttConfig - Configuration MQTT (optionnelle)
     */
    function enableMQTT(mqttConfig = {}) {
        // Cette fonction sera implémentée plus tard lorsque vous aurez accès au Raspberry Pi
        console.log("Mode MQTT préparé pour une implémentation future");
        
        // Mettre à jour la configuration MQTT si fournie
        if (mqttConfig) {
            Object.assign(config.mqtt, mqttConfig);
        }
        
        // Marquer MQTT comme activé
        config.mqtt.enabled = true;
    }
    
    // API publique du widget
    return {
        init,
        destroy,
        setConfig,
        enableMQTT,
        onResize: function() {} // Fonction vide pour compatibilité avec l'API de widget
    };
})();