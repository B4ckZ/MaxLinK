/**
 * Widget WiFi Stats pour MaxLink
 * Version avec connexion MQTT pour recevoir les données des clients WiFi
 */
window.wifistats = (function() {
    // Variables privées
    let widgetElement;
    let clientsContainer;
    let statusIndicator;
    let mqttClient = null;
    let isConnected = false;
    let lastUpdate = Date.now();
    
    // Configuration MQTT
    const MQTT_CONFIG = {
        host: window.location.hostname,
        port: 9001,
        clientId: 'maxlink-wifistats-' + Math.random().toString(16).substr(2, 8),
        username: 'mosquitto',
        password: 'mqtt'
    };
    
    // Stockage des clients WiFi
    const clients = new Map();
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        
        // Récupérer les références aux éléments DOM
        clientsContainer = widgetElement.querySelector('.clients-container');
        statusIndicator = widgetElement.querySelector('.status-indicator');
        
        console.log('Widget WiFi Stats avec MQTT initialisé');
        
        // Afficher un message en attendant
        showLoadingState();
        
        // Ajuster la hauteur
        adjustClientsContainerHeight();
        
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
        console.log('Widget WiFi Stats connecté au broker MQTT');
        isConnected = true;
        
        // S'abonner aux topics
        mqttClient.subscribe('rpi/network/wifi/clients');
        mqttClient.subscribe('rpi/network/wifi/status');
        console.log('Abonné aux topics WiFi');
        
        updateStatusIndicator();
    }
    
    /**
     * Callback d'échec de connexion
     */
    function onConnectFailure(error) {
        console.error('Échec connexion MQTT:', error.errorMessage);
        isConnected = false;
        updateStatusIndicator();
        setTimeout(connectMQTT, 5000);
    }
    
    /**
     * Callback de perte de connexion
     */
    function onConnectionLost(responseObject) {
        console.warn('Connexion MQTT perdue:', responseObject.errorMessage);
        isConnected = false;
        updateStatusIndicator();
        
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
            
            lastUpdate = Date.now();
            
            if (topic === 'rpi/network/wifi/clients') {
                updateClients(payload.clients || []);
            } else if (topic === 'rpi/network/wifi/status') {
                updateStatus(payload);
            }
            
            updateStatusIndicator();
            
        } catch (error) {
            console.error('Erreur traitement message:', error);
        }
    }
    
    /**
     * Met à jour la liste des clients
     */
    function updateClients(clientsList) {
        // Vider et remplir la Map
        clients.clear();
        
        clientsList.forEach(client => {
            const id = client.mac || Math.random().toString(36);
            clients.set(id, client);
        });
        
        renderClients();
    }
    
    /**
     * Met à jour le statut WiFi
     */
    function updateStatus(status) {
        // Mettre à jour le SSID si disponible
        const ssidElement = widgetElement.querySelector('.network-value');
        if (ssidElement && status.ssid) {
            ssidElement.textContent = status.ssid;
        }
        
        // Mettre à jour le canal
        const channelElements = widgetElement.querySelectorAll('.network-value');
        if (channelElements[1] && status.channel) {
            const freq = status.frequency && status.frequency > 5000 ? '5 GHz' : '2.4 GHz';
            channelElements[1].textContent = `${status.channel} (${freq})`;
        }
    }
    
    /**
     * Affiche un état de chargement
     */
    function showLoadingState() {
        if (!clientsContainer) return;
        
        clientsContainer.innerHTML = '';
        
        const loadingElement = document.createElement('div');
        loadingElement.className = 'client client-loading';
        loadingElement.textContent = 'En attente de données MQTT...';
        clientsContainer.appendChild(loadingElement);
    }
    
    /**
     * Met à jour l'affichage des clients
     */
    function renderClients() {
        if (!clientsContainer) return;
        
        clientsContainer.innerHTML = '';
        
        if (clients.size === 0) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'client client-empty';
            emptyElement.textContent = 'Aucun client connecté';
            clientsContainer.appendChild(emptyElement);
            return;
        }
        
        // Afficher chaque client
        clients.forEach(client => {
            const clientElement = createClientElement(client);
            clientsContainer.appendChild(clientElement);
        });
    }
    
    /**
     * Crée un élément DOM pour un client
     */
    function createClientElement(client) {
        const clientElement = document.createElement('div');
        clientElement.className = 'client';
        
        // Classe selon la force du signal
        if (client.signal) {
            const signalStrength = parseInt(client.signal);
            if (signalStrength > -50) {
                clientElement.classList.add('signal-excellent');
            } else if (signalStrength > -70) {
                clientElement.classList.add('signal-good');
            } else if (signalStrength > -80) {
                clientElement.classList.add('signal-fair');
            } else {
                clientElement.classList.add('signal-poor');
            }
        }
        
        // En-tête
        const nameElement = document.createElement('div');
        nameElement.className = 'client-header';
        nameElement.textContent = client.name || 'Client inconnu';
        clientElement.appendChild(nameElement);
        
        // Détails
        const detailsElement = document.createElement('div');
        detailsElement.className = 'client-details';
        
        const details = [];
        if (client.ip) details.push(`IP: ${client.ip}`);
        if (client.signal) details.push(`Signal: ${client.signal}dBm`);
        if (client.mac) details.push(`MAC: ${client.mac.slice(-8)}`);
        
        detailsElement.textContent = details.join(' | ');
        clientElement.appendChild(detailsElement);
        
        return clientElement;
    }
    
    /**
     * Met à jour l'indicateur de statut
     */
    function updateStatusIndicator() {
        if (!statusIndicator) return;
        
        const timeSinceUpdate = Date.now() - lastUpdate;
        const isActive = isConnected && timeSinceUpdate < 60000; // 1 minute
        
        statusIndicator.className = `status-indicator status-${isActive ? 'ok' : 'error'}`;
    }
    
    /**
     * Ajuste la hauteur du conteneur
     */
    function adjustClientsContainerHeight() {
        if (!clientsContainer || !widgetElement) return;
        
        try {
            const titleElement = widgetElement.querySelector('.widget-title');
            const statusElement = widgetElement.querySelector('.network-status');
            
            if (!titleElement || !statusElement) return;
            
            const titleHeight = titleElement.offsetHeight;
            const statusHeight = statusElement.offsetHeight;
            const containerHeight = widgetElement.offsetHeight;
            const padding = parseInt(getComputedStyle(widgetElement).paddingTop) * 2;
            const margins = parseInt(getComputedStyle(statusElement).marginBottom) || 0;
            
            const availableHeight = containerHeight - titleHeight - statusHeight - padding - margins;
            
            clientsContainer.style.height = `${Math.max(0, availableHeight)}px`;
        } catch (error) {
            console.error('Erreur ajustement hauteur:', error);
        }
    }
    
    /**
     * Appelé lors du redimensionnement
     */
    function onResize() {
        adjustClientsContainerHeight();
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
        
        if (clientsContainer) {
            clientsContainer.innerHTML = '';
        }
        
        clients.clear();
    }
    
    // API publique
    return {
        init,
        onResize,
        destroy
    };
})();