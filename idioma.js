(() => {
  const supported = new Set(['es', 'en']);
  const storageKey = 'glf-p2-language';
  const url = new URL(window.location.href);
  const fromURL = url.searchParams.get('lang');
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const fromBrowser = browserLanguages.map(value => value?.toLowerCase().split('-')[0]).find(value => supported.has(value));
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch { /* The selector also works without storage. */ }

  const text = [...document.querySelectorAll('[data-en]')].map(node => [node, node.textContent, node.dataset.en]);
  const attrs = ['aria-label', 'placeholder', 'alt', 'title', 'content'].flatMap(name =>
    [...document.querySelectorAll('[data-en-' + name + ']')].map(node =>
      [node, name, node.getAttribute(name), node.getAttribute('data-en-' + name)]));
  const picker = document.querySelector('.language-picker');
  const buttons = [...picker.querySelectorAll('[data-language]')];

  function apply(language) {
    const isEnglish = language === 'en';
    document.documentElement.lang = language;
    for (const [node, es, en] of text) node.textContent = isEnglish ? en : es;
    for (const [node, name, es, en] of attrs) node.setAttribute(name, isEnglish ? en : es);
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.language === language));
    document.dispatchEvent(new Event('glf:language'));
  }

  function remember(language) {
    try { localStorage.setItem(storageKey, language); } catch { /* Storage can be disabled. */ }
  }

  const initial = supported.has(fromURL) ? fromURL : supported.has(saved) ? saved : fromBrowser ?? 'es';
  if (supported.has(fromURL)) remember(initial);
  apply(initial);
  picker.hidden = false;

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const language = button.dataset.language;
      remember(language);
      const current = new URL(window.location.href);
      current.searchParams.set('lang', language);
      try { history.replaceState(null, '', current); } catch { /* Local file URLs may restrict history. */ }
      apply(language);
    });
  }
})();
