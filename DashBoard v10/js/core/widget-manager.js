/**
 * Gestionnaire de widgets pour le dashboard MAXLINK
 * Responsable du chargement, de l'initialisation et de la gestion des widgets
 */

const WidgetManager = (function() {
    // Cache privé des widgets chargés
    const loadedWidgets = {};
    // Référence à l'élément dashboard
    let dashboardElement;
    // Stockage de la configuration des widgets pour réutilisation
    let widgetsConfiguration = [];
    
    /**
     * Initialise le gestionnaire de widgets
     * @param {Array} config - Configuration des widgets à charger
     */
    function init(config) {
        console.log('Initialisation du gestionnaire de widgets');
        dashboardElement = document.querySelector('.dashboard');
        
        if (!dashboardElement) {
            console.error('Élément dashboard non trouvé');
            return;
        }
        
        // Stocker la configuration pour réutilisation
        widgetsConfiguration = config;
        
        // Définir les variables CSS pour le centrage
        updateCenterVariables();
        
        // Charger chaque widget dans la configuration
        config.forEach(widgetConfig => {
            loadWidget(widgetConfig);
        });
        
        // Déclencher un événement pour indiquer que les widgets sont chargés
        setTimeout(() => {
            const event = new CustomEvent('widgets-loaded');
            document.dispatchEvent(event);
        }, 1000);
        
        // Ajouter un écouteur pour les redimensionnements de fenêtre
        window.addEventListener('resize', Utils.debounce(() => {
            updateCenterVariables();
            // Informer tous les widgets du redimensionnement
            Object.values(loadedWidgets).forEach(widget => {
                if (typeof widget.onResize === 'function') {
                    widget.onResize();
                }
            });
        }, 250));
    }
    
    /**
     * Met à jour les variables CSS du centre de l'écran
     */
    function updateCenterVariables() {
        const height = window.innerHeight;
        const width = window.innerWidth;
        document.documentElement.style.setProperty('--centre-h', `${height / 2}px`);
        document.documentElement.style.setProperty('--centre-d', `${width / 2}px`);
    }
    
    /**
     * Charge un widget depuis son dossier
     * @param {Object} config - Configuration du widget
     */
    function loadWidget(config) {
        const { id } = config;
        const widgetPath = `widgets/${id}`;
        
        console.log(`Chargement du widget: ${id}`);
        
        // Charger le CSS du widget
        loadCSS(`${widgetPath}/${id}.css`);
        
        // Charger le HTML du widget
        fetch(`${widgetPath}/${id}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Impossible de charger le HTML du widget ${id}`);
                }
                return response.text();
            })
            .then(html => {
                // Injecter le HTML dans le dashboard
                const widgetElement = document.createElement('div');
                widgetElement.className = 'widget-container';
                widgetElement.id = id;
                widgetElement.innerHTML = html;
                dashboardElement.appendChild(widgetElement);
                
                // Charger et initialiser le JavaScript du widget
                loadJS(`${widgetPath}/${id}.js`, () => {
                    // Après le chargement du script, initialiser le widget
                    const widgetVarName = `${id}Widget`;
                    
                    // Vérifier si le widget est disponible
                    if (window[widgetVarName] && typeof window[widgetVarName].init === 'function') {
                        window[widgetVarName].init(widgetElement);
                        // Stocker le widget dans le cache
                        loadedWidgets[id] = window[widgetVarName];
                        console.log(`Widget ${id} initialisé avec succès`);
                    } else {
                        console.error(`Widget ${id} n'a pas de méthode d'initialisation ou n'est pas correctement défini`);
                    }
                });
            })
            .catch(error => {
                console.error(`Erreur lors du chargement du widget ${id}:`, error);
            });
    }
    
    /**
     * Charge une feuille de style CSS
     * @param {string} url - URL du fichier CSS
     */
    function loadCSS(url) {
        // Vérifier si la feuille de style est déjà chargée
        const existingLinks = document.querySelectorAll('link[rel="stylesheet"]');
        for (const link of existingLinks) {
            if (link.href.endsWith(url)) {
                return; // La feuille de style est déjà chargée
            }
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }
    
    /**
     * Charge un script JavaScript
     * @param {string} url - URL du fichier JavaScript
     * @param {Function} callback - Fonction à exécuter après le chargement
     */
    function loadJS(url, callback) {
        // Vérifier si le script est déjà chargé
        const existingScripts = document.querySelectorAll('script');
        for (const script of existingScripts) {
            if (script.src.endsWith(url)) {
                callback(); // Le script est déjà chargé, exécuter le callback
                return;
            }
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        script.onerror = function() {
            console.error(`Erreur lors du chargement du script: ${url}`);
        };
        document.body.appendChild(script);
    }
    
    /**
     * Obtient un widget par son ID
     * @param {string} id - ID du widget
     * @returns {Object} Le widget s'il existe, sinon null
     */
    function getWidget(id) {
        return loadedWidgets[id] || null;
    }
    
    /**
     * Obtient tous les widgets chargés
     * @returns {Object} Objet contenant tous les widgets chargés
     */
    function getWidgets() {
        return loadedWidgets;
    }
    
    /**
     * Recharge un widget
     * @param {string} id - ID du widget à recharger
     */
    function reloadWidget(id) {
        const widgetConfig = widgetsConfiguration.find(config => config.id === id);
        if (widgetConfig) {
            // Supprimer le widget existant
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
            // Supprimer du cache
            delete loadedWidgets[id];
            // Recharger
            loadWidget(widgetConfig);
        } else {
            console.error(`Configuration pour le widget ${id} non trouvée`);
        }
    }
    
    // API publique
    return {
        init,
        getWidget,
        getWidgets,
        reloadWidget,
        updateCenterVariables
    };
})();