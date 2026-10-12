const warmupStorageKey = "lagdeler-g8-warmup-v1";

// Names survive reordering of the roster (the existing p0, p1 IDs do not).
function pickHunters(roster, present, history, date, random = Math.random, avoid = []) {
  const known = new Set(roster);
  const active = new Set(present.filter(name => known.has(name)));
  const served = new Set(history.served.filter(name => known.has(name)));
  const previous = new Set(history.lastHunters);
  const hunters = [];
  while (hunters.length < 4) {
    if (roster.every(name => served.has(name))) served.clear();
    const eligible = roster.filter(name => active.has(name) && !served.has(name) && !hunters.includes(name));
    if (!eligible.length) break; // Absent players keep their turn.
    const alternatives = eligible.filter(name => !avoid.includes(name));
    const candidates = alternatives.length ? alternatives : eligible;
    const fresh = candidates.filter(name => !previous.has(name));
    const pool = fresh.length ? fresh : candidates;
    const name = pool[Math.floor(random() * pool.length)];
    hunters.push(name);
    served.add(name);
  }
  return {
    served: [...served],
    lastHunters: hunters,
    session: { date, hunters, beforeServed: [...history.served], beforeLastHunters: [...history.lastHunters] }
  };
}

function warmupDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function loadWarmupHistory() {
  const saved = localStorage.getItem(warmupStorageKey);
  if (!saved) return { served: [], lastHunters: [], session: null };
  const history = JSON.parse(saved);
  if (!history || !Array.isArray(history.served) || !Array.isArray(history.lastHunters) ||
      (history.session && (typeof history.session.date !== "string" || !Array.isArray(history.session.hunters)))) {
    throw new Error("Invalid warmup history");
  }
  return history;
}

function historyBeforeDraw(history) {
  const session = history.session;
  if (Array.isArray(session.beforeServed) && Array.isArray(session.beforeLastHunters)) {
    return { served: session.beforeServed, lastHunters: session.beforeLastHunters };
  }
  // Recover today's first draw from the previous version without clearing history.
  const rolloverIndex = session.hunters.findIndex(name => history.served.includes(name));
  const completedPreviousRound = rolloverIndex > 0 ? session.hunters.slice(0, rolloverIndex) : [];
  return {
    served: completedPreviousRound.length
      ? players.map(p => p.name).filter(name => !completedPreviousRound.includes(name))
      : history.served.filter(name => !session.hunters.includes(name)),
    lastHunters: []
  };
}

function renderWarmup(history) {
  const hunters = history.session.hunters;
  $("warmupHunters").replaceChildren(...hunters.map(name => {
    const badge = document.createElement("span");
    badge.className = "hunter";
    badge.textContent = name;
    return badge;
  }));
  const waiting = players.filter(p => !history.served.includes(p.name));
  const absentHunters = players.filter(p => hunters.includes(p.name) && !state.selected.has(p.id));
  const notes = [];
  if (hunters.length < 4) notes.push(`Valgt ${hunters.length} av 4 jegere. De andre som står for tur er ikke til stede.`);
  notes.push(waiting.length ? `Ikke vært jeger i denne runden: ${waiting.map(p => p.name).join(", ")}.` : "Alle har vært jeger. Neste gang starter en ny runde.");
  if (absentHunters.length) notes.push(`Ikke lenger merket til stede: ${absentHunters.map(p => p.name).join(", ")}. Dagens trekning er allerede lagret.`);
  $("warmupStatus").textContent = notes.join(" ");
  $("warmupResults").classList.remove("hidden");
  $("warmupResults").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("warmup").onclick = () => {
  $("message").textContent = "";
  try {
    const history = loadWarmupHistory();
    const date = warmupDate();
    const redraw = history.session?.date === date;
    const baseline = redraw ? historyBeforeDraw(history) : history;
    const present = players.filter(p => state.selected.has(p.id)).map(p => p.name);
    if (present.length < 4) {
      $("message").textContent = "Velg minst fire spillere som er til stede før du trekker jegere.";
      return;
    }
    const next = pickHunters(players.map(p => p.name), present, baseline, date, Math.random,
      redraw ? history.session.hunters : []);
    if (!next.session.hunters.length) {
      $("message").textContent = "Alle fremmøtte har allerede vært jeger. Venter på: " + players.filter(p => !baseline.served.includes(p.name)).map(p => p.name).join(", ") + ".";
      return;
    }
    // Do not show a successful draw unless its history was saved.
    localStorage.setItem(warmupStorageKey, JSON.stringify(next));
    renderWarmup(next);
  } catch (error) {
    $("message").textContent = "Kunne ikke lese eller lagre jegerhistorikken. Tillat lagring i nettleseren og prøv igjen. Historikken er ikke nullstilt.";
  }
};
