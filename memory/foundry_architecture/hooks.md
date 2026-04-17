# Hooks — Système événementiel

> Analogie C++ : comme les signals/slots de Qt ou le pattern Observer/Listener.

---

## Concept

Les Hooks sont le système d'événements global de Foundry. N'importe quel code peut :
- **Écouter** un événement (s'abonner)
- **Déclencher** un événement (émettre)

C'est le mécanisme principal de communication entre le coeur de Foundry et ton système.

---

## API de base

### S'abonner à un événement

```javascript
// Écouter à chaque fois (permanent)
Hooks.on("updateActor", (actor, changes, options, userId) => {
  console.log(`${actor.name} a été modifié`);
});

// Écouter une seule fois (auto-supprimé après le premier appel)
Hooks.once("ready", () => {
  console.log("Le jeu est prêt !");
});
```

### Se désabonner

```javascript
const hookId = Hooks.on("updateActor", myCallback);
Hooks.off("updateActor", hookId);  // Supprime l'abonnement
```

> Analogie C++ : `Hooks.on` = `connect(signal, slot)`, `Hooks.off` = `disconnect()`.

---

## Hooks du cycle de vie

Ces hooks sont appelés dans cet ordre au chargement du monde :

| Hook      | Quand                                  | Usage typique                        |
|-----------|----------------------------------------|--------------------------------------|
| `init`    | Tout début, avant chargement données   | Enregistrer classes, CONFIG          |
| `i18nInit`| Après chargement des traductions       | Manipulations i18n custom            |
| `setup`   | Données chargées, collections prêtes   | Accéder à `game.settings`            |
| `ready`   | Tout est prêt, canvas rendu            | Logique post-init, messages d'accueil|

```javascript
// Pattern standard dans star-marx.mjs
Hooks.once("init", () => {
  // Enregistrer DataModels, Documents, Sheets
});

Hooks.once("ready", () => {
  // Le système est opérationnel
});
```

---

## Hooks CRUD (Documents)

Chaque opération sur un Document déclenche des hooks :

| Hook             | Moment                    | Peut annuler ? |
|------------------|---------------------------|----------------|
| `preCreateActor` | Avant la création         | Oui (`return false`) |
| `createActor`    | Après la création         | Non            |
| `preUpdateActor` | Avant la mise à jour      | Oui            |
| `updateActor`    | Après la mise à jour      | Non            |
| `preDeleteActor` | Avant la suppression      | Oui            |
| `deleteActor`    | Après la suppression      | Non            |

Même pattern pour `Item`, `ChatMessage`, `Combat`, etc.

```javascript
// Exemple : empêcher la suppression d'un acteur si il est vivant
Hooks.on("preDeleteActor", (actor, options, userId) => {
  if (actor.system.isAlive) {
    ui.notifications.warn("Impossible de supprimer un personnage vivant !");
    return false;  // Annule la suppression
  }
});

// Exemple : action après création d'un item
Hooks.on("createItem", (item, options, userId) => {
  if (item.type === "weapon" && item.parent) {
    console.log(`${item.parent.name} a obtenu l'arme ${item.name}`);
  }
});
```

> Analogie C++ : les hooks `pre*` sont comme des validateurs qui peuvent rejeter une opération (comme un `beforeInsert` trigger en SQL). Les hooks post-opération sont des observers purs.

---

## Hooks de rendu

Déclenchés quand une fenêtre (Application) est rendue :

```javascript
// Modifier le HTML d'une fiche acteur après rendu
Hooks.on("renderActorSheet", (sheet, html, data) => {
  // html est l'élément DOM jQuery/HTMLElement
  // Tu peux injecter du contenu, modifier le style, etc.
});

// Modifier les messages du chat
Hooks.on("renderChatMessage", (message, html, data) => {
  // Ajouter des boutons d'action aux messages de dés
  if (message.isRoll) {
    html.querySelector(".dice-total")?.classList.add("star-marx-roll");
  }
});
```

---

## Hooks custom

Tu peux créer tes propres hooks :

```javascript
// Émettre un hook
Hooks.callAll("starMarxDamageApplied", actor, damageAmount);

// Ailleurs, écouter ce hook
Hooks.on("starMarxDamageApplied", (actor, amount) => {
  console.log(`${actor.name} a subi ${amount} dégâts`);
});
```

### callAll vs call

| Méthode    | Comportement                                        |
|------------|-----------------------------------------------------|
| `callAll`  | Appelle tous les listeners, ignore les return values |
| `call`     | S'arrête si un listener retourne `false`            |

> `call` est utilisé pour les hooks `pre*` (annulables). `callAll` pour les notifications.

---

## Résumé visuel

```
Ton code                    Foundry Core
─────────                   ────────────
                            ┌─────────────────┐
Hooks.once("init", fn) ───► │ Chargement monde │
                            │   → appelle init │ ──► fn()
                            └─────────────────┘

                            ┌─────────────────┐
Hooks.on("updateActor") ──► │ actor.update()   │
                            │   → pre hook     │ ──► peut annuler
                            │   → sauvegarde   │
                            │   → post hook    │ ──► notification
                            └─────────────────┘
```
