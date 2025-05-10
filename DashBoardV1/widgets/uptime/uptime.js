window.uptime = (function() {
    // Variables privées
    let widgetElement;
    let uptimeElement;
    let updateTimer;
    
    // Configuration
    const config = {
        refreshInterval: 1000 // Mise à jour toutes les secondes
    };
    
    // Variable pour le temps total en secondes
    let totalSeconds = 0;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        uptimeElement = widgetElement.querySelector('[data-metric="uptime"]');
        
        console.log('Widget Uptime initialisé');
        
        // Ajouter la classe pour la stabilité numérique
        if (uptimeElement) {
            uptimeElement.classList.add('uptime-value-stable');
        }
        
        // Initialiser avec une valeur de départ
        totalSeconds = 0;
        updateUptimeDisplay();
        
        // Démarrer l'intervalle de mise à jour
        startUpdateInterval();
    }
    
    /**
     * Démarre la mise à jour périodique de l'uptime
     */
    function startUpdateInterval() {
        if (updateTimer) {
            clearInterval(updateTimer);
        }
        
        updateTimer = setInterval(() => {
            // Incrémente simplement le compteur de secondes
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
        
        // Format harmonisé incluant les minutes: "00j 00h 00m 00s"
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
    
    // API publique simplifiée
    return {
        init,
        onResize,
        destroy
    };
})();