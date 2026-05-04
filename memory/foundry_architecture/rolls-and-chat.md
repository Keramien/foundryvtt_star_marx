# Rolls & Chat — Système de dés et messages

> Analogie C++ : les Rolls sont des objets qui encapsulent une expression de dés, l'évaluent, et produisent un résultat affiché dans le chat.

---

## La classe Roll

En Foundry, un jet de dés n'est pas juste un nombre aléatoire — c'est un **objet** qui contient la formule, les résultats individuels, et le total.

### Créer et évaluer un Roll

```javascript
// 1. Créer avec une formule (pas encore lancé)
const roll = new Roll("2d6 + 3");

// 2. Évaluer (lance les dés — opération async)
await roll.evaluate();

// 3. Lire les résultats
console.log(roll.formula);  // "2d6 + 3"
console.log(roll.total);    // ex: 11
console.log(roll.dice);     // Détail de chaque groupe de dés
console.log(roll.result);   // "4 + 6 + 3" (résultat détaillé)
```

> Analogie C++ : `Roll` est comme une classe `Expression` qui parse une formule, l'évalue de manière lazy (seulement quand on appelle `evaluate()`), et stocke le résultat.

---

## Syntaxe des formules de dés

| Formule         | Description                              |
|-----------------|------------------------------------------|
| `1d20`          | 1 dé à 20 faces                         |
| `2d6`           | 2 dés à 6 faces                         |
| `4d6kh3`        | 4d6, garder les 3 plus hauts (keep high) |
| `2d20kl`        | 2d20, garder le plus bas (keep low)      |
| `1d6 + 3`       | 1d6 plus un modificateur                 |
| `1d10 + @strength` | 1d10 + valeur dynamique (rollData)     |
| `{2d6, 3d4}kh`  | Pool de dés, garder le meilleur groupe   |

---

## Variables dynamiques avec getRollData()

Les formules peuvent référencer des données de l'acteur avec `@` :

```javascript
// Dans ton Document Actor
export class KamaradeActor extends Actor {
  getRollData() {
    const data = super.getRollData();
    // data contient déjà tout ce qui est dans system.*
    // Tu peux ajouter des raccourcis :
    data.mod = {
      str: Math.floor((data.attributes.strength - 10) / 2),
      dex: Math.floor((data.attributes.dexterity - 10) / 2)
    };
    return data;
  }
}

// Utilisation dans une formule :
const roll = new Roll("1d20 + @mod.str", actor.getRollData());
await roll.evaluate();
// Si strength = 16, @mod.str = 3, donc "1d20 + 3"
```

---

## Envoyer un Roll dans le chat

```javascript
const roll = new Roll("1d20 + @mod.str", actor.getRollData());
await roll.evaluate();

// Méthode simple — crée automatiquement un message chat
await roll.toMessage({
  speaker: ChatMessage.getSpeaker({ actor: actor }),
  flavor: "Test de Force"  // Texte descriptif au-dessus du résultat
});
```

Le message apparaît dans le chat avec :
- Le nom du lanceur (speaker)
- Le texte descriptif (flavor)
- La formule et le résultat détaillé
- Une animation 3D des dés (si activée)

---

## Roll Modes — Visibilité des jets

| Mode        | Qui voit ?                     | Usage                    |
|-------------|-------------------------------|--------------------------|
| `publicroll`| Tout le monde                 | Jets normaux             |
| `gmroll`    | MJ + lanceur                  | Jets semi-secrets        |
| `blindroll` | MJ uniquement (pas le lanceur)| Jets cachés au joueur    |
| `selfroll`  | Lanceur uniquement            | Tests personnels         |

```javascript
// Utiliser le mode sélectionné par l'utilisateur dans la toolbar
const rollMode = game.settings.get("core", "rollMode");

await roll.toMessage(
  { speaker: ChatMessage.getSpeaker({ actor }) },
  { rollMode: rollMode }
);
```

---

## Messages Chat (sans dés)

Tu peux aussi créer des messages simples :

```javascript
// Message texte simple
await ChatMessage.create({
  content: "<p>Camarade Zorg entre dans la pièce.</p>",
  speaker: ChatMessage.getSpeaker({ actor: myActor })
});

// Message avec un template Handlebars
const html = await renderTemplate(
  "systems/star-marx/templates/chat/skill-result.hbs",
  { actorName: "Zorg", skill: "Pilotage", success: true }
);

await ChatMessage.create({
  content: html,
  speaker: ChatMessage.getSpeaker({ actor: myActor })
});
```

---

## Workflow typique d'un jet de compétence

Voici le flux complet pour un jet de compétence dans Star Marx :

```javascript
async function rollSkill(actor, skillName) {
  // 1. Récupérer les données
  const rollData = actor.getRollData();
  const skill = actor.system.skills[skillName];

  // 2. Construire la formule
  const formula = `1d20 + ${skill.rank}`;

  // 3. Créer et évaluer le Roll
  const roll = new Roll(formula, rollData);
  await roll.evaluate();

  // 4. Déterminer le résultat
  const success = roll.total >= skill.difficulty;

  // 5. Afficher dans le chat avec un template custom
  const html = await renderTemplate(
    "systems/star-marx/templates/chat/skill-roll.hbs",
    {
      actorName: actor.name,
      skillName: skillName,
      roll: roll,
      success: success
    }
  );

  await ChatMessage.create({
    content: html,
    rolls: [roll],  // Attacher le Roll pour l'animation 3D
    speaker: ChatMessage.getSpeaker({ actor }),
    rollMode: game.settings.get("core", "rollMode")
  });
}
```

---

## Résumé

```
Formule ("2d6 + @str")
        │
        ▼
   new Roll(formule, rollData)
        │
        ▼
   await roll.evaluate()    ← Les dés sont lancés
        │
        ▼
   roll.total = 11          ← Résultat disponible
        │
        ▼
   roll.toMessage(...)       ← Affiché dans le chat
```
