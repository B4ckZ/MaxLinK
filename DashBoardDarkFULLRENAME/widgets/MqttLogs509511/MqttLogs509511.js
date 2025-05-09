const mqttlogs509511 = (function() {
    // Variables privées du widget
    let widgetElement;
    let logsContainer;
    let simulationInterval; // Pour stocker l'intervalle de simulation
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        logsContainer = widgetElement.querySelector('.logs-container');
        
        console.log('Widget MQTT Logs initialisé');
        
        // Vider le conteneur
        if (logsContainer) {
            logsContainer.innerHTML = '';
        }
        
        // Ajuster la hauteur du conteneur de logs
        adjustLogsHeight();

        // Ajouter quelques exemples de logs pour la démonstration
        addExampleLogs();
        
        // Démarrer la simulation
        startSimulation();
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
     * Parse un code complet et extrait ses composants
     * @param {string} code - Code complet à analyser
     * @returns {Object} - Données structurées extraites du code
     */
    function parseCode(code) {
        if (!code || code.length < 37) {
            // Si le code est trop court, utiliser des valeurs par défaut
            return {
                date: "09/05/25", // Format pour l'affichage
                time: "10h22",     // Format pour l'affichage
                pocheCode: "24042551110457205101005321",
                resultCode: 1
            };
        }

        // Extraire les parties du code
        const codeDate = code.substring(0, 6);
        const codeTime = code.substring(6, 10);
        const pocheCode = code.substring(10, 36);
        const resultCode = parseInt(code.substring(36, 37));

        // Formater la date pour l'affichage
        const day = codeDate.substring(0, 2);
        const month = codeDate.substring(2, 4);
        const year = codeDate.substring(4, 6);
        const date = `${day}/${month}/${year}`;

        // Formater l'heure pour l'affichage
        const hours = codeTime.substring(0, 2);
        const minutes = codeTime.substring(2, 4);
        const time = `${hours}h${minutes}`;

        return {
            date,
            time,
            pocheCode,
            resultCode: resultCode >= 1 && resultCode <= 3 ? resultCode : 1
        };
    }
    
    /**
     * Ajoute quelques logs d'exemple pour la démonstration
     */
    function addExampleLogs() {
        const exampleCodes = [
            "0905251022240425511104572051010053211", // OK
            "0905251015240425511104572051010053212", // Fuite Vanne
            "0905251012240425511104572051010053213", // Fuite Poche
            "0905250958240425511104572051010053211"  // OK
        ];
        
        exampleCodes.forEach(code => {
            addLogEntryFromCode(code);
        });
    }
    
    /**
     * Démarre la simulation des logs aléatoires
     */
    function startSimulation() {
        // Arrêter toute simulation précédente
        if (simulationInterval) {
            clearInterval(simulationInterval);
        }
        
        // Démarrer une nouvelle simulation avec un intervalle aléatoire entre 2 et 8 secondes
        simulationInterval = setInterval(() => {
            addRandomLogEntry();
        }, Math.random() * 6000 + 2000); // Entre 2000 et 8000 ms
    }
    
    /**
     * Arrête la simulation
     */
    function stopSimulation() {
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
    }
    
    /**
     * Génère un log aléatoire
     */
    function addRandomLogEntry() {
        // Générer la date d'aujourd'hui au format "DDMMYY"
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).substring(2);
        const dateCode = day + month + year;
        
        // Heure aléatoire entre 00:00 et 23:59 au format "HHMM"
        const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
        const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
        const timeCode = hours + minutes;
        
        // Code de poche aléatoire (26 chiffres)
        let pocheCode = '';
        for (let i = 0; i < 26; i++) {
            pocheCode += Math.floor(Math.random() * 10);
        }
        
        // Résultat aléatoire (1, 2 ou 3) avec une pondération
        // 70% OK (1), 15% FV (2), 15% FP (3)
        let resultCode;
        const rand = Math.random();
        if (rand < 0.7) {
            resultCode = 1; // OK
        } else if (rand < 0.85) {
            resultCode = 2; // FV
        } else {
            resultCode = 3; // FP
        }
        
        // Assembler le code complet
        const code = dateCode + timeCode + pocheCode + resultCode;
        
        // Ajouter le log
        addLogEntryFromCode(code);
    }
    
    /**
     * Ajoute un log à partir d'un code complet
     * @param {string} code - Code complet à analyser
     */
    function addLogEntryFromCode(code) {
        // Parser le code
        const logData = parseCode(code);
        // Ajouter l'entrée
        addLogEntry(logData);
    }
    
    /**
     * Ajoute un nouvel élément de log
     * @param {Object} logData - Données du log à ajouter
     */
    function addLogEntry(logData = {}) {
        // S'assurer que logData contient toutes les propriétés nécessaires
        const date = logData.date || '00/00/00';
        const time = logData.time || '00h00';
        const pocheCode = logData.pocheCode || '0'.repeat(26);
        const resultCode = logData.resultCode || 1;
        
        // Choisir un appareil aléatoire (A, B ou C)
        const deviceOptions = ['A', 'B', 'C']; 
        const device = logData.device || deviceOptions[Math.floor(Math.random() * deviceOptions.length)];
        
        // Déterminer les classes et le texte de statut en fonction du code de résultat
        let statusClass = '';
        let statusText = '';
        let statusIndicatorClass = '';
        
        switch (resultCode) {
            case 1: // OK
                statusClass = '';
                statusText = 'OK';
                statusIndicatorClass = 'status-ok';
                break;
            case 2: // Fuite Vanne
                statusClass = 'log-fuite-vanne';
                statusText = 'FV';
                statusIndicatorClass = 'status-fuite-vanne';
                break;
            case 3: // Fuite Poche
                statusClass = 'log-fuite-poche';
                statusText = 'FP';
                statusIndicatorClass = 'status-fuite-poche';
                break;
            default: // Par défaut, traiter comme OK
                statusClass = '';
                statusText = 'OK';
                statusIndicatorClass = 'status-ok';
        }
        
        // Créer l'élément de log
        const logLine = document.createElement('div');
        logLine.className = `log-line ${statusClass}`;
        
        // Construire le contenu du log
        logLine.innerHTML = `
            <span class="log-date">${date}</span>
            <span class="log-time">${time}</span>
            <span class="log-device">${device}</span>
            <span class="log-id">${pocheCode}</span>
            <span class="status-indicator ${statusIndicatorClass}">${statusText}</span>
        `;
        
        // Ajouter au début pour montrer les plus récents en haut
        if (logsContainer.firstChild) {
            logsContainer.insertBefore(logLine, logsContainer.firstChild);
        } else {
            logsContainer.appendChild(logLine);
        }
        
        // Limiter le nombre de logs affichés (garder les 100 derniers par exemple)
        const maxLogs = 100; // Valeur modifiable selon les besoins
        const logs = logsContainer.querySelectorAll('.log-line');
        if (logs.length > maxLogs) {
            for (let i = maxLogs; i < logs.length; i++) {
                if (logs[i] && logs[i].parentNode) {
                    logs[i].parentNode.removeChild(logs[i]);
                }
            }
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        adjustLogsHeight();
    }
    
    /**
     * Nettoyage lors de la destruction du widget
     */
    function destroy() {
        // Arrêter la simulation
        stopSimulation();
    }
    
    // API publique du widget
    return {
        init,
        addLogEntry,
        addLogEntryFromCode,
        startSimulation,
        stopSimulation,
        onResize,
        destroy
    };
})();