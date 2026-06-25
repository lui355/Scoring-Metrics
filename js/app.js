/* Fishbowl Topics shared helpers. Configure Supabase before deploying. */
const FISHBOWL_CONFIG = {
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};

const Fishbowl = (() => {
  const client = window.supabase.createClient(
    FISHBOWL_CONFIG.supabaseUrl,
    FISHBOWL_CONFIG.supabaseAnonKey
  );

  function getBowlId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function currentBaseUrl() {
    return window.location.href.split('/').slice(0, -1).join('/');
  }

  function submitUrl(id) {
    return `${currentBaseUrl()}/submit.html?id=${encodeURIComponent(id)}`;
  }

  function adminUrl(id) {
    return `${currentBaseUrl()}/admin.html?id=${encodeURIComponent(id)}`;
  }

  function requireConfigured() {
    const missing = FISHBOWL_CONFIG.supabaseUrl.includes('YOUR_') ||
      FISHBOWL_CONFIG.supabaseAnonKey.includes('YOUR_');
    if (!missing) return true;
    showToast('Add your Supabase URL and anon key in js/app.js before deploying.', 'error');
    return false;
  }

  function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl px-5 py-4 text-center text-sm font-semibold shadow-2xl transition';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('hidden', 'bg-red-500', 'bg-emerald-500', 'bg-zinc-800');
    toast.classList.add(type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-emerald-500' : 'bg-zinc-800');
    window.clearTimeout(toast._timeout);
    toast._timeout = window.setTimeout(() => toast.classList.add('hidden'), 4200);
  }

  function renderQr(elementId, text, size = 220) {
    const element = document.getElementById(elementId);
    if (!element || !window.QRCode) return;
    element.innerHTML = '';
    new QRCode(element, {
      text,
      width: size,
      height: size,
      colorDark: '#09090b',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }[char]));
  }

  return {
    client,
    adminUrl,
    escapeHtml,
    getBowlId,
    renderQr,
    requireConfigured,
    showToast,
    shuffle,
    submitUrl,
  };
})();
