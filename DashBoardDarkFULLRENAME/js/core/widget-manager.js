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
    // Drapeau pour suivre l'état d'initialisation
    let isInitialized = false;
    
    /**
     * Initialise le gestionnaire de widgets
     * @param {Array} [config] - Configuration optionnelle des widgets à charger
     * @returns {Promise} Promise qui résout quand les widgets sont initialisés
     */
    function init(config) {
        console.log('Initialisation du gestionnaire de widgets');
        dashboardElement = document.querySelector('.dashboard');
        
        if (!dashboardElement) {
            console.error('Élément dashboard non trouvé');
            return Promise.reject('Élément dashboard non trouvé');
        }
        
        // Définir les variables CSS pour le centrage
        updateCenterVariables();
        
        // Si une configuration est fournie, l'utiliser, sinon détecter les widgets
        if (config && Array.isArray(config) && config.length > 0) {
            return initWidgetsFromConfig(config);
        } else {
            return initWidgetsFromRegistry();
        }
    }
    
    /**
     * Initialise les widgets à partir d'une configuration
     * @param {Array} config - Configuration des widgets à charger
     * @returns {Promise} Promise qui résout quand les widgets sont initialisés
     */
    function initWidgetsFromConfig(config) {
        return new Promise((resolve) => {
            // Stocker la configuration pour réutilisation
            widgetsConfiguration = config;
            
            // Charger chaque widget dans la configuration
            config.forEach(widgetConfig => {
                loadWidget(widgetConfig);
            });
            
            // Marquer comme initialisé
            isInitialized = true;
            
            // Déclencher un événement pour indiquer que les widgets sont chargés
            setTimeout(() => {
                const event = new CustomEvent('widgets-loaded');
                document.dispatchEvent(event);
                resolve(config);
            }, 1000);
            
            // Ajouter un écouteur pour les redimensionnements de fenêtre
            setupResizeListener();
        });
    }
    
    /**
     * Initialise les widgets à partir du registre de widgets
     * @returns {Promise} Promise qui résout quand les widgets sont initialisés
     */
    function initWidgetsFromRegistry() {
        return WidgetRegistry.detectWidgets()
            .then(widgets => {
                console.log(`${widgets.length} widgets détectés:`, widgets.map(w => w.id));
                
                if (widgets.length === 0) {
                    console.warn('Aucun widget détecté. Le dashboard pourrait être vide.');
                }
                
                // Stocker la configuration pour réutilisation
                widgetsConfiguration = widgets;
                
                // Vérifier que les positions CSS existent pour tous les widgets
                checkPositionsCSS(widgets);
                
                // Charger chaque widget détecté
                widgets.forEach(widgetConfig => {
                    loadWidget(widgetConfig);
                });
                
                // Marquer comme initialisé
                isInitialized = true;
                
                // Déclencher un événement pour indiquer que les widgets sont chargés
                setTimeout(() => {
                    const event = new CustomEvent('widgets-loaded');
                    document.dispatchEvent(event);
                }, 1000);
                
                // Ajouter un écouteur pour les redimensionnements de fenêtre
                setupResizeListener();
                
                return widgets;
            });
    }
    
    /**
     * Vérifie que les positions CSS existent pour tous les widgets
     * @param {Array} widgets - Liste des widgets à vérifier
     */
    function checkPositionsCSS(widgets) {
        // Récupérer le contenu du fichier CSS de positions
        fetch('css/custom-positions.css')
            .then(response => response.text())
            .then(css => {
                // Vérifier que chaque widget a une entrée dans le CSS
                widgets.forEach(widget => {
                    const idSelector = `#${widget.id}`;
                    if (!css.includes(idSelector)) {
                        console.warn(`Position CSS non trouvée pour le widget ${widget.id}. Le widget pourrait ne pas s'afficher correctement.`);
                    }
                });
            })
            .catch(error => {
                console.error('Erreur lors de la vérification des positions CSS:', error);
            });
    }
    
    /**
     * Configure l'écouteur de redimensionnement de fenêtre
     */
    function setupResizeListener() {
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
                    // Utiliser directement l'ID comme nom de variable
                    const widgetVarName = id;
                    
                    // Vérifier si le widget est disponible
                    if (window[widgetVarName] && typeof window[widgetVarName].init === 'function') {
                        window[widgetVarName].init(widgetElement);
                        // Stocker le widget dans le cache
                        loadedWidgets[id] = window[widgetVarName];
                        console.log(`Widget ${id} initialisé avec succès`);
                    } else {
                        console.error(`Widget ${id} n'a pas de méthode d'initialisation ou n'est pas correctement défini. Variable attendue: ${widgetVarName}`);
                    }
                });
            })
            .catch(error => {
                console.error(`Erreur lors du chargement du widget ${id}:`, error);
            });
    }
    
    // Reste des fonctions (loadCSS, loadJS, getWidget, getWidgets, reloadWidget) reste inchangé...
    
    // API publique étendue
    return {
        init,
        getWidget,
        getWidgets,
        reloadWidget,
        updateCenterVariables,
        isInitialized: function() { return isInitialized; }
    };
})();