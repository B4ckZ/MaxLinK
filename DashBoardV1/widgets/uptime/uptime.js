/**
 * Widget Uptime pour MaxLink
 * Version avec abonnement MQTT au topic rpi/system/uptime
 */
window.uptime = (function() {
    // Variables privées
    let widgetElement;
    let uptimeElement;
    let mqttClient = null;
    let isConnected = false;
    
    // Configuration MQTT (réutilise la même config)
    const MQTT_CONFIG = {
        host: window.location.hostname,
        port: 9001,
        clientId: 'maxlink-uptime-' + Math.random().toString(16).substr(2, 8),
        username: 'mosquitto',
        password: 'mqtt'
    };
    
    // Valeur actuelle de l'uptime en secondes
    let currentUptime = 0;
    let lastUpdate = 0;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        uptimeElement = widgetElement.querySelector('[data-metric="uptime"]');
        
        console.log('Widget Uptime avec MQTT initialisé');
        
        // Ajouter la classe pour la stabilité numérique
        if (uptimeElement) {
            uptimeElement.classList.add('uptime-value-stable');
        }
        
        // Afficher une valeur initiale
        updateUptimeDisplay();
        
        // Connexion MQTT
        connectMQTT();
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
        console.log('Widget Uptime connecté au broker MQTT');
        isConnected = true;
        
        // S'abonner au topic uptime
        mqttClient.subscribe('rpi/system/uptime');
        console.log('Abonné au topic: rpi/system/uptime');
    }
    
    /**
     * Callback d'échec de connexion
     */
    function onConnectFailure(error) {
        console.error('Échec connexion MQTT:', error.errorMessage);
        isConnected = false;
        setTimeout(connectMQTT, 5000);
    }
    
    /**
     * Callback de perte de connexion
     */
    function onConnectionLost(responseObject) {
        console.warn('Connexion MQTT perdue:', responseObject.errorMessage);
        isConnected = false;
        
        if (responseObject.errorCode !== 0) {
            setTimeout(connectMQTT, 5000);
        }
    }
    
    /**
     * Callback de réception de message
     */
    function onMessageArrived(message) {
        try {
            const payload = JSON.parse(message.payloadString);
            
            if (message.destinationName === 'rpi/system/uptime' && payload.value) {
                currentUptime = payload.value;
                lastUpdate = Date.now();
                updateUptimeDisplay();
            }
            
        } catch (error) {
            console.error('Erreur traitement message:', error);
        }
    }
    
    /**
     * Formate l'uptime pour l'affichage
     */
    function formatUptime() {
        const days = Math.floor(currentUptime / 86400);
        const hours = Math.floor((currentUptime % 86400) / 3600);
        const minutes = Math.floor((currentUptime % 3600) / 60);
        const seconds = currentUptime % 60;
        
        return `${String(days).padStart(2, '0')}j ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    
    /**
     * Met à jour l'affichage de l'uptime
     */
    function updateUptimeDisplay() {
        if (uptimeElement) {
            uptimeElement.textContent = formatUptime();
        }
    }
    
    /**
     * Appelé lors du redimensionnement
     */
    function onResize() {
        // Pas d'ajustement nécessaire
    }
    
    /**
     * Nettoyage
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
    
    // API publique
    return {
        init,
        onResize,
        destroy
    };
})();