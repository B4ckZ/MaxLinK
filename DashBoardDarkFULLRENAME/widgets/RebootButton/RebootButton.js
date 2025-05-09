window.rebootbutton = (function() {
    // Variables privées du widget
    let widgetElement;
    let rebootBtn;
    let isRebooting = false;
    
    /**
     * Initialise le widget
     * @param {HTMLElement} element - L'élément DOM du widget
     */
    function init(element) {
        widgetElement = element;
        widgetElement.id = 'reboot-button-widget';
        
        // Récupérer le bouton
        rebootBtn = widgetElement.querySelector('#reboot-btn');
        
        if (rebootBtn) {
            // Ajouter l'écouteur d'événement
            rebootBtn.addEventListener('click', handleRebootClick);
            console.log('Bouton de redémarrage initialisé avec succès');
        } else {
            console.error('Bouton de redémarrage non trouvé');
        }
    }
    
    /**
     * Gère le clic sur le bouton de redémarrage
     */
    function handleRebootClick() {
        if (isRebooting) return; // Éviter les clics multiples
        
        // Demander confirmation
        if (confirm('Êtes-vous sûr de vouloir redémarrer le Raspberry Pi ?')) {
            isRebooting = true;
            
            // Ajouter la classe pour l'animation
            rebootBtn.classList.add('active');
            
            // Simuler un appel à une API pour redémarrer (à remplacer par un vrai appel API)
            console.log('Envoi de la commande de redémarrage au Raspberry Pi...');
            
            // Dans une implémentation réelle, vous devriez faire un appel AJAX comme celui-ci:
            /*
            fetch('/api/system/reboot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log('Redémarrage en cours:', data);
                // Le serveur va redémarrer, donc on ne recevra probablement pas de réponse complète
            })
            .catch(error => {
                console.error('Erreur lors du redémarrage:', error);
                isRebooting = false;
                rebootBtn.classList.remove('active');
                alert('Erreur lors du redémarrage. Vérifiez la console pour plus de détails.');
            });
            */
            
            // Pour simuler le comportement pour l'instant
            setTimeout(() => {
                alert('Le Raspberry Pi redémarre maintenant. La page va être rechargée dans quelques secondes.');
                
                // Attendre quelques secondes puis recharger la page
                setTimeout(() => {
                    window.location.reload();
                }, 5000);
            }, 2000);
        }
    }
    
    /**
     * Appelé lors du redimensionnement de la fenêtre
     */
    function onResize() {
        // Pas d'ajustement nécessaire pour ce widget
    }
    
    // API publique du widget
    return {
        init,
        onResize
    };
})();