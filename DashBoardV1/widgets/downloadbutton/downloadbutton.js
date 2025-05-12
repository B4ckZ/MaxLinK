window.downloadbutton = (function() {
    // Variables privées du widget
    let widgetElement;
    let downloadbutton;
    
    // Configuration MQTT
    const mqttTopic = 'weri/system/reboot';
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        downloadbutton = widgetElement.querySelector('#reboot-button');
        
        console.log('Widget Reboot Button initialisé');
        
        // Ajouter l'écouteur d'événement pour le clic
        if (downloadbutton) {
            downloadbutton.addEventListener('click', handleReboot);
        }
    }
    
    /**
     * Gère l'action de redémarrage
     */
    function handleReboot() {
        console.log('Demande de redémarrage du système');
        
        // Quand le Raspberry Pi sera disponible, cette fonction
        // enverra une commande via MQTT
        sendRebootCommand();
    }
    
    /**
     * Envoie la commande de redémarrage via MQTT
     */
    function sendRebootCommand() {
        // Code à implémenter quand MQTT sera disponible
        console.log(`Envoi d'une commande de redémarrage via MQTT sur le topic: ${mqttTopic}`);
        
        /* 
        // Exemple de code pour l'implémentation future
        if (window.mqtt && typeof window.mqtt.publish === 'function') {
            window.mqtt.publish(mqttTopic, JSON.stringify({
                command: 'reboot',
                timestamp: Date.now()
            }));
        }
        */
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Pas d'ajustement nécessaire pour ce widget
    }
    
    /**
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        // Supprimer l'écouteur d'événement
        if (downloadbutton) {
            downloadbutton.removeEventListener('click', handleReboot);
        }
    }
    
    // API publique du widget
    return {
        init,
        onResize,
        destroy
    };
})();