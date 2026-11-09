/* ═══════════════════════════════════════════════════════════════
   agents-playground — Pipeline multi-agents (mode simulation)
   Reproduit la chaîne réelle de la factory LanceFer : Orchestrator ->
   Architecte -> Ingénieur(s) -> QA (tests + adversarial) ->
   Auditeur sécurité (veto possible) -> Gatekeeper release.
   Tout tourne dans le navigateur, seed déterministe,
   AUCUN appel réseau, AUCUNE donnée réelle.
   ═══════════════════════════════════════════════════════════════ */

/* PRNG déterministe (mulberry32) — même tâche = même plan */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* ── Dictionnaires de la factory ────────────────────────────────── */
const ROLES = {
  orch:    { name: 'Orchestrator',    icon: '🧠', color: 'var(--gold)' },
  arch:    { name: 'Architecte',      icon: '📐', color: 'var(--goldsoft)' },
  eng:     { name: 'Ingénieur',       icon: '🛠️', color: 'var(--goldsoft)' },
  qa:      { name: 'QA / Tests',      icon: '🧪', color: 'var(--goldsoft)' },
  qaAdv:   { name: 'QA adversarial',  icon: '⚔️', color: 'var(--goldsoft)' },
  security:{ name: 'Auditeur sécurité', icon: '🛡️', color: 'var(--danger)' },
  gate:    { name: 'Gatekeeper release', icon: '🚦', color: 'var(--ok)' },
};

const STAGES = [
  { id: 'orch', label: 'Découpage en sous-tâches' },
  { id: 'arch', label: 'ADR & design des interfaces' },
  { id: 'eng',  label: 'Implémentation' },
  { id: 'qa',   label: 'QA : suite de tests' },
  { id: 'qaAdv',label: 'QA : adversarial fuzzing' },
  { id: 'security', label: 'Revue sécurité (veto possible)' },
  { id: 'gate', label: 'Gatekeeper de release' },
];

/* Lexique de risques que l'auditeur sécurité traque dans les specs. */
const RISK_WORDS = [
  { re: /\b(secret|private key|clé privée)\w*/i,   issue: 'Gestion de secret en dur', fix: 'Extraire vers variables d\'environnement + Docker Secrets ; secret jamais versionné.' },
  { re: /\b(password|mot de passe)\b/i,            issue: 'Mot de passe mentionné dans la spec', fix: 'Référencer un hash (bcrypt/argon2) et un champ UI, jamais la valeur.' },
  { re: /\beval\b|\bFunction\(/i,                 issue: 'eval() detecté (code execution)', fix: 'Remplacer par parseur AST/liste blanche (même décision que sur la calculatrice ARIA).' },
  { re: /\b(delete all|drop table|truncate)\b/i,  issue: 'Operation destructive illimitée', fix: 'Rendre impossible : requêtes paramétrées + double confirmation + backup.' },
  { re: /\b(http:\/\/)/,                          issue: 'Endpoint non chiffré (HTTP)', fix: 'HTTPS + HSTS ; exception LAN locale documentée dans l\'ADR.' },
  { re: /\b(personal data|user data|nom réel|real name)\b/i, issue: 'Données personnelles dans le flux', fix: 'Anonymiser (placeholders <User>), masquage à la télémétrie [USER_HOME].' },
];

const IDEA_EXAMPLES = [
  'Ajouter "mémorise que je m\'appelle..." à ARIA',
  'Export PDF des clôtures de caisse',
  'Partage instantané du presse-papiers (desktop ↔ mobile)',
  'expose l\'API avec delete all /users pour l\'admin',
  'login avec le mot de passe par défaut secret123 en prod',
  'Flux de streaming vidéo HTTP entre PC et téléphone',
];

/* ── Génération du plan (deterministe par tache) ─────────────────── */
function planFor(idea) {
  const rng = mulberry32(hashStr(idea.toLowerCase().trim()));
  const risks = RISK_WORDS.filter((r) => r.re.test(idea));
  const subtasks = [];
  const n = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < n; i++) {
    const dom = pick(rng, ['core', 'UI', 'API', 'sync', 'CLI', 'telemetry']);
    subtasks.push(`${dom}/${pick(rng, ['module helper', 'écran', 'endpoint', 'formatter', 'store', 'writer'])} + tests`);
  }
  const tests = 4 + Math.floor(rng() * 9);
  const adv = pick(rng, ['path traversal', 'timeout/cancel storm', 'unicode au path', 'malformed frame', 'double submit', 'race sur le store']);
  const vetoed = risks.length > 0;
  const secNote = vetoed || (rng() < 0.35 && !risks.length);
  return { idea, subtasks, tests, adv, risks, vetoed, secNote, fixedAfter: vetoed };
}
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

/* ── Logs par étape ──────────────────────────────────────────────── */
function stageLogs(plan, stageIndex) {
  const s = STAGES[stageIndex];
  const t = plan.idea.trim();
  const logs = [];
  switch (s.id) {
    case 'orch':
      logs.push(`[task received] "${t}`);
      logs.push(`répartition en ${plan.subtasks.length} sous-tâches → eng: /${plan.subtasks.join(' · eng: ')}`);
      logs.push('contraintes: CI verte obligatoire · aucun secret versionné · WCAG si UI');
      break;
    case 'arch':
      logs.push(`ADR-001 : intégration de "${t}" sans dépendance SaaS au core`);
      logs.push(`interfaces publiées: ${plan.subtasks.length} modules ; contrats signés avant le code`);
      break;
    case 'eng':
      logs.push(plan.subtasks.map((s2) => `implémente ${s2}`).join(' ; '));
      logs.push('style: commits conventionnels, zéro dump de données réelles');
      break;
    case 'qa':
      logs.push(`génération de la suite: ${plan.tests} tests (unit + intégration)`);
      logs.push(`result: ${plan.tests}/${plan.tests} ✓ pass`);
      break;
    case 'qaAdv':
      logs.push(`fuzz ciblé: ${plan.adv} · mutation de frames · état impossible`);
      logs.push(`result: 2 edge-cases durcis (guards ajoutées) puis re-run ✓`);
      break;
    case 'security':
      if (plan.risks.length) {
        for (const r of plan.risks) {
          logs.push(`🛑 VETO — ${r.issue}`);
          logs.push(`   fix demandé : ${r.fix}`);
        }
        logs.push('gatekeeper: NON-PUBLIÉ tant que le fix n\'est pas appliqué');
      } else if (plan.secNote) {
        logs.push('note (pas de veto) : durée de session + rate-limit à doubler au endpoint public');
      } else {
        logs.push('revue: sanitizer anti-path-traversal OK · pas de secret en dur · pas d\'eval');
      }
      break;
    case 'gate':
      if (plan.vetoed) {
        logs.push('⏸ HOLD — release bloquée par veto sécurité (fix à appliquer avant re-run)');
      } else {
        logs.push(`✓ ALLOW — release attachée à un tag v* · artefacts construits par CI`);
        logs.push('historique: tache → ADR → tests → veto → release tracés immuablement');
      }
      break;
  }
  return logs;
}

const verdict = (plan) => plan.vetoed
  ? { cls: 'danger', text: 'VETO SÉCURITÉ — fix exigé, release en attente' }
  : { cls: 'ok', text: 'RELEASE AUTORISÉE ✓ QA + audit de sécurité passés' };
