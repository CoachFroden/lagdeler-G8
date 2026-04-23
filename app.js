const players = [
  { name: "David", level: 5 },
  { name: "Davyd", level: 6 },
  { name: "Eryk", level: 6 },
  { name: "Linus", level: 7 },
  { name: "Emil", level: 7 },
  { name: "Tobias", level: 7 },
  { name: "Max", level: 8 },
  { name: "Olai", level: 4 },
  { name: "Isak", level: 7 },
  { name: "Lavrans", level: 3 },
  { name: "Johannes", level: 3 },
  { name: "Mikael", level: 1 },
  { name: "Mikkel", level: 4 },
  { name: "Daniel", level: 1 },
  { name: "Sigurd", level: 1 },
  { name: "Evo", level: 2 },
  { name: "Thomas", level: 4 },
  { name: "Samuel", level: 2 }
];

let selected = new Set(players.map(p => p.name));
let conflicts = [];
let together = []; // NY

const playerList = document.getElementById("playerList");

// Spillere
players.forEach(p => {
  const div = document.createElement("div");
  div.className = "player active";
  div.textContent = p.name;

  div.onclick = () => {
    if (selected.has(p.name)) {
      selected.delete(p.name);
      div.classList.remove("active");
    } else {
      selected.add(p.name);
      div.classList.add("active");
    }
  };

  playerList.appendChild(div);
});

//
// 🔴 KONFLIKTER
//
function renderConflictSelector() {
  const controls = document.getElementById("conflictControls");
  controls.innerHTML = "";

  const select1 = document.createElement("select");
  const select2 = document.createElement("select");

  players.forEach(p => {
    select1.innerHTML += `<option>${p.name}</option>`;
    select2.innerHTML += `<option>${p.name}</option>`;
  });

  const btn = document.createElement("button");
  btn.textContent = "Legg til";

  btn.onclick = () => {
    if (select1.value !== select2.value) {
      const exists = conflicts.some(c =>
        (c[0] === select1.value && c[1] === select2.value) ||
        (c[0] === select2.value && c[1] === select1.value)
      );

      if (!exists) {
        conflicts.push([select1.value, select2.value]);
      }
      renderConflicts();
    }
  };

  controls.appendChild(select1);
  controls.appendChild(select2);
  controls.appendChild(btn);

  renderConflicts();
}

function renderConflicts() {
  const list = document.getElementById("conflictList");
  list.innerHTML = "";

  conflicts.forEach((c, index) => {
    const item = document.createElement("div");
    item.textContent = `${c[0]} ❌ ${c[1]}`;

    item.onclick = () => {
      conflicts.splice(index, 1);
      renderConflicts();
    };

    list.appendChild(item);
  });
}

renderConflictSelector();

//
// 🟢 SPILL SAMMEN (NY)
//
function renderTogetherSelector() {
  const controls = document.getElementById("togetherControls");
  controls.innerHTML = "";

  const select1 = document.createElement("select");
  const select2 = document.createElement("select");

  players.forEach(p => {
    select1.innerHTML += `<option>${p.name}</option>`;
    select2.innerHTML += `<option>${p.name}</option>`;
  });

  const btn = document.createElement("button");
  btn.textContent = "Legg til";

  btn.onclick = () => {
    if (select1.value === select2.value) {
      alert("Velg to forskjellige spillere");
      return;
    }

    const exists = together.some(t =>
      (t[0] === select1.value && t[1] === select2.value) ||
      (t[0] === select2.value && t[1] === select1.value)
    );

    if (!exists) {
      together.push([select1.value, select2.value]);
    }

    renderTogether();
  };

  controls.appendChild(select1);
  controls.appendChild(select2);
  controls.appendChild(btn);

  renderTogether();
}

function renderTogether() {
  const list = document.getElementById("togetherList");
  list.innerHTML = "";

  together.forEach((t, index) => {
    const item = document.createElement("div");
    item.textContent = `${t[0]} 🤝 ${t[1]}`;

    item.onclick = () => {
      together.splice(index, 1);
      renderTogether();
    };

    list.appendChild(item);
  });
}

renderTogetherSelector();

//
// ⚙️ LAG LAG
//
let lastTeams = [];

document.getElementById("generate").onclick = () => {
  const numTeams = parseInt(document.getElementById("numTeams").value);

  const activePlayers = players.filter(p => selected.has(p.name));
  if (activePlayers.length < numTeams) {
    alert("For få spillere!");
    return;
  }

  let teams = Array.from({ length: numTeams }, () => []);

  // shuffle
  for (let i = activePlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activePlayers[i], activePlayers[j]] = [activePlayers[j], activePlayers[i]];
  }

  activePlayers.sort((a, b) => b.level - a.level + (Math.random() - 0.5));

  activePlayers.forEach(p => {
    let bestTeam = teams[0];
    let bestScore = Infinity;

    teams.forEach(team => {
      let score = team.reduce((sum, x) => sum + x.level, 0);

      // konflikter
      conflicts.forEach(c => {
        if (team.some(x => x.name === c[0]) && p.name === c[1]) score += 100;
        if (team.some(x => x.name === c[1]) && p.name === c[0]) score += 100;
      });

      // samarbeid (NY)
      together.forEach(t => {
        if (team.some(x => x.name === t[0]) && p.name === t[1]) score -= 200;
        if (team.some(x => x.name === t[1]) && p.name === t[0]) score -= 200;
      });

      score += Math.random();

      if (score < bestScore) {
        bestScore = score;
        bestTeam = team;
      }
    });

    bestTeam.push(p);
  });

  lastTeams = teams;

  showModal(teams);
  document.getElementById("showTeams").classList.remove("hidden");
};

function showModal(teams) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");

  content.innerHTML = "";

  teams.forEach((team, i) => {
    const div = document.createElement("div");

    const totalLevel = team.reduce((sum, p) => sum + p.level, 0);

div.innerHTML = `
  <div class="teamHeader">
    <div class="teamTitle team${i + 1}">Lag ${i + 1}</div>
    <div class="teamLevel">⚡ ${totalLevel}</div>
  </div>

  ${team.map(p => `<div>${p.name}</div>`).join("")}
  <br><br>
`;

    content.appendChild(div);
  });

  modal.classList.remove("hidden");
  modal.classList.add("show");
}

document.getElementById("modal").onclick = () => {
  document.getElementById("modal").classList.remove("show");
};

document.getElementById("showTeams").onclick = () => {
  if (lastTeams.length) {
    showModal(lastTeams);
  }
};

document.getElementById("togglePlayers").onclick = () => {
  playerList.classList.toggle("hidden");
};

document.getElementById("toggleConflicts").onclick = () => {
  document.getElementById("conflicts").classList.toggle("hidden");
};

// NY toggle
document.getElementById("toggleTogether").onclick = () => {
  document.getElementById("together").classList.toggle("hidden");
};