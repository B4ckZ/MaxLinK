window.clock = (function() {
    // Variables privées du widget
    let widgetElement;
    let clockTimeElement;
    let clockDateElement;
    let updateInterval;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        clockTimeElement = widgetElement.querySelector('#clock-time');
        clockDateElement = widgetElement.querySelector('#clock-date');
        
        console.log('Widget Horloge initialisé');
        
        // Nettoyer l'intervalle existant si nécessaire
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        
        // Ajouter la classe pour la stabilisation
        if (clockTimeElement) {
            clockTimeElement.classList.add('clock-time-stable');
        }
        
        // Mettre à jour l'horloge immédiatement puis toutes les secondes
        updateClock();
        updateInterval = setInterval(updateClock, 1000);
    }
    
    /**
     * Met à jour l'affichage de l'horloge
     */
    function updateClock() {
        const now = new Date();
        
        // Format de l'heure: HH:MM:SS avec zeros de remplissage
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        
        // Format de la date: JJ/MM/AAAA
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateString = `${day}/${month}/${year}`;
        
        // Mettre à jour l'affichage avec vérification
        if (clockTimeElement) {
            clockTimeElement.textContent = timeString;
        }
        
        if (clockDateElement) {
            clockDateElement.textContent = dateString;
        }
    }
    
    /**
     * Prépare le widget pour la communication MQTT dans le futur
     * À implémenter quand le serveur sera disponible
     */
    function prepareForMQTT() {
        // Ici, vous ajouterez le code pour souscrire aux topics MQTT
        // et gérer les messages quand le serveur sera disponible
        console.log('Préparation pour MQTT - non implémentée');
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
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    
    // API publique du widget - inclut des méthodes pour futur MQTT
    return {
        init,
        updateClock,
        prepareForMQTT, // Placeholder pour l'intégration future
        onResize,
        destroy
    };
})();