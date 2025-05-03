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
        document.documentElement.style.setProperty('--centre-h', '50vh');
        document.documentElement.style.setProperty('--centre-d', '50vw');
        
        // Ajouter la classe de positionnement absolu au dashboard
        dashboardElement.classList.add('absolute-positioning');
        
        // Charger chaque widget dans la configuration
        config.forEach(widgetConfig => {
            loadWidget(widgetConfig);
        });
        
        // Déclencher un événement pour indiquer que les widgets sont chargés
        setTimeout(() => {
            const event = new CustomEvent('widgets-loaded');
            document.dispatchEvent(event);
        }, 1000); // Délai pour s'assurer que tous les widgets sont chargés
    }
    
    /**
     * Charge un widget depuis son dossier
     * @param {Object} config - Configuration du widget
     */
    function loadWidget(config) {
        const { id, position, size, zIndex } = config;
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
                widgetElement.className = 'widget-container neumorphic';
                widgetElement.id = id;
                widgetElement.innerHTML = html;
                dashboardElement.appendChild(widgetElement);
                
                // Appliquer le positionnement et les dimensions
                applyPositioning(widgetElement, position, size, zIndex);
                
                // Charger et initialiser le JavaScript du widget
                loadJS(`${widgetPath}/${id}.js`, () => {
                    // Après le chargement du script, initialiser le widget
                    // Variable globale conventionnelle pour le widget
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
     * Applique le positionnement et les dimensions à un élément de widget
     * @param {HTMLElement} element - L'élément widget
     * @param {Object} position - Position du widget
     * @param {Object} size - Dimensions du widget
     * @param {number} zIndex - Ordre d'empilement
     */
    function applyPositioning(element, position, size, zIndex) {
        // Position absolue
        element.style.position = 'absolute';
        
        // Transformation pour centrer par rapport au point de référence
        element.style.transform = 'translate(-50%, -50%)';
        
        // Appliquer la position
        if (position) {
            if (position.top) element.style.top = position.top;
            if (position.left) element.style.left = position.left;
        }
        
        // Appliquer les dimensions
        if (size) {
            if (size.width) element.style.width = size.width;
            if (size.height) element.style.height = size.height;
        }
        
        // Appliquer le z-index
        if (zIndex !== undefined) {
            element.style.zIndex = zIndex;
        }
        
        // Ajouter la classe pour le positionnement absolu
        element.classList.add('absolute-positioned');
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
        reloadWidget
    };
})();