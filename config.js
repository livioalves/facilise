const faciliseProductionHosts = new Set(['facilise.com', 'www.facilise.com']);
window.FACILISE_API_ORIGIN = faciliseProductionHosts.has(window.location.hostname.toLowerCase())
  ? 'https://api.facilise.com'
  : window.location.origin;
window.faciliseApiUrl = (path) => new URL(path, `${window.FACILISE_API_ORIGIN}/`).toString();
