// Inline stroke icons used by {{icon:name}}. aria-hidden: they always sit next to text.
const svg = (size, body, extra = '') => `<svg class="icon${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const PLANE = '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>';

export const ICONS = {
  telegram: svg(20, PLANE, ' icon-flip'),
  telegramLg: svg(26, PLANE, ' icon-flip'),
  check: svg(20, '<path d="M5 12l5 5L20 7"/>', ' icon-check'),
  close: svg(20, '<path d="M6 6l12 12M18 6 6 18"/>'),
  user: svg(20, '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  play: '<svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  gift: svg(24, '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>'),
  target: svg(24, '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  chat: svg(24, '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>'),
  video: svg(24, '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3"/>')
};
