window.wifistats = (function() {
    // Variables privées du widget
    let widgetElement;
    let clientsContainer;
    let statusIndicator;
    let lastActivityTimestamp = Date.now(); // Initialisé correctement
    let statusCheckTimer;
    
    // Configuration du widget
    const config = {
        statusCheckInterval: 1000,       // Intervalle de vérification du statut en ms
        statusTimeoutThreshold: 5000     // Délai avant de considérer inactif en ms
    };
    
    // Stockage des clients WiFi (utilise Map pour efficacité)
    const clients = new Map();
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        // Nettoyage préventif
        destroy();
        
        widgetElement = element;
        
        // Récupérer les références aux éléments DOM (une seule fois)
        clientsContainer = widgetElement.querySelector('.clients-container');
        statusIndicator = widgetElement.querySelector('.status-indicator');
        
        console.log('Widget WiFi Stats initialisé');
        
        // Réinitialiser le timestamp d'activité au démarrage
        lastActivityTimestamp = Date.now();
        
        // Démarrer la vérification périodique du statut
        startStatusCheck();
        
        // Ajuster la hauteur du conteneur de clients
        adjustClientsContainerHeight();
        
        // Afficher un message en attendant les données
        showLoadingState();
    }
    
    /**
     * Affiche un état de chargement initial
     */
    function showLoadingState() {
        if (!clientsContainer) return;
        
        clientsContainer.innerHTML = '';
        
        const loadingElement = document.createElement('div');
        loadingElement.className = 'client client-loading';
        loadingElement.textContent = 'En attente de données...';
        clientsContainer.appendChild(loadingElement);
    }
    
    /**
     * Démarre la vérification périodique du statut
     */
    function startStatusCheck() {
        if (statusCheckTimer) {
            clearInterval(statusCheckTimer);
        }
        
        statusCheckTimer = setInterval(() => {
            updateStatusIndicator();
        }, config.statusCheckInterval);
    }
    
    /**
     * Met à jour l'indicateur de statut basé sur la dernière activité
     */
    function updateStatusIndicator() {
        if (!statusIndicator) return;
        
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTimestamp;
        const isActive = timeSinceLastActivity < config.statusTimeoutThreshold;
        
        statusIndicator.className = `status-indicator status-${isActive ? 'ok' : 'error'}`;
    }
    
    /**
     * Met à jour la liste des clients dans l'interface
     */
    function renderClients() {
        if (!clientsContainer) return;
        
        // Vider le conteneur
        clientsContainer.innerHTML = '';
        
        // Afficher un message si aucun client
        if (clients.size === 0) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'client client-empty';
            emptyElement.textContent = 'Aucun client connecté';
            clientsContainer.appendChild(emptyElement);
            return;
        }
        
        // Convertir Map en Array et trier (plus récent en haut)
        const clientsArray = Array.from(clients.values()).sort((a, b) => {
            // Tri par temps de connexion (du plus récent au plus ancien)
            return parseConnTime(b.connectedTime) - parseConnTime(a.connectedTime);
        });
        
        // Afficher chaque client
        clientsArray.forEach(client => {
            const clientElement = createClientElement(client);
            clientsContainer.appendChild(clientElement);
        });
    }
    
    /**
     * Parse le temps de connexion format "XhYm" en secondes
     * @param {string} timeStr - Temps au format XhYm
     * @returns {number} Temps en secondes
     */
    function parseConnTime(timeStr) {
        if (!timeStr) return 0;
        
        try {
            // Gérer les formats comme "3h25m"
            if (timeStr.includes('h') && timeStr.includes('m')) {
                const [hours, mins] = timeStr.split('h');
                return (parseInt(hours) * 3600) + (parseInt(mins) * 60);
            } 
            // Gérer les formats comme "3h"
            else if (timeStr.includes('h')) {
                const hours = parseInt(timeStr);
                return hours * 3600;
            } 
            // Gérer les formats comme "25m"
            else if (timeStr.includes('m')) {
                const mins = parseInt(timeStr);
                return mins * 60;
            }
            // Autres formats inconnus
            return 0;
        } catch (e) {
            console.error('Erreur lors du parsing du temps de connexion:', e);
            return 0;
        }
    }
    
    /**
     * Crée un élément DOM pour un client WiFi
     * @param {Object} client - Données du client
     * @returns {HTMLElement} Élément DOM du client
     */
    function createClientElement(client) {
        const clientElement = document.createElement('div');
        clientElement.className = 'client';
        
        // Déterminer la classe CSS basée sur la force du signal (si disponible)
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
        
        // En-tête du client
        const nameElement = document.createElement('div');
        nameElement.className = 'client-header';
        nameElement.textContent = client.name || 'Client inconnu';
        clientElement.appendChild(nameElement);
        
        // Détails du client
        const detailsElement = document.createElement('div');
        detailsElement.className = 'client-details';
        
        // Construire les détails avec les données disponibles
        const details = [];
        if (client.ip) details.push(`IP: ${client.ip}`);
        if (client.signal) details.push(`Signal: ${client.signal}dBm`);
        if (client.speed) details.push(`${client.speed}`);
        if (client.connectedTime) details.push(`${client.connectedTime}`);
        if (client.mac) details.push(`MAC: ${client.mac.slice(-8)}`); // Afficher seulement les derniers caractères
        
        detailsElement.textContent = details.join(' | ');
        clientElement.appendChild(detailsElement);
        
        return clientElement;
    }
    
    /**
     * Met à jour les clients et affiche les changements
     * @param {Array} clientsData - Données des clients WiFi
     * @returns {boolean} Succès de l'opération
     */
    function updateClients(clientsData) {
        if (!Array.isArray(clientsData)) return false;
        
        try {
            // Vider la Map des clients existants
            clients.clear();
            
            // Ajouter les nouveaux clients
            clientsData.forEach(client => {
                if (client.mac || client.name) {
                    const id = client.mac || client.name; // Préférer MAC, sinon nom
                    clients.set(id, client);
                }
            });
            
            // Mettre à jour l'interface
            renderClients();
            
            // Signaler l'activité
            notifyActivity();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour des clients:', error);
            return false;
        }
    }
    
    /**
     * Notifie le widget d'une activité MQTT
     */
    function notifyActivity() {
        lastActivityTimestamp = Date.now();
        updateStatusIndicator();
    }
    
    /**
     * Ajuste la hauteur du conteneur des clients
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
            
            // Utiliser max pour éviter les hauteurs négatives
            clientsContainer.style.height = `${Math.max(0, availableHeight)}px`;
        } catch (error) {
            console.error('Erreur lors de l\'ajustement de la hauteur:', error);
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        adjustClientsContainerHeight();
    }
    
    /**
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        if (statusCheckTimer) {
            clearInterval(statusCheckTimer);
            statusCheckTimer = null;
        }
        
        if (clientsContainer) {
            clientsContainer.innerHTML = '';
        }
        
        // Vider la Map des clients
        clients.clear();
    }
    
    // API publique du widget
    return {
        init,
        updateClients,  // API principale pour mettre à jour les clients
        notifyActivity, // Pour signaler activité sans données
        onResize,
        destroy
    };
})();