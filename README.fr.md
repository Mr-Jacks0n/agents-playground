<div align="center">

![agents-playground](demo/banner.png)

**Les démos interactives de la méthode agents IA de Mr Jackson · 100 % dans votre navigateur.**

[![License](https://img.shields.io/badge/licence-MIT-bc9c22)](LICENSE)
[![No backend](https://img.shields.io/badge/backend-aucun-bc9c22)](demo/)
[![No LLM](https://img.shields.io/badge/LLM-aucun-bc9c22)](demo/)
[![No network](https://img.shields.io/badge/réseau-aucun-bc9c22)](demo/)
[![SIMULATION](https://img.shields.io/badge/mode-simulation-d6ba60)](#ce-que-ce-nest-pas)

**[🇬🇧 English version](README.md)** ·
[**▶ Ouvrir la démo**](https://mr-jacks0n.github.io/agents-playground/)

</div>

---

Deux démos interactives, un objectif : *montrer comment les vrais agents IA
industrialisés sont construits · et quels garde-fous ils traversent* · sans
prétendre que quoique ce soit en train de tourner.

## Ce que vous avez

### 🏭 Onglet 1 · Pipeline multi-agents de factory (simulé)

Tapez une idée de fonctionnalité. Une chaîne d'agents simulée reproduit la
méthode réelle utilisée dans [LanceFer](https://github.com/Mr-Jacks0n/LanceFer) :

```
Compétences → Orchestrator → Architecte → Ingénieur → QA (tests + adversarial)
→ Auditeur sécurité (VETO possible) → Gatekeeper release
```

- Déterministe : la même idée produit toujours le même déroulé (PRNG avec
  graine, `mulberry32`).
- D'abord, l'orchestrator **sélectionne des compétences dans un catalogue
  local** : chaque entrée déclare des déclencheurs explicites (« quand
  l'utiliser ») et un niveau de risque (`none · safe · critical`), et le plan
  est **prévisualisé avant exécution** avec des empreintes de manifeste simulées.
- L'**auditeur sécurité** parcourt votre idée avec un lexique de risques
  (secret en dur, `eval()`, HTTP non chiffré, opérations destructives, données
  personnelles…) et peut poser un **veto** sur la release · exactement la
  posture de sécurité de la vraie factory.
- Une release bloquée est l'*unique* issue quand l'idée est risquée. C'est
  voulu : le gatekeeper n'outrepasse jamais un veto.
- Les chiffres cités dans l'interface sont des statistiques réelles de dépôt
  (145 tests Node + 59 JVM sur LanceDrop), pas des inventions.

### 🤖 Onglet 2 · Console d'agent à règles (mini-ARIA)

La miniature d'[ARIA](https://github.com/Mr-Jacks0n/IA), l'agent apprenant
personnel de Mr Jackson :

- reconnaissance d'intents (pas de magie : des règles lisibles et assumées,
  chacune avec son niveau de risque),
- mémoire de session (« mémorise que … ») **avec discipline de mémoire** :
  secrets, tokens et mots de passe jamais stockés, même sur demande ·
  toute demande d'effacement explicite (« oublie que … ») est honorée ·
  une purge destructive (« efface ma mémoire ») exige une confirmation
  explicite dans la conversation,
- une **trace de réflexion transparente** · l'agent montre comment il raisonne,
- un **parseur arithmétique sûr à liste blanche** · la leçon directe de l'audit
  réel `eval()`/DoS de la calculatrice d'ARIA.

Tout vit dans la page. Un rechargement = mémoire propre.

### 📐 Onglet 3 · La méthode

Six cartes qui relient chaque concept simulé au dépôt réel où il vit.

## Ce que ce n'est pas

- ❌ Pas de LLM, pas de UI branchée sur un modèle · aucune clé d'API,
  aucune inférence.
- ❌ Aucun réseau : pas de télémétrie, pas de persistance au-delà de la page.
- ❌ Ce n'est pas une affirmation que des agents tournent ici. C'est une
  **simulation** étiquetée comme telle, qui montre des mécaniques et des
  garde-fous, avec des liens honnêtes vers les dépôts réels
  ([LanceFer](https://github.com/Mr-Jacks0n/LanceFer),
  [IA](https://github.com/Mr-Jacks0n/IA)) où ils existent vraiment.
- Le filigrane en bas à droite le rappelle toujours : *SIMULATION EXÉCUTÉE DANS
  VOTRE NAVIGATEUR · AUCUN LLM · AUCUN RÉSEAU*.

## Lancer en local

```bash
git clone https://github.com/Mr-Jacks0n/agents-playground.git
cd agents-playground/demo
python3 -m http.server 8000
# → http://localhost:8000
```

## Structure du dépôt

| Chemin | Rôle |
|---|---|
| `demo/index.html` | coquille à 3 onglets (pipeline · mini-ARIA · méthode) |
| `demo/pipeline.js` | moteur : PRNG, catalogue local de compétences (risque classifié), génération de plan, lexique de risques, logs par étape, verdict |
| `demo/aria.js` | mini-agent : intents, mémoire de session, trace de réflexion, parseur sûr |
| `demo/main.js` | orchestration DOM : onglets, animation des étapes, binding du chat |
| `demo/styles.css` | tokens de marque (or `#bc9c22` sur près-noir), grille de flux, chat, trace |
| `demo/banner.png` | bannière d'en-tête, construite depuis le kit de marque officiel Mr.Jackson |

## Licence

MIT © 2026 [Mr Jackson](https://github.com/Mr-Jacks0n)
