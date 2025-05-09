const logo = (function() {
    function init(element) {
        console.log('Widget Logo initialisé');
    }
    
    function onResize() {
        // Fonction vide - requise par l'API des widgets
    }
    
    return {
        init,
        onResize
    };
})();