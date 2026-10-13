// Give icon-only buttons/links an accessible name from their title (Angular renders them dynamically).
(function () {
  function label(root) {
    root.querySelectorAll('button[title]:not([aria-label]), a[title]:not([aria-label])').forEach(function (el) {
      if (!el.textContent.trim() && el.title) {
        el.setAttribute('aria-label', el.title);
      }
    });
  }

  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    setTimeout(function () {
      pending = false;
      label(document);
    }, 200);
  }).observe(document.body, { childList: true, subtree: true });

  label(document);
})();
