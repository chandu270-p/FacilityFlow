const categories = ['Electrical', 'HVAC', 'Plumbing', 'IT / Network', 'Furniture', 'Cleaning', 'Security', 'General Facilities'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
const state = {
  token: localStorage.getItem('facilityflow.token'),
  user: null,
  issues: [],
  users: [],
  selected: null,
  filter: 'All',
  search: '',
  loading: false
};
const app = document.querySelector('#app');

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function initials(name) {
  return String(name || 'FF').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function optionList(items, selected = '') {
  return items.map((item) => `<option ${item === selected ? 'selected' : ''} value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
}

function priorityClass(priority) { return String(priority).toLowerCase(); }
function statusClass(status) { return String(status).toLowerCase().replaceAll(' ', '-'); }
function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not set'; }
function reporterLabel(id) { return id === state.user?.id ? 'You' : `Employee ${id}`; }
function isAdmin() { return state.user?.role === 'Facility Administrator'; }

function renderLogin(error = '') {
  app.innerHTML = `<section class="login-shell" aria-labelledby="login-title">
    <div class="login-visual">
      <div class="login-brand"><span class="brand-mark">F</span><span>FacilityFlow</span></div>
      <div class="login-visual-copy"><span class="eyebrow">Workplace operations</span><h1>Every fix starts with a clear signal.</h1><p>One calm workspace for reporting, routing, and resolving the things that keep a facility moving.</p></div>
      <div class="login-visual-footer"><span>Local demo environment</span><span>Facility operations</span></div>
    </div>
    <div class="login-panel"><div class="login-panel-inner">
      <span class="eyebrow">Secure demo access</span><h2 id="login-title">Welcome back.</h2><p class="lede">Sign in with your provisioned account and role.</p>
      <form id="login-form" class="form-grid" novalidate>
        <label for="login-role">Role<select id="login-role" name="role" required><option value="" selected disabled>Select your role</option><option value="Employee">Employee</option><option value="Facility Administrator">Facility Administrator</option></select></label>
        <label for="login-email">Company email<input id="login-email" name="email" type="email" required placeholder="Your complete company email" autocomplete="username" /></label>
        <label for="login-password">Password<input id="login-password" name="password" type="password" required placeholder="Enter your password" autocomplete="current-password" /></label>
        <div class="login-hint"><span class="hint-dot" aria-hidden="true"></span><span>Access is verified against your provisioned role.</span></div>
        <div class="error" role="alert" aria-live="polite">${escapeHtml(error)}</div>
        <button class="primary primary-wide" type="submit">Open issue desk <span aria-hidden="true">-&gt;</span></button>
      </form>
    </div></div>
  </section>`;

  document.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    button.textContent = 'Checking access...';
    const form = new FormData(event.currentTarget);
    try {
      const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: form.get('email'), role: form.get('role'), password: form.get('password') }) });
      state.token = result.token;
      state.user = result.user;
      localStorage.setItem('facilityflow.token', state.token);
      await renderDesk();
    } catch (loginError) {
      renderLogin(loginError.message);
    }
  });

  document.querySelector('#login-role').addEventListener('change', (event) => {
    document.querySelector('#login-email').placeholder = event.target.value === 'Facility Administrator' ? 'admin@facilityflow.demo' : 'Your complete company email';
  });
}

function filteredIssues() {
  const query = state.search.trim().toLowerCase();
  return state.issues.filter((issue) => {
    const statusMatch = state.filter === 'All' || issue.status === state.filter;
    const searchMatch = !query || [issue.description, issue.category, issue.priority, issue.status, issue.id].some((value) => String(value).toLowerCase().includes(query));
    return statusMatch && searchMatch;
  });
}

function renderSummary() {
  const open = state.issues.filter((issue) => issue.status === 'Open').length;
  const active = state.issues.filter((issue) => issue.status === 'In Progress').length;
  const resolved = state.issues.filter((issue) => issue.status === 'Resolved').length;
  return `<div class="summary-strip" aria-label="Issue summary">
    <div><span>Total reports</span><strong>${state.issues.length}</strong></div>
    <div><span>Open</span><strong>${open}</strong></div>
    <div><span>In progress</span><strong>${active}</strong></div>
    <div><span>Resolved</span><strong>${resolved}</strong></div>
  </div>`;
}

function renderIssueRows() {
  const visible = filteredIssues();
  if (!visible.length) return '<div class="empty-state"><span class="empty-icon" aria-hidden="true">--</span><strong>No matching issues</strong><span>Try a different status or search term.</span></div>';
  return visible.map((issue) => `<button class="issue-row ${state.selected?.id === issue.id ? 'is-selected' : ''}" data-issue="${issue.id}" aria-pressed="${state.selected?.id === issue.id}">
    <span class="issue-id">#${issue.id}</span><span class="issue-main"><strong>${escapeHtml(issue.description)}</strong><span>${escapeHtml(issue.category)} <i>/</i> ${reporterLabel(issue.reporter_id)}</span></span>
    <span class="issue-priority ${priorityClass(issue.priority)}"><span class="priority-dot" aria-hidden="true"></span>${escapeHtml(issue.priority)}</span>
    <span class="issue-status ${statusClass(issue.status)}">${escapeHtml(issue.status)}</span><span class="issue-date">${formatDate(issue.updated_at)}</span><span class="row-arrow" aria-hidden="true">-&gt;</span>
  </button>`).join('');
}

function renderDetail() {
  const issue = state.selected;
  if (!issue) return '<div class="detail-empty"><span class="detail-empty-mark" aria-hidden="true">+</span><strong>Select an issue</strong><span>Choose a record from the queue to inspect its current state.</span></div>';
  const assignees = state.users.filter((user) => user.role === 'Facility Administrator');
  const readOnly = !isAdmin();
  return `<div class="detail-header"><div><span class="eyebrow">Issue #${issue.id}</span><h2>${escapeHtml(issue.description)}</h2></div><span class="status-pill ${statusClass(issue.status)}">${escapeHtml(issue.status)}</span></div>
    <p class="detail-description">${escapeHtml(issue.description)}</p>
    <div class="detail-facts"><div><span>Reported by</span><strong>${reporterLabel(issue.reporter_id)}</strong></div><div><span>Last updated</span><strong>${formatDate(issue.updated_at)}</strong></div><div><span>Category</span><strong>${escapeHtml(issue.category)}</strong></div><div><span>Priority</span><strong class="fact-priority ${priorityClass(issue.priority)}">${escapeHtml(issue.priority)}</strong></div><div><span>Assigned to</span><strong>${issue.assignee_id ? `Administrator ${issue.assignee_id}` : 'Unassigned'}</strong></div><div><span>Created</span><strong>${formatDate(issue.created_at)}</strong></div></div>
    ${issue.resolution_notes ? `<div class="resolution-note"><span>Resolution note</span><p>${escapeHtml(issue.resolution_notes)}</p></div>` : ''}
    ${readOnly ? '<div class="readonly-note" role="note"><span class="lock-icon" aria-hidden="true">&#9679;</span><span>This report is read-only after submission. We will keep you posted as it moves forward.</span></div>' : `<details class="admin-editor"><summary><span>Administrator controls</span><small>Open only when you need to update this issue</small></summary><form id="admin-form" class="admin-controls"><label for="admin-category">Category<select id="admin-category" name="category">${optionList(categories, issue.category)}</select></label><label for="admin-priority">Priority<select id="admin-priority" name="priority">${optionList(priorities, issue.priority)}</select></label><label for="admin-assignee">Assignee<select id="admin-assignee" name="assignee_id"><option value="">Unassigned</option>${assignees.map((user) => `<option value="${user.id}" ${user.id === issue.assignee_id ? 'selected' : ''}>${escapeHtml(user.name)}</option>`).join('')}</select></label><label for="admin-status">Status<select id="admin-status" name="status">${optionList(statuses, issue.status)}</select></label><label class="wide-field" for="admin-resolution">Resolution notes<textarea id="admin-resolution" name="resolution_notes" placeholder="Required when resolving or closing">${escapeHtml(issue.resolution_notes || '')}</textarea></label><button class="primary" type="submit">Save changes <span aria-hidden="true">-&gt;</span></button></form></details>`}`;
}

function renderCreateForm() {
  return `<section id="create-panel" class="create-panel" hidden aria-labelledby="create-title"><div class="create-heading"><div><span class="panel-kicker">A simple first step</span><h2 id="create-title">Tell us what's happening.</h2><p class="form-guidance">We'll take it from here.</p></div><button id="close-create" class="close-button" type="button" aria-label="Close report form">&times;</button></div><form id="issue-form" class="form-grid"><label for="issue-description">What needs attention?<textarea id="issue-description" name="description" required placeholder="Describe the facility problem"></textarea></label><div class="form-two-col"><label for="issue-category">Category<select id="issue-category" name="category">${optionList(categories)}</select></label><label for="issue-priority">Priority<select id="issue-priority" name="priority">${optionList(priorities, 'Medium')}</select></label></div><div id="issue-form-status" class="form-status" role="status" aria-live="polite"></div><button class="primary primary-wide" type="submit">Send report <span aria-hidden="true">-&gt;</span></button></form></section>`;
}

async function renderDesk(message = '') {
  state.loading = true;
  renderLoading();
  try {
    const me = await api('/api/auth/me');
    state.user = me.user;
    state.issues = (await api('/api/issues')).issues;
    state.users = isAdmin() ? (await api('/api/users')).users : [];
    if (!state.selected || !state.issues.some((issue) => issue.id === state.selected.id)) state.selected = state.issues[0] || null;
  } catch (error) {
    state.loading = false;
    localStorage.removeItem('facilityflow.token');
    state.token = null;
    return renderLogin(error.message);
  }
  state.loading = false;
  const admin = isAdmin();
  const greeting = admin ? 'Good morning. Here\'s what needs your attention.' : `Good morning, ${escapeHtml(state.user.name)}. How can we help make your workspace better today?`;
  const subtitle = admin ? 'A clear view of the work moving through your facility.' : 'Tell us what is happening and follow your report as it moves forward.';
  app.innerHTML = `<header class="topbar"><div class="brand"><span class="brand-mark">F</span><span>FacilityFlow</span><span class="brand-divider"></span><span class="brand-context">${admin ? 'Operations' : 'My workspace'}</span></div><div class="topbar-actions"><span class="environment-tag"><span class="online-dot" aria-hidden="true"></span>Local demo</span><div class="user-menu"><span class="avatar">${initials(state.user.name)}</span><span class="user-copy"><strong>${escapeHtml(state.user.name)}</strong><small>${escapeHtml(state.user.role)}</small></span></div><button id="logout" class="icon-button" title="Sign out" aria-label="Sign out">&#8594;</button></div></header>
    <main class="page"><div class="page-head"><div><span class="eyebrow">${admin ? 'Facility Administrator workspace' : 'Employee workspace'}</span><h1>${greeting}</h1><p class="page-subtitle">${subtitle}</p></div>${admin ? '<span class="role-badge">Operations desk</span>' : '<button id="new-issue" class="primary action-button"><span class="plus" aria-hidden="true">+</span> Report an issue</button>'}</div>
    ${renderSummary()}<section class="workspace"><div class="queue-panel panel"><div class="queue-header"><div><div class="panel-kicker">${admin ? 'Operational queue' : 'Your reports'}</div><h2>${admin ? 'What needs attention' : 'Issues you have submitted'}</h2></div><span class="record-count" aria-live="polite">${filteredIssues().length} shown</span></div><div class="queue-toolbar"><label class="search-box" for="issue-search"><span aria-hidden="true">⌕</span><input id="issue-search" value="${escapeHtml(state.search)}" placeholder="Search issues, categories, IDs..." /></label><div class="segmented" role="group" aria-label="Filter issues">${['All', ...statuses].map((status) => `<button class="segment ${state.filter === status ? 'active' : ''}" type="button" data-filter="${status}" aria-pressed="${state.filter === status}">${status}</button>`).join('')}</div></div><div class="queue-columns" aria-hidden="true"><span>ID</span><span>Issue</span><span>Priority</span><span>Status</span><span>Updated</span><span></span></div><div id="issue-list" class="issue-list">${renderIssueRows()}</div>${!admin ? renderCreateForm() : ''}</div><aside class="detail-panel panel" aria-labelledby="detail-title"><div class="panel-topline"><span class="panel-kicker">Issue detail</span><span class="secure-label">${admin ? 'Admin view' : 'Read only'}</span></div><div id="detail-title">${renderDetail()}</div></aside></section></main>`;
  wireDesk();
  if (message) showToast(message);
}

function renderLoading() { app.innerHTML = '<div class="loading-shell" role="status"><span class="loading-mark" aria-hidden="true">F</span><span>Loading your workspace...</span></div>'; }

function wireDesk() {
  document.querySelector('#logout').addEventListener('click', () => { localStorage.removeItem('facilityflow.token'); state.token = null; state.user = null; state.selected = null; renderLogin(); });
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.filter; refreshQueue(); }));
  document.querySelector('#issue-search').addEventListener('input', (event) => { state.search = event.target.value; refreshQueue(); });
  wireIssueRows();
  const newIssue = document.querySelector('#new-issue');
  if (newIssue) newIssue.addEventListener('click', () => { const panel = document.querySelector('#create-panel'); panel.hidden = false; document.querySelector('#issue-description').focus(); panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  const closeCreate = document.querySelector('#close-create');
  if (closeCreate) closeCreate.addEventListener('click', () => { document.querySelector('#create-panel').hidden = true; document.querySelector('#new-issue').focus(); });
  const createForm = document.querySelector('#issue-form');
  if (createForm) createForm.addEventListener('submit', async (event) => { event.preventDefault(); await submitForm(createForm, '/api/issues', 'Your issue is on its way.'); });
  const adminForm = document.querySelector('#admin-form');
  if (adminForm) adminForm.addEventListener('submit', async (event) => { event.preventDefault(); const data = new FormData(adminForm); await submitForm(adminForm, `/api/issues/${state.selected.id}`, 'Issue updated', { category: data.get('category'), priority: data.get('priority'), status: data.get('status'), resolution_notes: data.get('resolution_notes'), assignee_id: data.get('assignee_id') ? Number(data.get('assignee_id')) : null }); });
}

async function submitForm(form, path, message, suppliedPayload) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Saving...';
  const data = new FormData(form);
  const payload = suppliedPayload || { description: data.get('description'), category: data.get('category'), priority: data.get('priority') };
  try {
    await api(path, { method: path === '/api/issues' ? 'POST' : 'PATCH', body: JSON.stringify(payload) });
    await renderDesk(message);
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Try again';
    const status = form.querySelector('[role="status"]');
    if (status) status.textContent = error.message;
    showToast(error.message, true);
  }
}

function refreshQueue() {
  document.querySelector('#issue-list').innerHTML = renderIssueRows();
  document.querySelector('.record-count').textContent = `${filteredIssues().length} shown`;
  document.querySelectorAll('[data-filter]').forEach((button) => { const active = button.dataset.filter === state.filter; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); });
  wireIssueRows();
}

function showToast(message, error = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${error ? 'toast-error' : ''}`;
  toast.setAttribute('role', error ? 'alert' : 'status');
  toast.innerHTML = `<span class="toast-check" aria-hidden="true">${error ? '!' : '&#10003;'}</span>${escapeHtml(message)}`;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 3600);
}

function wireIssueRows() {
  document.querySelectorAll('[data-issue]').forEach((button) => button.addEventListener('click', () => { state.selected = state.issues.find((issue) => issue.id === Number(button.dataset.issue)); renderDesk(); }));
}

if (state.token) renderDesk(); else renderLogin();
