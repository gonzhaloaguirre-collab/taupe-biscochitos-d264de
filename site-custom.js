(async () => {
  try {
    const response = await fetch('/api/public', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (Object.prototype.hasOwnProperty.call(data.content || {}, key)) el.innerHTML = data.content[key];
    });
    Object.entries(data.palette || {}).forEach(([key, value]) => {
      if (/^--[a-z-]+$/.test(key) && /^#[0-9a-fA-F]{6}$/.test(value)) document.documentElement.style.setProperty(key, value);
    });
  } catch (error) {
    console.warn('La configuración compartida no está disponible temporalmente.', error);
  }
})();
