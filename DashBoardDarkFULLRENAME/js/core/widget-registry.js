/**
 * Registre des widgets pour le dashboard MAXLINK
 * Responsable de la détection des widgets disponibles
 */
const WidgetRegistry = (function() {
    // Stockage de la configuration des widgets
    let availableWidgets = [];
    
    /**
     * Détecte les widgets disponibles dans le dossier widgets
     * @returns {Promise} Promise qui résout avec la liste des widgets détectés
     */
    function detectWidgets() {
        return new Promise((resolve, reject) => {
            // Utiliser une requête XHR ou fetch pour obtenir la liste des sous-dossiers de widgets
            fetch('widgets/')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Impossible de lire le dossier des widgets');
                    }
                    return response.text();
                })
                .then(html => {
                    // Extraire les noms de dossiers des widgets à partir de la réponse HTML
                    const regex = /<a[^>]*href="([^"]+\/)"/g;
                    const widgets = [];
                    let match;
                    
                    while ((match = regex.exec(html)) !== null) {
                        const folderName = match[1].replace('/', '');
                        // Ignorer les dossiers spéciaux comme '..' ou '.'
                        if (folderName !== '..' && folderName !== '.' && folderName !== '') {
                            widgets.push({ id: folderName });
                        }
                    }
                    
                    availableWidgets = widgets;
                    resolve(widgets);
                })
                .catch(error => {
                    console.error('Erreur lors de la détection des widgets:', error);
                    // En cas d'erreur, résoudre avec une liste vide pour ne pas bloquer le chargement
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