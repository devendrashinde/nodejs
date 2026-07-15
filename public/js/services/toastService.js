/**
 * Toast Notification Service - Display non-modal notifications
 * Replaces alert() calls with elegant toast messages
 */
angular.module('ToastService', [])
    .factory('ToastService', ['$rootScope', '$timeout', function($rootScope, $timeout) {
        $rootScope.toasts = [];

        function showToast(message, type, duration) {
            type = type || 'info'; // 'success', 'error', 'warning', 'info'
            duration = duration || 3000; // milliseconds

            var toast = {
                id: Date.now(),
                message: message,
                type: type,
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
            success: function(message, duration) {
                return showToast(message, 'success', duration || 2500);
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
