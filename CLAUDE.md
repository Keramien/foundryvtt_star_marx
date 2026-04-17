# 🚀 Projet Star Marx — Foundry VTT
> Document de référence projet — À lire en priorité par Claude Opus avant toute intervention.

---

## 1. Présentation du projet

**Nom du projet :** Star Marx  
**Type :** Adaptation d'un jeu de rôle sur table existant vers Foundry VTT  
**Ton & ambiance :** Humoristique / parodique  
**Genre :** Science-fiction (espace, futur)  
**Statut :** En cours de développement  

Star Marx est un jeu de rôle sur table existant, à l'univers science-fiction parodique. Ce projet vise à en réaliser une implémentation complète sur **Foundry VTT** (version intermédiaire), incluant un système de jeu custom avec fiches de personnages, mécaniques de compétences et outils MJ.

---

## 2. Ressources de référence

### 📚 Règles officielles du jeu
Les livres de règles complets au format PDF sont disponibles ici :

```
memory/star_marx_books/
```

> ⚠️ **Note pour Claude Opus :** Avant d'intervenir sur les mécaniques de jeu, consulter les PDFs dans ce dossier pour connaître les règles officielles. Ne jamais inventer ou supposer une règle sans avoir vérifié dans ces sources.

---

## 3. Stack technique

| Élément | Détail |
|---|---|
| Plateforme | Foundry VTT |
| Niveau du développeur | Intermédiaire |
| Langage | JavaScript / HTML / CSS (standard Foundry) |
| Système | Système maison (game system custom) |

---

## 4. Objectifs du projet

### ✅ Priorité 1 — Système de compétences
- Définir la liste des compétences issues des règles Star Marx
- Implémenter les compétences sur la fiche de personnage Foundry
- Gérer les jets de compétences (formules de dés, seuils de réussite)
- Affichage des résultats dans le chat Foundry

### 🔲 Priorité 2 — À définir
> D'autres mécaniques seront ajoutées au fur et à mesure. Se référer aux PDFs pour identifier les modules à implémenter.

---

## 5. Architecture du projet Foundry

> 🔲 À compléter une fois la structure de dossiers du système Foundry initialisée.

```
star-marx/          ← dossier racine du game system Foundry
├── system.json
├── template.json
├── memory/
├── module/
├── templates/
└── lang/
```

---

## 6. Conventions de travail

- Toujours se référer aux fichiers .md dans `memory/star_marx_books/rules/` avant de coder une mécanique
- `memory/star_marx_books/rules/edition_augmentee_sommaire.md` contient les liens des fichiers en fonction du besoin.
- Conserver le ton **humoristique et parodique** de l'univers dans les textes UI (labels, descriptions, messages de chat)
- Ecrire et commenter le code en anglais !

## 6.1 Système de Traduction & Localisation (i18n)
* **Méthode :** Utilisation native de l'API `game.i18n` de Foundry VTT.
* **Fichiers :** Stockage dans `/languages/fr.json` et `/languages/en.json`.
* **Règle de nommage :** Les clés doivent être hiérarchisées (ex: `STARMARX.Actor.Attributes.Health`).
* **Contrainte Claude :** Ne jamais coder de texte "en dur" dans les templates HTML ou les scripts. Toujours proposer la clé i18n correspondante et mettre à jour le fichier JSON de langue.

---

## 7. Journal des décisions

| Date | Décision |
|---|---|
| 2026-04-16 | Initialisation du projet, choix de Foundry VTT comme plateforme |
| 2026-04-16 | Priorité donnée au système de compétences |

---

## 8. Questions ouvertes / À trancher

- [ ] Quel est le système de dés utilisé dans Star Marx ? (voir PDFs)
- [ ] Y a-t-il des factions ou des classes de personnages ? (voir PDFs)
- [ ] Faut-il un module de combat dès la V1 ?

---

*Ce document est vivant. Le mettre à jour à chaque décision structurante du projet.*
