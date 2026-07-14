/**
 * Transliteration Service
 * Enables cross-script tag search between Latin (English) and Devanagari (Hindi/Marathi/etc.)
 * Uses phonetic transliteration — no external API required.
 *
 * How it works:
 *  - Any Devanagari text is converted to its Latin phonetic equivalent.
 *  - Both the search term and the tag are normalised the same way before comparison.
 *  - This means "mumbai" matches "मुंबई", and "मुंबई" matches "mumbai".
 */
angular.module('TransliterationService', [])
    .factory('TransliterationService', [function() {

        // ---------- Devanagari character tables ----------

        var CONSONANTS = {
            'क':'k',  'ख':'kh', 'ग':'g',  'घ':'gh', 'ङ':'ng',
            'च':'ch', 'छ':'chh','ज':'j',  'झ':'jh', 'ञ':'ny',
            'ट':'t',  'ठ':'th', 'ड':'d',  'ढ':'dh', 'ण':'n',
            'त':'t',  'थ':'th', 'द':'d',  'ध':'dh', 'न':'n',
            'प':'p',  'फ':'ph', 'ब':'b',  'भ':'bh', 'म':'m',
            'य':'y',  'र':'r',  'ल':'l',  'व':'v',  'ळ':'l',
            'श':'sh', 'ष':'sh', 'स':'s',  'ह':'h',
            // Nukta variants (Urdu-origin sounds)
            'क़':'q', 'ख़':'kh', 'ग़':'g', 'ज़':'z',
            'ड़':'r', 'ढ़':'rh','फ़':'f',
        };

        var VOWELS_INDEPENDENT = {
            'अ':'a', 'आ':'aa','इ':'i', 'ई':'ii','उ':'u', 'ऊ':'uu',
            'ऋ':'ri','ॠ':'rri','ए':'e', 'ऐ':'ai','ओ':'o', 'औ':'au',
            'ऑ':'o',
        };

        var VOWEL_MATRAS = {
            'ा':'aa','ि':'i', 'ी':'ii','ु':'u', 'ू':'uu',
            'ृ':'ri','े':'e', 'ै':'ai','ो':'o', 'ौ':'au',
            'ॉ':'o',
        };

        var DEVANAGARI_NUMERALS = {
            '०':'0','१':'1','२':'2','३':'3','४':'4',
            '५':'5','६':'6','७':'7','८':'8','९':'9',
        };

        var HALANT      = '\u094D'; // ् virama / halant
        var ANUSVARA    = '\u0902'; // ं
        var CHANDRABINDU= '\u0901'; // ँ
        var VISARGA     = '\u0903'; // ः
        var ZWJ         = '\u200D'; // zero-width joiner
        var ZWNJ        = '\u200C'; // zero-width non-joiner

        // Labial consonants — anusvara before these sounds as 'm', not 'n'
        var LABIALS = { 'ब':true,'प':true,'म':true,'व':true,'भ':true,'फ':true,'फ़':true };

        function isDevanagari(ch) {
            var c = ch.charCodeAt(0);
            return c >= 0x0900 && c <= 0x097F;
        }

        // ---------- Core transliterator ----------

        /**
         * Convert a Devanagari string to its Latin phonetic equivalent.
         * Non-Devanagari characters are passed through unchanged.
         */
        function devanagariToLatin(text) {
            if (!text) return '';
            // Split into individual Unicode code points (handles surrogate pairs)
            var chars = Array.from ? Array.from(text) : text.split('');
            var result = '';
            var i = 0;

            while (i < chars.length) {
                var ch = chars[i];

                // Skip zero-width characters
                if (ch === ZWJ || ch === ZWNJ) { i++; continue; }

                // Halant encountered standalone (e.g. after already consuming it) — skip
                if (ch === HALANT) { i++; continue; }

                // Devanagari numeral
                if (DEVANAGARI_NUMERALS[ch] !== undefined) {
                    result += DEVANAGARI_NUMERALS[ch];
                    i++;
                    continue;
                }

                // Anusvara / chandrabindu — use 'm' before labials, 'n' otherwise
                if (ch === ANUSVARA || ch === CHANDRABINDU) {
                    var nextCh = chars[i + 1] || '';
                    result += LABIALS[nextCh] ? 'm' : 'n';
                    i++;
                    continue;
                }

                // Visarga
                if (ch === VISARGA) {
                    result += 'h';
                    i++;
                    continue;
                }

                // Independent vowel
                if (VOWELS_INDEPENDENT[ch] !== undefined) {
                    result += VOWELS_INDEPENDENT[ch];
                    i++;
                    continue;
                }

                // Consonant — check what follows to determine which vowel to emit
                if (CONSONANTS[ch] !== undefined) {
                    var base = CONSONANTS[ch];
                    var next = chars[i + 1] || '';

                    if (next === HALANT) {
                        // Halant suppresses the inherent vowel — emit consonant only
                        result += base;
                        i += 2; // skip consonant + halant
                    } else if (VOWEL_MATRAS[next] !== undefined) {
                        // Vowel matra replaces the inherent 'a'
                        result += base + VOWEL_MATRAS[next];
                        i += 2; // skip consonant + matra
                    } else {
                        // Inherent vowel 'a'
                        result += base + 'a';
                        i++;
                    }
                    continue;
                }

                // Vowel matra appearing without a preceding consonant — pass value through
                if (VOWEL_MATRAS[ch] !== undefined) {
                    result += VOWEL_MATRAS[ch];
                    i++;
                    continue;
                }

                // Unknown Devanagari character — skip silently
                if (isDevanagari(ch)) { i++; continue; }

                // Any other character (Latin, punctuation, spaces, etc.)
                result += ch;
                i++;
            }

            return result;
        }

        /**
         * Normalise a (possibly already-Latin) string for fuzzy phonetic comparison.
         * Collapses length distinctions and common variant spellings so that
         * "mumbai" == "mumbaai", "ram" == "rama", etc.
         */
        function normalizeForSearch(text) {
            if (!text) return '';
            return devanagariToLatin(text)
                .toLowerCase()
                .replace(/aa+/g, 'a')   // long-a → a
                .replace(/ii+/g, 'i')   // long-i → i
                .replace(/uu+/g, 'u')   // long-u → u
                .replace(/ph/g, 'f')    // ph → f (consistent with English)
                .replace(/bh/g, 'b')
                .replace(/gh/g, 'g')
                .replace(/dh/g, 'd')
                .replace(/th/g, 't')
                .replace(/kh/g, 'k')
                .replace(/sh/g, 's')
                .replace(/ch/g, 'c')
                .replace(/ng/g, 'n')
                .replace(/ny/g, 'n')
                .replace(/rri/g, 'ri')
                .replace(/a$/g, '');    // drop final schwa (silent in Hindi)
        }

        // ---------- Public API ----------

        return {
            /**
             * Check whether tagText matches searchText using cross-script phonetic
             * comparison.  Either string may be Latin, Devanagari, or mixed.
             *
             * @param {string} tagText    - Tag to test (stored value)
             * @param {string} searchText - User's search input
             * @returns {boolean}
             */
            matchesSearch: function(tagText, searchText) {
                if (!tagText || !searchText) return false;
                var normTag    = normalizeForSearch(tagText);
                var normSearch = normalizeForSearch(searchText);
                if (!normSearch) return false;
                return normTag.indexOf(normSearch) !== -1;
            },

            /** Expose for unit testing / debugging */
            devanagariToLatin: devanagariToLatin,
            normalizeForSearch: normalizeForSearch,

            /**
             * Convert Devanagari to Latin for use as a database LIKE search term.
             * Unlike normalizeForSearch, this preserves digraphs (sh, kh, dh, th …)
             * so that the generated term matches how English speakers actually spell
             * the word (e.g. "वैष्णव" → "vaishnav", not "vaisnav").
             *
             * @param {string} text - Search input (may be Devanagari or Latin)
             * @returns {string} Latin string safe for a LIKE '%…%' query
             */
            transliterateForSearch: function(text) {
                if (!text) return '';
                return devanagariToLatin(text)
                    .toLowerCase()
                    .replace(/aa+/g, 'a')  // long-a → a
                    .replace(/ii+/g, 'i')  // long-i → i
                    .replace(/uu+/g, 'u')  // long-u → u
                    .replace(/a$/g,  '');  // drop final schwa
            },
        };
    }]);
