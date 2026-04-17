# ES Modules — JavaScript pour un développeur C++

> Ce guide traduit les concepts JavaScript/web en termes C++.

---

## import / export vs #include

En C++, tu inclus des headers. En JavaScript (ES Modules), tu **importes** des exports nommés.

```cpp
// C++
#include "actor.h"          // Inclut tout le header
Actor* a = new Actor();
```

```javascript
// JavaScript ES Modules
import { StarMarxActor } from "./actor/actor.mjs";   // Import nommé
import StarMarxActor from "./actor/actor.mjs";        // Import par défaut

const a = new StarMarxActor();
```

### Exporter depuis un module

```javascript
// actor.mjs — exports nommés (préféré dans Foundry)
export class StarMarxActor extends Actor { /* ... */ }
export function helper() { /* ... */ }

// Importer
import { StarMarxActor, helper } from "./actor/actor.mjs";
```

```javascript
// config.mjs — export par défaut (1 seul par fichier)
export default { SYSTEM_ID: "star-marx" };

// Importer
import CONFIG from "./config.mjs";
```

### Différences clés avec #include

| C++ `#include`                     | JS `import`                          |
|------------------------------------|--------------------------------------|
| Copie textuelle du header          | Référence au module (pas de copie)   |
| Résolu au préprocesseur            | Résolu au chargement (runtime)       |
| Peut inclure plusieurs fois        | Chargé une seule fois (singleton)    |
| Ordre important                    | Ordre géré automatiquement (DAG)     |
| Headers gardent (.h) / implem (.cpp) | Tout dans un seul fichier (.mjs)   |

---

## Typage dynamique vs statique

C'est le changement le plus déstabilisant pour un dev C++.

```cpp
// C++ — typage statique
int health = 10;           // health est TOUJOURS un int
std::string name = "Zorg"; // name est TOUJOURS un string
health = "oops";           // ERREUR DE COMPILATION
```

```javascript
// JavaScript — typage dynamique
let health = 10;          // health est un number... pour l'instant
let name = "Zorg";        // name est un string... pour l'instant
health = "oops";          // Aucune erreur ! (mais c'est un bug logique)
```

### Types JavaScript essentiels

| Type JS       | Equivalent C++           | Exemple                    |
|---------------|--------------------------|----------------------------|
| `number`      | `double`                 | `42`, `3.14`               |
| `string`      | `std::string`            | `"hello"`, `'world'`       |
| `boolean`     | `bool`                   | `true`, `false`            |
| `null`        | `nullptr`                | `null`                     |
| `undefined`   | (pas d'équivalent)       | Variable déclarée non initialisée |
| `object`      | `struct` / `std::map`    | `{ name: "Zorg", hp: 10 }`|
| `Array`       | `std::vector`            | `[1, 2, 3]`               |

### Pièges courants

```javascript
// == fait de la conversion implicite (à éviter !)
0 == ""        // true (les deux sont "falsy")
0 === ""       // false (=== vérifie aussi le type) ← TOUJOURS utiliser ===

// null et undefined sont différents
let x;              // x est undefined
let y = null;       // y est null (valeur explicitement "rien")

// Vérifier si une valeur existe
if (value != null)  // Vérifie à la fois null ET undefined
```

---

## async / await vs threads

En C++, tu utilises des threads pour le parallélisme. En JavaScript, il n'y a **qu'un seul thread**. Le "parallélisme" est géré par des **Promises** et `async/await`.

```cpp
// C++ — thread pour une opération longue
std::thread t([&]() {
    auto result = database.query("SELECT ...");
    callback(result);
});
t.join();
```

```javascript
// JavaScript — async/await (mono-thread, non-bloquant)
async function loadData() {
  const result = await database.query("SELECT ...");  // "pause" ici
  processResult(result);  // reprend quand c'est prêt
}
```

### Règles essentielles

1. Une fonction `async` retourne toujours une **Promise**
2. `await` ne peut être utilisé que dans une fonction `async`
3. `await` **ne bloque pas** le thread — il "pause" la fonction et rend la main
4. Toute opération I/O dans Foundry est `async` (DB, réseau, fichiers)

```javascript
// Les opérations Foundry sont async
await actor.update({ "system.health": 10 });  // Sauvegarde en DB
await ChatMessage.create({ content: "Hello" }); // Envoie au serveur
const roll = new Roll("1d20");
await roll.evaluate();  // Génère le résultat aléatoire
```

> Analogie : pense à `await` comme un `co_await` en C++20 coroutines, pas comme un `thread.join()`.

---

## Classes JavaScript vs C++

La syntaxe est proche mais il y a des différences :

```javascript
class StarMarxActor extends Actor {
  // Pas de déclaration de membres à l'avance (pas de header)
  // Pas de types explicites
  // Pas de destructeur

  // Constructeur
  constructor(data, context) {
    super(data, context);   // Appel au parent obligatoire si extends
    this.customProp = 42;   // Les propriétés se créent à l'affectation
  }

  // Méthode d'instance
  getRollData() {
    return { ...super.getRollData() };  // ... = spread operator (copie)
  }

  // Méthode statique
  static getDefaultOptions() {
    return { width: 600 };
  }

  // Propriété privée (convention ou vrai privé)
  #secretValue = 0;        // Privé (vrai, inaccessible de l'extérieur)

  // Getter (propriété calculée)
  get isAlive() {
    return this.system.health > 0;
  }
}
```

### Pas de surcharge de méthode

```javascript
// C++ : on peut avoir plusieurs signatures
void attack(int damage);
void attack(int damage, std::string type);

// JavaScript : une seule méthode, paramètres optionnels
attack(damage, type = "physical") {
  // type vaut "physical" si non fourni
}
```

---

## Objets et destructuration

Les objets JS sont omniprésents (comme des `std::map<string, any>` légers) :

```javascript
// Créer un objet
const actor = {
  name: "Zorg",
  health: 20,
  attributes: { strength: 15 }
};

// Accéder
actor.name          // "Zorg"
actor["name"]       // "Zorg" (accès dynamique, comme map["key"])

// Destructuration — extraire des valeurs
const { name, health } = actor;
// Equivalent C++ : auto [name, health] = std::tie(actor.name, actor.health);

// Spread — copier/fusionner
const copy = { ...actor };               // Copie superficielle
const modified = { ...actor, health: 15 }; // Copie + override
```

---

## Le mot-clé `this`

En C++, `this` est toujours l'instance de la classe. En JavaScript, `this` dépend du **contexte d'appel** :

```javascript
class MySheet {
  onClick() {
    console.log(this);  // Dépend de COMMENT onClick est appelé !
  }
}

const sheet = new MySheet();
sheet.onClick();           // this = sheet (normal)

const fn = sheet.onClick;
fn();                      // this = undefined ! (détaché du contexte)
```

**Solution :** les méthodes statiques privées avec `static #method` (pattern v14) ou les arrow functions `() => {}` qui capturent le `this` environnant.

---

## Organisation du code Star Marx

```
module/
├── star-marx.mjs           ← Point d'entrée (déclaré dans system.json)
│                              Imports + Hooks.once("init", ...)
├── actor/
│   ├── data-models.mjs     ← Classes TypeDataModel (schémas)
│   ├── actor.mjs           ← Classe StarMarxActor extends Actor
│   └── sheet.mjs           ← Classe StarMarxActorSheet extends ActorSheetV2
├── item/
│   ├── data-models.mjs
│   ├── item.mjs
│   └── sheet.mjs
├── rolls/
│   └── skill-roll.mjs      ← Logique des jets de compétence
└── helpers/
    └── config.mjs           ← Constantes, configuration
```

Le fichier `star-marx.mjs` importe tout et enregistre dans les hooks. Les autres fichiers exportent des classes et fonctions.
