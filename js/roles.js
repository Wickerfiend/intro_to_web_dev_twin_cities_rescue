/* roles.js  (services.html)
   Volunteer role finder: filter roles by when you are free, save the ones
   you like, and keep that list in localStorage so it is still there after a
   refresh and on the contact page. */
(function () {
  'use strict';

  var TCAR = window.TCAR;
  var state = { filter: 'all', saved: [] };
  var els = {};

  /* ---------- small helpers ---------- */

  function makeEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text) { node.textContent = text; }
    return node;
  }

  function findRole(id) {
    return TCAR.ROLES.filter(function (role) { return role.id === id; })[0];
  }

  function isSaved(id) {
    return state.saved.indexOf(id) !== -1;
  }

  function timeLabel(time) {
    return time === 'weekday' ? 'Weekdays' : 'Weekends';
  }

  /* ---------- state and storage ---------- */

  function loadState() {
    var filter = TCAR.storage.read(TCAR.KEYS.roleFilter, 'all');
    var filterIsValid = TCAR.FILTERS.some(function (f) { return f.key === filter; });
    state.filter = filterIsValid ? filter : 'all';

    var saved = TCAR.storage.read(TCAR.KEYS.savedRoles, []);
    state.saved = Array.isArray(saved)
      ? saved.filter(function (id) { return Boolean(findRole(id)); })
      : [];
  }

  function saveState() {
    TCAR.storage.write(TCAR.KEYS.roleFilter, state.filter);
    TCAR.storage.write(TCAR.KEYS.savedRoles, state.saved);
  }

  /* ---------- data logic ---------- */

  function getVisibleRoles() {
    return TCAR.ROLES.filter(function (role) {
      if (state.filter === 'saved') { return isSaved(role.id); }
      if (state.filter === 'all') { return true; }
      return role.times.indexOf(state.filter) !== -1;
    });
  }

  function toggleSaved(id) {
    if (isSaved(id)) {
      state.saved = state.saved.filter(function (savedId) { return savedId !== id; });
    } else {
      state.saved.push(id);
    }
    saveState();
  }

  function setFilter(key) {
    state.filter = key;
    saveState();
  }

  /* ---------- rendering ---------- */

  function createRoleCard(role) {
    var saved = isSaved(role.id);
    var card = makeEl('article', 'card role-card');
    card.setAttribute('data-role-id', role.id);

    card.appendChild(makeEl('h3', '', role.title));
    card.appendChild(makeEl('p', '', role.summary));

    var commitment = makeEl('p');
    commitment.appendChild(makeEl('strong', '', 'Commitment: '));
    commitment.appendChild(document.createTextNode(role.commitment + '.'));
    card.appendChild(commitment);

    var tags = makeEl('p', 'role-times');
    role.times.forEach(function (time) {
      tags.appendChild(makeEl('span', 'tag', timeLabel(time)));
    });
    card.appendChild(tags);

    var button = makeEl('button', 'btn role-save' + (saved ? '' : ' ghost'), saved ? 'Saved ✓' : 'Save role');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', 'Save role: ' + role.title);
    button.setAttribute('data-action', 'toggle');
    card.appendChild(button);

    return card;
  }

  function renderFilters() {
    els.filters.textContent = '';
    TCAR.FILTERS.forEach(function (filter) {
      var label = filter.label;
      if (filter.key === 'saved') { label += ' (' + state.saved.length + ')'; }
      var button = makeEl('button', 'chip', label);
      button.type = 'button';
      button.setAttribute('data-filter', filter.key);
      button.setAttribute('aria-pressed', String(state.filter === filter.key));
      els.filters.appendChild(button);
    });
  }

  function renderRoles() {
    var visible = getVisibleRoles();
    els.list.textContent = '';

    if (visible.length === 0) {
      els.list.appendChild(makeEl('p', 'empty', "You haven't saved any roles yet. Choose “Save role” on a card and it will appear here."));
    } else {
      visible.forEach(function (role) { els.list.appendChild(createRoleCard(role)); });
    }
    updateStatus(visible.length);
  }

  function updateStatus(visibleCount) {
    var current = TCAR.FILTERS.filter(function (f) { return f.key === state.filter; })[0];
    els.status.textContent = 'Showing ' + visibleCount + ' of ' + TCAR.ROLES.length +
      ' roles (' + current.label.toLowerCase() + ').';
  }

  function renderSavedPanel() {
    els.savedList.textContent = '';
    els.savedPanel.hidden = state.saved.length === 0;

    state.saved.forEach(function (id) {
      var role = findRole(id);
      var item = makeEl('li');
      item.appendChild(makeEl('span', '', role.title));

      var remove = makeEl('button', 'link-button', 'Remove');
      remove.type = 'button';
      remove.setAttribute('data-remove', id);
      remove.setAttribute('aria-label', 'Remove ' + role.title + ' from my list');
      item.appendChild(remove);
      els.savedList.appendChild(item);
    });
    els.savedCount.textContent = '(' + state.saved.length + ')';
  }

  function render() {
    renderFilters();
    renderRoles();
    renderSavedPanel();
  }

  /* ---------- keyboard focus ----------
     render() rebuilds the buttons, which would drop keyboard focus back to
     the top of the page, so we put focus back on the matching control. */

  function restoreFocus(selector, fallbackSelector) {
    var target = document.querySelector(selector) || document.querySelector(fallbackSelector);
    if (target) { target.focus(); }
  }

  /* ---------- events ---------- */

  function handleListClick(event) {
    var button = event.target.closest('[data-action="toggle"]');
    if (!button) { return; }
    var id = button.closest('[data-role-id]').getAttribute('data-role-id');
    toggleSaved(id);
    render();
    restoreFocus('[data-role-id="' + id + '"] .role-save', '[data-filter="' + state.filter + '"]');
  }

  function handleFilterClick(event) {
    var button = event.target.closest('[data-filter]');
    if (!button) { return; }
    var key = button.getAttribute('data-filter');
    setFilter(key);
    render();
    restoreFocus('[data-filter="' + key + '"]', '#role-filters button');
  }

  function handleSavedPanelClick(event) {
    var remove = event.target.closest('[data-remove]');
    var clear = event.target.closest('[data-clear]');
    if (remove) {
      toggleSaved(remove.getAttribute('data-remove'));
      render();
      restoreFocus('#saved-list [data-remove]', '[data-filter="saved"]');
    } else if (clear) {
      state.saved = [];
      saveState();
      render();
      restoreFocus('[data-filter="saved"]', '#role-filters button');
    }
  }

  function init() {
    els.tools = document.getElementById('role-tools');
    els.filters = document.getElementById('role-filters');
    els.status = document.getElementById('role-status');
    els.list = document.getElementById('role-list');
    els.savedPanel = document.getElementById('saved-panel');
    els.savedList = document.getElementById('saved-list');
    els.savedCount = document.getElementById('saved-count');
    if (!els.list || !els.filters) { return; }

    loadState();
    els.tools.hidden = false;
    els.list.addEventListener('click', handleListClick);
    els.filters.addEventListener('click', handleFilterClick);
    els.savedPanel.addEventListener('click', handleSavedPanelClick);
    render();
  }

  init();
})();
