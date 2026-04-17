# Architecture Foundry VTT v14 — Vue d'ensemble

> Guide pour un développeur C++ découvrant Foundry VTT.

---

## Qu'est-ce que Foundry VTT ?

Foundry VTT est une application **client-serveur** pour jouer aux JDR en ligne. Le serveur (Node.js) gère la persistance et la synchronisation entre joueurs. Le client (navigateur web) exécute le rendu et la logique de jeu.

Un **game system** (comme Star Marx) est un plugin qui définit les règles : structure des données, fiches de personnages, jets de dés, etc. C'est ce qu'on développe.

---

## Analogie globale pour un dev C++

Imagine un framework C++ qui te fournit :
- Une **base de données intégrée** (Documents = objets persistés automatiquement)
- Un **système de fenêtres** (Sheets = UI pour afficher/éditer les Documents)
- Un **bus d'événements** (Hooks = signals/slots à la Qt)
- Un **moteur de templates** (Handlebars = génération de HTML depuis des données)

Tu n'écris pas l'application de zéro : tu **étends** les classes fournies par Foundry.

---

## Cycle de vie d'un système

Quand un monde Foundry se charge, ton système passe par 3 phases :

```
┌─────────────────────────────────────────────────────┐
│  1. INIT                                            │
│  → Enregistrer les classes (DataModels, Documents)  │
│  → Configurer le système via l'objet CONFIG         │
│  → Aucune donnée de jeu n'est encore disponible     │
├─────────────────────────────────────────────────────┤
│  2. SETUP                                           │
│  → Les collections sont prêtes (game.actors, etc.)  │
│  → Les données sont chargées depuis la DB           │
├─────────────────────────────────────────────────────┤
│  3. READY                                           │
│  → Tout est initialisé, le canvas est prêt          │
│  → Tu peux interagir avec le jeu                    │
└─────────────────────────────────────────────────────┘
```

**Analogie C++ :** C'est comme 3 phases de constructeur :
- `init` = déclaration des types (comme enregistrer des factories)
- `setup` = chargement des données (comme désérialiser depuis un fichier)
- `ready` = post-initialisation (comme un `onReady()` callback)

---

## Les 3 piliers de l'architecture

### 1. DataModels — La structure des données
Définissent le **schéma** de tes entités (personnage, objet, PNJ...).
→ Analogie : comme une `struct` C++ avec validation intégrée.
→ Voir [data-models.md](data-models.md)

### 2. Documents — La logique métier + persistance
Objets qui **existent en base de données** et se synchronisent entre clients.
→ Analogie : comme une classe C++ avec sérialisation automatique.
→ Voir [documents-and-sheets.md](documents-and-sheets.md)

### 3. Sheets — L'interface utilisateur
Fenêtres qui affichent et permettent d'éditer un Document.
→ Analogie : comme une vue MVC ou un widget Qt.
→ Voir [documents-and-sheets.md](documents-and-sheets.md)

---

## Structure de fichiers d'un système Foundry

```
star-marx/
├── system.json              ← Manifeste (comme un CMakeLists.txt / package.json)
│
├── module/                  ← Code JavaScript
│   ├── star-marx.mjs        ← Point d'entrée (comme main.cpp)
│   ├── actor/
│   │   ├── data-models.mjs  ← Schémas de données (structs)
│   │   ├── actor.mjs        ← Logique métier Actor
│   │   └── sheet.mjs        ← UI de la fiche Actor
│   └── item/
│       ├── data-models.mjs
│       ├── item.mjs
│       └── sheet.mjs
│
├── templates/               ← Fichiers Handlebars (.hbs)
│   ├── actor/               ← Templates pour les fiches acteur
│   └── item/                ← Templates pour les fiches objet
│
├── styles/                  ← CSS (mise en forme)
│   └── star-marx.css
│
└── languages/               ← Traductions
    ├── fr.json
    └── en.json
```

---

## Tableau récapitulatif : C++ → Foundry

| Concept C++                    | Equivalent Foundry VTT               |
|-------------------------------|---------------------------------------|
| `struct` / classe de données  | `TypeDataModel.defineSchema()`        |
| Classe avec sérialisation     | `Document` (Actor, Item...)           |
| Widget Qt / Vue MVC           | `Sheet` (ApplicationV2)              |
| `#include` / header           | `import` / `export` (ES Modules)     |
| Signals/Slots (Qt)            | `Hooks.on()` / `Hooks.once()`        |
| Pattern Observer              | Système de Hooks                      |
| `main()`                      | Hook `init` dans le fichier esmodule  |
| Fichier de config (.ini/.xml) | `system.json`                        |
| Sérialisation (protobuf...)   | Persistance automatique des Documents |
| `std::thread` / async         | `async` / `await` (mono-thread)      |
| Typage statique (compile)     | Typage dynamique (runtime)           |
| CMakeLists.txt                | `system.json` (manifeste)            |
| Template C++ (`<T>`)          | Handlebars templates (`.hbs`)        |

---

## Point d'entrée : le fichier principal

Ton `module/star-marx.mjs` est l'équivalent d'un `main()` :

```javascript
// Imports (comme des #include)
import { StarMarxActor } from "./actor/actor.mjs";
import { StarMarxActorSheet } from "./actor/sheet.mjs";
import { CharacterData } from "./actor/data-models.mjs";

// Phase INIT — enregistrement des classes
Hooks.once("init", () => {
  console.log("Star Marx | Initialisation du système");

  // Enregistrer le schéma de données
  CONFIG.Actor.dataModels.character = CharacterData;

  // Enregistrer la classe Document custom
  CONFIG.Actor.documentClass = StarMarxActor;

  // Enregistrer la fiche (Sheet) par défaut
  Actors.registerSheet("star-marx", StarMarxActorSheet, {
    makeDefault: true
  });
});

// Phase READY — tout est chargé
Hooks.once("ready", () => {
  console.log("Star Marx | Système prêt !");
});
```

---

## Liens vers les guides détaillés

- [DataModels](data-models.md) — Schémas de données
- [Documents & Sheets](documents-and-sheets.md) — Logique métier et UI
- [Hooks](hooks.md) — Système événementiel
- [Rolls & Chat](rolls-and-chat.md) — Dés et messages
- [i18n](i18n.md) — Localisation
- [ES Modules](es-modules.md) — JavaScript pour un dev C++
