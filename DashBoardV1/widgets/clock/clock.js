/**
 * Widget Horloge amélioré pour MaxLink
 * Version modifiée pour respecter les styles CSS et éviter les conflits
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
        
        // Ajouter la police Roboto Mono pour la stabilité des chiffres
        addMonospaceFont();
        
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
     * Ajoute dynamiquement la police Roboto Mono depuis Google Fonts
     */
    function addMonospaceFont() {
        if (!document.getElementById('roboto-mono-font')) {
            // Préconnexion pour accélérer le chargement
            const preconnectGoogle = document.createElement('link');
            preconnectGoogle.rel = 'preconnect';
            preconnectGoogle.href = 'https://fonts.googleapis.com';
            document.head.appendChild(preconnectGoogle);
            
            const preconnectGstatic = document.createElement('link');
            preconnectGstatic.rel = 'preconnect';
            preconnectGstatic.href = 'https://fonts.gstatic.com';
            preconnectGstatic.crossOrigin = 'anonymous';
            document.head.appendChild(preconnectGstatic);
            
            // Chargement de la police
            const fontLink = document.createElement('link');
            fontLink.id = 'roboto-mono-font';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap';
            document.head.appendChild(fontLink);
        }
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
        // Arrêter l'intervalle de mise à jour
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    
    // API publique du widget
    return {
        init,
        updateClock,
        onResize,
        destroy
    };
})();