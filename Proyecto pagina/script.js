const STORAGE_KEY = "infoempleos_data_v1";

const initialData = {
  users: [
    { name: "Admin Demo", email: "admin@infoempleos.com", role: "admin", password: "Admin123*", active: true },
    { name: "Carla Ruiz", email: "carla@correo.com", role: "candidato", password: "Candidata123*", active: true }
  ],
  session: null,
  jobs: [
    { id: 1, title: "Desarrollador Frontend", location: "Remoto", type: "Tiempo completo", company: "SoftNova", skills: ["React", "TypeScript"] },
    { id: 2, title: "Ingeniero DevOps", location: "Bogotá", type: "Tiempo completo", company: "CloudOps", skills: ["AWS", "CI/CD"] },
    { id: 3, title: "QA Automation", location: "Híbrido", type: "Freelance", company: "Quality Labs", skills: ["Cypress", "API Testing"] },
    { id: 4, title: "Desarrollador Backend", location: "Medellín", type: "Medio tiempo", company: "DataCore", skills: ["Node.js", "PostgreSQL"] }
  ],
  applications: []
};

const state = loadData();

const sections = ["panel", "empleos", "reportes", "ayuda", "respaldo"];
const sectionButtons = document.querySelectorAll(".nav-link");
const authTabs = document.querySelectorAll(".tab-btn");
const authForms = {
  login: document.querySelector("#login-form"),
  registro: document.querySelector("#registro-form"),
  recuperar: document.querySelector("#recuperar-form")
};

sectionButtons.forEach(btn => btn.addEventListener("click", () => switchSection(btn.dataset.section)));
authTabs.forEach(btn => btn.addEventListener("click", () => switchAuthView(btn.dataset.authView)));

document.querySelector("#login-form").addEventListener("submit", handleLogin);
document.querySelector("#registro-form").addEventListener("submit", handleRegister);
document.querySelector("#recuperar-form").addEventListener("submit", handleRecover);
document.querySelector("#logout-btn").addEventListener("click", logout);
document.querySelector("#empleos-search-form").addEventListener("submit", handleSearch);
document.querySelector("#export-report-btn").addEventListener("click", exportReport);
document.querySelector("#backup-btn").addEventListener("click", backupData);
document.querySelector("#restore-file").addEventListener("change", restoreData);

renderAll();

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(initialData);
  try {
    return { ...structuredClone(initialData), ...JSON.parse(raw) };
  } catch {
    return structuredClone(initialData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function switchSection(section) {
  sections.forEach(id => document.getElementById(id).classList.toggle("hidden", id !== section));
  sectionButtons.forEach(btn => btn.classList.toggle("is-active", btn.dataset.section === section));
  document.querySelector("#current-location").textContent = section[0].toUpperCase() + section.slice(1);
}

function switchAuthView(view) {
  Object.keys(authForms).forEach(key => authForms[key].classList.toggle("hidden", key !== view));
  authTabs.forEach(btn => {
    const active = btn.dataset.authView === view;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
}

function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;
  const user = state.users.find(u => u.email.toLowerCase() === email && u.password === password && u.active);

  if (!user) return showToast("Credenciales inválidas o usuario inactivo.", "error");

  state.session = { email: user.email, name: user.name, role: user.role, startedAt: new Date().toISOString() };
  saveData();
  showToast("Inicio de sesión exitoso.", "success");
  renderAll();
}

function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const requestedRole = form.role?.value;
  const safeRole = "candidato";

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim().toLowerCase(),
    role: safeRole,
    password: form.password.value,
    active: true
  };

  if (state.users.some(u => u.email === payload.email)) {
    return showToast("Ya existe un usuario con ese correo.", "warning");
  }

  state.users.push(payload);
  saveData();
  form.reset();
  switchAuthView("login");
  if (requestedRole && requestedRole !== safeRole) {
    showToast("El registro público solo permite el rol candidato.", "warning");
  }
  showToast("Registro exitoso. Ya puedes iniciar sesión.", "success");
  renderUsers();
}

function handleRecover(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const email = form.email.value.trim().toLowerCase();
  const user = state.users.find(u => u.email === email);
  if (!user) return showToast("No existe cuenta registrada con ese correo.", "warning");

  showToast(`Solicitud enviada a ${email}. (Simulación local)`, "success");
  form.reset();
}

function logout() {
  state.session = null;
  saveData();
  showToast("Sesión finalizada correctamente.", "success");
  renderAll();
}

function handleSearch(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const term = document.querySelector("#search-input").value.trim().toLowerCase();
  const location = document.querySelector("#location-filter").value;
  const type = document.querySelector("#type-filter").value;

  const filtered = state.jobs.filter(job => {
    const matchesTerm = [job.title, job.company, ...job.skills].join(" ").toLowerCase().includes(term);
    const matchesLocation = location ? job.location === location : true;
    const matchesType = type ? job.type === type : true;
    return matchesTerm && matchesLocation && matchesType;
  });

  renderJobs(filtered);
  showToast(`Se encontraron ${filtered.length} vacantes.`, "success");
}

function renderAll() {
  renderSession();
  renderUsers();
  renderJobs(state.jobs);
  renderReports();
}

function renderSession() {
  const sessionInfo = document.querySelector("#session-info");
  const logoutBtn = document.querySelector("#logout-btn");
  const isActive = Boolean(state.session);

  if (isActive) {
    sessionInfo.textContent = `Sesión activa: ${state.session.name} (${state.session.role})`;
    logoutBtn.hidden = false;
  } else {
    sessionInfo.textContent = "Sesión no iniciada";
    logoutBtn.hidden = true;
  }
}

function renderUsers() {
  const tbody = document.querySelector("#users-table-body");
  tbody.innerHTML = "";

  const canSeeUsers = state.session?.role === "admin";
  if (!canSeeUsers) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "Debes iniciar sesión como administrador para ver esta información.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  state.users.forEach(user => {
    const row = document.createElement("tr");
    const columns = [
      user.name,
      user.email,
      user.role,
      user.active ? "Activo" : "Inactivo"
    ];
    columns.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
}

function renderJobs(list) {
  const jobsList = document.querySelector("#jobs-list");
  const count = document.querySelector("#result-count");
  jobsList.innerHTML = "";
  count.textContent = `${list.length} resultados`;

  if (!list.length) {
    jobsList.innerHTML = "<p>No hay vacantes para esos filtros.</p>";
    return;
  }

  list.forEach(job => {
    const card = document.createElement("article");
    card.className = "job-card";
    const alreadyApplied = state.applications.some(a => a.jobId === job.id && a.email === state.session?.email);

    card.innerHTML = `
      <h3>${job.title}</h3>
      <p class="job-meta">${job.company} · ${job.location} · ${job.type}</p>
      <p>Skills: ${job.skills.join(", ")}</p>
      <button type="button" class="primary-btn" ${alreadyApplied ? "disabled" : ""}>${alreadyApplied ? "Aplicación enviada" : "Aplicar"}</button>
    `;

    const applyBtn = card.querySelector("button");
    applyBtn?.addEventListener("click", () => applyToJob(job.id));
    jobsList.appendChild(card);
  });
}

function applyToJob(jobId) {
  if (!state.session) return showToast("Debes iniciar sesión para aplicar.", "warning");

  const duplicate = state.applications.some(a => a.jobId === jobId && a.email === state.session.email);
  if (duplicate) return showToast("Ya aplicaste a esta vacante.", "warning");

  const confirmApply = window.confirm("¿Confirmas tu postulación a esta vacante?");
  if (!confirmApply) return showToast("Postulación cancelada por el usuario.", "warning");

  state.applications.push({ jobId, email: state.session.email, at: new Date().toISOString() });
  saveData();
  renderJobs(state.jobs);
  renderReports();
  showToast("Postulación registrada exitosamente.", "success");
}

function renderReports() {
  const container = document.querySelector("#stats-grid");
  const activeUsers = state.users.filter(u => u.active).length;
  const stats = [
    { label: "Usuarios totales", value: state.users.length },
    { label: "Usuarios activos", value: activeUsers },
    { label: "Vacantes", value: state.jobs.length },
    { label: "Postulaciones", value: state.applications.length }
  ];

  container.innerHTML = stats.map(stat => `<article class="stat"><h3>${stat.label}</h3><p>${stat.value}</p></article>`).join("");
}

function exportReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      users: state.users.length,
      jobs: state.jobs.length,
      applications: state.applications.length
    }
  };
  downloadJson(report, "reporte-infoempleos.json");
  showToast("Reporte exportado correctamente.", "success");
}

function backupData() {
  downloadJson(state, "backup-infoempleos.json");
  showToast("Copia de seguridad generada.", "success");
}

function restoreData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data.users || !data.jobs || !data.applications) throw new Error("Estructura inválida");
      Object.assign(state, data);
      saveData();
      renderAll();
      showToast("Respaldo restaurado correctamente.", "success");
    } catch {
      showToast("Archivo de respaldo inválido.", "error");
    }
  };
  reader.readAsText(file);
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function showToast(message, type = "success") {
  const region = document.querySelector("#mensajes-sistema");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
