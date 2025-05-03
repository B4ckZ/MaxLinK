/**
 * Gestionnaire de widgets pour le dashboard MAXLINK
 * Responsable du chargement, de l'initialisation et de la gestion des widgets
 */

const WidgetManager = (function() {
    // Cache privé des widgets chargés
    const loadedWidgets = {};
    // Référence à l'élément dashboard
    let dashboardElement;
    
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
        
        // Définir les variables CSS pour le centrage
        document.documentElement.style.setProperty('--centre-h', '50vh');
        document.documentElement.style.setProperty('--centre-d', '50vw');
        
        // Ajouter la classe de positionnement absolu au dashboard
        dashboardElement.classList.add('absolute-positioning');
        
        // Charger chaque widget dans la configuration
        config.forEach(widgetConfig => {
            loadWidget(widgetConfig);
        });
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
                    // Après le chargement du script, le widget doit s'enregistrer lui-même
                    if (window[`${id}Widget`] && typeof window[`${id}Widget`].init === 'function') {
                        window[`${id}Widget`].init(widgetElement);
                        // Stocker le widget dans le cache
                        loadedWidgets[id] = window[`${id}Widget`];
                    } else {
                        console.error(`Widget ${id} n'a pas de méthode d'initialisation`);
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
     * Recharge un widget
     * @param {string} id - ID du widget à recharger
     */
    function reloadWidget(id) {
        const widgetConfig = widgetsConfig.find(config => config.id === id);
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
        }
    }
    
    // API publique
    return {
        init,
        getWidget,
        reloadWidget
    };
})();