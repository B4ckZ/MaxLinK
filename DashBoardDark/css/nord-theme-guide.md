# Guide d'utilisation des couleurs Nord

Ce guide sert de référence pour l'utilisation cohérente des couleurs du thème Nord dans le dashboard MAXLINK.

## Palette Nord

```css
:root {
    /* Tons sombres (Polar Night) */
    --nord0: #2E3440;  /* Fond le plus sombre */
    --nord1: #3B4252;  /* Fond sombre */
    --nord2: #434C5E;  /* Fond moins sombre */
    --nord3: #4C566A;  /* Fond le moins sombre */
    
    /* Tons clairs (Snow Storm) */
    --nord4: #D8DEE9;  /* Texte tertiaire */
    --nord5: #E5E9F0;  /* Texte secondaire */
    --nord6: #ECEFF4;  /* Texte primaire */
    
    /* Tons bleutés (Frost) */
    --nord7: #8FBCBB;  /* Accent secondaire */
    --nord8: #88C0D0;  /* Accent primaire */
    --nord9: #81A1C1;  /* Accent tertiaire */
    --nord10: #5E81AC; /* Accent quaternaire */
    
    /* Tons colorés (Aurora) */
    --nord11: #BF616A; /* Rouge / Erreur */
    --nord12: #D08770; /* Orange / Avertissement */
    --nord13: #EBCB8B; /* Jaune / Attention */
    --nord14: #A3BE8C; /* Vert / Succès */
    --nord15: #B48EAD; /* Violet / Accent spécial */
}
```

## Utilisation des couleurs dans le thème sombre

### Arrière-plans
- **`--nord0`**: Arrière-plan principal du dashboard, fond des conteneurs inset
- **`--nord1`**: Arrière-plan des widgets
- **`--nord2`**: Arrière-plan des composants interactifs (ex. topics, clients)
- **`--nord3`**: Éléments d'interface active, bordures, séparateurs

### Textes
- **`--nord4`**: Texte tertiaire (informations secondaires, métadonnées)
- **`--nord5`**: Texte secondaire (contenu standard, libellés)
- **`--nord6`**: Texte primaire (titres, texte important, valeurs clés)

### Accents et interactions
- **`--nord7`**: Accent secondaire (gradients, éléments décoratifs)
- **`--nord8`**: Accent primaire (titres de widgets, boutons, liens)
- **`--nord9`**: Accent tertiaire (liens secondaires, valeurs numériques)
- **`--nord10`**: Accent quaternaire (sélections, états spéciaux)

### États et notifications
- **`--nord11`**: Rouge (erreurs, alertes, annulations)
- **`--nord12`**: Orange (avertissements, processus en attente)
- **`--nord13`**: Jaune (attention, notifications peu importantes)
- **`--nord14`**: Vert (succès, validation, statut OK)
- **`--nord15`**: Violet (informations spéciales, éléments mis en avant)

## Cas d'utilisation courants

### Composants de base
```css
/* Widgets */
.widget-container {
    background-color: var(--nord1);
    color: var(--nord6);
}

/* Titres */
.widget-title {
    color: var(--nord8);
}

/* Zones inset */
.inset-area {
    background-color: var(--nord0);
    box-shadow: inset 2px 2px 4px var(--shadow-color),
                inset -2px -2px 4px var(--highlight-color);
}
```

### Indicateurs d'état
```css
.status-ok {
    background-color: var(--nord14);
    box-shadow: 0 0 8px var(--nord14);
}

.status-error {
    background-color: var(--nord11);
    box-shadow: 0 0 8px var(--nord11);
}

.status-warning {
    background-color: var(--nord12);
    box-shadow: 0 0 8px var(--nord12);
}

.status-info {
    background-color: var(--nord15);
    box-shadow: 0 0 8px var(--nord15);
}
```

### Éléments interactifs
```css
.interactive-item {
    background-color: var(--nord2);
    color: var(--nord6);
}

.interactive-item:hover {
    background-color: var(--nord3);
}
```