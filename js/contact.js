/* contact.js  (contact.html)
   1. JavaScript validation with messages next to each field.
   2. Saves the form as a draft in localStorage and restores it on load.
   3. Pre-fills "Interest type" and "Roles" from the list saved on services.html. */
(function () {
  'use strict';

  var TCAR = window.TCAR;
  var MESSAGE_MIN = 10;
  var MESSAGE_MAX = 600;
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var NAME_PATTERN = /^[\p{L}][\p{L} .'\-]*$/u;

  var form;
  var fields = {};

  /* Each validator returns an error message, or '' when the value is fine. */
  var VALIDATORS = {
    name: function (values) {
      var name = values.name.trim();
      if (name === '') { return 'Please enter your name.'; }
      if (name.length < 2) { return 'Your name needs at least 2 characters.'; }
      if (!NAME_PATTERN.test(name)) { return 'Use letters, spaces, periods, apostrophes, or hyphens only.'; }
      return '';
    },
    email: function (values) {
      var email = values.email.trim();
      if (email === '') { return 'Please enter your email address.'; }
      if (!EMAIL_PATTERN.test(email)) { return 'Enter a valid email address, like name@example.com.'; }
      return '';
    },
    interest: function (values) {
      return values.interest === '' ? 'Please choose what you are interested in.' : '';
    },
    availability: function (values) {
      return values.availability.length === 0 ? 'Select at least one time you could help.' : '';
    },
    experience: function (values) {
      return values.experience === '' ? 'Please tell us about your experience with pets.' : '';
    },
    message: function (values) {
      var length = values.message.trim().length;
      if (length > 0 && length < MESSAGE_MIN) {
        return 'If you add a message, please write at least ' + MESSAGE_MIN + ' characters (you have ' + length + ').';
      }
      if (values.message.length > MESSAGE_MAX) {
        return 'Please keep your message to ' + MESSAGE_MAX + ' characters or fewer.';
      }
      return '';
    }
  };

  /* ---------- reading the form ---------- */

  function getValues() {
    var checked = form.querySelectorAll('input[name="availability"]:checked');
    var experience = form.querySelector('input[name="experience"]:checked');
    return {
      name: fields.name.value,
      email: fields.email.value,
      interest: fields.interest.value,
      availability: Array.prototype.map.call(checked, function (box) { return box.value; }),
      experience: experience ? experience.value : '',
      message: fields.message.value
    };
  }

  function getSavedRoleTitles() {
    var ids = TCAR.storage.read(TCAR.KEYS.savedRoles, []);
    if (!Array.isArray(ids)) { return []; }
    return TCAR.ROLES
      .filter(function (role) { return ids.indexOf(role.id) !== -1; })
      .map(function (role) { return role.title; });
  }

  /* ---------- showing and clearing errors ---------- */

  function errorBox(key) {
    return document.getElementById(key + '-error');
  }

  function controlsFor(key) {
    if (key === 'availability' || key === 'experience') {
      return Array.prototype.slice.call(form.querySelectorAll('input[name="' + key + '"]'));
    }
    return [fields[key]];
  }

  function showError(key, message) {
    var box = errorBox(key);
    box.textContent = message;
    box.hidden = false;
    controlsFor(key).forEach(function (control) { control.setAttribute('aria-invalid', 'true'); });
  }

  function clearError(key) {
    var box = errorBox(key);
    box.textContent = '';
    box.hidden = true;
    controlsFor(key).forEach(function (control) { control.removeAttribute('aria-invalid'); });
  }

  function validateField(key) {
    var message = VALIDATORS[key](getValues());
    if (message) { showError(key, message); } else { clearError(key); }
    return message;
  }

  function validateForm() {
    var problems = [];
    Object.keys(VALIDATORS).forEach(function (key) {
      var message = validateField(key);
      if (message) { problems.push({ key: key, message: message }); }
    });
    return problems;
  }

  function showSummary(problems) {
    var summary = document.getElementById('form-summary');
    var list = document.getElementById('summary-list');
    list.textContent = '';
    problems.forEach(function (problem) {
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + controlsFor(problem.key)[0].id;
      link.textContent = problem.message;
      item.appendChild(link);
      list.appendChild(item);
    });
    summary.hidden = problems.length === 0;
    if (problems.length) { summary.focus(); }
  }

  function hideSummary() {
    document.getElementById('form-summary').hidden = true;
  }

  /* ---------- draft saved in localStorage ---------- */

  function saveDraft() {
    TCAR.storage.write(TCAR.KEYS.formDraft, getValues());
  }

  function applyDraft(draft) {
    if (!draft || typeof draft !== 'object') { return; }
    fields.name.value = draft.name || '';
    fields.email.value = draft.email || '';
    fields.interest.value = draft.interest || '';
    fields.message.value = draft.message || '';
    var availability = Array.isArray(draft.availability) ? draft.availability : [];
    form.querySelectorAll('input[name="availability"]').forEach(function (box) {
      box.checked = availability.indexOf(box.value) !== -1;
    });
    form.querySelectorAll('input[name="experience"]').forEach(function (radio) {
      radio.checked = radio.value === draft.experience;
    });
  }

  /* ---------- saved roles from services.html ---------- */

  function applySavedRoles() {
    var titles = getSavedRoleTitles();
    var wrapper = document.getElementById('roles-field');
    var panel = document.getElementById('saved-roles-note');
    wrapper.hidden = titles.length === 0;
    panel.hidden = titles.length === 0;
    fields.roles.value = titles.join(', ');
    document.getElementById('saved-roles-count').textContent = titles.length;

    if (titles.length > 0 && fields.interest.value === '') {
      fields.interest.value = 'volunteer';
    }
  }

  /* ---------- small UI pieces ---------- */

  function updateCounter() {
    var count = fields.message.value.length;
    document.getElementById('message-count').textContent = count + ' / ' + MESSAGE_MAX + ' characters';
  }

  function showSuccess(values) {
    var box = document.getElementById('form-success');
    var titles = getSavedRoleTitles();
    var text = 'Thank you, ' + values.name.trim() + '! Your ' + values.interest + ' interest form is ready for a coordinator.';
    if (titles.length) { text += ' Roles you chose: ' + titles.join(', ') + '.'; }
    text += ' (This is a sample site, so nothing was actually sent.)';
    document.getElementById('success-text').textContent = text;
    box.hidden = false;
    box.focus();
  }

  /* ---------- events ---------- */

  function handleSubmit(event) {
    event.preventDefault();
    var problems = validateForm();
    document.getElementById('form-success').hidden = true;
    showSummary(problems);
    if (problems.length > 0) { return; }

    var values = getValues();
    TCAR.storage.remove(TCAR.KEYS.formDraft);
    form.reset();
    updateCounter();
    applySavedRoles();
    showSuccess(values);
  }

  function handleFieldChange(event) {
    var key = event.target.name;
    if (!VALIDATORS[key]) { return; }
    /* Re-check right away only when the field already shows an error,
       so people are not scolded while they are still typing. */
    if (!errorBox(key).hidden) { validateField(key); }
    if (document.getElementById('summary-list').children.length) { hideSummary(); }
    saveDraft();
    updateCounter();
  }

  function handleFieldBlur(event) {
    /* If focus is moving to the submit button, skip this check. Adding an error
       message here would push the button down before the click finished, so the
       click would miss. The submit handler validates everything anyway. */
    var next = event.relatedTarget;
    if (next && next.type === 'submit') { return; }

    var key = event.target.name;
    if (VALIDATORS[key] && key !== 'availability' && key !== 'experience') {
      validateField(key);
    }
  }

  function init() {
    form = document.getElementById('interest-form');
    if (!form) { return; }
    ['name', 'email', 'interest', 'message', 'roles'].forEach(function (key) {
      fields[key] = document.getElementById(key);
    });

    form.setAttribute('novalidate', '');   /* JavaScript shows the messages instead */
    applyDraft(TCAR.storage.read(TCAR.KEYS.formDraft, null));
    applySavedRoles();
    updateCounter();

    form.addEventListener('submit', handleSubmit);
    form.addEventListener('input', handleFieldChange);
    form.addEventListener('change', handleFieldChange);
    form.addEventListener('focusout', handleFieldBlur);
  }

  init();
})();
