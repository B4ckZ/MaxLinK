/**
 * Widget Server Monitoring pour MAXLINK Dashboard
 * Affiche les métriques principales du serveur
 */

const serverMonitoringWidget = (function() {
    // Variables privées du widget
    let widgetElement;
    let config = {
        // Configuration par défaut du widget
        updateInterval: 5000, // Intervalle de mise à jour en millisecondes
        // URL d'API fictive - dans un cas réel, ce serait l'URL de votre API
        apiEndpoint: 'api/server-stats'
    };
    
    // État interne des données
    let data = {
        cpu: {
            core1: 62,
            core2: 41,
            core3: 79,
            core4: 59
        },
        temperature: {
            cpu: 69,
            gpu: 64
        },
        frequency: {
            cpu: 2.8,
            gpu: 354
        },
        memory: {
            ram: 60,
            ssd: 45
        }
    };
    
    // Intervalle de mise à jour
    let updateTimer;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     * @param {Object} customConfig - Configuration personnalisée (optionnelle)
     */
    function init(element, customConfig = {}) {
        widgetElement = element;
        
        // Fusionner la configuration personnalisée avec les valeurs par défaut
        config = {...config, ...customConfig};
        
        console.log('Widget Server Monitoring initialisé');
        
        // Animer les barres de progression initialement
        animateProgressBars();
        
        // Premier chargement des données et démarrage de la mise à jour périodique
        loadData();
        startUpdateInterval();
    }
    
    /**
     * Animation des barres de progression
     */
    function animateProgressBars() {
        const progressBars = widgetElement.querySelectorAll('.progress-bar');
        
        progressBars.forEach(bar => {
            const targetWidth = bar.style.width;
            bar.style.width = '0';
            
            setTimeout(() => {
                bar.style.transition = 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
                bar.style.width = targetWidth;
            }, 300);
        });
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
        }, config.updateInterval);
    }
    
    /**
     * Charge ou rafraîchit les données du widget
     */
    function loadData() {
        // Dans une application réelle, vous feriez un appel API ici
        // Pour l'exemple, nous simulons des données changeantes
        
        // Simuler des changements de données
        simulateDataChanges();
        
        // Mettre à jour l'interface avec les nouvelles données
        updateUI();
    }
    
    /**
     * Simule des changements de données pour la démonstration
     */
    function simulateDataChanges() {
        // Fonction utilitaire pour générer une variation aléatoire
        const randomVariation = (value, maxVariation = 5, min = 0, max = 100) => {
            const variation = (Math.random() - 0.5) * 2 * maxVariation;
            return Math.min(Math.max(value + variation, min), max);
        };
        
        // Varier les données CPU
        data.cpu.core1 = randomVariation(data.cpu.core1);
        data.cpu.core2 = randomVariation(data.cpu.core2);
        data.cpu.core3 = randomVariation(data.cpu.core3);
        data.cpu.core4 = randomVariation(data.cpu.core4);
        
        // Varier les températures
        data.temperature.cpu = randomVariation(data.temperature.cpu, 1, 40, 90);
        data.temperature.gpu = randomVariation(data.temperature.gpu, 1, 40, 90);
        
        // Varier légèrement les fréquences
        data.frequency.cpu = parseFloat(randomVariation(data.frequency.cpu, 0.1, 1.5, 4.0).toFixed(1));
        data.frequency.gpu = Math.round(randomVariation(data.frequency.gpu, 10, 200, 800));
        
        // Varier la mémoire
        data.memory.ram = randomVariation(data.memory.ram, 2);
        data.memory.ssd = randomVariation(data.memory.ssd, 1);
    }
    
    /**
     * Met à jour l'interface utilisateur avec les nouvelles données
     */
    function updateUI() {
        // Mettre à jour les barres de progression CPU
        updateProgressBar('Core 1', data.cpu.core1, '%');
        updateProgressBar('Core 2', data.cpu.core2, '%');
        updateProgressBar('Core 3', data.cpu.core3, '%');
        updateProgressBar('Core 4', data.cpu.core4, '%');
        
        // Mettre à jour les températures
        updateProgressBar('T-CPU', data.temperature.cpu, '°C');
        updateProgressBar('T-GPU', data.temperature.gpu, '°C');
        
        // Mettre à jour les fréquences
        updateProgressBar('F-CPU', data.frequency.cpu, ' GHz');
        updateProgressBar('F-GPU', data.frequency.gpu, ' MHz');
        
        // Mettre à jour la mémoire
        updateProgressBar('RAM', data.memory.ram, '%');
        updateProgressBar('SSD', data.memory.ssd, '%');
    }
    
    /**
     * Met à jour une barre de progression spécifique
     * @param {string} label - Étiquette de la barre de progression
     * @param {number} value - Valeur à afficher
     * @param {string} unit - Unité à afficher (%, °C, etc.)
     */
    function updateProgressBar(label, value, unit) {
        // Trouver la ligne contenant cette étiquette
        const progressRows = widgetElement.querySelectorAll('.progress-row');
        let targetRow;
        
        for (const row of progressRows) {
            const labelElement = row.querySelector('.progress-label, .progress-label-wide, .progress-label-short');
            if (labelElement && labelElement.textContent.trim() === label) {
                targetRow = row;
                break;
            }
        }
        
        if (targetRow) {
            // Mettre à jour la barre de progression
            const progressBar = targetRow.querySelector('.progress-bar');
            const progressValue = targetRow.querySelector('.progress-value');
            
            if (progressBar) {
                // Pour les pourcentages, la largeur est directement la valeur
                // Pour les autres unités, on calcule une proportion
                let width;
                
                if (unit === '%') {
                    width = value;
                } else if (unit === '°C') {
                    // Température: échelle de 30°C à 100°C
                    width = ((value - 30) / 70) * 100;
                } else if (unit === ' GHz') {
                    // Fréquence CPU: échelle de 1 à 5 GHz
                    width = (value / 5) * 100;
                } else if (unit === ' MHz') {
                    // Fréquence GPU: échelle de 100 à 1000 MHz
                    width = (value / 1000) * 100;
                }
                
                // Limiter la largeur entre 0 et 100%
                width = Math.min(Math.max(width, 0), 100);
                
                progressBar.style.width = `${width}%`;
            }
            
            if (progressValue) {
                progressValue.textContent = `${value}${unit}`;
            }
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Aucune action spécifique nécessaire pour ce widget lors du redimensionnement
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
    
    /**
     * Définit une nouvelle configuration
     * @param {Object} newConfig - Nouvelle configuration
     */
    function setConfig(newConfig) {
        config = {...config, ...newConfig};
        
        // Si l'intervalle de mise à jour a changé, redémarrer l'intervalle
        if (newConfig.updateInterval) {
            startUpdateInterval();
        }
    }
    
    // API publique du widget
    return {
        init,
        loadData,
        setConfig,
        onResize,
        destroy
    };
})();