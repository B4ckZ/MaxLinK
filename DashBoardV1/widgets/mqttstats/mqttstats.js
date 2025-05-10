/**
 * Widget MQTT Stats pour MaxLink
 * Version sans simulation - préparée pour MQTT réel uniquement
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
    
    // Timer unique pour les mises à jour UI
    let updateTimer = null;
    
    // Configuration du widget
    const config = {
        updateInterval: 1000,
        connectionTimeout: 5000,
        mqttConfig: {
            host: "mqtt://localhost",
            port: 1883,
            clientId: "dashboard-mqttstats"
        }
    };
    
    // Structure de données MQTT - état actuel
    const mqttData = {
        received: 0,
        sent: 0,
        uptime: { days: 0, hours: 0, minutes: 0, seconds: 0 },
        latency: 0,
        status: 'ok',
        topics: [],
        lastActivityTimestamp: Date.now(),
        connected: false
    };
    
    // Timestamp de référence pour l'uptime
    let lastUptimeUpdate = Date.now();
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        // Nettoyage préventif
        destroy();
        
        widgetElement = element;
        
        // Récupérer les références aux éléments DOM
        mqttTopicsContainer = widgetElement.querySelector('#mqtt-topics-container');
        messagesReceivedElement = widgetElement.querySelector('#messages-received');
        messagesSentElement = widgetElement.querySelector('#messages-sent');
        uptimeElement = widgetElement.querySelector('#mqtt-uptime');
        latencyElement = widgetElement.querySelector('#mqtt-latency');
        statusIndicatorElement = widgetElement.querySelector('#mqtt-status-indicator');
        
        // Fusionner la configuration
        Object.assign(config, customConfig);
        
        console.log('Widget MQTT Stats initialisé');
        
        // Appliquer les classes pour stabiliser l'affichage
        applyStabilizationClasses();
        
        // Afficher l'état initial - avec des valeurs initiales vides
        initializePlaceholderValues();
        
        // Préparer l'intégration MQTT (sera implémentée ultérieurement)
        initMQTTConnection();
        
        // Démarrer le timer pour vérifier l'état de la connexion MQTT seulement
        startConnectionCheck();
        
        // Ajuster la hauteur du conteneur
        adjustTopicsContainerHeight();
    }
    
    /**
     * Initialise des valeurs placeholder pour l'UI
     */
    function initializePlaceholderValues() {
        // Réinitialiser à zéro tous les compteurs
        mqttData.received = 0;
        mqttData.sent = 0;
        mqttData.uptime = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        mqttData.latency = 0;
        mqttData.status = 'error'; // Démarrer avec status erreur jusqu'à connexion
        mqttData.connected = false;
        mqttData.topics = []; // Liste vide au démarrage
        
        // Mettre à jour l'UI avec ces valeurs initiales
        updateUI();
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
     * Initialise la connexion MQTT
     */
    function initMQTTConnection() {
        // À implémenter quand MQTT sera disponible
        console.log('Connexion MQTT non implémentée');
        
        /* 
        // Exemple de code à implémenter plus tard:
        
        if (window.mqtt) {
            // Configurer la connexion
            const client = window.mqtt.connect(config.mqttConfig.host, {
                port: config.mqttConfig.port,
                clientId: config.mqttConfig.clientId
            });
            
            // Gérer les événements
            client.on('connect', onMQTTConnect);
            client.on('message', onMQTTMessage);
            client.on('error', onMQTTError);
            client.on('close', onMQTTClose);
            
            // S'abonner à tous les topics pertinents
            client.subscribe('#');
        }
        */
    }
    
    /**
     * Démarre la vérification périodique de la connexion
     */
    function startConnectionCheck() {
        // Arrêter l'ancien timer si existant
        stopConnectionCheck();
        
        // Créer un nouveau timer qui vérifie uniquement l'état de la connexion
        updateTimer = setInterval(() => {
            checkMQTTActivity();
            updateStatus(); // Mettre à jour uniquement l'indicateur de statut
        }, config.updateInterval);
    }
    
    /**
     * Arrête la vérification périodique
     */
    function stopConnectionCheck() {
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    }
    
    /**
     * Vérifie l'activité MQTT et met à jour le statut
     */
    function checkMQTTActivity() {
        const now = Date.now();
        const timeSinceLastActivity = now - mqttData.lastActivityTimestamp;
        
        mqttData.status = timeSinceLastActivity > config.connectionTimeout ? 'error' : 'ok';
        mqttData.connected = mqttData.status === 'ok';
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
            statusIndicatorElement.className = `status-indicator status-${mqttData.status}`;
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
            placeholderElement.textContent = 'Aucun topic MQTT actif';
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
     * Traite un message MQTT reçu
     * @param {string} topic - Topic du message
     * @param {string} message - Contenu du message
     */
    function handleMQTTMessage(topic, message) {
        // Incrémenter le compteur de messages
        mqttData.received++;
        
        // Mettre à jour le timestamp d'activité
        mqttData.lastActivityTimestamp = Date.now();
        
        // Ajouter le topic s'il n'existe pas déjà
        if (!mqttData.topics.includes(topic)) {
            mqttData.topics.push(topic);
            // Limiter le nombre de topics
            if (mqttData.topics.length > 15) {
                mqttData.topics.shift();
            }
            // Mettre à jour l'affichage des topics
            updateTopics();
        }
        
        // Mettre à jour le compteur
        updateCounters();
    }
    
    /**
     * Enregistre un message envoyé
     */
    function recordMessageSent() {
        mqttData.sent++;
        mqttData.lastActivityTimestamp = Date.now();
        updateCounters();
    }
    
    /**
     * Met à jour les informations d'uptime du broker MQTT
     * @param {Object} uptimeData - Données d'uptime du broker
     */
    function updateBrokerUptime(uptimeData) {
        if (uptimeData && typeof uptimeData === 'object') {
            mqttData.uptime = uptimeData;
            updateUptime();
        }
    }
    
    /**
     * Met à jour les informations de latence
     * @param {number} latency - Valeur de latence en ms
     */
    function updateBrokerLatency(latency) {
        if (typeof latency === 'number' && latency >= 0) {
            mqttData.latency = latency;
            updateLatency();
        }
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
        stopConnectionCheck();
        if (mqttTopicsContainer) {
            mqttTopicsContainer.innerHTML = '';
        }
    }
    
    // API publique du widget - adaptée pour MQTT réel
    return {
        init,
        handleMQTTMessage,
        recordMessageSent,
        updateBrokerUptime,
        updateBrokerLatency,
        onResize,
        destroy
    };
})();