# Etat des implementations des Signes des Kamarades

Derniere mise a jour : 2026-05-08.

Ce document suit l'etat d'implementation des Signes particuliers des Kamarades dans Foundry VTT.

Etats utilises :

- `Implemente` : l'effet mecanique principal est branche dans les calculs du systeme et couvert par des tests unitaires quand l'effet est automatisable.
- `Partiel` : une partie de l'effet est automatisee, mais il reste un point de regle a coder ou a arbitrer.
- `Narratif` : le Signe existe dans les packs, mais son effet est gere par le joueur ou le Secretaire General sans besoin de code pour l'instant.
- `Manuel` : le Signe existe dans les packs, mais son effet est gere par le joueur ou le Secretaire General sans besoin de code pour l'instant.
- `A faire` : le Signe a une mecanique identifiable qui merite une implementation dediee.

## Signes raciaux

| Signe | Etat | Description breve |
|---|---|---|
| Alevin | Manuel | Acces aux Signes de Robot sauf Defragmentation acceleree, soins par MACHINISTE et mode aquatique a 1 PV a cadrer. |
| Bicyclope | Implemente | Bonus automatique de +2 en MEDAILLE OLYMPIQUE, en supposant le terrain favorable par defaut. |
| Bourbasky | Narratif | Adaptation au vide, corps modulable et substitution narrative de TCHERNOBYL selon le recit. |
| Dulusk | Implemente | Donne acces a un Signe racial ou une Clef raciale au choix selon le metissage du personnage. |
| Gigolbare | A faire | Gateaux dopants : ajout d'un de a un test, cout en PV selon le resultat et usages limites par KARKASS. |
| Gonklin | Manuel | Bonus de +2 pour casser les machines et malus de -2 pour les utiliser. |
| Gryazny | Implemente | Maximum de Kontrebandes augmente de 5 a 7. |
| Hjort | Implemente | +2 en CORRUPTION, +2 Zlotys et limite optionnelle de PRISONNIER POLITIQUE a 1. |
| Humain | Implemente | +2 points de Traits et +1 Signe maximum a la creation. |
| Klon | Implemente | Bonus de +2 contre la peur et attribution/equivalent automatique du Signe Grand. |
| Krolik | Implemente | +2 PV, -2 en BRISEUR DE GREVE et +1 degat en LUTTE sont automatises ; le bonus de bond reste contextuel. |
| Mnogy | Implemente | +1 PV est automatise ; le +2 pour resister a la peur reste a integrer avec les contextes de peur. |
| Reflexe Pavlovien | Manuel | Pouvoir TCHERNOBYL contre la dangerosite ennemie, avec effet d'interruption de l'affrontement. |
| Robot | Narratif | Absence de respiration, resistance au vide et contraintes de reparation gerees a la table pour l'instant. |
| Roi du Pogo | Manuel | Toute interaction physique au contact inflige automatiquement 1 PV a la cible. |
| Simple | Manuel | Signe Petit gratuit et emprunt ponctuel du Trait d'un Kamarade contre 1 Zloty. |
| Truizyk | Narratif | Lecture des pensees via la transpiration avec TCHERNOBYL, fortement dependante du contexte. |
| Vynoslivy | Narratif | Quasi-invulnerabilite au vide, manque d'air, temperature et faim ; ressort surtout narratif. |
| Xiphomis | Narratif | Ailes repliables et usage de TCHERNOBYL pour le vol selon le recit du joueur. |

## Signes generaux

| Signe | Etat | Description breve |
|---|---|---|
| Acolyte, Larbin, etc. | A faire | Suivant secondaire avec ses propres Traits, gerable comme PNJ ou note de personnage. |
| Angora | Manuel ? | Depense de Zlotys pour imposer un malus allergique ou baisser la dangerosite d'un adversaire. |
| Armurier | Implemente | Premier jet de LUTTE ou AK 47 en combat : +1 au jet et +1 aux degats, consomme par Kamarade via les flags du combat ; le proprietaire est toujours affecte et peut ajouter d'autres Kamarades. |
| Attaque Bondissante | Manuel ? | Une fois par combat, contre 1 Zloty, ajoute MEDAILLE OLYMPIQUE aux degats de LUTTE. |
| Autonomie | Narratif | Gestion de l'autonomie energetique du Robot sans compteur systeme dedie pour l'instant. |
| Bien Outille | A faire | La Kontrebande donne +4 au lieu du bonus standard de +2. |
| Defragmentation acceleree | Narratif | Robot operationnel 24h/24, sans mise en veille obligatoire. |
| Derogation | Implemente | Trait cible configurable sur l'instance du Signe ; le Trait choisi progresse au cout de Doctrine. |
| Egalite mon c... | Narratif | Les echecs critiques et evenements aleatoires retombent sur d'autres personnages. |
| Famille nombreuse | A faire | Variante d'Acolyte pour Petits Klons, avec repartition et reutilisation de points de Traits. |
| Grand | Implemente | +2 PV, +2 en BRISEUR DE GREVE et +1 degat en LUTTE ; annule avec Petit si les deux sont presents. |
| Heros malgre lui | Narratif | Une fois par partie, transforme les consequences d'un echec critique en effet benefique. |
| La dure Loi de l'Evolution | Manuel | Sacrifice d'un Petit Klon pour eviter la moitie des degats recus. |
| La Fessee | Manuel | Sacrifice d'un Petit Klon pour donner un bonus de +2 au prochain jet des survivants. |
| Maman etait un poele en fonte | Manuel | Contre 1 Zloty, renvoie la moitie des degats naturels subis par le Robot. |
| Methodique | A faire | Reserve de points bonus creee par les excedents d'un jet au-dessus de 9. |
| Mon precieux ! | Implemente | Trait cible configurable sur l'instance du Signe ; le Trait choisi gagne +1 en bonus automatique. |
| Oups ! Desole... | Manuel | Une fois par combat, une attaque rate le Kamarade et touche quelqu'un d'autre. |
| Passager Hallucinatoire | Narratif | Presence hallucinee geree par le Secretaire General. |
| Petit | Partiel | Plafond des degats de LUTTE et annulation avec Grand automatises ; discretion et esquive sur 1 restent manuelles. |
| Pieces autonomes | Narratif | Robot capable de separer ses membres ou capteurs, avec complications gerees par le Secretaire General. |
| Pimp my bot | Manuel | Deplacement temporaire de croix de Traits par un MACHINISTE contre 1 Zloty. |
| Proces et menaces | Manuel | Jet de CORRUPTION chaque round pour empecher un adversaire d'attaquer. |
| Radar a Nouba | Narratif | Detection des fetes et soirees contre un cout en Zlotys fixe par le Secretaire General. |
| Rancunier | Manuel | Apres survie a 0 PV, +1 contre un adversaire, son organisation ou son groupe. |
| Roue de la Fortune | A faire | Echecs critiques sur 2 et 3, avec gain d'XP toutes les cinq catastrophes. |
| Talent cache | Manuel | Depense d'XP en pleine partie pour acquerir un Trait utile. |
| Toi, j't'aime pas | Manuel | Intimidation ou pression sur les machines par un Gonklin via BRISEUR DE GREVE. |
| Toi, j't'aime vraiment pas | Manuel | Destruction d'une machine contre un cout en Zlotys negocie. |
| Tous dessus | A faire | Petits Klons immobilisant une cible et abaissant le seuil pour la toucher a 9. |
| Un seul esprit pour toute une equipe ! | Implemente | Mode configurable sur l'instance du Signe ; +1 en LUTTE, PRISONNIER POLITIQUE et BRISEUR DE GREVE en groupe, -1 si seul. |
| Veteran of Psychic War | Manuel | Captive un public avec ses recits ; jet en KARKASS ou LUTTE selon la mise en scene. |
| Vieille connaissance | Manuel | Une fois par partie, contre 1 Zloty, declare connaitre un PNJ utile. |

## Signes de groupuscule

| Signe | Etat | Description breve |
|---|---|---|
| Bibliotheque ambulante | Manuel | Echange temporaire d'un Trait avec UNIVERSITET contre Zlotys, avec cout croissant dans la partie. |
| Tu l'as laisse tomber par terre | Manuel | Permet d'utiliser la Kontrebande d'un autre PJ comme si c'etait la sienne. |

## Signes de Traits

| Signe | Etat | Description breve |
|---|---|---|
| A l'epreuve des balles | Manuel | Immunite digestive aux poisons et nourritures dangereuses, sans calcul systeme pour l'instant. |
| Bluffeur | Manuel | Substitution de JEUX ET PARIS a PROPAGANDE pour mentir, avec option de resultat cache. |
| Boucher | Implemente | +1 degat en LUTTE. |
| Cadavre exquis | Narratif | Fait disparaitre les cadavres par la cuisine. |
| C'est ma rubrique | Manuel | Permet d'utiliser SAMIZDATS sur les sujets lies a la rubrique choisie. |
| Chernyi Rynok | Manuel | Depense de 1 Zloty en debut de partie pour obtenir une cargaison utile au scenario. |
| Comme un chat | Narratif | Ignore les degats de chute sauf decision contraire du Secretaire General. |
| Confidence sur l'oreiller | Narratif | Obtient des informations apres une nuit de plaisir ou d'ivresse. |
| Cuistot roboratif | A faire | Pool de soins egal au Trait GROUILLOT, a repartir entre les convives. |
| Deduction | Narratif | Permet de demander au Secretaire General si un raisonnement est juste contre Zlotys. |
| Disparition | Manuel | Disparition ponctuelle du champ de vision d'un tiers, resolue par opposition. |
| Dissimulation | Narratif | Dissimule automatiquement un petit objet sur soi. |
| Dos au mur | Implemente | A 1 PV, +1 aux Traits de Marteau et +1 aux degats, sans boucle sur le calcul de PV. |
| Embuscade | A faire | Apres preparation, +1 aux scores et degats allies au premier round. |
| En premiere ligne | Implemente | +3 PV maximum via le calcul central de sante. |
| Esprit de meute | Manuel | Contre 1 Zloty, attaque supplementaire contre une cible blessee par un allie. |
| Fichier central | Narratif | Acces a des informations sensibles via ETRE AU PARFUM, contenu arbitre par le Secretaire General. |
| Filature | Manuel | Ajout de KGB ou PROPAGANDE a SOCIAL TRAITRE pour suivre ou surveiller discretement. |
| Garde du corps | Manuel | Interception des degats destines a des compagnons et usage possible de l'Armure. |
| Gladiator | Manuel | Une fois par combat, contre 1 Zloty, ajoute BOLCHOI aux degats. |
| IA de l'amour dans l'air | Manuel | Jet de debut de scenario pour gagner 3 Zlotys informatiques ou subir des ennuis numeriques. |
| Implant K | Narratif | Bibliotheque mentale accessible apres une heure de concentration. |
| Insomniaque | Narratif | Sommeil reduit a quatre heures, mais impossible a reveiller pendant ce repos. |
| Interrogatoire muscle | Manuel | Relances d'interrogatoire illimitees, chaque nouvel essai coutant 1d2 PV a la cible. |
| Ivrogne | Manuel | Substitution de KARKASS aux Traits de Faucille lors d'une cuite partagee. |
| Je garde une balle a ton nom | Manuel ? | Bonus de degats ou de Trait accorde par le Secretaire General selon la preparation. |
| Kalachnikov | Manuel | Repartition des degats d'AK 47 entre plusieurs adversaires. |
| La Fureur de Vivre | Manuel | En bataille spatiale, ajoute PRISONNIER POLITIQUE aux jets de pilotage contre 1 Zloty. |
| Lire sur les levres | Narratif | Comprend une personne visible qui parle une langue connue. |
| Machines et bidules | Manuel | Substitution de RECHERCHE ET CONCEPTION a un Trait, avec usure progressive de l'invention. |
| Mage du scotch | Manuel ? | Repare une Kontrebande cassee ou fait tenir une machine contre Zlotys. |
| Maitre chanteur | Narratif | Service impose a un PNJ innocent contre 1 Zloty et une pression narrative. |
| Maitre d'armes | Manuel | Repartition manuelle des degats de LUTTE entre plusieurs adversaires. |
| Masochiste | A faire | Gagne 1 Zloty temporaire par tranche de 3 PV perdus en combat. |
| Massacre artistique | Manuel | Une fois par combat, jet d'intimidation sanglante pour annuler l'attaque adverse. |
| Meme pas peur | Implemente | Substitution de BRISEUR DE GREVE a PRISONNIER POLITIQUE pour resister a la peur. |
| Memoire eidetique | Narratif | Permet de demander au Secretaire General des details oublies. |
| Minorite clandestine | Narratif | Reseau d'aide contre Zlotys, avec contraintes et risques narratifs. |
| Monsieur Propre | Manuel | Efface temoins et traces d'un crime avec un jet de GROUILLOT. |
| Ne pas se fier aux apparences | A faire | +2 au debut d'un conflit grace a la sous-estimation de l'adversaire. |
| Never Give Up ! | Implemente | Les PV sont calcules avec PRISONNIER POLITIQUE + 5 au lieu de KARKASS + 5. |
| Noyade verbale | Manuel | Immobilise verbalement une victime pendant une duree egale au resultat du jet. |
| O mon vaisseau 1 | A faire | +1 aux jets lies au vaisseau designe. |
| O mon vaisseau 2 | A faire | Bonus du vaisseau designe porte a +2, malus de -1 avec les autres vehicules et exclusivite d'equipe. |
| Ombre de l'ombre | Manuel | Indetectable tant que le Kamarade reste immobile dans une zone d'ombre. |
| Pangalactic Market | Narratif | Cuisine locale transformee en illusion culinaire exotique ou familiere. |
| Perfidie | Manuel | Une fois par combat, contre 1 Zloty, ajoute SOCIAL TRAITRE aux degats. |
| Petit debrouillard | Manuel | Recherche d'objet avec qualites choisies selon le resultat du jet de MARCHE NOIR. |
| Physionomiste | Narratif | Reconnait immediatement une personne deja rencontree. |
| Piqure | A faire | Ajoute 1d6 a un test au prix de 1d2 PV pour la cible injectee. |
| Point faible | Manuel | Une fois par combat, contre 1 Zloty, ajoute KGB aux degats. |
| Precis | Implemente | +1 degat en AK 47. |
| Projection | Manuel | Remplace les degats par une projection physique de l'adversaire. |
| Que d'un oeil | Narratif | Impossible a surprendre pendant le sommeil. |
| Realite virtuelle | Narratif | Permet de projeter le groupe dans un univers de jeu video. |
| Regeneration | Implemente | Recupere 3 PV a la fin de chaque combat via StarMarxCombat, avec notification de succes. |
| Reputation | Manuel | Jet de seuil 9 a chaque nouveau PNJ pour definir ce qu'il a entendu sur le Kamarade. |
| Roentgenizdat | Narratif | Gain de Zloty quand le Secretaire General utilise les musiques fournies par le joueur. |
| Roi de la combine | Manuel | Obtention temporaire d'une ou deux Kontrebandes en debut de scenario selon les jets. |
| Sabir | Narratif | Se fait comprendre partout pour l'essentiel. |
| Serial Lover | Manuel | Contre 1 Zloty, fait intervenir un ancien amour utile ou problematique selon le jet. |
| Serment d'hypocrite | Manuel | Une fois par combat, contre 1 Zloty, ajoute DOPAGE aux degats. |
| Sous la ceinture | A faire | Sur un jet de combat a trois des paye en Zlotys, les 1 comptent comme des 6. |
| Star de la propagande mediatique | Manuel | Une fois par aventure, substitue BOLCHOI a un autre Trait en presence d'un public. |
| Ton professoral | Manuel | Substitution d'UNIVERSITET a BRISEUR DE GREVE pour intimider un personnage scolarise. |
| Toujours la au bon endroit | Manuel | Jet de debut de scenario donnant 1 a 3 apparitions utiles avec les outils. |
| Tout en attaque | A faire | Abandon de l'Armure et degats de contact egaux au Trait MUSKLE. |
| Veneneux | A faire | Poison par DOPAGE avec pertes de PV selon le seuil choisi et consequences en cas d'echec. |
