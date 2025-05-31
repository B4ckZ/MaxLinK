/**
 * Widget MQTT Stats pour MaxLink
 * Version utilisant les vraies statistiques du broker MQTT
 */
window.mqttstats = (function() {
    // Variables privées
    let widgetElement;
    let mqttTopicsContainer;
    let messagesReceivedElement;
    let messagesSentElement;
    let uptimeElement;
    let latencyElement;
    let statusIndicatorElement;
    let mqttClient = null;
    let isConnected = false;
    
    // Configuration MQTT
    const MQTT_CONFIG = {
        host: window.location.hostname,
        port: 9001,
        clientId: 'maxlink-mqttstats-' + Math.random().toString(16).substr(2, 8),
        username: 'mosquitto',
        password: 'mqtt'
    };
    
    // Données MQTT actuelles
    const mqttData = {
        received: 0,
        sent: 0,
        uptime: { days: 0, hours: 0, minutes: 0, seconds: 0 },
        latency: 0,
        status: 'error',
        topics: [],
        lastUpdate: 0,
        connected: false
    };
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        
        // Récupérer les références aux éléments DOM
        mqttTopicsContainer = widgetElement.querySelector('#mqtt-topics-container');
        messagesReceivedElement = widgetElement.querySelector('#messages-received');
        messagesSentElement = widgetElement.querySelector('#messages-sent');
        uptimeElement = widgetElement.querySelector('#mqtt-uptime');
        latencyElement = widgetElement.querySelector('#mqtt-latency');
        statusIndicatorElement = widgetElement.querySelector('#mqtt-status-indicator');
        
        console.log('Widget MQTT Stats initialisé');
        
        // Appliquer les classes pour stabiliser l'affichage
        applyStabilizationClasses();
        
        // Afficher l'état initial
        updateUI();
        
        // Connexion MQTT
        connectMQTT();
        
        // Ajuster la hauteur du conteneur
        adjustTopicsContainerHeight();
    }
    
    /**
     * Applique les classes de stabilisation aux éléments numériques
     */
    function applyStabilizationClasses() {
        const elements = [
            { el: messagesReceivedElement, cls: 'mqtt-stats-value-stable' },
            { el: messagesSentElement, cls: 'mqtt-stats-value-stable' },
            { el: uptimeElement, cls: 'mqtt-info-value-stable' },
            { el: latencyElement, cls: 'mqtt-info-value-stable' }
        ];
        
        elements.forEach(item => {
            if (item.el) item.el.classList.add(item.cls);
        });
    }
    
    /**
     * Connexion au broker MQTT
     */
    function connectMQTT() {
        try {
            if (typeof Paho === 'undefined' || !Paho.MQTT) {
                console.error('Bibliothèque Paho MQTT non disponible');
                setTimeout(connectMQTT, 5000);
                return;
            }
            
            mqttClient = new Paho.MQTT.Client(
                MQTT_CONFIG.host,
                MQTT_CONFIG.port,
                MQTT_CONFIG.clientId
            );
            
            mqttClient.onConnectionLost = onConnectionLost;
            mqttClient.onMessageArrived = onMessageArrived;
            
            const connectOptions = {
                onSuccess: onConnect,
                onFailure: onConnectFailure,
                userName: MQTT_CONFIG.username,
                password: MQTT_CONFIG.password,
                keepAliveInterval: 30,
                cleanSession: true
            };
            
            console.log('Tentative de connexion MQTT à', MQTT_CONFIG.host + ':' + MQTT_CONFIG.port);
            mqttClient.connect(connectOptions);
            
        } catch (error) {
            console.error('Erreur création client MQTT:', error);
            setTimeout(connectMQTT, 5000);
        }
    }
    
    /**
     * Callback de connexion réussie
     */
    function onConnect() {
        console.log('Connecté au broker MQTT');
        isConnected = true;
        mqttData.connected = true;
        mqttData.status = 'ok';
        
        // S'abonner aux topics de statistiques
        mqttClient.subscribe('rpi/network/mqtt/stats');
        mqttClient.subscribe('rpi/network/mqtt/topics');
        console.log('Abonné aux topics de statistiques MQTT');
        
        updateStatus();
    }
    
    /**
     * Callback d'échec de connexion
     */
    function onConnectFailure(error) {
        console.error('Échec connexion MQTT:', error.errorMessage);
        isConnected = false;
        mqttData.connected = false;
        mqttData.status = 'error';
        updateStatus();
        setTimeout(connectMQTT, 5000);
    }
    
    /**
     * Callback de perte de connexion
     */
    function onConnectionLost(responseObject) {
        console.warn('Connexion MQTT perdue:', responseObject.errorMessage);
        isConnected = false;
        mqttData.connected = false;
        mqttData.status = 'error';
        updateStatus();
        
        if (responseObject.errorCode !== 0) {
            setTimeout(connectMQTT, 5000);
        }
    }
    
    /**
     * Callback de réception de message
     */
    function onMessageArrived(message) {
        try {
            const topic = message.destinationName;
            const payload = JSON.parse(message.payloadString);
            
            mqttData.lastUpdate = Date.now();
            
            if (topic === 'rpi/network/mqtt/stats') {
                // Mettre à jour les statistiques
                mqttData.received = payload.messages_received || 0;
                mqttData.sent = payload.messages_sent || 0;
                mqttData.uptime = payload.uptime || { days: 0, hours: 0, minutes: 0, seconds: 0 };
                mqttData.latency = payload.latency_ms || 0;
                
                // Mettre à jour l'UI
                updateCounters();
                updateUptime();
                updateLatency();
                
            } else if (topic === 'rpi/network/mqtt/topics') {
                // Mettre à jour la liste des topics
                mqttData.topics = payload.topics || [];
                updateTopics();
            }
            
            // Toujours mettre à jour le statut après réception
            mqttData.status = 'ok';
            updateStatus();
            
        } catch (error) {
            console.error('Erreur traitement message:', error);
        }
    }
    
    /**
     * Met à jour l'interface utilisateur complète
     */
    function updateUI() {
        updateCounters();
        updateUptime();
        updateLatency();
        updateStatus();
        updateTopics();
    }
    
    /**
     * Met à jour les compteurs de messages
     */
    function updateCounters() {
        if (messagesReceivedElement) {
            messagesReceivedElement.textContent = mqttData.received.toLocaleString();
        }
        
        if (messagesSentElement) {
            messagesSentElement.textContent = mqttData.sent.toLocaleString();
        }
    }
    
    /**
     * Met à jour l'affichage de l'uptime
     */
    function updateUptime() {
        if (uptimeElement) {
            uptimeElement.textContent = formatUptime(mqttData.uptime);
        }
    }
    
    /**
     * Formate l'uptime pour l'affichage
     * @param {Object} uptime - Objet contenant les composants d'uptime
     * @returns {string} - Uptime formaté
     */
    function formatUptime(uptime) {
        const { days, hours, minutes, seconds } = uptime;
        return `${String(days).padStart(2, '0')}j ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    
    /**
     * Met à jour l'affichage de la latence
     */
    function updateLatency() {
        if (latencyElement) {
            latencyElement.textContent = `${mqttData.latency}ms`;
        }
    }
    
    /**
     * Met à jour l'indicateur de statut
     */
    function updateStatus() {
        if (statusIndicatorElement) {
            // Vérifier si on a reçu des données récemment (moins de 30 secondes)
            const isRecent = (Date.now() - mqttData.lastUpdate) < 30000;
            const status = isConnected && isRecent ? 'ok' : 'error';
            
            statusIndicatorElement.className = `status-indicator status-${status}`;
        }
    }
    
    /**
     * Met à jour la liste des topics
     */
    function updateTopics() {
        if (!mqttTopicsContainer) return;
        
        // Vider le conteneur
        mqttTopicsContainer.innerHTML = '';
        
        // Afficher un message si aucun topic
        if (mqttData.topics.length === 0) {
            const placeholderElement = document.createElement('div');
            placeholderElement.className = 'mqtt-topic-placeholder';
            placeholderElement.textContent = 'En attente des topics MQTT...';
            placeholderElement.style.textAlign = 'center';
            placeholderElement.style.color = 'var(--nord4)';
            placeholderElement.style.fontStyle = 'italic';
            placeholderElement.style.padding = '20px';
            mqttTopicsContainer.appendChild(placeholderElement);
            return;
        }
        
        // Créer et ajouter chaque topic
        mqttData.topics.forEach(topic => {
            const topicElement = document.createElement('div');
            topicElement.className = 'mqtt-topic';
            topicElement.textContent = topic;
            mqttTopicsContainer.appendChild(topicElement);
        });
    }
    
    /**
     * Ajuste la hauteur du conteneur des topics
     */
    function adjustTopicsContainerHeight() {
        if (!mqttTopicsContainer || !widgetElement) return;
        
        const titleHeight = widgetElement.querySelector('.widget-title')?.offsetHeight || 0;
        const statsHeight = widgetElement.querySelector('.mqtt-stats-grid')?.offsetHeight || 0;
        const infoHeight = widgetElement.querySelector('.mqtt-info-box')?.offsetHeight || 0;
        const containerHeight = widgetElement.offsetHeight;
        const padding = parseInt(getComputedStyle(widgetElement).paddingTop) * 2;
        const margins = 20; // Marge estimée entre les éléments
        
        const availableHeight = containerHeight - titleHeight - statsHeight - infoHeight - padding - margins;
        
        mqttTopicsContainer.style.maxHeight = `${Math.max(0, availableHeight)}px`;
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        adjustTopicsContainerHeight();
    }
    
    /**
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        if (mqttClient && isConnected) {
            try {
                mqttClient.disconnect();
            } catch (error) {
                console.error('Erreur déconnexion:', error);
            }
        }
    }
    
    // API publique du widget
    return {
        init,
        onResize,
        destroy
    };
})();