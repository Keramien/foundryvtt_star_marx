# Soyouz — Les vaisseaux de l'Union

> Source : Édition Augmentée, p.78-88 (`memory/start_marx_books/rules/edition_augmentee_soyouz.md`)

---

## Concept

Dans l'univers Star Marx, le **soyouz** n'est pas un simple véhicule : c'est un **personnage à part entière**, avec ses propres Traits, ses Signes Particuliers, ses Points de Vie et sa personnalité (souvent détestable). Les Kamarades finissent parfois par préférer leur vaisseau à leurs propres équipiers — surtout aux Hjorts obèses.

Un soyouz peut être n'importe quoi :
- Un kosmobus classique, un chasseur racé ou un gros destroyer
- Un truc improbable : vaisseau en chocolat blanc (*Galak-Tikka*), en allumettes, en parpaings
- Un animal vivant (baleine cosmique *Gojirov*) ou un végétal géant (navette-navet *Tube-Hercule*)

L'univers est alcoolisé et foutraque : toute théorie de propulsion farfelue a une chance de fonctionner (moteur mange-poussière, pompe à flatulences bovines, collecteur à mémoire propulsive…).

---

## Les 7 Traits du vaisseau

Les scores vont de **–2 à +2** et s'ajoutent aux jets des Kamarades qui pilotent l'engin.

| Trait | Focus | Combinaison avec |
|---|---|---|
| **TUPOLEV** | Vitesse, manœuvrabilité, moteurs | SOYOUZ (pilotage) |
| **ORGUE DE STALINE** | Armement | AK 47 (canonnier) |
| **PARADE** | Aspect, prestige, impression | PROPAGANDE, BRISEUR DE GRÈVE |
| **LEBEDEV** | Informatique, scanners, radars | OPÉRATEUR CODEUR |
| **DATCHA** | Confort, habitabilité | (bonus narratif) |
| **TÉTRIS** | Capacité des soutes, masse | (calcul dégâts au bélier) |
| **MUR DE FER** | Blindage, armure, PV | (détermine les PV) |

Voir [traits_soyouz.md](traits_soyouz.md) pour le détail complet.

---

## Création d'un soyouz

### Principe : total à zéro

Pour un vaisseau équilibré de départ, la **somme des 7 Traits doit faire 0**. Exemple officiel, l'*U.R.S.S.S. Coopérative Kolkhozprise* :

| Trait | Score |
|---|---|
| TUPOLEV | –1 |
| ORGUE DE STALINE | +1 |
| PARADE | +1 |
| LEBEDEV | –1 |
| DATCHA | –2 |
| TÉTRIS | 0 |
| MUR DE FER | +2 |
| **TOTAL** | **0** |

→ Gros vaisseau poussif, armé, blindé, célèbre, mais inconfortable.

### Participation des joueurs (variante)

Le Secrétaire Général peut organiser un **tour de table** : chaque joueur explique comment il apporte sa pierre à l'édifice, à la manière des règles d'**entraide** :
- Jet à **9** = +1 point au vaisseau (dans un Trait au choix)
- Jet à **12** = +2 points
- Jet à **15** = +3 points

Les points sont **définitivement acquis**. Trait utilisé : le plus pertinent (CORRUPTION pour truquer des papiers, MACHINISTE pour bidouiller, etc.).

### Qualificatifs narratifs

Pour chaque score ≠ 0, attacher un **mot ou une phrase** qui décrit concrètement la personnalité du soyouz (*poussif*, *canon à ions pulsés*, *célèbre*, *commandes en blugaxien vernaculaire*, *lits-planches*, *blindé avec parapluie déflecteur*…). Voir [traits_soyouz.md](traits_soyouz.md) pour des listes d'exemples.

---

## Points de Vie et Dégâts

### Points de Vie

```
PV soyouz = 5 + MUR DE FER
```

Les PV représentent les dégâts superficiels à la structure externe. Tant qu'il y en a, **rien de grave** ne se passe vraiment.

### Dégâts infligés (table par ORGUE DE STALINE)

| ORGUE DE STALINE | Dégâts infligés |
|---|---|
| –2 | 0 (désarmé) |
| –1 | 1d2 – 1 (0 ou 1) |
| 0 | 1 |
| +1 | 2 |
| +2 | 3 |
| +3 | 4 |

Les Signes Particuliers de l'artilleur (Armurier, Embuscade, Précis…) **s'appliquent** normalement.

### Dégâts au bélier (éperonnage)

Si un pilote culotté décide de **rentrer dedans**, les dégâts se calculent sur **TÉTRIS** (la masse) au lieu d'ORGUE DE STALINE. Le Signe *Pare-chocs en Titane* permet d'utiliser MUR DE FER à la place.

### Combattant extérieur

Un Kamarade en scaphandre qui tape sur un vaisseau avec une meuleuse ne fait que **1 point de dégât maximum** (même avec un gros score en AK 47). En cas d'échec, les dégâts ennemis touchent **à la fois** le Kamarade **et** le vaisseau.

---

## Avaries (quand les PV tombent à 0)

Une fois les PV épuisés, **les Traits du vaisseau baissent** à chaque coup encaissé. **À –3**, le Trait atteint ses limites et la situation devient critique :

| Trait à –3 | Conséquence |
|---|---|
| **TUPOLEV** | Immobilisation, perte de manœuvrabilité ou explosion du réservoir |
| **ORGUE DE STALINE** | Armement retourné contre le soyouz (à –2 : plus aucun tir) |
| **PARADE** | Jet en PRISONNIER POLITIQUE pour ne pas fuir en gilet de sauvetage |
| **LEBEDEV** | Vaisseau muet et sourd, l'adversaire gagne des bonus |
| **DATCHA** | Dépressurisation forcée (ou plus de vodka à bord — urgence absolue) |
| **MUR DE FER** | Blindage qui part en lambeaux, combats futurs plus durs |

> **TÉTRIS** ne prend **pas** d'avarie (masse intrinsèque du vaisseau).

Le Signe *Jusqu'au-boutiste* décale la limite à –4 au lieu de –3. Le Signe *Pitoyable* double les dégâts d'avarie reçus mais empêche le coup de grâce final.

---

## Combat spatial — Postes et rôles

Dans un combat spatial, plusieurs postes permettent à **tous** les Kamarades de participer :

| Rôle | Trait Kamarade | Trait Soyouz | Action |
|---|---|---|---|
| **Pilote** | SOYOUZ | TUPOLEV | Manœuvrer, poursuivre, semer, éperonner |
| **Artilleur** | AK 47 | ORGUE DE STALINE | Tirer, infliger des dégâts |
| **Opérateur** | OPÉRATEUR CODEUR | LEBEDEV | Entraide : annoncer 9/12/15 pour +1/+2/+3 à un autre poste (échec = malus) |
| **Technicien** | MACHINISTE | — | Entraide en combat ou réparation en fin de tour (9/12/15 = 1/2/3 PV ou points de Trait rendus) |
| **Beau parleur** | PROPAGANDE / BRISEUR DE GRÈVE | PARADE | Regonfler le moral, impressionner les assaillants |
| **Bourrin** | LUTTE / MUSKLE | — | Combat externe (1 dégât max), aide au mécano, encaisser des dégâts à la place du vaisseau (×2 sur les PV du Kamarade) |

### Réparation (fin de tour)

Le technicien annonce une difficulté :
- **9** → rend 1 PV ou 1 point de Trait
- **12** → rend 2
- **15** → rend 3

Sur échec, il **aggrave** les dégâts (inverser la polarité du régulateur de mornifle, couper un circuit essentiel…).

---

## Modification d'un soyouz (en jeu)

Les Kamarades peuvent faire évoluer leur vaisseau entre deux scénarios, mais **ça coûte**.

### Avec de l'XP

- **2 XP** par point de Trait ajouté
- **2 XP** par Signe Particulier du soyouz
- **Mutualisable** entre plusieurs Kamarades

### Avec un jet de dés

Difficulté = **opposé du total des Traits du vaisseau**.
Ex : si le total est à +2, malus de –2 sur le jet.

- Jet à **9** = +1 à un Trait
- Jet à **12** = +2

Sur échec, le vaisseau **perd** des points ou gagne une Faiblesse.

### Contraintes narratives (règles d'univers)

Le Secrétaire Général doit **contrer** l'optimisation abusive :
- **Chapardages** aux kosmodocks (plaques, câbles, ailerons rutilants)
- **Confiscations** par des officiers tatillons revendeurs de pièces
- **Pénurie mécanique** : sur Plouk 47, difficile d'avoir mieux que +1
- **Déshabiller Youri pour habiller Piotr** : +1 à un Trait = –1 à un autre
- **Accidents divers** (alcoolémie oblige)

---

## Environnement spatial

L'Union est parsemée de :
- **Kosmorocades** : autoroutes balisées au cœur de l'Union
- **Kosmodocks** : stations-services spatiales (stands à tchéboureks, salons-lits)
- **Astroports** : terminus d'aéroport à la limite atmosphérique, ascenseurs géants
- **Spatiobars** insalubres (en s'approchant de la Border Zone)

La table **Événements à bord des soyouz** (p.86-87) propose 20 événements aléatoires pour pimenter les longs voyages : laitue vampire mutante, gnome vendeur de harnais, hacker ennuyé, épave piégée, éléphobranque en rut, boucle spatio-temporelle, génération lost, Krustpodes droguées au sucre, vortex échangeur de corps, Père Noël nemtsy en panne de rennes, etc.

---

## Renvois internes

- [traits_soyouz.md](traits_soyouz.md) — Détail des 7 Traits, avaries, qualificatifs d'exemple
- [signes_soyouz.md](signes_soyouz.md) — Les 14 Signes Particuliers achetables pour un vaisseau
- [dons_soyouz.md](dons_soyouz.md) — Dons spécifiques aux vaisseaux ennemis
