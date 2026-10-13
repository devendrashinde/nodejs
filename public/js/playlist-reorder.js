// Drag-and-drop reordering for playlist items (elements carry data-item-id and draggable=true).
(function () {
  var draggedId = null;

  function itemEl(target) {
    return target.closest ? target.closest('[data-item-id][draggable="true"]') : null;
  }

  document.addEventListener('dragstart', function (e) {
    var el = itemEl(e.target);
    if (!el) return;
    draggedId = el.getAttribute('data-item-id');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);
    el.classList.add('playlist-dragging');
  });

  document.addEventListener('dragover', function (e) {
    if (draggedId && itemEl(e.target)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  document.addEventListener('drop', function (e) {
    var el = itemEl(e.target);
    if (!draggedId || !el) return;
    e.preventDefault();
    var targetId = el.getAttribute('data-item-id');
    var scope = angular.element(document.getElementById('controller')).scope();
    if (scope) {
      scope.$apply(function () {
        scope.reorderPlaylistItem(draggedId, targetId);
      });
    }
  });

  document.addEventListener('dragend', function () {
    draggedId = null;
    document.querySelectorAll('.playlist-dragging').forEach(function (n) {
      n.classList.remove('playlist-dragging');
    });
  });
})();
