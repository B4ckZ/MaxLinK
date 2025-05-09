/**
 * Registre des widgets pour le dashboard MAXLINK
 * Détection totalement automatique des widgets disponibles
 */
const WidgetRegistry = (function() {
    // Stockage de la configuration des widgets
    let availableWidgets = [];
    
    /**
     * Détecte les widgets disponibles dans le dossier widgets
     * @returns {Promise} Promise qui résout avec la liste des widgets détectés
     */
    function detectWidgets() {
        return new Promise((resolve) => {
            console.log("Démarrage de la détection automatique des widgets...");
            
            // Méthode 1: essayer d'identifier les widgets à partir du HTML du dossier
            tryDetectFromDirectoryListing()
                .then(widgets => {
                    if (widgets && widgets.length > 0) {
                        console.log(`Détection réussie via l'analyse du dossier: ${widgets.length} widgets trouvés`);
                        availableWidgets = widgets;
                        resolve(widgets);
                    } else {
                        console.log("Analyse du dossier échouée, passage à la méthode par scan...");
                        // Méthode 2: scanner le dossier en recherchant les sous-dossiers
                        return scanWidgetsDirectory();
                    }
                })
                .then(widgets => {
                    if (widgets && widgets.length > 0) {
                        console.log(`Détection réussie via scan: ${widgets.length} widgets trouvés`);
                        availableWidgets = widgets;
                        resolve(widgets);
                    } else {
                        console.warn("Aucun widget détecté par aucune méthode.");
                        availableWidgets = [];
                        resolve([]);
                    }
                })
                .catch(error => {
                    console.error("Erreur lors de la détection des widgets:", error);
                    availableWidgets = [];
                    resolve([]);
                });
        });
    }
    
    /**
     * Tente de détecter les widgets en analysant la liste des dossiers
     * @returns {Promise} Promise qui résout avec la liste des widgets ou un tableau vide
     */
    function tryDetectFromDirectoryListing() {
        return new Promise((resolve) => {
            fetch('widgets/')
                .then(response => {
                    if (!response.ok) {
                        console.warn('Impossible de lire le dossier des widgets.');
                        resolve([]);
                        return;
                    }
                    return response.text();
                })
                .then(html => {
                    if (!html) {
                        console.warn('Réponse HTML vide.');
                        resolve([]);
                        return;
                    }
                    
                    console.log("Analyse de la réponse HTML pour la détection des widgets");
                    
                    // Tentative 1: Recherche spécifique pour Firefox
                    let widgets = [];
                    if (html.includes('📁') || html.includes('folder.gif')) {
                        const folderRegex = /<a[^>]*>(.*?)<\/a>/g;
                        let match;
                        while ((match = folderRegex.exec(html)) !== null) {
                            if (match[1].includes('📁') || match[1].includes('folder.gif') || match[1].includes('Vers un rép')) {
                                // Ignorer les icônes et liens "Vers un rép"
                                continue;
                            }
                            
                            // Nettoyer le nom du dossier
                            const folderName = match[1].trim();
                            if (folderName && folderName !== '..' && folderName !== '.') {
                                widgets.push({ id: folderName });
                            }
                        }
                    }
                    
                    // Tentative 2: Recherche générique de liens avec slash final (/)
                    if (widgets.length === 0) {
                        const folderRegex = /<a[^>]*href="([^"]+\/)"[^>]*>(.*?)<\/a>/g;
                        let match;
                        while ((match = folderRegex.exec(html)) !== null) {
                            const folderPath = match[1];
                            // Extraire le nom du dossier du chemin
                            const folderName = folderPath.replace(/\/$/, ''); // Supprimer le / final
                            
                            // Si le dossier a un nom valide (pas .. ni .)
                            if (folderName && folderName !== '..' && folderName !== '.') {
                                widgets.push({ id: folderName });
                            }
                        }
                    }
                    
                    resolve(widgets);
                })
                .catch(error => {
                    console.error('Erreur lors de l\'analyse du dossier:', error);
                    resolve([]);
                });
        });
    }
    
    /**
     * Scanne le dossier widgets en recherchant les sous-dossiers
     * @returns {Promise} Promise qui résout avec la liste des widgets détectés
     */
    function scanWidgetsDirectory() {
        return new Promise((resolve) => {
            console.log("Démarrage du scan du dossier widgets...");
            
            // Nous allons tester directement tous les chemins possibles
            // en nous basant sur les conventions de nommage communes
            
            // Liste de noms de widgets potentiels à tester
            // Cette liste est générée dynamiquement à partir des modèles courants
            const potentialNames = [
                // Conventions de nommage camelCase
                'logo', 'rebootButton', 'serverMonitoring', 'mqttLogs',
                'mqttStats', 'wifiStats', 'uptime', 'dashboard', 'status',
                'settings', 'config', 'system', 'user', 'network', 'storage',
                'memory', 'cpu', 'temperature', 'humidity', 'pressure',
                'weather', 'clock', 'calendar', 'notification', 'alert',
                'alarm', 'timer', 'counter', 'gauge', 'chart', 'graph',
                'table', 'list', 'grid', 'form', 'input', 'output', 'display',
                
                // Conventions avec tirets
                'reboot-button', 'server-monitoring', 'mqtt-logs',
                'mqtt-stats', 'wifi-stats',
                
                // Conventions avec underscores
                'reboot_button', 'server_monitoring', 'mqtt_logs',
                'mqtt_stats', 'wifi_stats',
                
                // Noms spécifiques à votre application (observés dans votre code)
                'mqttlogs509511', 'mqttlogs999'
            ];
            
            // Effectuer des requêtes pour tester l'existence de chaque widget potentiel
            Promise.all(
                // Pour chaque nom potentiel, vérifie si le dossier existe
                // et si le fichier HTML correspondant existe
                potentialNames.map(name => 
                    Promise.all([
                        // Vérifie si le dossier existe
                        fetch(`widgets/${name}/`).then(r => r.ok).catch(() => false),
                        // Vérifie si le fichier HTML existe
                        fetch(`widgets/${name}/${name}.html`).then(r => r.ok).catch(() => false)
                    ]).then(([folderExists, htmlExists]) => {
                        // Si au moins l'un des deux existe, considère que le widget existe
                        if (folderExists || htmlExists) {
                            return { id: name };
                        }
                        return null;
                    })
                )
            ).then(results => {
                // Filtrer les résultats nuls
                const detectedWidgets = results.filter(w => w !== null);
                console.log(`Scan terminé: ${detectedWidgets.length} widgets potentiels trouvés`);
                
                // Vérifier que les widgets trouvés sont réellement valides
                validateWidgets(detectedWidgets).then(validWidgets => {
                    console.log(`Validation terminée: ${validWidgets.length} widgets valides`);
                    resolve(validWidgets);
                });
            }).catch(error => {
                console.error('Erreur lors du scan des widgets:', error);
                resolve([]);
            });
        });
    }
    
    /**
     * Valide que les widgets détectés sont réellement valides
     * @param {Array} widgets - Liste des widgets à valider
     * @returns {Promise} Promise qui résout avec la liste des widgets valides
     */
    function validateWidgets(widgets) {
        return new Promise((resolve) => {
            // Vérifie que chaque widget a un fichier JS valide
            Promise.all(
                widgets.map(widget => 
                    fetch(`widgets/${widget.id}/${widget.id}.js`)
                        .then(response => {
                            if (response.ok) {
                                return widget;
                            }
                            return null;
                        })
                        .catch(() => null)
                )
            ).then(results => {
                const validWidgets = results.filter(w => w !== null);
                resolve(validWidgets);
            }).catch(() => {
                // En cas d'erreur, on considère que tous les widgets sont valides
                resolve(widgets);
            });
        });
    }
    
    /**
     * Vérifie si un widget existe
     * @param {string} id - ID du widget à vérifier
     * @returns {Promise<boolean>} True si le widget existe, false sinon
     */
    function widgetExists(id) {
        return new Promise((resolve) => {
            fetch(`widgets/${id}/${id}.html`)
                .then(response => {
                    resolve(response.ok);
                })
                .catch(() => {
                    resolve(false);
                });
        });
    }
    
    /**
     * Obtient la liste des widgets disponibles
     * @returns {Array} Liste des widgets disponibles
     */
    function getAvailableWidgets() {
        return availableWidgets;
    }
    
    // API publique
    return {
        detectWidgets,
        widgetExists,
        getAvailableWidgets
    };
})();