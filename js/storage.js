/* storage.js
   Small wrapper around localStorage. Every call is wrapped in try/catch
   because storage can be blocked (private mode) or hold bad JSON. */
window.TCAR = window.TCAR || {};

window.TCAR.storage = {
  read: function (key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  },

  write: function (key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  },

  remove: function (key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      /* nothing to do: the page still works without storage */
    }
  }
};
