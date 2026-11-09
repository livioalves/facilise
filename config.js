window.FACILISE_API_ORIGIN = 'https://api.facilise.com';
window.faciliseApiUrl = (path) => new URL(path, `${window.FACILISE_API_ORIGIN}/`).toString();
