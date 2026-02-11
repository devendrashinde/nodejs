/**
 * Audio Player Service - Music player functionality
 * Manages audio playback, playlist, and player state
 */
angular.module('AudioPlayerService', [])
    .factory('AudioPlayerService', ['$rootScope', 'APP_CONSTANTS', 'UtilityService', function($rootScope, APP_CONSTANTS, UtilityService) {
        var audio = new Audio();
        var playerState = {
            playlist: [],
            currentIndex: -1,
            isPlaying: false,
            currentTime: "0:00",
            duration: "0:00",
            progress: 0,
            volume: APP_CONSTANTS.DEFAULT_VOLUME,
            isShuffle: false,
            isRepeat: false
        };
        
        // Set initial volume
        audio.volume = playerState.volume / 100;
        
        // Audio event listeners
        audio.addEventListener('timeupdate', function() {
            if (audio.duration) {
                playerState.currentTime = UtilityService.formatTime(audio.currentTime);
                playerState.progress = (audio.currentTime / audio.duration) * 100;
                $rootScope.$apply();
            }
        });
        
        audio.addEventListener('loadedmetadata', function() {
            playerState.duration = UtilityService.formatTime(audio.duration);
            $rootScope.$apply();
        });
        
        audio.addEventListener('ended', function() {
            if (playerState.isRepeat) {
                audio.currentTime = 0;
                audio.play();
            } else {
                service.next();
            }
        });
        
        var service = {
            /**
             * Get current player state
             * @returns {object} Player state
             */
            getState: function() {
                return playerState;
            },
            
            /**
             * Load and play audio file
             * @param {object} track - Track object with path property
             */
            playTrack: function(track) {
                if (!track || !track.path) {
                    return;
                }
                
                audio.src = track.path;
                audio.load();
                audio.play()
                    .then(function() {
                        playerState.isPlaying = true;
                        $rootScope.$apply();
                    })
                    .catch(function(error) {
                        console.error('Error playing audio:', error);
                        playerState.isPlaying = false;
                        $rootScope.$apply();
                    });
            },
            
            /**
             * Toggle play/pause
             */
            togglePlay: function() {
                if (playerState.currentIndex < 0 || playerState.currentIndex >= playerState.playlist.length) {
                    return;
                }
                
                if (playerState.isPlaying) {
                    audio.pause();
                    playerState.isPlaying = false;
                } else {
                    audio.play()
                        .then(function() {
                            playerState.isPlaying = true;
                            $rootScope.$apply();
                        })
                        .catch(function(error) {
                            console.error('Error playing audio:', error);
                        });
                }
            },
            
            /**
             * Play next track
             */
            next: function() {
                if (playerState.playlist.length === 0) {
                    return;
                }
                
                if (playerState.isShuffle) {
                    playerState.currentIndex = Math.floor(Math.random() * playerState.playlist.length);
                } else {
                    playerState.currentIndex = (playerState.currentIndex + 1) % playerState.playlist.length;
                }
                
                this.playTrack(playerState.playlist[playerState.currentIndex]);
            },
            
            /**
             * Play previous track
             */
            previous: function() {
                if (playerState.playlist.length === 0) {
                    return;
                }
                
                playerState.currentIndex--;
                if (playerState.currentIndex < 0) {
                    playerState.currentIndex = playerState.playlist.length - 1;
                }
                
                this.playTrack(playerState.playlist[playerState.currentIndex]);
            },
            
            /**
             * Seek to position
             * @param {number} percent - Position as percentage (0-100)
             */
            seek: function(percent) {
                if (audio.duration) {
                    audio.currentTime = (percent / 100) * audio.duration;
                }
            },
            
            /**
             * Set volume
             * @param {number} volume - Volume level (0-100)
             */
            setVolume: function(volume) {
                playerState.volume = Math.max(0, Math.min(100, volume));
                audio.volume = playerState.volume / 100;
            },
            
            /**
             * Toggle shuffle mode
             */
            toggleShuffle: function() {
                playerState.isShuffle = !playerState.isShuffle;
            },
            
            /**
             * Toggle repeat mode
             */
            toggleRepeat: function() {
                playerState.isRepeat = !playerState.isRepeat;
            },
            
            /**
             * Play track by index
             * @param {number} index - Track index in playlist
             */
            playTrackByIndex: function(index) {
                if (index < 0 || index >= playerState.playlist.length) {
                    return;
                }
                
                playerState.currentIndex = index;
                this.playTrack(playerState.playlist[index]);
            },
            
            /**
             * Add track to playlist
             * @param {object} track - Track to add
             * @param {boolean} autoPlay - Whether to immediately play this track (default: true)
             * @returns {number} Index of track in playlist
             */
            addToPlaylist: function(track, autoPlay) {
                if (!track) {
                    return -1;
                }
                
                // Default autoPlay to true if not specified
                if (autoPlay === undefined) {
                    autoPlay = true;
                }
                
                // Check if track already in playlist
                var existingIndex = playerState.playlist.findIndex(function(t) {
                    return t.path === track.path;
                });
                
                if (existingIndex === -1) {
                    playerState.playlist.push(track);
                    existingIndex = playerState.playlist.length - 1;
                }
                
                // Auto-play: play this track immediately (if requested)
                if (autoPlay) {
                    playerState.currentIndex = existingIndex;
                    this.playTrack(track);
                }
                
                $rootScope.$broadcast('playlistUpdated', playerState);
                return existingIndex;
            },
            
            /**
             * Clear entire playlist
             */
            clearPlaylist: function() {
                playerState.playlist = [];
                playerState.currentIndex = -1;
                audio.pause();
                audio.src = '';
                playerState.isPlaying = false;
                $rootScope.$broadcast('playlistUpdated', playerState);
            },
            
            /**
             * Remove track from playlist
             * @param {number} index - Track index to remove
             */
            removeFromPlaylist: function(index) {
                if (index < 0 || index >= playerState.playlist.length) {
                    return;
                }
                
                playerState.playlist.splice(index, 1);
                
                // Adjust current index if needed
                if (index === playerState.currentIndex) {
                    if (playerState.playlist.length > 0) {
                        this.playTrackByIndex(Math.min(index, playerState.playlist.length - 1));
                    } else {
                        audio.pause();
                        playerState.isPlaying = false;
                        playerState.currentIndex = -1;
                    }
                } else if (index < playerState.currentIndex) {
                    playerState.currentIndex--;
                }
            },
            
            /**
             * Clear playlist
             */
            clearPlaylist: function() {
                audio.pause();
                playerState.playlist = [];
                playerState.currentIndex = -1;
                playerState.isPlaying = false;
                playerState.currentTime = "0:00";
                playerState.duration = "0:00";
                playerState.progress = 0;
            },
            
            /**
             * Set entire playlist
             * @param {Array} tracks - Array of tracks
             */
            setPlaylist: function(tracks) {
                playerState.playlist = tracks || [];
                playerState.currentIndex = -1;
            }
        };
        
        return service;
    }]);
