# Documents & Sheets — Logique métier et interface utilisateur

> Analogie C++ : Document = classe métier avec persistance auto. Sheet = widget Qt / Vue MVC.

---

## Le pattern Document/Sheet

C'est le **coeur** de l'architecture Foundry. Deux responsabilités séparées :

```
┌──────────────────────┐      ┌──────────────────────┐
│      DOCUMENT        │      │        SHEET          │
│  (Modèle + Logique)  │◄────►│    (Interface UI)     │
│                      │      │                       │
│ • Données persistées │      │ • Affichage HTML      │
│ • Méthodes métier    │      │ • Formulaires         │
│ • Sync réseau        │      │ • Interactions user   │
│ • Validation         │      │ • Rendu Handlebars    │
└──────────────────────┘      └──────────────────────┘
```

Un Document peut avoir **plusieurs Sheets** (fiches alternatives), mais une Sheet affiche toujours **un seul Document**.

---

## Documents

### Documents fournis par Foundry

| Document       | Description                        |
|----------------|------------------------------------|
| `Actor`        | Personnage, PNJ, créature          |
| `Item`         | Objet, compétence, sort, équipement|
| `ChatMessage`  | Message dans le chat               |
| `Combat`       | Rencontre de combat                |
| `Scene`        | Carte / scène de jeu               |
| `JournalEntry` | Note / article de journal          |
| `ActiveEffect` | Effet actif sur un acteur          |

### Étendre un Document

```javascript
// module/actor/actor.mjs

export class KamaradeActor extends Actor {

  /** Données disponibles dans les formules de dés (@health, @attributes.strength...) */
  getRollData() {
    const data = super.getRollData();
    // data contient déjà tout ce qui est dans system.*
    return data;
  }

  /** Méthode métier custom */
  async takeDamage(amount) {
    const newHealth = Math.max(0, this.system.health - amount);
    await this.update({ "system.health": newHealth });

    // Envoyer un message dans le chat
    ChatMessage.create({
      content: `${this.name} subit ${amount} dégâts ! (PV: ${newHealth})`,
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }
}
```

Enregistrement :
```javascript
Hooks.once("init", () => {
  CONFIG.Actor.documentClass = KamaradeActor;
});
```

### Opérations CRUD sur les Documents

```javascript
// Créer
const actor = await Actor.create({
  name: "Camarade Zorg",
  type: "character",
  system: { health: 20 }
});

// Lire
const found = game.actors.get(actor.id);
const byName = game.actors.getName("Camarade Zorg");

// Mettre à jour
await actor.update({ "system.health": 15 });

// Supprimer
await actor.delete();
```

> Chaque opération est **async** : elle envoie la requête au serveur, qui la persiste et la propage aux autres clients.

---

## Sheets (ApplicationV2 en v14)

En v14, les Sheets utilisent le framework **ApplicationV2**. C'est une refonte complète par rapport aux anciennes versions.

### Structure d'une Sheet

```javascript
// module/actor/sheet.mjs

export class StarMarxActorSheet extends foundry.applications.sheets.ActorSheetV2 {

  /** Configuration statique — comme des constantes de classe */
  static DEFAULT_OPTIONS = {
    classes: ["star-marx", "actor-sheet"],    // Classes CSS
    position: { width: 600, height: 700 },   // Taille de la fenêtre
    window: {
      icon: "fas fa-user",                    // Icône dans la barre de titre
      title: "Star Marx - Fiche"
    },
    actions: {
      rollSkill: StarMarxActorSheet.#onRollSkill,    // Boutons d'action
      takeDamage: StarMarxActorSheet.#onTakeDamage
    },
    form: {
      handler: StarMarxActorSheet.#onSubmit,
      submitOnChange: true     // Sauvegarde auto quand on modifie un champ
    }
  };

  /** Parties du template — la Sheet est composée de blocs */
  static PARTS = {
    header: { template: "systems/star-marx/templates/actor/header.hbs" },
    tabs: { template: "systems/star-marx/templates/actor/tabs.hbs" },
    stats: { template: "systems/star-marx/templates/actor/stats.hbs" },
    skills: { template: "systems/star-marx/templates/actor/skills.hbs" }
  };

  /** Préparer les données pour le template */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.isEditable = this.isEditable;
    return context;
  }

  /** Handler d'action — appelé quand on clique un bouton [data-action="rollSkill"] */
  static async #onRollSkill(event, target) {
    const skillName = target.dataset.skill;
    // ... logique de jet de dé
  }

  /** Handler de soumission du formulaire */
  static async #onSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }
}
```

Enregistrement :
```javascript
Hooks.once("init", () => {
  Actors.registerSheet("star-marx", StarMarxActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "STARMARX.Sheet.Character"
  });
});
```

---

## Templates Handlebars (.hbs)

Les templates sont des fichiers HTML avec une syntaxe spéciale pour injecter des données.

### Exemple : `templates/actor/stats.hbs`

```handlebars
<section class="attributes">
  <h2>{{localize "STARMARX.Attributes.Title"}}</h2>

  {{!-- Boucle sur les attributs --}}
  {{#each system.attributes as |value key|}}
    <div class="attribute">
      <label>{{localize (concat "STARMARX.Attributes." key)}}</label>
      <input type="number"
             name="system.attributes.{{key}}"
             value="{{value}}"
             data-dtype="Number" />
    </div>
  {{/each}}
</section>
```

### Syntaxe clé

| Handlebars                          | Equivalent C++/pseudo-code        |
|-------------------------------------|-----------------------------------|
| `{{variable}}`                      | `printf("%s", variable)`          |
| `{{#if condition}}...{{/if}}`       | `if (condition) { ... }`          |
| `{{#each array as \|item key\|}}...{{/each}}` | `for (auto& [key, item] : array)` |
| `{{localize "KEY"}}`                | `i18n.translate("KEY")`           |
| `{{> partialName}}`                 | `#include "partial.hbs"`          |

### Data binding automatique

Le `name` d'un `<input>` correspond au **chemin** dans le document :
- `name="system.health"` → modifie `actor.system.health`
- `name="system.attributes.strength"` → modifie `actor.system.attributes.strength`

Quand `submitOnChange: true` est activé, chaque modification d'un champ déclenche automatiquement une sauvegarde. Pas besoin de bouton "Sauvegarder".

---

## Cycle de rendu d'une Sheet

```
1. _prepareContext()     ← Préparer les données pour les templates
2. _renderHTML()         ← Foundry compile les templates Handlebars
3. _replaceHTML()        ← Le HTML est inséré dans le DOM
4. _onRender()           ← Hook post-rendu (pour ajouter des listeners custom)
```

Quand le Document est modifié (via `update()`), la Sheet se **re-rend automatiquement**.

> Analogie C++ : c'est comme un pattern Observer où le widget s'abonne aux changements du modèle et appelle `repaint()` automatiquement.

---

## Actions (boutons interactifs)

En v14, les boutons utilisent l'attribut `data-action` :

```html
<!-- Dans le template .hbs -->
<button type="button" data-action="rollSkill" data-skill="piloting">
  {{localize "STARMARX.Roll"}}
</button>
```

```javascript
// Dans la Sheet
static DEFAULT_OPTIONS = {
  actions: {
    rollSkill: StarMarxActorSheet.#onRollSkill
  }
};

static async #onRollSkill(event, target) {
  const skill = target.dataset.skill;  // "piloting"
  // ...
}
```

> Analogie C++ : comme connecter un signal `clicked()` d'un bouton Qt à un slot.
