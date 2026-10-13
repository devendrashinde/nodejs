/**
 * Toast Notification Service - Display non-modal notifications
 * Replaces alert() calls with elegant toast messages
 */
// Global drop-in for alert(); infers toast type from the message and falls back to alert() before Angular is ready.
window.appAlert = function (message) {
    var text = String(message == null ? '' : message).replace(/\s*\n+\s*/g, ' ').trim();
    try {
        var injector = angular.element(document.body).injector();
        var toasts = injector && injector.get('ToastService');
        if (!toasts) { throw new Error('no toast service'); }
        var type = /fail|error|not found|invalid|cannot|unable|✗|not available/i.test(text) ? 'error'
            : /✓|success|added|created|cleared|updated|deleted|removed|restored|started|copied/i.test(text) ? 'success'
            : /^(please|no )/i.test(text) ? 'warning' : 'info';
        injector.get('$rootScope').$evalAsync(function () { toasts[type](text, 4000); });
    } catch (e) {
        window.alert(message);
    }
};

angular.module('ToastService', [])
    .factory('ToastService', ['$rootScope', '$timeout', function($rootScope, $timeout) {
        $rootScope.toasts = [];

        function showToast(message, type, duration, action) {
            type = type || 'info'; // 'success', 'error', 'warning', 'info'
            duration = duration || 3000; // milliseconds

            var toast = {
                id: Date.now(),
                message: message,
                type: type,
                action: action || null,
                visible: true
            };

            $rootScope.toasts.push(toast);

            // Auto-remove after duration
            $timeout(function() {
                removeToast(toast.id);
            }, duration);

            return toast;
        }

        function removeToast(id) {
            for (var i = 0; i < $rootScope.toasts.length; i++) {
                if ($rootScope.toasts[i].id === id) {
                    $rootScope.toasts.splice(i, 1);
                    break;
                }
            }
        }

        return {
            success: function(message, duration, action) {
                return showToast(message, 'success', duration || 2500, action);
            },
            error: function(message, duration) {
                return showToast(message, 'error', duration || 3500);
            },
            warning: function(message, duration) {
                return showToast(message, 'warning', duration || 3000);
            },
            info: function(message, duration) {
                return showToast(message, 'info', duration || 2500);
            },
            remove: removeToast,
            clear: function() {
                $rootScope.toasts = [];
            }
        };
    }]);
