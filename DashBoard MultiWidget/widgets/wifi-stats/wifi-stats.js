/**
 * Widget WiFi Stats pour MAXLINK Dashboard
 * Affiche les informations sur le réseau WiFi et les clients connectés
 */

const wifiStatsWidget = (function() {
    // Variables privées du widget
    let widgetElement;
    let clientsContainer;
    let config = {
        // Configuration par défaut du widget
        updateInterval: 10000, // Intervalle de mise à jour en millisecondes
        maxClients: 10 // Nombre maximum de clients à afficher
    };
    
    // Données simulées
    let wifiData = {
        ssid: 'MaxLinkNetwork',
        channel: '6 (2.4 GHz)',
        status: 'ok', // 'ok' ou 'error'
        clients: [
            {
                name: 'ESP32-509',
                ip: '31.43.149.200',
                speed: '67 Mbps',
                connectedTime: '3h25m'
            },
            {
                name: 'ESP32-511',
                ip: '64.24.151.214',
                speed: '67 Mbps',
                connectedTime: '3h25m'
            },
            {
                name: 'Android de JJ',
                ip: '41.196.93.233',
                speed: '67 Mbps',
                connectedTime: '3h25m'
            }
        ]
    };
    
    // Intervalle de mise à jour
    let updateTimer;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        widgetElement = element;
        clientsContainer = widgetElement.querySelector('.clients-container');
        
        // Fusionner la configuration personnalisée avec les valeurs par défaut
        config = {...config, ...customConfig};
        
        console.log('Widget WiFi Stats initialisé');
        
        // Premier chargement des données et démarrage de la mise à jour périodique
        loadData();
        startUpdateInterval();
    }
    
    /**
     * Démarre la mise à jour périodique des données
     */
    function startUpdateInterval() {
        // Nettoyer l'intervalle précédent si existant
        if (updateTimer) {
            clearInterval(updateTimer);
        }
        
        // Créer un nouvel intervalle
        updateTimer = setInterval(() => {
            loadData();
        }, config.updateInterval);
    }
    
    /**
     * Charge ou rafraîchit les données du widget
     */
    function loadData() {
        // Dans une application réelle, vous feriez un appel API ici
        // Pour l'exemple, nous simulons des données changeantes
        
        // Simuler des changements de données
        simulateDataChanges();
        
        // Mettre à jour l'interface avec les nouvelles données
        updateUI();
    }
    
    /**
     * Simule des changements de données pour la démonstration
     */
    function simulateDataChanges() {
        // Simuler un changement aléatoire de statut (1% de chance d'erreur)
        wifiData.status = Math.random() < 0.01 ? 'error' : 'ok';
        
        // Simuler des changements dans les vitesses de connexion des clients
        wifiData.clients.forEach(client => {
            const speed = Math.floor(30 + Math.random() * 70);
            client.speed = `${speed} Mbps`;
            
            // Incrémenter le temps de connexion (de façon simplifiée)
            let [hours, mins] = client.connectedTime.split('h');
            hours = parseInt(hours);
            mins = parseInt(mins.replace('m', ''));
            
            mins += Math.floor(config.updateInterval / 60000);
            if (mins >= 60) {
                hours += Math.floor(mins / 60);
                mins = mins % 60;
            }
            
            client.connectedTime = `${hours}h${mins}m`;
        });
        
        // Occasionnellement ajouter ou supprimer un client
        if (Math.random() < 0.2 && wifiData.clients.length < config.maxClients) {
            // Ajouter un nouveau client
            const deviceTypes = ['ESP32', 'Android', 'iPhone', 'Laptop'];
            const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
            const deviceNumber = Math.floor(Math.random() * 1000);
            
            wifiData.clients.push({
                name: `${deviceType}-${deviceNumber}`,
                ip: `192.168.1.${Math.floor(100 + Math.random() * 100)}`,
                speed: `${Math.floor(30 + Math.random() * 70)} Mbps`,
                connectedTime: '0h1m'
            });
        } else if (Math.random() < 0.1 && wifiData.clients.length > 1) {
            // Supprimer un client aléatoire (sauf le premier)
            const indexToRemove = Math.floor(1 + Math.random() * (wifiData.clients.length - 1));
            wifiData.clients.splice(indexToRemove, 1);
        }
    }
    
    /**
     * Met à jour l'interface utilisateur avec les nouvelles données
     */
    function updateUI() {
        // Mettre à jour les informations du réseau
        const ssidElement = widgetElement.querySelector('.network-info:first-child .network-value');
        const channelElement = widgetElement.querySelector('.network-info:nth-child(2) .network-value');
        const statusIndicator = widgetElement.querySelector('.status-indicator');
        
        if (ssidElement) ssidElement.textContent = wifiData.ssid;
        if (channelElement) channelElement.textContent = wifiData.channel;
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator status-${wifiData.status}`;
        }
        
        // Effacer et recréer la liste des clients
        if (clientsContainer) {
            clientsContainer.innerHTML = '';
            
            wifiData.clients.forEach(client => {
                const clientElement = document.createElement('div');
                clientElement.className = 'client';
                clientElement.innerHTML = `
                    <div>${client.name}</div>
                    <div>IP # ${client.ip} | ${client.speed} | ${client.connectedTime}</div>
                `;
                
                clientsContainer.appendChild(clientElement);
            });
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Ajuster la hauteur du conteneur de clients si nécessaire
        adjustClientsContainerHeight();
    }
    
    /**
     * Ajuste la hauteur du conteneur des clients
     */
    function adjustClientsContainerHeight() {
        if (clientsContainer) {
            const titleHeight = widgetElement.querySelector('.widget-title').offsetHeight;
            const statusHeight = widgetElement.querySelector('.network-status').offsetHeight;
            const containerHeight = widgetElement.offsetHeight;
            const padding = parseInt(getComputedStyle(widgetElement).paddingTop) * 2;
            const margins = parseInt(getComputedStyle(widgetElement.querySelector('.network-status')).marginBottom) || 0;
            
            const availableHeight = containerHeight - titleHeight - statusHeight - padding - margins;
            
            clientsContainer.style.height = `${availableHeight}px`;
        }
    }
    
    /**
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        // Arrêter l'intervalle de mise à jour
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    }
    
    /**
     * Définit une nouvelle configuration
     * @param {Object} newConfig - Nouvelle configuration
     */
    function setConfig(newConfig) {
        config = {...config, ...newConfig};
        
        // Si l'intervalle de mise à jour a changé, redémarrer l'intervalle
        if (newConfig.updateInterval) {
            startUpdateInterval();
        }
    }
    
    // API publique du widget
    return {
        init,
        loadData,
        setConfig,
        onResize,
        destroy
    };
})();