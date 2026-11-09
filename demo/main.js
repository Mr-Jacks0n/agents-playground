/* ═══════════════════════════════════════════════════════════════
   agents-playground · orchestration de l'interface
   Tabs, simulateur de pipeline (animation séquentielle), console
   mini-ARIA. Zéro framework, zéro réseau : juste du DOM.
   ═══════════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Système d'onglets ──────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    $('page-' + btn.dataset.page).classList.add('active');
    if (btn.dataset.page === 'aria') $('aria-input').focus();
  });
});

/* ═════════════════════════════════════════════════════════════════
   PIPELINE · flux, exemples, exécution animée
   ═════════════════════════════════════════════════════════════════ */

/* construire la grille de 7 étapes depuis STAGES + ROLES */
function buildFlow() {
  const flow = $('pi-flow');
  flow.innerHTML = '';
  STAGES.forEach((st, i) => {
    const r = ROLES[st.id];
    const card = document.createElement('div');
    card.className = 'stage';
    card.id = 'stage-' + st.id;
    card.innerHTML = `<div class="ic">${r.icon}</div><div>${r.name}</div><div class="small"></div>`;
    flow.appendChild(card);
  });
}

/* puces d'exemples cliquables */
function buildExamples() {
  const box = $('pi-examples');
  IDEA_EXAMPLES.forEach((idea) => {
    const b = document.createElement('button');
    b.className = 'ex';
    b.textContent = idea;
    b.addEventListener('click', () => { $('pi-idea').value = idea; runPipeline(); });
    box.appendChild(b);
  });
}

/* logs horodatés façon CI */
let tMs = 0;
function logConsole(text, cls = '') {
  const box = $('pi-console');
  tMs += 120 + Math.floor(Math.random() * 480);
  const stamp = new Date(tMs).toISOString().substring(14, 23);
  const ln = document.createElement('div');
  ln.className = 'ln ' + cls;
  ln.innerHTML = `<span class="ts">${stamp}</span>${text}`;
  box.appendChild(ln);
  box.scrollTop = box.scrollHeight;
}

let running = false;
async function runPipeline() {
  if (running) return;
  const idea = $('pi-idea').value.trim();
  if (!idea) { $('pi-idea').focus(); return; }
  running = true;
  $('pi-run').disabled = true;

  const plan = planFor(idea);

  /* reset visuel */
  tMs = 0;
  $('pi-console').innerHTML = '';
  $('pi-verdict').className = 'verdict';
  buildFlow();
  STAGES.forEach((st) => $('stage-' + st.id).querySelector('.small').textContent = '');

  const DUR = 420;
  for (let i = 0; i < STAGES.length; i++) {
    const st = STAGES[i];
    const card = $('stage-' + st.id);
    card.classList.add('run');

    const logs = stageLogs(plan, i);
    for (const msg of logs) {
      logConsole(msg, /VETO|NON-PUBLIÉ/.test(msg) ? 'err' : (/⏸/.test(msg) ? 'warn' : (/✓|ALLOW/.test(msg) ? 'ok' : '')));
      await sleep(260);
    }

    await sleep(DUR);
    if (st.id === 'security' && plan.vetoed) {
      card.classList.add('error');
      card.querySelector('.small').textContent = 'VETO ✋';
      logConsole('audit sécurité : release refusée · retour au développeur obligatoire', 'err');
    } else {
      card.classList.remove('run');
      card.classList.add('done');
      card.querySelector('.small').textContent = st.id === 'skills' ? `${plan.skills.length} retenues` : (st.id === 'qa' ? `${plan.tests} tests ✓` : (st.id === 'gate' ? (plan.vetoed ? 'HOLD' : 'RELEASE') : ''));
    }
  }

  const v = verdict(plan);
  const vd = $('pi-verdict');
  vd.classList.remove('ok', 'danger');
  vd.classList.add(v.cls);
  vd.textContent = plan.vetoed
    ? `⛔ ${v.text} · retirez les éléments risqués (ou appliquez les fixes proposés) et relancez la chaîne.`
    : `🚀 ${v.text} · les mêmes étapes que dans la vraie factory`;

  running = false;
  $('pi-run').disabled = false;
}

/* ═════════════════════════════════════════════════════════════════
   MINI-ARIA · binding de la console
   ═════════════════════════════════════════════════════════════════ */

function sendAria() {
  const raw = $('aria-input').value;
  agentTurn(raw);            // clear l'input lui-même
  $('aria-input').focus();
}

function seedAria() {
  renderMemory();
  trace('console démarrée · mode simulation locale, aucune donnée ne quitte la page');
  bubble('agent', esc('Bonjour ! Je suis la mini-ARIA · un agent à règles, pas un LLM. Essayez « quelle heure », « calcule 12*7 », « mémorise que … », « oublie que … », « que sais-tu » ou « réfléchis à … ». Astuce : demandez de mémoriser un mot de passe pour voir le refus de discipline, et « efface ma mémoire » pour la confirmation critique.'));
}

/* ── init ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildFlow();
  buildExamples();

  $('pi-run').addEventListener('click', runPipeline);
  $('pi-idea').addEventListener('keydown', (e) => { if (e.key === 'Enter') runPipeline(); });

  $('aria-send').addEventListener('click', sendAria);
  $('aria-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendAria(); });
  seedAria();
});
