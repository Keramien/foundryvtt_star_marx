# DataModels — Le système de données (Foundry v14)

> Analogie C++ : comme des `struct` avec validation et migration intégrées.

---

## Pourquoi des DataModels ?

En v14, Foundry utilise des **classes TypeDataModel** pour définir le schéma de données de tes acteurs et objets. C'est l'équivalent de déclarer une struct en C++ — tu définis les champs, leurs types, et leurs contraintes.

> **Note :** Les anciennes versions de Foundry utilisaient un fichier `template.json`. En v14, c'est remplacé par des DataModels en JavaScript. Plus flexible, plus typé, plus puissant.

---

## Définir un schéma

```javascript
// module/actor/data-models.mjs

export class CharacterData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      // Champ simple — comme un int avec contraintes
      health: new fields.NumberField({
        required: true,
        initial: 10,       // Valeur par défaut
        min: 0,
        integer: true
      }),

      // Champ texte — comme un std::string
      biography: new fields.HTMLField({ initial: "" }),

      // Champ imbriqué — comme une struct dans une struct
      attributes: new fields.SchemaField({
        strength: new fields.NumberField({ initial: 10, min: 1, max: 20 }),
        dexterity: new fields.NumberField({ initial: 10, min: 1, max: 20 }),
        intelligence: new fields.NumberField({ initial: 10, min: 1, max: 20 })
      }),

      // Tableau — comme un std::vector
      skills: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({ required: true }),
          rank: new fields.NumberField({ initial: 0, min: 0, max: 5 })
        })
      ),

      // Booléen — comme un bool
      isAlive: new fields.BooleanField({ initial: true }),

      // Référence fichier (image, token...)
      portrait: new fields.FilePathField({ categories: ["IMAGE"] })
    };
  }
}
```

---

## Types de champs disponibles

| Champ Foundry          | Equivalent C++          | Usage                          |
|------------------------|-------------------------|--------------------------------|
| `StringField`          | `std::string`           | Texte simple                   |
| `NumberField`          | `int` / `float`         | Valeurs numériques             |
| `BooleanField`         | `bool`                  | Vrai/Faux                      |
| `SchemaField`          | `struct` imbriquée      | Objet avec sous-champs         |
| `ArrayField`           | `std::vector<T>`        | Liste d'éléments               |
| `HTMLField`            | `std::string` (HTML)    | Texte riche avec sanitisation  |
| `FilePathField`        | path / `std::string`    | Chemin vers un fichier média   |
| `ObjectField`          | `std::map<string, any>` | Objet libre (non typé)         |
| `SetField`             | `std::set<T>`           | Ensemble sans doublons         |

---

## Options communes des champs

```javascript
new fields.NumberField({
  required: true,    // Obligatoire (pas nullable)
  initial: 10,       // Valeur par défaut (comme une valeur d'init en C++)
  min: 0,            // Contrainte minimum
  max: 100,          // Contrainte maximum
  integer: true,     // Entier seulement (pas de float)
  nullable: false,   // Peut être null ?
  validate: (v) => v % 2 === 0  // Validation custom (comme un assert)
});
```

---

## Enregistrement dans le système

Le DataModel doit être enregistré pendant le hook `init` :

```javascript
// module/star-marx.mjs
import { CharacterData } from "./actor/data-models.mjs";
import { NpcData } from "./actor/data-models.mjs";

Hooks.once("init", () => {
  // Associer le DataModel au type d'acteur "character"
  CONFIG.Actor.dataModels.character = CharacterData;
  CONFIG.Actor.dataModels.npc = NpcData;
});
```

Il faut aussi déclarer les types dans `system.json` :

```json
{
  "documentTypes": {
    "Actor": {
      "character": {},
      "npc": {}
    },
    "Item": {
      "weapon": {},
      "armor": {}
    }
  }
}
```

---

## Accéder aux données

Une fois un acteur créé, ses données DataModel sont accessibles via `actor.system` :

```javascript
const actor = game.actors.get("abc123");

// Lire
console.log(actor.system.health);             // 10
console.log(actor.system.attributes.strength); // 15

// Modifier (async — envoie la mise à jour au serveur)
await actor.update({
  "system.health": 8,
  "system.attributes.strength": 16
});
```

**Attention :** On ne modifie jamais directement `actor.system.health = 8`. Il faut toujours passer par `actor.update()` pour que la modification soit persistée et synchronisée entre tous les clients.

> Analogie C++ : c'est comme si chaque propriété avait un setter qui notifie un observer + écrit en DB.

---

## Données dérivées (computed)

Tu peux ajouter des propriétés calculées via `prepareDerivedData()` :

```javascript
export class CharacterData extends foundry.abstract.TypeDataModel {

  static defineSchema() { /* ... */ }

  // Appelé automatiquement après chaque chargement/mise à jour
  prepareDerivedData() {
    // Calculer le modificateur à partir de la valeur brute
    const str = this.attributes.strength;
    this.attributes.strengthMod = Math.floor((str - 10) / 2);

    // Points de vie maximum basés sur la constitution
    this.maxHealth = 10 + this.attributes.constitution;
  }
}
```

> Analogie C++ : comme un getter calculé, mais appelé automatiquement par le framework à chaque mise à jour du modèle.

---

## Migration de données

Quand tu fais évoluer ton schéma entre versions, `migrateData()` permet de transformer les anciennes données :

```javascript
export class CharacterData extends foundry.abstract.TypeDataModel {

  static migrateData(source) {
    // Exemple : renommer un ancien champ
    if ("hp" in source) {
      source.health = source.hp;
      delete source.hp;
    }
    return super.migrateData(source);
  }
}
```

> Analogie C++ : comme un constructeur de conversion qui gère les anciennes versions de sérialisation.
