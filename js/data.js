/* data.js
   The data the site's JavaScript works with: two arrays (ROLES, FILTERS)
   and one object of storage keys (KEYS). */
window.TCAR = window.TCAR || {};

window.TCAR.KEYS = {
  savedRoles: 'tcar.savedRoles',
  roleFilter: 'tcar.roleFilter',
  formDraft: 'tcar.formDraft'
};

window.TCAR.ROLES = [
  {
    id: 'care',
    title: 'Animal care companion',
    summary: 'Help with feeding, cleaning, and enrichment. Spend time with animals so they stay happy and social.',
    commitment: 'One 3-hour shift per week',
    times: ['weekday', 'weekend']
  },
  {
    id: 'walker',
    title: 'Dog walker',
    summary: "Give shelter dogs exercise and fresh air, and help staff learn each dog's personality.",
    commitment: 'Flexible, mornings and weekends',
    times: ['weekday', 'weekend']
  },
  {
    id: 'events',
    title: 'Event ambassador',
    summary: 'Represent the rescue at adoption events and community fairs, greet guests, and share our story.',
    commitment: 'A few weekends each season',
    times: ['weekend']
  },
  {
    id: 'driver',
    title: 'Transport driver',
    summary: 'Safely move animals to vet visits, foster homes, and events across the metro area.',
    commitment: 'As your schedule allows',
    times: ['weekday', 'weekend']
  }
];

window.TCAR.FILTERS = [
  { key: 'all', label: 'All roles' },
  { key: 'weekday', label: 'Weekdays' },
  { key: 'weekend', label: 'Weekends' },
  { key: 'saved', label: 'My saved roles' }
];
