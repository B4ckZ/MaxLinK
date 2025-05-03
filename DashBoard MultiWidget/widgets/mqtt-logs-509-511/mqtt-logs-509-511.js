/**
 * Widget MQTT Logs pour MAXLINK Dashboard
 * Affiche les logs MQTT
 */

const mqttLogsWidget = (function() {
    // Variables privées du widget
    let widgetElement;
    let logsContainer;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        logsContainer = widgetElement.querySelector('.logs-container');
        
        console.log('Widget MQTT Logs initialisé');
        
        // Ajuster la hauteur du conteneur de logs
        adjustLogsHeight();
    }
    
    /**
     * Ajuste la hauteur du conteneur des logs MQTT
     */
    function adjustLogsHeight() {
        if (logsContainer) {
            const titleHeight = widgetElement.querySelector('.widget-title').offsetHeight;
            const containerHeight = widgetElement.offsetHeight;
            const padding = parseInt(getComputedStyle(widgetElement).paddingTop) * 2;
            const marginTop = parseInt(getComputedStyle(logsContainer).marginTop) || 0;
            
            const availableHeight = containerHeight - titleHeight - padding - marginTop;
            
            logsContainer.style.height = `${availableHeight}px`;
        }
    }
    
    /**
     * Ajoute un nouvel élément de log
     * @param {Object} logData - Données du log à ajouter
     */
    function addLogEntry(logData = {}) {
        // Par défaut, utiliser la date actuelle
        const now = new Date();
        const date = logData.date || `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
        const time = logData.time || `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Créer l'élément de log
        const logLine = document.createElement('div');
        logLine.className = `log-line ${logData.error ? 'log-error' : ''}`;
        
        logLine.innerHTML = `
            <span class="log-date">${date}</span>
            <span class="log-time">${time}</span>
            <span class="log-device">${logData.device || 'A'}</span>
            <span class="log-id">${logData.id || Math.floor(Math.random() * 1000000000000000)}</span>
            <span class="status-indicator ${logData.error ? 'status-error' : 'status-ok'}"></span>
        `;
        
        // Ajouter au début pour montrer les plus récents en haut
        if (logsContainer.firstChild) {
            logsContainer.insertBefore(logLine, logsContainer.firstChild);
        } else {
            logsContainer.appendChild(logLine);
        }
        
        // Limiter le nombre de logs affichés (garder les 50 derniers par exemple)
        const maxLogs = 50;
        const logs = logsContainer.querySelectorAll('.log-line');
        if (logs.length > maxLogs) {
            for (let i = maxLogs; i < logs.length; i++) {
                logsContainer.removeChild(logs[i]);
            }
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        adjustLogsHeight();
    }
    
    // API publique du widget
    return {
        init,
        addLogEntry,
        onResize
    };
})();