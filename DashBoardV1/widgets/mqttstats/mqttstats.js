window.mqttstats = (function() {
    // Variables privées du widget
    let widgetElement;
    let mqttTopicsContainer;
    let messagesReceivedElement;
    let messagesSentElement;
    let uptimeElement;
    let latencyElement;
    let statusIndicatorElement;
    
    // Configuration du widget
    let config = {
        updateInterval: 1000,           // Intervalle de mise à jour UI en millisecondes
        connectionTimeout: 5000,        // Délai avant de considérer le serveur comme inactif (5 sec)
        simulationMode: true,           // Mode simulation (à désactiver quand le MQTT sera prêt)
        mqttConfig: {
            // Configuration pour la connexion MQTT
            host: "mqtt://localhost",
            port: 1883,
            username: "",
            password: "",
            clientId: "dashboard-mqttstats"
        }
    };
    
    // Structure de données MQTT
    let mqttData = {
        received: 0,                        // Nombre de messages reçus
        sent: 0,                            // Nombre de messages envoyés
        uptime: {                           // Uptime du serveur MQTT
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0                      // Ajout des secondes
        },
        latency: 0,                         // Latence en ms
        status: 'ok',                       // Statut ('ok' ou 'error')
        topics: [],                         // Liste des topics MQTT
        lastActivityTimestamp: Date.now(),  // Timestamp de dernière activité
        connected: false                    // État de connexion
    };
    
    // Variables pour les timers et le suivi du temps
    let activityCheckTimer;
    let simulationTimer;
    let uiUpdateTimer;
    let lastUptimeUpdate;
    let mqttClient = null;  // Pour stocker la référence au client MQTT
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        widgetElement = element;
        
        // Récupérer les éléments DOM nécessaires
        mqttTopicsContainer = widgetElement.querySelector('#mqtt-topics-container');
        messagesReceivedElement = widgetElement.querySelector('#messages-received');
        messagesSentElement = widgetElement.querySelector('#messages-sent');
        uptimeElement = widgetElement.querySelector('#mqtt-uptime');
        latencyElement = widgetElement.querySelector('#mqtt-latency');
        statusIndicatorElement = widgetElement.querySelector('#mqtt-status-indicator');
        
        // Fusionner la configuration personnalisée avec les valeurs par défaut
        config = {...config, ...customConfig};
        
        console.log('Widget MQTT Stats initialisé');
        console.log(config.simulationMode ? 'Mode simulation activé' : 'Mode réel activé');
        
        // Ajouter la police Roboto Mono pour la stabilité des chiffres
        addMonospaceFont();
        
        // Ajouter les classes pour la stabilisation des valeurs numériques
        applyStabilizationClasses();
        
        // Initialiser la connexion MQTT (réelle ou simulée)
        initMQTTConnection();
        
        // Démarrer les vérifications périodiques d'activité
        startActivityCheck();
        
        // Si en mode simulation, démarrer la simulation
        if (config.simulationMode) {
            startSimulation();
        }
        
        // Démarrer les mises à jour de l'UI
        startUIUpdates();
        
        // Ajuster la hauteur du conteneur de topics
        adjustTopicsContainerHeight();
    }
    
    /**
     * Ajoute dynamiquement la police Roboto Mono depuis Google Fonts
     * Cette police monospace assure que tous les chiffres ont la même largeur
     */
    function addMonospaceFont() {
        if (!document.getElementById('roboto-mono-font')) {
            // Préconnexion pour accélérer le chargement
            const preconnectGoogle = document.createElement('link');
            preconnectGoogle.rel = 'preconnect';
            preconnectGoogle.href = 'https://fonts.googleapis.com';
            document.head.appendChild(preconnectGoogle);
            
            const preconnectGstatic = document.createElement('link');
            preconnectGstatic.rel = 'preconnect';
            preconnectGstatic.href = 'https://fonts.gstatic.com';
            preconnectGstatic.crossOrigin = 'anonymous';
            document.head.appendChild(preconnectGstatic);
            
            // Chargement de la police
            const fontLink = document.createElement('link');
            fontLink.id = 'roboto-mono-font';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap';
            document.head.appendChild(fontLink);
        }
    }
    
    /**
     * Applique les classes CSS pour stabiliser les valeurs numériques
     */
    function applyStabilizationClasses() {
        // Appliquer aux compteurs de messages
        if (messagesReceivedElement) {
            messagesReceivedElement.classList.add('mqtt-stats-value-stable');
        }
        
        if (messagesSentElement) {
            messagesSentElement.classList.add('mqtt-stats-value-stable');
        }
        
        // Appliquer aux valeurs d'uptime et latence
        if (uptimeElement) {
            uptimeElement.classList.add('mqtt-info-value-stable');
        }
        
        if (latencyElement) {
            latencyElement.classList.add('mqtt-info-value-stable');
        }
    }
    
    /**
     * Initialise la connexion MQTT (réelle ou simulée)
     */
    function initMQTTConnection() {
        if (config.simulationMode) {
            console.log("Mode simulation actif, pas de connexion MQTT réelle");
            // Initialiser des données de simulation
            initSimulationData();
            return;
        }
        
        // Code pour établir la connexion MQTT avec la bibliothèque de votre choix
        // Ce code est commenté car il nécessite une bibliothèque MQTT
        // À décommenter et compléter quand le serveur MQTT sera disponible
        
        /*
        // Exemple avec MQTT.js (à adapter selon votre bibliothèque)
        const client = mqtt.connect(config.mqttConfig.host, {
            port: config.mqttConfig.port,
            username: config.mqttConfig.username,
            password: config.mqttConfig.password,
            clientId: config.mqttConfig.clientId
        });
        
        client.on('connect', () => {
            console.log('Connecté au serveur MQTT');
            mqttData.connected = true;
            mqttData.lastActivityTimestamp = Date.now();
            // S'abonner aux topics
            client.subscribe('#');  // S'abonner à tous les topics (à affiner)
        });
        
        client.on('message', (topic, message) => {
            // Incrémenter le compteur de messages reçus
            mqttData.received++;
            // Mettre à jour le timestamp d'activité
            mqttData.lastActivityTimestamp = Date.now();
            // Ajouter le topic à la liste s'il n'y est pas déjà
            if (!mqttData.topics.includes(topic)) {
                mqttData.topics.push(topic);
                // Limiter le nombre de topics affichés
                if (mqttData.topics.length > 20) {
                    mqttData.topics.shift(); // Enlever le plus ancien
                }
            }
        });
        
        client.on('error', (error) => {
            mqttData.status = 'error';
            console.error("Erreur MQTT:", error);
        });
        
        // Stocker la référence client pour un usage ultérieur
        mqttClient = client;
        */
    }
    
    /**
     * Initialise les données de simulation
     */
    function initSimulationData() {
        // Initialiser avec des valeurs de départ réalistes
        mqttData.received = 15234;
        mqttData.sent = 8712;
        mqttData.uptime = {
            days: 5,
            hours: 2,
            minutes: 32,
            seconds: 15
        };
        mqttData.latency = 23;
        mqttData.status = 'ok';
        mqttData.topics = [
            'weri/device/+/temp',
            'weri/device/+/humidity',
            'weri/device/+/status',
            'weri/system/stats',
            'weri/system/updates',
            'weri/device/+/battery',
            'weri/device/+/connection',
            'weri/network/pid/reload'
        ];
        mqttData.lastActivityTimestamp = Date.now();
        mqttData.connected = true;
        
        // Initialiser le timestamp de référence pour l'uptime
        lastUptimeUpdate = Date.now();
    }
    
    /**
     * Démarre les vérifications périodiques d'activité
     */
    function startActivityCheck() {
        // Arrêter l'ancien timer s'il existe
        if (activityCheckTimer) {
            clearInterval(activityCheckTimer);
        }
        
        // Démarrer un nouveau timer
        activityCheckTimer = setInterval(() => {
            checkMQTTActivity();
        }, 1000); // Vérifier toutes les secondes
    }
    
    /**
     * Vérifie l'activité MQTT et met à jour le statut
     */
    function checkMQTTActivity() {
        const now = Date.now();
        const timeSinceLastActivity = now - mqttData.lastActivityTimestamp;
        
        // Si aucune activité depuis plus longtemps que le délai configuré
        if (timeSinceLastActivity > config.connectionTimeout) {
            mqttData.status = 'error';
            mqttData.connected = false;
        } else {
            mqttData.status = 'ok';
            mqttData.connected = true;
        }
    }
    
    /**
     * Démarre la simulation des données MQTT
     */
    function startSimulation() {
        // Arrêter l'ancien timer s'il existe
        if (simulationTimer) {
            clearInterval(simulationTimer);
        }
        
        // Démarrer un nouveau timer
        simulationTimer = setInterval(() => {
            runSimulation();
        }, 1000); // Simuler toutes les secondes
    }
    
    /**
     * Exécute une itération de la simulation
     */
    function runSimulation() {
        if (!config.simulationMode) return;
        
        // Simuler des messages reçus/envoyés de façon réaliste
        mqttData.received += Math.floor(Math.random() * 3);  // 0-2 messages par seconde
        mqttData.sent += Math.floor(Math.random() * 2);      // 0-1 messages par seconde
        
        // Gestion correcte de l'uptime - incrémenter en secondes
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastUptimeUpdate) / 1000);
        
        if (elapsedSeconds > 0) {
            // Calculer les nouvelles valeurs d'uptime
            let totalSeconds = 
                mqttData.uptime.days * 86400 + 
                mqttData.uptime.hours * 3600 + 
                mqttData.uptime.minutes * 60 + 
                mqttData.uptime.seconds + 
                elapsedSeconds;
            
            // Recalculer les jours, heures, minutes, secondes
            mqttData.uptime.days = Math.floor(totalSeconds / 86400);
            totalSeconds %= 86400;
            
            mqttData.uptime.hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            
            mqttData.uptime.minutes = Math.floor(totalSeconds / 60);
            totalSeconds %= 60;
            
            mqttData.uptime.seconds = totalSeconds;
            
            // Mettre à jour le timestamp
            lastUptimeUpdate = now;
        }
        
        // Simuler des variations de latence
        mqttData.latency = Math.floor(15 + Math.random() * 20); // 15-35ms
        
        // Mettre à jour le timestamp d'activité (sauf si on veut simuler une panne)
        if (Math.random() > 0.005) {  // 0.5% de chance de simuler une panne
            mqttData.lastActivityTimestamp = Date.now();
        }
        
        // Occasionnellement ajouter ou supprimer un topic
        if (Math.random() < 0.05) { // 5% de chance
            const deviceTypes = ['temp', 'humidity', 'status', 'battery', 'connection', 'signal', 'power'];
            const topicPrefix = Math.random() < 0.5 ? 'weri/device/+/' : 'weri/system/';
            const topicSuffix = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
            
            // Ajouter le topic s'il n'existe pas déjà
            const newTopic = topicPrefix + topicSuffix;
            if (!mqttData.topics.includes(newTopic)) {
                mqttData.topics.push(newTopic);
                // Limiter le nombre de topics
                if (mqttData.topics.length > 15) {
                    mqttData.topics.shift(); // Enlever le plus ancien
                }
            }
        }
    }
    
    /**
     * Démarre les mises à jour périodiques de l'interface utilisateur
     */
    function startUIUpdates() {
        // Arrêter l'ancien timer s'il existe
        if (uiUpdateTimer) {
            clearInterval(uiUpdateTimer);
        }
        
        // Mettre à jour l'UI immédiatement
        updateUI();
        
        // Démarrer un nouveau timer
        uiUpdateTimer = setInterval(() => {
            updateUI();
        }, config.updateInterval);
    }
    
    /**
     * Met à jour l'interface utilisateur avec les données actuelles
     */
    function updateUI() {
        // Mettre à jour les compteurs de messages
        if (messagesReceivedElement) {
            messagesReceivedElement.textContent = mqttData.received.toLocaleString();
        }
        
        if (messagesSentElement) {
            messagesSentElement.textContent = mqttData.sent.toLocaleString();
        }
        
        // Mettre à jour l'uptime avec le format "00j 00h 00s"
        if (uptimeElement) {
            const days = String(mqttData.uptime.days).padStart(2, '0');
            const hours = String(mqttData.uptime.hours).padStart(2, '0');
			const minutes = String(mqttData.uptime.minutes).padStart(2, '0');
            const seconds = String(mqttData.uptime.seconds).padStart(2, '0');
            uptimeElement.textContent = `${days}j ${hours}h ${minutes}m ${seconds}s`;
        }
        
        // Mettre à jour la latence
        if (latencyElement) {
            latencyElement.textContent = `${mqttData.latency}ms`;
        }
        
        // Mettre à jour l'indicateur de statut
        if (statusIndicatorElement) {
            statusIndicatorElement.className = `status-indicator status-${mqttData.status}`;
        }
        
        // Mettre à jour la liste des topics
        if (mqttTopicsContainer) {
            mqttTopicsContainer.innerHTML = '';
            
            mqttData.topics.forEach(topic => {
                const topicElement = document.createElement('div');
                topicElement.className = 'mqtt-topic';
                topicElement.textContent = topic;
                
                mqttTopicsContainer.appendChild(topicElement);
            });
        }
    }
    
    /**
     * Ajuste la hauteur du conteneur des topics MQTT
     */
    function adjustTopicsContainerHeight() {
        if (mqttTopicsContainer) {
            const titleHeight = widgetElement.querySelector('.widget-title').offsetHeight;
            const statsHeight = widgetElement.querySelector('.mqtt-stats-grid').offsetHeight;
            const infoHeight = widgetElement.querySelector('.mqtt-info-box').offsetHeight;
            const containerHeight = widgetElement.offsetHeight;
            const padding = parseInt(getComputedStyle(widgetElement).paddingTop) * 2;
            const margins = 20; // Marge estimée entre les éléments
            
            const availableHeight = containerHeight - titleHeight - statsHeight - infoHeight - padding - margins;
            
            mqttTopicsContainer.style.maxHeight = `${availableHeight}px`;
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        adjustTopicsContainerHeight();
    }
    
    /**
     * Définit une nouvelle configuration
     * @param {Object} newConfig - Nouvelle configuration
     */
    function setConfig(newConfig) {
        const oldConfig = {...config};
        config = {...config, ...newConfig};
        
        // Si le mode simulation a changé
        if (oldConfig.simulationMode !== config.simulationMode) {
            // Arrêter les timers existants
            if (simulationTimer) {
                clearInterval(simulationTimer);
                simulationTimer = null;
            }
            
            // Réinitialiser la connexion MQTT
            initMQTTConnection();
            
            // Si on passe en mode simulation, démarrer la simulation
            if (config.simulationMode) {
                startSimulation();
            }
        }
        
        // Si l'intervalle de mise à jour a changé, redémarrer les timers
        if (oldConfig.updateInterval !== config.updateInterval) {
            startUIUpdates();
        }
    }
    
    /**
     * Simule la réception d'un message (utile pour tester)
     */
    function simulateMessageReceived() {
        mqttData.received++;
        mqttData.lastActivityTimestamp = Date.now();
    }
    
    /**
     * Simule l'envoi d'un message (utile pour tester)
     */
    function simulateMessageSent() {
        mqttData.sent++;
        mqttData.lastActivityTimestamp = Date.now();
    }
    
    /**
     * Simule une panne du serveur MQTT (utile pour tester)
     */
    function simulateServerDown() {
        // Reculer le timestamp d'activité pour simuler une absence d'activité
        mqttData.lastActivityTimestamp = Date.now() - (config.connectionTimeout + 1000);
    }
    
    /**
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        // Arrêter tous les timers
        if (activityCheckTimer) {
            clearInterval(activityCheckTimer);
            activityCheckTimer = null;
        }
        
        if (simulationTimer) {
            clearInterval(simulationTimer);
            simulationTimer = null;
        }
        
        if (uiUpdateTimer) {
            clearInterval(uiUpdateTimer);
            uiUpdateTimer = null;
        }
        
        // Fermer la connexion MQTT si elle existe
        if (mqttClient) {
            mqttClient.end();
            mqttClient = null;
        }
    }
    
    // API publique du widget
    return {
        init,
        setConfig,
        onResize,
        destroy,
        // Fonctions utiles pour les tests
        simulateMessageReceived,
        simulateMessageSent,
        simulateServerDown
    };
})();