/**
 * Registre des widgets pour le dashboard MAXLINK
 * Version universelle qui fonctionne à la fois en local avec Firefox et en hébergement sur serveur web
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
            
            // Détecter si nous sommes dans un environnement serveur (http/https) ou local (file)
            const isServerEnvironment = window.location.protocol === 'http:' || window.location.protocol === 'https:';
            console.log(`Environnement détecté: ${isServerEnvironment ? 'Serveur Web' : 'Fichier Local'}`);
            
            // On crée une liste des sous-dossiers du dossier widgets
            scanWidgetsDirectory(isServerEnvironment)
                .then(subdirectories => {
                    if (subdirectories.length > 0) {
                        console.log(`Scan direct: ${subdirectories.length} sous-dossiers trouvés dans /widgets/`);
                        
                        // Pour chaque sous-dossier, on vérifie s'il contient les fichiers d'un widget valide
                        return validateSubdirectories(subdirectories);
                    } else {
                        console.warn("Aucun sous-dossier trouvé dans /widgets/");
                        return [];
                    }
                })
                .then(validWidgets => {
                    console.log(`Validation terminée: ${validWidgets.length} widgets valides trouvés`);
                    availableWidgets = validWidgets;
                    resolve(validWidgets);
                })
                .catch(error => {
                    console.error("Erreur lors de la détection des widgets:", error);
                    resolve([]);
                });
        });
    }
    
    /**
     * Scanne le dossier widgets pour trouver tous les sous-dossiers
     * Fonctionne à la fois en mode local (Firefox) et sur serveur web
     * @param {boolean} isServerEnvironment - Indique si nous sommes dans un environnement serveur
     * @returns {Promise<Array>} Promise qui résout avec la liste des sous-dossiers
     */
    function scanWidgetsDirectory(isServerEnvironment) {
        return new Promise((resolve) => {
            // Effectuer une requête au dossier widgets
            fetch('widgets/')
                .then(response => {
                    if (!response.ok) {
                        console.warn('Impossible d\'accéder au dossier widgets.');
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
                    
                    // Enregistrer l'HTML brut dans la console pour diagnostic
                    console.log("HTML brut des dossiers (extrait):", html.substring(0, 500));
                    
                    // Liste pour stocker les sous-dossiers trouvés
                    const subdirectories = [];
                    
                    // Environnement local avec Firefox (comme celui testé)
                    if (!isServerEnvironment && (html.includes('201:') && html.includes('DIRECTORY'))) {
                        console.log("Format Firefox détecté: extraction basée sur le motif '201: nom DIRECTORY'");
                        
                        // Approche basée sur les lignes qui a bien fonctionné dans vos tests
                        const lines = html.split('\n');
                        
                        lines.forEach(line => {
                            const trimmedLine = line.trim();
                            
                            if (trimmedLine.startsWith('201:') && trimmedLine.includes('DIRECTORY')) {
                                // Utiliser l'expression régulière qui a bien fonctionné dans les tests
                                const match = trimmedLine.match(/201:\s+(\S+)/);
                                if (match && match[1]) {
                                    const folderName = match[1];
                                    
                                    // Ignorer les dossiers spéciaux
                                    if (folderName && 
                                        folderName !== '..' && 
                                        folderName !== '.' && 
                                        !folderName.includes('vers un') && 
                                        !subdirectories.includes(folderName)) {
                                        
                                        subdirectories.push(folderName);
                                        console.log(`Dossier détecté via le format Firefox: ${folderName}`);
                                    }
                                }
                            }
                        });
                    }
                    // Environnement serveur web standard (listings de répertoires)
                    else if (isServerEnvironment) {
                        console.log("Format serveur web détecté: extraction basée sur les liens de dossiers");
                        
                        // Dans un environnement serveur, les dossiers sont généralement des liens se terminant par un slash
                        const directoryLinksRegex = /<a[^>]*href="([^"]+\/)"[^>]*>/g;
                        let linkMatch;
                        
                        while ((linkMatch = directoryLinksRegex.exec(html)) !== null) {
                            const folderPath = linkMatch[1];
                            const folderName = folderPath.replace(/\/$/, ''); // Enlever le slash final
                            
                            if (folderName && 
                                folderName !== '..' && 
                                folderName !== '.' && 
                                !folderName.includes('vers un') && 
                                !subdirectories.includes(folderName)) {
                                
                                subdirectories.push(folderName);
                                console.log(`Dossier détecté via les liens: ${folderName}`);
                            }
                        }
                    }
                    
                    // Si aucune des méthodes précédentes n'a fonctionné, essayer une approche plus générique
                    if (subdirectories.length === 0) {
                        console.log("Tentative d'extraction générique");
                        
                        // Essayer de trouver des liens vers des dossiers de manière plus générique
                        const genericLinksRegex = /<a[^>]*>([^<]+)<\/a>/g;
                        let genericMatch;
                        
                        while ((genericMatch = genericLinksRegex.exec(html)) !== null) {
                            const text = genericMatch[1].trim();
                            
                            if (text && 
                                text !== '..' && 
                                text !== '.' && 
                                !text.includes('Parent Directory') && 
                                !subdirectories.includes(text)) {
                                
                                // Vérifier si c'est un dossier en regardant si un lien avec slash existe
                                if (html.includes(`href="${text}/"`)) {
                                    subdirectories.push(text);
                                    console.log(`Dossier détecté via approche générique: ${text}`);
                                }
                            }
                        }
                    }
                    
                    // Si aucune des méthodes précédentes n'a fonctionné, utiliser la liste de secours
                    if (subdirectories.length === 0) {
                        console.warn("Passage à la liste de secours des dossiers connus");
                        
                        // Liste des noms de widgets connus (basée sur la structure de votre projet)
                        const knownWidgets = [
                            // 'logo', 'mqttlogs509511', 'mqttlogs999', 'mqttstats',
                            // 'rebootbutton', 'servermonitoring', 'uptime', 'wifistats', 'clock'
                        ];
                        
                        subdirectories.push(...knownWidgets);
                        console.log(`Utilisation de la liste de secours: ${knownWidgets.join(', ')}`);
                    }
                    
                    console.log(`Sous-dossiers identifiés: ${subdirectories.join(', ')}`);
                    resolve(subdirectories);
                })
                .catch(error => {
                    console.error('Erreur lors du scan du dossier widgets:', error);
                    
                    // En cas d'erreur, utiliser la liste de secours
                    const knownWidgets = [
/*                         'logo', 'mqttlogs509511', 'mqttlogs999', 'mqttstats',
                        'rebootbutton', 'servermonitoring', 'uptime', 'wifistats', 'clock' */
                    ];
                    
                    console.log(`Utilisation de la liste de secours suite à une erreur: ${knownWidgets.join(', ')}`);
                    resolve(knownWidgets);
                });
        });
    }
    
    /**
     * Valide que les sous-dossiers contiennent des widgets valides
     * @param {Array} subdirectories - Liste des sous-dossiers à valider
     * @returns {Promise<Array>} Promise qui résout avec la liste des widgets valides
     */
    function validateSubdirectories(subdirectories) {
        return new Promise((resolve) => {
            console.log("Validation des sous-dossiers comme widgets...");
            
            // Pour chaque sous-dossier, vérifier s'il contient les fichiers d'un widget valide
            Promise.all(
                subdirectories.map(dir => {
                    // Si dir est déjà un objet avec un id, extraire l'id
                    const dirId = typeof dir === 'object' ? dir.id : dir;
                    
                    return Promise.all([
                        // Vérifier l'existence du fichier HTML
                        fetch(`widgets/${dirId}/${dirId}.html`)
                            .then(response => response.ok)
                            .catch(() => false),
                        
                        // Vérifier l'existence du fichier JS
                        fetch(`widgets/${dirId}/${dirId}.js`)
                            .then(response => response.ok)
                            .catch(() => false)
                    ]).then(([htmlExists, jsExists]) => {
                        // Un widget est considéré comme valide s'il a au moins son fichier HTML et JS
                        if (htmlExists && jsExists) {
                            console.log(`Widget valide trouvé: ${dirId}`);
                            return { id: dirId };
                        }
                        console.warn(`Dossier ignoré (fichiers manquants): ${dirId}`);
                        return null;
                    });
                })
            ).then(results => {
                // Filtrer les résultats nuls
                const validWidgets = results.filter(w => w !== null);
                resolve(validWidgets);
            }).catch(error => {
                console.error('Erreur lors de la validation des widgets:', error);
                resolve([]);
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
            Promise.all([
                fetch(`widgets/${id}/${id}.html`).then(r => r.ok).catch(() => false),
                fetch(`widgets/${id}/${id}.js`).then(r => r.ok).catch(() => false)
            ]).then(([htmlExists, jsExists]) => {
                resolve(htmlExists && jsExists);
            }).catch(() => {
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