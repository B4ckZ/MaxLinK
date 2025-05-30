/**
 * Widget Server Monitoring pour MaxLink
 * Version MQTT avec connexion WebSocket en temps réel
 */
window.servermonitoring = (function() {
    // Variables privées
    let widgetElement;
    let mqttClient = null;
    let isConnected = false;
    let reconnectTimer = null;
    let isInitialized = false; // Empêcher les initialisations multiples
    
    // Configuration MQTT
    const MQTT_CONFIG = {
        host: window.location.hostname, // Utilise l'IP/hostname actuel
        port: 9001, // Port WebSocket
        clientId: 'maxlink-dashboard-' + Math.random().toString(16).substr(2, 8),
        username: 'mosquitto',
        password: 'mqtt',
        reconnectPeriod: 5000,
        keepalive: 30
    };
    
    // Configuration des métriques (inchangée)
    const config = {
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
    
    // Mapping des topics MQTT vers les métriques
    const TOPIC_MAPPING = {
        'rpi/system/cpu/core1': 'cpu-core1',
        'rpi/system/cpu/core2': 'cpu-core2',
        'rpi/system/cpu/core3': 'cpu-core3',
        'rpi/system/cpu/core4': 'cpu-core4',
        'rpi/system/temperature/cpu': 'temp-cpu',
        'rpi/system/temperature/gpu': 'temp-gpu',
        'rpi/system/frequency/cpu': 'freq-cpu',
        'rpi/system/frequency/gpu': 'freq-gpu',
        'rpi/system/memory/ram': 'memory-ram',
        'rpi/system/memory/swap': 'memory-swap',
        'rpi/system/memory/disk': 'memory-disk'
    };
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        // Éviter les initialisations multiples
        if (isInitialized) {
            console.warn('Widget Server Monitoring déjà initialisé');
            return;
        }
        
        widgetElement = element;
        isInitialized = true;
        
        console.log('Widget Server Monitoring avec MQTT initialisé');
        
        // Afficher des valeurs initiales à 0
        updateAllMetrics(0);
        
        // Charger MQTT de manière sécurisée
        loadMQTTSafely();
    }
    
    /**
     * Charge MQTT de manière sécurisée
     */
    function loadMQTTSafely() {
        // Attendre un peu pour s'assurer que tout est chargé
        setTimeout(() => {
            if (typeof Paho !== 'undefined' && Paho.MQTT && Paho.MQTT.Client) {
                connectMQTT();
            } else {
                console.error('Bibliothèque Paho MQTT non disponible');
                // Réessayer une fois après un délai
                setTimeout(() => {
                    if (typeof Paho !== 'undefined' && Paho.MQTT && Paho.MQTT.Client) {
                        connectMQTT();
                    } else {
                        console.error('Impossible de charger MQTT après plusieurs tentatives');
                    }
                }, 2000);
            }
        }, 1000);
    }
    

    
    /**
     * Connexion au broker MQTT
     */
    function connectMQTT() {
        // Éviter les connexions multiples
        if (mqttClient && isConnected) {
            console.log('Déjà connecté à MQTT');
            return;
        }
        
        try {
            // Nettoyer l'ancienne connexion si elle existe
            if (mqttClient) {
                try {
                    mqttClient.disconnect();
                } catch (e) {
                    // Ignorer les erreurs de déconnexion
                }
                mqttClient = null;
            }
            
            // Créer le client MQTT
            mqttClient = new Paho.MQTT.Client(
                MQTT_CONFIG.host,
                MQTT_CONFIG.port,
                MQTT_CONFIG.clientId
            );
            
            // Configurer les callbacks
            mqttClient.onConnectionLost = onConnectionLost;
            mqttClient.onMessageArrived = onMessageArrived;
            
            // Options de connexion
            const connectOptions = {
                onSuccess: onConnect,
                onFailure: onConnectFailure,
                userName: MQTT_CONFIG.username,
                password: MQTT_CONFIG.password,
                keepAliveInterval: MQTT_CONFIG.keepalive,
                cleanSession: true,
                useSSL: false
            };
            
            console.log('Tentative de connexion MQTT à', MQTT_CONFIG.host + ':' + MQTT_CONFIG.port);
            mqttClient.connect(connectOptions);
            
        } catch (error) {
            console.error('Erreur lors de la création du client MQTT:', error);
            scheduleReconnect();
        }
    }
    
    /**
     * Callback de connexion réussie
     */
    function onConnect() {
        console.log('Connecté au broker MQTT');
        isConnected = true;
        
        // S'abonner à tous les topics système
        Object.keys(TOPIC_MAPPING).forEach(topic => {
            mqttClient.subscribe(topic);
            console.log('Abonné au topic:', topic);
        });
        
        // Afficher un indicateur de connexion (optionnel)
        updateConnectionStatus(true);
    }
    
    /**
     * Callback d'échec de connexion
     */
    function onConnectFailure(error) {
        console.error('Échec de connexion MQTT:', error.errorMessage);
        isConnected = false;
        updateConnectionStatus(false);
        scheduleReconnect();
    }
    
    /**
     * Callback de perte de connexion
     */
    function onConnectionLost(responseObject) {
        console.warn('Connexion MQTT perdue:', responseObject.errorMessage);
        isConnected = false;
        updateConnectionStatus(false);
        
        if (responseObject.errorCode !== 0) {
            scheduleReconnect();
        }
    }
    
    /**
     * Callback de réception de message
     */
    function onMessageArrived(message) {
        try {
            const topic = message.destinationName;
            const payload = JSON.parse(message.payloadString);
            
            // Trouver la métrique correspondante
            const metricId = TOPIC_MAPPING[topic];
            if (metricId) {
                // Mettre à jour l'UI avec la valeur reçue
                updateMetric(metricId, payload.value);
            }
            
        } catch (error) {
            console.error('Erreur lors du traitement du message MQTT:', error);
        }
    }
    
    /**
     * Programme une reconnexion
     */
    function scheduleReconnect() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
        }
        
        reconnectTimer = setTimeout(() => {
            console.log('Tentative de reconnexion MQTT...');
            connectMQTT();
        }, MQTT_CONFIG.reconnectPeriod);
    }
    
    /**
     * Met à jour une métrique spécifique
     */
    function updateMetric(metricId, value) {
        const metricConfig = config.metrics[metricId];
        if (!metricConfig) return;
        
        const element = widgetElement.querySelector(`[data-metric="${metricId}"]`);
        if (!element) return;
        
        updateMetricUI(element, metricConfig, value);
    }
    
    /**
     * Met à jour l'élément UI d'une métrique
     */
    function updateMetricUI(element, metricConfig, value) {
        if (value === undefined || value === null) return;
        
        const progressBar = element.querySelector('.progress-bar');
        const progressValue = element.querySelector('.progress-value');
        
        // Arrondir la valeur selon le type
        let displayValue = value;
        if (metricConfig.suffix === "%") {
            displayValue = Math.round(value);
        } else if (metricConfig.suffix === " GHz" || metricConfig.suffix === "°C") {
            displayValue = value.toFixed(1);
        } else {
            displayValue = Math.round(value);
        }
        
        // Mettre à jour la barre de progression
        if (progressBar) {
            const percentage = (value / metricConfig.max) * 100;
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
            
            // Appliquer une classe en fonction du niveau
            progressBar.classList.remove('level-warning', 'level-critical');
            if (value >= metricConfig.critical) {
                progressBar.classList.add('level-critical');
            } else if (value >= metricConfig.warning) {
                progressBar.classList.add('level-warning');
            }
        }
        
        // Mettre à jour le texte de la valeur
        if (progressValue) {
            progressValue.textContent = `${displayValue}${metricConfig.suffix}`;
        }
    }
    
    /**
     * Met à jour toutes les métriques avec une valeur
     */
    function updateAllMetrics(value) {
        Object.keys(config.metrics).forEach(metricId => {
            updateMetric(metricId, value);
        });
    }
    
    /**
     * Met à jour l'indicateur de statut de connexion (optionnel)
     */
    function updateConnectionStatus(connected) {
        // Vous pouvez ajouter un indicateur visuel de connexion ici
        // Par exemple, changer la couleur du titre ou ajouter un point
        const titleElement = widgetElement.querySelector('.widget-title');
        if (titleElement) {
            if (connected) {
                titleElement.style.opacity = '1';
            } else {
                titleElement.style.opacity = '0.6';
            }
        }
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
        isInitialized = false;
        
        // Nettoyer les timers
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        
        // Déconnexion MQTT
        if (mqttClient) {
            try {
                if (isConnected) {
                    mqttClient.disconnect();
                }
            } catch (error) {
                console.error('Erreur lors de la déconnexion MQTT:', error);
            }
            mqttClient = null;
        }
        
        isConnected = false;
    }
    
    // API publique du widget
    return {
        init,
        onResize,
        destroy,
        // Exposer certaines méthodes pour le debug
        isConnected: () => isConnected,
        reconnect: () => connectMQTT()
    };
})();