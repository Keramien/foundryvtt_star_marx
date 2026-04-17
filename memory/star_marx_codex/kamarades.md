# Kamarades — Création et gestion de personnage

> Source : Livre de base, p.69-73, 123-125, 127-151 ; Kosmokultor p.30-31

---

## Création pas à pas

### Etape 1 : Choisir un Peuple et une Doctrine (p.70)

**Peuples disponibles :** Humain, Hjort, Klon, Simple, Bourbasky, Mnogy, Gryazny, Gonklin, Krolik, Gigolbare, Robot, Alevin, Baboulin, Bicyclope, Dulusk, Truizyik, Vulgain, Xiphomis, Morskoyzeh, Tsvetok, Gusano.

**Doctrines :**
| Doctrine | Focus | Traits associés |
|---|---|---|
| **Marteau** | Physique/Combat | AK 47, Briseur de Greve, Goulag, Karkass, Lutte, Medaille Olympique, Muskle, Prisonnier Politique, Soyouz |
| **Faucille** | Social/Interaction | Acrobate, Action Partisane, Bolchoi, Corruption, Etre au Parfum, Grouillot, Marche Noir, Poupee Russe, Propagande, Social Traitre |
| **Etoile** | Intellectuel/Technique | Dopage, Jeux et Paris, KGB, Machiniste, Operateur Codeur, Pionnier, Recherche & Conception, Samizdats, Tchernobyl, Universitet |

Chaque Trait de la Doctrine choisie reçoit **1 croix gratuite**.

> Certains peuples imposent une Doctrine (ex : Klon = Marteau, Hjort = Faucille, Bourbasky = Etoile).

---

### Etape 2 : Choisir les Signes Particuliers (p.70)

- **2 Signes Particuliers** au choix
- SAUF si le peuple a un Signe Racial obligatoire → 1 racial gratuit + 1 au choix
- Humains : pas de racial, mais +2 points de Trait bonus à la place

Voir le dossier `signes/` pour la liste complète :
- `signes/signes_generaux.md` — Signes accessibles à tous
- `signes/signes_traits.md` — Signes associés à un Trait spécifique
- `signes/signes_raciaux.md` — Signes Raciaux (souvent obligatoires)
- `signes/signes_groupuscules.md` — Signes réservés à un groupuscule

---

### Etape 3 : Distribuer 20 points de création dans les Traits (p.71)

- **20 points** à répartir
- Traits de sa Doctrine : **1 point = 1 rang**
- Traits hors Doctrine : **2 points = 1 rang**
- **Maximum à la création : 5 rangs** par Trait

Voir [traits.md](traits.md) pour la liste des 29 Traits.

---

### Etape 4 : Calculer les Points de Vie (p.71)

```
PV = 5 + KARKASS
```

Modificateurs possibles :
| Source | Modification |
|---|---|
| Signe "Grand" | +2 PV |
| Signe "En première ligne" | +3 PV |
| Signe "Never Give Up !" | PV = 5 + PRISONNIER POLITIQUE (remplace KARKASS) |
| Race Krolik | +2 PV |
| Race Mnogy | +1 PV |
| Race Klon (via "Grand") | +2 PV |

---

### Etape 5 : Calculer les Dégâts (p.72)

Basés sur le Trait utilisé pour le combat (généralement LUTTE ou AK 47) :

| Valeur du Trait | Dégâts |
| 0-2 | 1 |
| 3-4 | 2 |
| 5-6 | 3 |
| 7+  | 4 |

Modifié par certains Signes (Boucher : +1, Précis : +1, etc.).

---

### Etape 6 : Déterminer l'Armure (p.72, 123)

- Concept narratif (objet, capacité ou PNJ) qui permet d'**ignorer TOUS les dégâts d'une attaque**
- Utilisable **2 fois par scénario**
- Le joueur décrit ce qu'est son Armure
- Reset entre les scénarios

---

### Etape 7 : Choisir la Kontrebande (p.72-73, 124-125)

- **1 Kontrebande** de départ (max 5, achetables avec des Zlotys auprès du MJ)
- Donne **+2 bonus** à un jet (ou aux dégâts) quand utilisée, puis devient "cochée" (utilisée)
- Peut être "réparée" (taper dessus à la soviétique) :
  - 1ère réparation : casse sur 1-2 (d6)
  - 2ème réparation : casse sur 1-4
  - 3ème réparation : auto-détruite mais fonctionne une dernière fois

Des tables de **Barda** (équipement aléatoire) existent pour chaque Doctrine et la plupart des races.

---

## Système de combat

### Initiative
Le MJ décide de l'ordre.

### Résolution
- Jet : **2d6 + Trait - Dangerosité de l'ennemi**
- Résultat >= 9 = touché → infliger les dégâts
- Résultat < 9 = le Kamarade subit les dégâts de l'ennemi

### Dangerosité
Valeur de difficulté intrinsèque de chaque ennemi, servant de malus au jet d'attaque.

### Poursuite
+1/-1 à l'indicateur de progression par succès/échec ; +3 ou -3 termine la poursuite.

---

## Progression / XP (p.43)

- Le MJ distribue **1 XP par scénario** (peut varier)
- Dépenses :

| Coût | Achat |
|---|---|
| 1 XP | +1 rang dans un Trait de Doctrine |
| 2 XP | +1 rang dans un Trait hors Doctrine |
| 2 XP | Nouveau Signe Particulier ou Clef |
| 2 XP (mutualisable) | +1 au Trait d'un vaisseau (Soyouz) ou Signe de vaisseau |

---

## Soins

| Méthode | Effet |
|---|---|
| DOPAGE (après combat) | Pool de soins = score DOPAGE, distribué entre l'équipe |
| Vodka (1 Zloty, hors combat) | +3 PV |
| Régénération (Signe) | +3 PV à la fin de chaque combat |
| Cuistot roboratif (Signe) | Pool de soins = score GROUILLOT |
| Robots | Nécessitent MACHINISTE (pas DOPAGE) |

---

## A 0 PV
Le personnage est **mort, inconscient ou psychologiquement brisé** (le MJ décide).

---

## Clefs (p.147-151, optionnel)

Traits de personnalité optionnels qui rapportent des Zlotys quand joués. Coûtent **2 XP**. Maximum **5 par Kamarade**.

35+ Clefs disponibles : Addict, Amnésique, Apparatchik, Austère, Balai, Barbare, Bernard Lévrier, Bricoleur, Briseur de Coeur, Coeur Brisé, Collectionneur de Trophées, Contrat Social, Diva, Dourak, Ecologiste, Economie d'Energie, Exilé, Gladiateur de Mir TV, Gourmet, Grognon, Imposteur, Kapo, Kommissaire, Lutte Finale, Machine, Maître d'Echec, Masochiste, Opium du Peuple, Par le bout du nez, Parti, Plan Quinquennal, Pollueur, Productivité, Promis au Goulag, Question, Radin, Renommée, Repli Stratégique, Révolte, Savant Fou, Social-Traître, Survivant, Trente billions d'amis, Verbeux, Vétéran, Voyageur, Vrai Socialiste.

### Clefs du Kosmokultor (p.30-31)
- **Clef du Foncedé** : expérimentation de drogues
- **Clef du DJ** : contrôle la playlist musicale de la session

---

## Règles optionnelles

### Faiblesses (p.145)
Sur un échec critique, le personnage gagne une faiblesse (-4 quand invoquée). Peut être utilisée pour 1 Zloty. Retirée en fin de session avec accord du MJ.

### Atouts (p.146)
Sur un succès critique hors combat, gagne une phrase d'avantage commémorative (+2 une fois par scénario). Peut être rafraîchi en l'utilisant comme handicap.

---

## Résumé de la fiche de personnage

```
NOM : _______________
PEUPLE : ____________     DOCTRINE : ___________

TRAITS MARTEAU          TRAITS FAUCILLE         TRAITS ETOILE				       TRAITS SPECIAUX
□□□□□ AK 47             □□□□□ Acrobate          □□□□□ Dopage               □□□□□ Tchernobyl
□□□□□ Briseur de Greve  □□□□□ Action Partisane  □□□□□ Jeux et Paris
□□□□□ Goulag            □□□□□ Bolchoi           □□□□□ KGB
□□□□□ Karkass           □□□□□ Corruption        □□□□□ Machiniste
□□□□□ Lutte             □□□□□ Etre au Parfum    □□□□□ Operateur Codeur
□□□□□ Medaille Olymp.   □□□□□ Grouillot         □□□□□ Pionnier
□□□□□ Muskle            □□□□□ Marche Noir       □□□□□ Recherche & Conc.
□□□□□ Prisonnier Pol.   □□□□□ Poupee Russe      □□□□□ Samizdats
□□□□□ Soyouz            □□□□□ Propagande        □□□□□ Universitet
                        □□□□□ Social Traitre    

PV : 5 + KARKASS = ___     DEGATS : ___
ARMURE : ___ (2 utilisations/scénario)
ZLOTYS : 5 (+ bonus raciaux)

SIGNES PARTICULIERS :       KONTREBANDE :
1. _______________          1. _______________ (+2)
2. _______________

CLEFS :
1. _______________
```
