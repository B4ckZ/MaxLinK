/**
 * Widget Horloge amélioré pour MaxLink
 * Version optimisée avec suppression des imports redondants et utilisation des utilitaires communs
 */
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
        
        // Ajouter UNIQUEMENT les classes CSS au lieu de styles inline
        if (clockTimeElement) {
            // Nous ajoutons une classe au lieu de styles inline
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
        
        // Mettre à jour l'affichage
        if (clockTimeElement) {
            clockTimeElement.textContent = timeString;
        }
        
        if (clockDateElement) {
            clockDateElement.textContent = dateString;
        }
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
        // Utilisation de la fonction utilitaire pour nettoyer les timers
        updateInterval = Utils.clearTimers(updateInterval);
    }
    
    // API publique du widget
    return {
        init,
        updateClock,
        onResize,
        destroy
    };
})();