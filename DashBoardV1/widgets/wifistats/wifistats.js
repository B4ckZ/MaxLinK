/**
 * Widget WiFi Stats pour MaxLink
 * Version améliorée avec affichage étendu : nom, IP, MAC, qualité signal et uptime
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
     * Détermine la classe CSS selon la qualité du signal
     */
    function getSignalClass(signalQuality) {
        if (signalQuality >= 75) return 'signal-excellent';
        if (signalQuality >= 50) return 'signal-good';
        if (signalQuality >= 25) return 'signal-fair';
        return 'signal-poor';
    }
    
    /**
     * Détermine l'icône selon la qualité du signal
     */
    function getSignalIcon(signalQuality) {
        if (signalQuality >= 75) return '▂▄▆█';
        if (signalQuality >= 50) return '▂▄▆_';
        if (signalQuality >= 25) return '▂▄__';
        return '▂___';
    }
    
    /**
     * Formate les octets en format lisible
     */
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    /**
     * Crée un élément DOM pour un client
     */
    function createClientElement(client) {
        const clientElement = document.createElement('div');
        clientElement.className = 'client';
        
        // Ajouter la classe selon la qualité du signal
        const signalQuality = client.signal_quality || 0;
        clientElement.classList.add(getSignalClass(signalQuality));
        
        // Créer la structure complète
        clientElement.innerHTML = `
            <div class="client-header">
                <span class="client-name">${client.name || 'Appareil inconnu'}</span>
                <span class="client-signal" title="Signal: ${client.signal || 'N/A'} dBm">
                    <span class="signal-icon">${getSignalIcon(signalQuality)}</span>
                    <span class="signal-percent">${signalQuality}%</span>
                </span>
            </div>
            <div class="client-details">
                <div class="client-info-row">
                    <span class="info-label">IP:</span>
                    <span class="info-value">${client.ip || 'N/A'}</span>
                    <span class="info-label">Uptime:</span>
                    <span class="info-value">${client.uptime || 'N/A'}</span>
                </div>
                <div class="client-info-row">
                    <span class="info-label">MAC:</span>
                    <span class="info-value mac-address">${client.mac || 'N/A'}</span>
                </div>
                ${client.rx_bytes || client.tx_bytes ? `
                <div class="client-info-row traffic-info">
                    <span class="traffic-item">↓ ${formatBytes(client.rx_bytes)}</span>
                    <span class="traffic-item">↑ ${formatBytes(client.tx_bytes)}</span>
                </div>
                ` : ''}
            </div>
        `;
        
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