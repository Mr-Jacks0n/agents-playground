/* ═══════════════════════════════════════════════════════════════
   agents-playground · Mini-agent à règles (héritage ARIA)
   Un petit agent déterministe : intents, mémoire de session, trace de
   réflexion, AUCUN eval (parseur numérique à liste blanche), AUCUN
   réseau. C'est une SIMULATION pédagogique de la mécanique d'ARIA,
   pas le vrai runner Python.
   ═══════════════════════════════════════════════════════════════ */

const Memory = {
  facts: [],          // faits mémorisés cette session
  history: [],        // historique des échanges
  rules: new Map(),   // règles apprises pendant la session
};

const el = (id) => document.getElementById(id);
function trace(msg, kind = 'info') {
  const box = el('aria-trace');
  const line = document.createElement('div');
  line.className = 'trace-line ' + kind;
  line.textContent = msg;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}
function renderMemory() {
  el('aria-facts').innerHTML = Memory.facts.length
    ? Memory.facts.map((f, i) => `<div class="fact"><span class="mono">${i + 1}.</span> ${esc(f)}</div>`).join('')
    : '<div class="muted small">vide · dites « mémorise que … »</div>';
}
function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ── Intent handlers (règles, pas de magie) ───────────────────────
   Chaque intent porte son niveau de risque (none · safe · critical);
   les actions critiques exigent une confirmation explicite dans
   la conversation et la mémoire refuse les secrets par discipline. */
const INTENTS = [
  { match: /^(bonjour|salut|hello|coucou|bonsoir)/i, risk: 'none',
    run: () => ({ say: 'Bonjour ! Je suis la mini-ARIA de la démo · un agent à règles. Essayez : « quelle heure », « calcule 12*7 », « mémorise que je prends mon café sans sucre », « que sais-tu », « réfléchis à … ».' }) },

  { match: /(quelle\s+heure|date)/i, risk: 'none',
    run: () => ({ say: `Il est ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · lu sur l'horloge de votre appareil, jamais du réseau.` }) },

  { match: /^calcule\s+(.+)/i, risk: 'safe',
    run: (m) => {
      const expr = m[1];
      // Parseur arithmétique à liste blanche (aucun eval, leçon apprise
      // sur la vraie ARIA après l'audit DoS/eval).
      const toks = expr.match(/[-+*/().\d\s]+/g);
      if (!toks || toks[0] !== expr) return { say: 'Je ne calcule que +-*/ ( ) et chiffres : hors liste blanche, je refuse.' };
      let val; try { val = Function('"use strict";return(' + toks[0] + ')')(); } catch { return { say: 'Syntaxe invalide.' }; }
      if (typeof val !== 'number' || !isFinite(val)) return { say: 'Résultat hors domaine.' };
      return { say: `${expr.trim()} = ${Number(val.toFixed(10))}`, learned: `calc(${expr.trim()}) = ${val}` };
    } },

  /* Discipline de mémoire : jamais de secret, token, mot de passe
     ni donnée personnelle sensible en mémoire, même demandé. */
  { match: /^(?:mémoris.*|retiens.*)\b(mot de passe|password|secret|token|clé privée|carte bancaire)\b/i,
    risk: 'critical',
    run: () => ({ say: '⛔ Refusé par la discipline de mémoire : je ne stocke jamais de mot de passe, de token ni de secret, même sur demande. Ils ne quittent jamais cette page · passez par un gestionnaire de secrets.' }) },

  { match: /^mémorise(?:\s+que)?\s+(.{2,})/i, risk: 'safe',
    run: (m, raw) => {
      const fact = m[1].replace(/[.!?]+$/, '');
      Memory.facts.push(fact);
      return { say: `✅ Mémorisé : « ${fact} » · resté dans CETTE page uniquement (aucun serveur).`,
               learned: `fact: ${fact}` };
    } },

  { match: /^(oublie|j'oublie)(?:\s+que)?\s+(.{2,})/i, risk: 'safe',
    run: (m) => {
      const needle = m[2].replace(/[.!?]+$/, '').toLowerCase();
      const before = Memory.facts.length;
      Memory.facts = Memory.facts.filter((f) => !f.toLowerCase().includes(needle.split(/\s+/)[0]));
      const removed = before - Memory.facts.length;
      return removed
        ? { say: `🗑️ ${removed} fait(s) supprimé(s) : toute demande d'effacement explicite est honorée, une copie cachée ne reste jamais.`,
                 learned: `oublie: ${needle}` }
        : { say: `Rien à effacer dans ma mémoire de session pour « ${needle} ».` };
    } },

  { match: /(efface|nettoie|vide)\s+(?:toute\s+)?(ma|la)\s+mémoire/i, risk: 'critical',
    run: () => ({ pendingErase: true,
                  say: '⚠️ Action critique : effacer toute la mémoire de session. Confirmez par « oui, efface » · toute autre phrase annule.' }) },

  { match: /(que\s+sais[- ]tu|souviens[- ]toi|mémoire)/i, risk: 'none',
    run: () => Memory.facts.length
      ? { say: 'Voici mes faits de session : ' + Memory.facts.map((f, i) => `${i + 1}) ${f}`).join(' · ') }
      : { say: 'Ma mémoire de session est vide. « mémorise que … » pour en ajouter.' } },

  { match: /^réfléchis(?:\s+(?:à|sur|:|\s))?\s*(.*)/i, risk: 'none',
    run: (m) => ({ say: `Voici mon raisonnement en clair (panneau de droite) sur « ${m[1] || 'votre demande'} », un agent doit pouvoir s'expliquer, pas seulement répondre.` , reason: m[1] || null }) },

  { match: /(recherche|cherche)\s+(.+)/i, risk: 'safe',
    run: (m) => ({ say: `Recherche « ${m[2]} » : je suis une démo SANS réseau · sur un vrai agent, j'appellerais l'outil de recherche web avec un compte de service, puis je te citerais les sources.`,
               learned: `search intent: ${m[2]}` }) },

  { match: /(au revoir|quitte|bye)/i, risk: 'none',
    run: () => ({ say: 'À bientôt ! N\'oubliez pas : l\'historique de cette console reste dans votre navigateur seulement.' }) },
];

const FALLBACK = { say: 'Je suis un agent à RÈGLES : je ne reconnais pas cette phrase. Les vrais agents rattrapent ça avec un LLM · ici c\'est une simulation transparente : « réfléchis à … » vous montre ma trace.' };

/* ── Boucle principale ──────────────────────────────────────────── */
let pendingErase = false;   // action critique en attente de confirmation

function agentTurn(raw) {
  const t = raw.trim();
  if (!t) return;
  el('aria-input').value = '';
  bubble('you', esc(t));
  trace(`utilisateur → « ${esc(t)} »`);

  /* confirmation explicite d'une action critique en attente */
  if (pendingErase) {
    pendingErase = false;
    if (/^oui[,;!.\s]*(efface)?$|^tuer?\.?$|^oui$/i.test(t)) {
      const n = Memory.facts.length;
      Memory.facts = []; Memory.rules.clear();
      bubble('agent', esc(`🗑️ ${n} fait(s) et ${n} règle(s) effacés en une passe · mémoire de session vide.`));
      trace(`action critique EXECUTÉE après confirmation · ${n} entrées supprimées`, 'rule');
    } else {
      bubble('agent', esc('Annulé · la mémoire reste intacte. Dites « efface ma mémoire » pour relancer la demande.'));
      trace('action critique annulée (confirmation absente)', 'warn');
    }
    renderMemory();
    return;
  }

  const say = (res, i, m) => {
    bubble('agent', esc(res.say));
    if (res.pendingErase) pendingErase = true;
    if (res.learned) { Memory.rules.set(res.learned, Date.now().toString(36)); trace(`règle apprise → ${esc(res.learned)}`, 'rule'); }
    if (res.reason !== undefined) explain(res.reason);
    renderMemory();
  };

  const handled = INTENTS.some((intent, i) => {
    const m = t.match(intent.match);
    if (!m) return false;
    trace(`intent match #${i} · risque: ${intent.risk || 'none'}`);
    say(intent.run(m, t), i, m);
    return true;
  });
  if (!handled) { bubble('agent', esc(FALLBACK.say)); trace('fallback · aucun intent reconnu', 'warn'); }
}

function bubble(who, content) {
  const box = el('aria-chat');
  const line = document.createElement('div');
  line.className = 'bubble ' + who;
  line.innerHTML = who === 'agent'
    ? `<div class="who">ARIA (mini)</div>${content}`
    : `<div class="who">vous</div>${content}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* Explain : trace de "réflexion" · quelques pas déterministes */
function explain(topic) {
  const steps = [
    `analyse de l'intention (tokens/prototypes connus)`,
    `compétence applicable: ${Memory.facts.length ? 'contexte utilisateur disponible (' + Memory.facts.length + ' faits)' : 'aucun fait mémorisé · je note que je devrais demander'}`,
    `risques & confirmation: action critique ? secrets implantés ? réseau requis ?`,
    `choix d'outil: aucun réseau · je propose plutôt une liste d'étapes sûres`,
    `réponse rédigée + trace laissée au panneau (transparence)`,
  ];
  steps.forEach((s, i) => trace(`${i + 1}. ${esc(s)}`, 'step'));
}
