/**
 * Widget WiFi Stats pour MaxLink
 * Version simplifiée avec mise à jour différentielle
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
    
    // Map des clients pour la mise à jour différentielle
    const clientsMap = new Map();
    
    // Icônes de device
    const deviceIcons = {
        'default': '📱',
        'laptop': '💻',
        'phone': '📱',
        'tablet': '📱',
        'raspberry': '🖥️',
        'device': '📡'
    };
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        
        // Récupérer les références aux éléments DOM
        clientsContainer = widgetElement.querySelector('.clients-container');
        statusIndicator = widgetElement.querySelector('.status-indicator');
        
        console.log('Widget WiFi Stats simplifié initialisé');
        
        // Afficher un message en attendant
        showPlaceholder();
        
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
     * Met à jour la liste des clients avec mise à jour différentielle
     */
    function updateClients(clientsList) {
        // Créer un Set des MACs actuels pour détecter les déconnexions
        const currentMacs = new Set();
        
        // Mettre à jour ou ajouter les clients
        clientsList.forEach(client => {
            const mac = client.mac;
            currentMacs.add(mac);
            
            if (clientsMap.has(mac)) {
                // Client existant - mise à jour
                updateClientElement(mac, client);
            } else {
                // Nouveau client - création
                createClientElement(mac, client);
            }
        });
        
        // Supprimer les clients déconnectés
        clientsMap.forEach((element, mac) => {
            if (!currentMacs.has(mac)) {
                removeClientElement(mac);
            }
        });
        
        // Gérer l'affichage du placeholder
        if (clientsMap.size === 0) {
            showPlaceholder();
        }
    }
    
    /**
     * Crée un nouvel élément client
     */
    function createClientElement(mac, client) {
        const clientElement = document.createElement('div');
        clientElement.className = 'wifi-client';
        clientElement.dataset.mac = mac;
        
        // Structure HTML
        clientElement.innerHTML = `
            <div class="client-icon">${getDeviceIcon(client.name)}</div>
            <div class="client-info">
                <div class="client-name">${client.name || 'Unknown'}</div>
                <div class="client-details">
                    <span class="client-mac">${client.mac}</span>
                    <span class="client-separator">|</span>
                    <span class="client-uptime">${client.uptime || '0s'}</span>
                </div>
            </div>
        `;
        
        // Ajouter avec animation
        clientElement.style.opacity = '0';
        clientElement.style.transform = 'translateY(10px)';
        
        clientsContainer.appendChild(clientElement);
        clientsMap.set(mac, clientElement);
        
        // Déclencher l'animation
        requestAnimationFrame(() => {
            clientElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            clientElement.style.opacity = '1';
            clientElement.style.transform = 'translateY(0)';
        });
    }
    
    /**
     * Met à jour un élément client existant
     */
    function updateClientElement(mac, client) {
        const element = clientsMap.get(mac);
        if (!element) return;
        
        // Mettre à jour uniquement les éléments qui ont changé
        const nameElement = element.querySelector('.client-name');
        const uptimeElement = element.querySelector('.client-uptime');
        
        if (nameElement && nameElement.textContent !== client.name) {
            nameElement.textContent = client.name || 'Unknown';
        }
        
        if (uptimeElement && uptimeElement.textContent !== client.uptime) {
            uptimeElement.textContent = client.uptime || '0s';
        }
    }
    
    /**
     * Supprime un élément client
     */
    function removeClientElement(mac) {
        const element = clientsMap.get(mac);
        if (!element) return;
        
        // Animation de suppression
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateX(-10px)';
        
        setTimeout(() => {
            element.remove();
            clientsMap.delete(mac);
            
            // Afficher placeholder si vide
            if (clientsMap.size === 0) {
                showPlaceholder();
            }
        }, 300);
    }
    
    /**
     * Détermine l'icône selon le nom du device
     */
    function getDeviceIcon(name) {
        if (!name) return deviceIcons.default;
        
        const nameLower = name.toLowerCase();
        
        if (nameLower.includes('laptop') || nameLower.includes('macbook')) {
            return deviceIcons.laptop;
        } else if (nameLower.includes('iphone') || nameLower.includes('android') || nameLower.includes('phone')) {
            return deviceIcons.phone;
        } else if (nameLower.includes('ipad') || nameLower.includes('tablet')) {
            return deviceIcons.tablet;
        } else if (nameLower.includes('raspberry') || nameLower.includes('pi')) {
            return deviceIcons.raspberry;
        }
        
        return deviceIcons.device;
    }
    
    /**
     * Affiche un placeholder quand aucun client
     */
    function showPlaceholder() {
        if (!clientsContainer) return;
        
        // Vérifier s'il existe déjà un placeholder
        if (clientsContainer.querySelector('.wifi-placeholder')) return;
        
        // Vider le conteneur
        clientsContainer.innerHTML = '';
        clientsMap.clear();
        
        const placeholder = document.createElement('div');
        placeholder.className = 'wifi-placeholder';
        placeholder.textContent = 'Aucun client connecté';
        clientsContainer.appendChild(placeholder);
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
        
        clientsMap.clear();
    }
    
    // API publique
    return {
        init,
        onResize,
        destroy
    };
})();