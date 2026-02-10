// Application constants and configuration
angular.module('photoApp.constants', [])
    .constant('APP_CONSTANTS', {
        // Pagination
        ITEMS_PER_PAGE: 20,
        
        // Media types
        IMAGE_TYPES: ['jpg', 'png', 'jpeg', 'bmp', 'gif', 'webp', 'svg'],
        VIDEO_TYPES: ['mp4', 'avi', 'mov', '3gp', 'mkv', 'mpg', 'mpeg', 'mts', 'm4v', 'divx', 'xvid', 'webm', 'ogg', 'ogv', 'flv', 'wmv', 'asf', 'rm', 'rmvb', 'ts', 'vob', 'f4v'],
        AUDIO_TYPES: ['mp3', 'amr', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
        
        // Audio player defaults
        DEFAULT_VOLUME: 80,
        
        // UI timeouts (milliseconds)
        NO_MORE_PHOTOS_TIMEOUT: 5000,
        FANCYBOX_INIT_DELAY: 100,
        
        // Autocomplete
        AUTOCOMPLETE_MIN_LENGTH: 1,
        AUTOCOMPLETE_MAX_RESULTS: 10
    });
