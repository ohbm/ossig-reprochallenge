// Edition tabs: switches between the panels of each challenge edition.
// Used on the About page and the Source Projects page.
// The tab marked aria-selected="true" in the HTML is shown by default.
// A link ending in a panel's id (e.g. #edition-2026-2028) opens that tab.
(function() {
  document.querySelectorAll('[data-tabs]').forEach(function(tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

    const select = function(tab, updateUrl) {
      tabs.forEach(function(other) {
        const selected = other === tab;
        other.setAttribute('aria-selected', String(selected));
        other.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(other.getAttribute('aria-controls'));
        if (panel) {
          panel.hidden = !selected;
        }
      });
      if (updateUrl && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + tab.getAttribute('aria-controls'));
      }
    };

    const fromHash = tabs.find(function(tab) {
      return window.location.hash === '#' + tab.getAttribute('aria-controls');
    });
    const initial = fromHash || tabs.find(function(tab) {
      return tab.getAttribute('aria-selected') === 'true';
    }) || tabs[0];
    select(initial, false);

    tabs.forEach(function(tab, index) {
      tab.addEventListener('click', function() {
        select(tab, true);
      });

      tab.addEventListener('keydown', function(event) {
        let next = null;
        if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
        if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (next) {
          event.preventDefault();
          next.focus();
          select(next, true);
        }
      });
    });
  });
})();
