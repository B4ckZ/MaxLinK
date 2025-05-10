/**
 * Widget Uptime pour MaxLink
 * Version améliorée avec préparation pour MQTT
 */
window.uptime = (function() {
    // Variables privées
    let widgetElement;
    let uptimeElement;
    let updateTimer;
    
    // Configuration
    const config = {
        refreshInterval: 1000, // Mise à jour toutes les secondes
        mqttTopic: 'weri/system/uptime' // Topic MQTT pour l'uptime du système
    };
    
    // Variable pour le temps total en secondes
    let totalSeconds = 0;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        // Nettoyage préventif
        destroy();
        
        widgetElement = element;
        uptimeElement = widgetElement.querySelector('[data-metric="uptime"]');
        
        // Fusion des configurations
        Object.assign(config, customConfig);
        
        console.log('Widget Uptime initialisé');
        
        // Ajouter la classe pour la stabilité numérique
        if (uptimeElement) {
            uptimeElement.classList.add('uptime-value-stable');
        }
        
        // Initialiser avec une valeur de départ
        totalSeconds = 0;
        updateUptimeDisplay();
        
        // Préparer l'intégration MQTT
        setupMQTTListener();
        
        // Démarrer l'intervalle de mise à jour locale
        startUpdateInterval();
    }
    
    /**
     * Configure l'écouteur MQTT pour recevoir l'uptime du système
     */
    function setupMQTTListener() {
        // À implémenter quand MQTT sera disponible
        console.log(`Préparation de l'écouteur MQTT sur le topic: ${config.mqttTopic}`);
        
        /* Exemple de code à implémenter:
        if (window.mqtt) {
            window.mqtt.subscribe(config.mqttTopic);
            
            window.mqtt.on('message', (topic, message) => {
                if (topic === config.mqttTopic) {
                    handleUptimeMessage(message);
                }
            });
        }
        */
    }
    
    /**
     * Traite un message MQTT d'uptime reçu
     * @param {Buffer|string} message - Message MQTT contenant l'uptime
     */
    function handleUptimeMessage(message) {
        try {
            const uptimeData = JSON.parse(message.toString());
            
            // Le message peut contenir soit un nombre total de secondes
            if (typeof uptimeData.seconds === 'number') {
                totalSeconds = uptimeData.seconds;
                updateUptimeDisplay();
            } 
            // Soit un objet avec les composants (jours, heures, minutes, secondes)
            else if (uptimeData.days !== undefined) {
                totalSeconds = 
                    (uptimeData.days || 0) * 86400 + 
                    (uptimeData.hours || 0) * 3600 + 
                    (uptimeData.minutes || 0) * 60 + 
                    (uptimeData.seconds || 0);
                updateUptimeDisplay();
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message d\'uptime:', error);
        }
    }
    
    /**
     * Démarre la mise à jour périodique de l'uptime
     */
    function startUpdateInterval() {
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
        
        updateTimer = setInterval(() => {
            totalSeconds++;
            updateUptimeDisplay();
        }, config.refreshInterval);
    }
    
    /**
     * Formate l'uptime pour l'affichage
     * @returns {string} Chaîne formatée pour l'affichage
     */
    function formatUptime() {
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
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
     * Met à jour directement la valeur d'uptime
     * @param {number} seconds - Nombre total de secondes d'uptime
     */
    function setUptime(seconds) {
        if (typeof seconds === 'number' && seconds >= 0) {
            totalSeconds = seconds;
            updateUptimeDisplay();
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Pas d'ajustement nécessaire
    }
    
    /**
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    }
    
    // API publique du widget
    return {
        init,
        setUptime,
        handleUptimeMessage,
        onResize,
        destroy
    };
})();