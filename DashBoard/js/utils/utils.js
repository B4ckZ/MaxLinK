/**
 * Fonctions utilitaires partagées
 */

const Utils = (function() {
    /**
     * Crée une fonction debounce qui limite les appels fréquents
     * @param {Function} func - La fonction à exécuter
     * @param {number} delay - Le délai en millisecondes
     * @returns {Function} - La fonction debounced
     */
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    /**
     * Ajuste la hauteur d'un élément en fonction de la hauteur disponible
     * @param {HTMLElement} container - Conteneur parent
     * @param {HTMLElement} element - Élément à ajuster
     * @param {number} offset - Décalage additionnel (optionnel)
     */
    function adjustHeight(container, element, offset = 0) {
        if (!container || !element) return;
        
        const containerHeight = container.offsetHeight;
        const elementTop = element.offsetTop;
        const availableHeight = containerHeight - elementTop - offset;
        
        element.style.height = `${availableHeight}px`;
    }
    
    /**
     * Crée un élément avec des attributs et des enfants
     * @param {string} tag - Nom de la balise HTML
     * @param {Object} attributes - Attributs à ajouter à l'élément
     * @param {Array|string} children - Enfants de l'élément (texte ou éléments)
     * @returns {HTMLElement} - L'élément créé
     */
    function createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Ajouter les attributs
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'style' && typeof attributes[key] === 'object') {
                Object.assign(element.style, attributes[key]);
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        // Ajouter les enfants
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }
    
    // API publique
    return {
        debounce,
        adjustHeight,
        createElement
    };
})();