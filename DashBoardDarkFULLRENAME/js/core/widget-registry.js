/**
 * Registre des widgets pour le dashboard MAXLINK
 * Détection totalement automatique des widgets par scan direct du dossier
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
            
            // On crée une liste des sous-dossiers du dossier widgets
            scanWidgetsDirectory()
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
     * @returns {Promise<Array>} Promise qui résout avec la liste des sous-dossiers
     */
    function scanWidgetsDirectory() {
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
                    
                    // Liste pour stocker les sous-dossiers trouvés
                    const subdirectories = [];
                    
                    // Méthode 1: Analyse Firefox-style
                    if (html.includes('📁') || html.includes('folder.gif')) {
                        console.log("Détection des dossiers au format Firefox");
                        
                        // Différentes expressions régulières pour capturer les noms de dossiers
                        // dans différents formats de page d'index de dossiers
                        const patterns = [
                            // Motif Firefox standard avec icônes
                            /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?<a[^>]*>(📁|<img[^>]*>)[^<]*<\/a>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g,
                            
                            // Motif Firefox plus simple
                            /<a[^>]*>[^<]*?📁[^<]*?<\/a>[^<]*?<a[^>]*>([^<]+)<\/a>/g,
                            
                            // Liens directs avec / à la fin
                            /<a[^>]*href="([^"]+\/)"/g
                        ];
                        
                        // Essayer chaque motif jusqu'à trouver des dossiers
                        for (const pattern of patterns) {
                            const regex = new RegExp(pattern);
                            let match;
                            const tempDirs = [];
                            
                            while ((match = regex.exec(html)) !== null) {
                                // Le nom du dossier peut être dans différents groupes selon le pattern
                                let folderName = match[1];
                                
                                // Si le motif a capturé l'icône dans le groupe 1, 
                                // alors le nom du dossier est dans le groupe 2
                                if (match[2]) {
                                    folderName = match[2];
                                }
                                
                                // Nettoyer le nom du dossier
                                folderName = folderName.trim();
                                
                                // Si le nom contient un slash, obtenir juste le nom du dossier
                                if (folderName.includes('/')) {
                                    folderName = folderName.replace(/\/$/, '');
                                    
                                    // Si le chemin contient des sous-dossiers, prendre juste le dernier niveau
                                    const parts = folderName.split('/');
                                    folderName = parts[parts.length - 1];
                                }
                                
                                // Ignorer les dossiers spéciaux
                                if (folderName && folderName !== '..' && folderName !== '.' && 
                                    !folderName.includes('vers un') && !folderName.includes('parent')) {
                                    tempDirs.push(folderName);
                                }
                            }
                            
                            if (tempDirs.length > 0) {
                                subdirectories.push(...tempDirs);
                                break; // Sortir de la boucle si des dossiers ont été trouvés
                            }
                        }
                    }
                    
                    // Méthode 2: Vérification directe
                    // Si aucun dossier n'a été trouvé avec l'analyse HTML,
                    // on utilise une approche plus directe
                    if (subdirectories.length === 0) {
                        console.log("Passage à la vérification directe des dossiers");
                        
                        // Liste des noms de widgets connus (basée sur la structure de votre projet)
                        // Cette liste sert uniquement de filet de sécurité si l'analyse HTML échoue
                        const knownWidgets = [
                            'logo', 'mqttlogs509511', 'mqttlogs999', 'mqttstats',
                            'rebootbutton', 'servermonitoring', 'uptime', 'wifistats'
                        ];
                        
                        // En mode sécurité, on ajoute ces widgets connus à la liste pour vérification
                        subdirectories.push(...knownWidgets);
                    }
                    
                    console.log(`Sous-dossiers identifiés: ${subdirectories.join(', ')}`);
                    resolve(subdirectories);
                })
                .catch(error => {
                    console.error('Erreur lors du scan du dossier widgets:', error);
                    resolve([]);
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
                    return Promise.all([
                        // Vérifier l'existence du fichier HTML
                        fetch(`widgets/${dir}/${dir}.html`)
                            .then(response => response.ok)
                            .catch(() => false),
                        
                        // Vérifier l'existence du fichier JS
                        fetch(`widgets/${dir}/${dir}.js`)
                            .then(response => response.ok)
                            .catch(() => false)
                    ]).then(([htmlExists, jsExists]) => {
                        // Un widget est considéré comme valide s'il a au moins son fichier HTML et JS
                        if (htmlExists && jsExists) {
                            console.log(`Widget valide trouvé: ${dir}`);
                            return { id: dir };
                        }
                        console.log(`Dossier ignoré (fichiers manquants): ${dir}`);
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