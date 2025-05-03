/**
 * Widget MQTT Server pour MAXLINK Dashboard
 * Affiche les informations sur le serveur MQTT
 */

const mqttServerWidget = (function() {
    // Variables privées du widget
    let widgetElement;
    let mqttTopicsContainer;
    let config = {
        // Configuration par défaut du widget
        updateInterval: 5000, // Intervalle de mise à jour en millisecondes
    };
    
    // Données simulées
    let mqttData = {
        received: 15234,
        sent: 8712,
        uptime: {
            days: 5,
            hours: 2,
            minutes: 32
        },
        status: 'ok', // 'ok' ou 'error'
        topics: [
            'weri/device/+/temp',
            'weri/device/+/humidity',
            'weri/device/+/status',
            'weri/system/stats',
            'weri/system/updates',
            'weri/device/+/battery',
            'weri/device/+/connection',
            'weri/network/pid/reload'
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
        mqttTopicsContainer = widgetElement.querySelector('.mqtt-topics');
        
        // Fusionner la configuration personnalisée avec les valeurs par défaut
        config = {...config, ...customConfig};
        
        console.log('Widget MQTT Server initialisé');
        
        // Premier chargement des données et démarrage de la mise à jour périodique
        loadData();
        startUpdateInterval();
        
        // Ajuster la hauteur du conteneur de topics
        adjustTopicsContainerHeight();
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
        // Augmenter le nombre de messages reçus et envoyés
        mqttData.received += Math.floor(Math.random() * 10);
        mqttData.sent += Math.floor(Math.random() * 5);
        
        // Augmenter le temps d'uptime
        mqttData.uptime.minutes += Math.floor(config.updateInterval / 60000);
        if (mqttData.uptime.minutes >= 60) {
            mqttData.uptime.hours += Math.floor(mqttData.uptime.minutes / 60);
            mqttData.uptime.minutes = mqttData.uptime.minutes % 60;
            
            if (mqttData.uptime.hours >= 24) {
                mqttData.uptime.days += Math.floor(mqttData.uptime.hours / 24);
                mqttData.uptime.hours = mqttData.uptime.hours % 24;
            }
        }
        
        // Simuler un changement aléatoire de statut (1% de chance d'erreur)
        mqttData.status = Math.random() < 0.01 ? 'error' : 'ok';
        
        // Occasionnellement ajouter ou supprimer un topic
        if (Math.random() < 0.1) {
            const deviceTypes = ['temp', 'humidity', 'status', 'battery', 'connection', 'signal', 'power'];
            const topicPrefix = Math.random() < 0.5 ? 'weri/device/+/' : 'weri/system/';
            const topicSuffix = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
            
            // Ajouter le topic s'il n'existe pas déjà
            const newTopic = topicPrefix + topicSuffix;
            if (!mqttData.topics.includes(newTopic)) {
                mqttData.topics.push(newTopic);
            }
        } else if (Math.random() < 0.05 && mqttData.topics.length > 3) {
            // Supprimer un topic aléatoire (mais garder au moins 3 topics)
            const indexToRemove = Math.floor(Math.random() * mqttData.topics.length);
            mqttData.topics.splice(indexToRemove, 1);
        }
    }
    
    /**
     * Met à jour l'interface utilisateur avec les nouvelles données
     */
    function updateUI() {
        // Mettre à jour les informations MQTT
        const mqttInfoContainer = widgetElement.querySelector('.mqtt-info-container');
        const statusIndicator = widgetElement.querySelector('.status-indicator');
        
        if (mqttInfoContainer) {
            const infoElements = mqttInfoContainer.querySelectorAll('div');
            if (infoElements.length >= 2) {
                infoElements[0].textContent = `${mqttData.received.toLocaleString()} reçus | ${mqttData.sent.toLocaleString()} envoyés`;
                infoElements[1].textContent = `Uptime : ${mqttData.uptime.days}j ${mqttData.uptime.hours}h ${mqttData.uptime.minutes}m | Latence`;
            }
        }
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator status-${mqttData.status}`;
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
            const statusHeight = widgetElement.querySelector('.mqtt-status').offsetHeight;
            const containerHeight = widgetElement.offsetHeight;
            const padding = parseInt(getComputedStyle(widgetElement).paddingTop) * 2;
            const margins = parseInt(getComputedStyle(widgetElement.querySelector('.mqtt-status')).marginBottom) || 0;
            
            const availableHeight = containerHeight - titleHeight - statusHeight - padding - margins;
            
            mqttTopicsContainer.style.height = `${availableHeight}px`;
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