/**
 * Widget Uptime pour MAXLINK Dashboard
 * Affiche le temps écoulé depuis le dernier redémarrage du système
 */

const uptimeWidget = (function() {
    // Variables privées
    let widgetElement;
    let uptimeElement;
    let config = {
        refreshInterval: 1000, // Mise à jour toutes les secondes
        animateChanges: true,
        simulateMode: true // Pour la démo - à désactiver en production
    };
    
    // Variables pour le compteur simulé
    let simulatedUptime = {
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
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        widgetElement = element;
        uptimeElement = widgetElement.querySelector('[data-metric="uptime"]');
        
        // Fusionner la configuration personnalisée
        Object.assign(config, customConfig);
        
        console.log('Widget Uptime initialisé');
        
        // Initialiser le compteur simulé avec une valeur aléatoire
        if (config.simulateMode) {
            simulatedUptime.totalSeconds = Math.floor(Math.random() * 1000000); // Valeur aléatoire pour la démo
            updateSimulatedUptime();
        }
        
        // Charger les données initiales
        loadData();
        
        // Mettre en place l'intervalle de rafraîchissement
        startUpdateInterval();
        
        // Ajouter les écouteurs d'événements
        setupEventListeners();
    }
    
    /**
     * Charge ou rafraîchit les données du widget
     */
    function loadData() {
        if (config.simulateMode) {
            // Mode simulation - incrémenter le compteur
            simulatedUptime.totalSeconds++;
            updateSimulatedUptime();
            updateUptimeDisplay();
        } else {
            // Mode réel - appel API
            fetchUptimeData()
                .then(data => {
                    updateValue(data.uptime);
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération de l\'uptime:', error);
                });
        }
    }
    
    /**
     * Récupère les données d'uptime depuis l'API
     * @returns {Promise} Promesse contenant les données d'uptime
     */
    function fetchUptimeData() {
        // Implémentez ici l'appel à votre API réelle
        // Exemple : return fetch('/api/system/uptime').then(res => res.json());
        
        // Simulation pour la démonstration
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ uptime: '3d 12h 45m 30s' });
            }, 100);
        });
    }
    
    /**
     * Met à jour le compteur simulé
     */
    function updateSimulatedUptime() {
        const seconds = simulatedUptime.totalSeconds;
        
        simulatedUptime.days = Math.floor(seconds / 86400);
        simulatedUptime.hours = Math.floor((seconds % 86400) / 3600);
        simulatedUptime.minutes = Math.floor((seconds % 3600) / 60);
        simulatedUptime.seconds = seconds % 60;
    }
    
    /**
     * Met à jour l'affichage de l'uptime
     */
    function updateUptimeDisplay() {
        const { days, hours, minutes, seconds } = simulatedUptime;
        
        const uptimeStr = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
        
        updateValue(uptimeStr);
    }
    
    /**
     * Démarre l'intervalle de mise à jour
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
     * Configure les écouteurs d'événements
     */
    function setupEventListeners() {
        // Ajouter un effet de clic sur le cadre intérieur (optionnel)
        const insetElement = widgetElement.querySelector('.uptime-inset');
        
        if (insetElement) {
            insetElement.addEventListener('click', () => {
                // Effet visuel au clic
                insetElement.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    insetElement.style.transform = '';
                }, 200);
                
                // Forcer un rafraîchissement des données
                loadData();
            });
        }
    }
    
    /**
     * Met à jour la valeur affichée
     * @param {string} value - Nouvelle valeur d'uptime
     */
    function updateValue(value) {
        if (uptimeElement && value !== undefined) {
            // Animation subtile lors de la mise à jour
            if (config.animateChanges) {
                uptimeElement.classList.remove('value-update');
                // Utiliser requestAnimationFrame pour forcer un re-flow
                window.requestAnimationFrame(() => {
                    uptimeElement.classList.add('value-update');
                });
            }
            
            uptimeElement.textContent = value;
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Le CSS gère automatiquement l'adaptation aux différentes tailles
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
        
        // Retirer les écouteurs d'événements
        const insetElement = widgetElement.querySelector('.uptime-inset');
        if (insetElement) {
            insetElement.removeEventListener('click', () => {});
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