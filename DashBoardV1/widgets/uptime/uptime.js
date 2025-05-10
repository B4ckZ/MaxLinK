window.uptime = (function() {
    // Variables privées
    let widgetElement;
    let uptimeElement;
    let config = {
        refreshInterval: 1000 // Mise à jour toutes les secondes
    };
    
    // Variables pour le compteur
    let uptime = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0
    };
    
    // Timer pour les mises à jour régulières
    let updateTimer;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        uptimeElement = widgetElement.querySelector('[data-metric="uptime"]');
        
        console.log('Widget Uptime initialisé');
        
        // Initialiser avec une valeur
        uptime.totalSeconds = 0;
        
        // Charger les données initiales
        loadData();
        
        // Mettre en place l'intervalle de rafraîchissement
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
        }, config.refreshInterval);
    }
    
    /**
     * Charge ou rafraîchit les données du widget
     */
    function loadData() {
        // Appel à l'API - à remplacer par votre implémentation réelle
        fetchUptimeData()
            .then(data => {
                updateValue(data.uptime);
            })
            .catch(error => {
                console.error('Erreur lors de la récupération de l\'uptime:', error);
                // En cas d'erreur, incrémenter localement
                uptime.totalSeconds++;
                updateUptimeDisplay();
            });
    }
    
    /**
     * Récupère les données d'uptime depuis l'API
     * @returns {Promise} Promesse contenant les données d'uptime
     */
    function fetchUptimeData() {
        // Remplacer par votre appel API réel
        // Exemple : return fetch('/api/system/uptime').then(res => res.json());
        
        // Version temporaire en attendant l'API
        return new Promise((resolve) => {
            uptime.totalSeconds++;
            updateUptime();
            resolve({ uptime: formatUptime() });
        });
    }
    
    /**
     * Met à jour l'objet uptime avec les secondes actuelles
     */
    function updateUptime() {
        const seconds = uptime.totalSeconds;
        
        uptime.days = Math.floor(seconds / 86400);
        uptime.hours = Math.floor((seconds % 86400) / 3600);
        uptime.minutes = Math.floor((seconds % 3600) / 60);
        uptime.seconds = seconds % 60;
    }
    
    /**
     * Formate l'uptime pour l'affichage
     * @returns {string} Chaîne formatée pour l'affichage
     */
    function formatUptime() {
        const { days, hours, minutes, seconds } = uptime;
        return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    
    /**
     * Met à jour l'affichage de l'uptime
     */
    function updateUptimeDisplay() {
        updateValue(formatUptime());
    }
    
    /**
     * Met à jour la valeur affichée
     * @param {string} value - Nouvelle valeur d'uptime
     */
    function updateValue(value) {
        if (uptimeElement && value !== undefined) {
            uptimeElement.textContent = value;
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
        // Arrêter l'intervalle de mise à jour
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    }
    
    // API publique
    return {
        init,
        loadData,
        updateValue,
        onResize,
        destroy
    };
})();