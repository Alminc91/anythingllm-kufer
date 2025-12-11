/**
 * TTS Text Normalizer - Multilingual
 *
 * Uses:
 * - franc-min: Language detection (82+ languages)
 * - n2words: Numbers to words (28 languages)
 * - Intl.DateTimeFormat: Date/weekday formatting (all languages)
 *
 * Manual per-language: Only 3 words needed (hour, times, currency)
 */

// ============================================
// ISO 639-3 to ISO 639-1 mapping (franc returns 3-letter codes)
// ============================================
const ISO_639_3_TO_1 = {
  'deu': 'de', 'eng': 'en', 'fra': 'fr', 'spa': 'es', 'tur': 'tr',
  'ara': 'ar', 'ukr': 'uk', 'rus': 'ru', 'pol': 'pl', 'zho': 'zh',
  'cmn': 'zh', 'ita': 'it', 'por': 'pt', 'nld': 'nl', 'jpn': 'ja',
  'kor': 'ko', 'vie': 'vi', 'tha': 'th', 'hin': 'hi', 'ben': 'bn',
  'srp': 'sr', 'hrv': 'hr', 'bos': 'bs', 'ces': 'cs', 'slk': 'sk',
  'hun': 'hu', 'ron': 'ro', 'bul': 'bg', 'ell': 'el', 'heb': 'he',
  'fas': 'fa', 'urd': 'ur', 'swe': 'sv', 'nor': 'no', 'dan': 'da',
  'fin': 'fi', 'est': 'et', 'lav': 'lv', 'lit': 'lt', 'ind': 'id',
};

// ============================================
// Language-specific words (only 3-4 words per language!)
// ============================================
const LANGUAGE_WORDS = {
  // Format: { hour: "Uhr", times: "Termine", currency: "Euro", locale: "de-DE" }
  de: { hour: 'Uhr', times: 'Termine', currency: 'Euro', locale: 'de-DE', n2w: 'de' },
  en: { hour: "o'clock", times: 'sessions', currency: 'dollars', locale: 'en-US', n2w: 'en' },
  fr: { hour: 'heures', times: 'fois', currency: 'euros', locale: 'fr-FR', n2w: 'fr' },
  es: { hour: 'horas', times: 'veces', currency: 'euros', locale: 'es-ES', n2w: 'es' },
  it: { hour: 'ore', times: 'volte', currency: 'euro', locale: 'it-IT', n2w: 'it' },
  pt: { hour: 'horas', times: 'vezes', currency: 'euros', locale: 'pt-PT', n2w: 'pt' },
  nl: { hour: 'uur', times: 'keer', currency: 'euro', locale: 'nl-NL', n2w: 'nl' },
  pl: { hour: '', times: 'razy', currency: 'euro', locale: 'pl-PL', n2w: 'pl' },
  ru: { hour: 'часов', times: 'раз', currency: 'евро', locale: 'ru-RU', n2w: 'ru' },
  uk: { hour: 'годині', times: 'разів', currency: 'євро', locale: 'uk-UA', n2w: 'uk' },
  tr: { hour: '', times: 'kez', currency: 'euro', locale: 'tr-TR', n2w: 'tr' },
  ar: { hour: '', times: 'مرات', currency: 'يورو', locale: 'ar-SA', n2w: 'ar' },
  zh: { hour: '点', times: '次', currency: '欧元', locale: 'zh-CN', n2w: 'zh' },
  ja: { hour: '時', times: '回', currency: 'ユーロ', locale: 'ja-JP', n2w: 'ja' },
  ko: { hour: '시', times: '번', currency: '유로', locale: 'ko-KR', n2w: 'ko' },
  vi: { hour: 'giờ', times: 'lần', currency: 'euro', locale: 'vi-VN', n2w: 'vi' },
  hr: { hour: 'sati', times: 'puta', currency: 'eura', locale: 'hr-HR', n2w: 'hr' },
  sr: { hour: 'сати', times: 'пута', currency: 'евра', locale: 'sr-RS', n2w: 'sr' },
  cs: { hour: 'hodin', times: 'krát', currency: 'eur', locale: 'cs-CZ', n2w: 'cz' },
  hu: { hour: 'óra', times: 'alkalommal', currency: 'euró', locale: 'hu-HU', n2w: 'hu' },
  ro: { hour: 'ore', times: 'ori', currency: 'euro', locale: 'ro-RO', n2w: 'ro' },
  da: { hour: '', times: 'gange', currency: 'euro', locale: 'da-DK', n2w: 'dk' },
  no: { hour: '', times: 'ganger', currency: 'euro', locale: 'nb-NO', n2w: 'no' },
  sv: { hour: '', times: 'gånger', currency: 'euro', locale: 'sv-SE', n2w: 'sv' },
  fi: { hour: '', times: 'kertaa', currency: 'euroa', locale: 'fi-FI', n2w: 'fi' },
  he: { hour: '', times: 'פעמים', currency: 'אירו', locale: 'he-IL', n2w: 'he' },
  id: { hour: 'jam', times: 'kali', currency: 'euro', locale: 'id-ID', n2w: 'id' },
  lt: { hour: 'valandą', times: 'kartų', currency: 'eurų', locale: 'lt-LT', n2w: 'lt' },
  lv: { hour: '', times: 'reizes', currency: 'eiro', locale: 'lv-LV', n2w: 'lv' },
  fa: { hour: 'ساعت', times: 'بار', currency: 'یورو', locale: 'fa-IR', n2w: 'fa' },
  az: { hour: 'saat', times: 'dəfə', currency: 'avro', locale: 'az-AZ', n2w: 'az' },
};

// Default fallback
const DEFAULT_LANG = 'de';

// ============================================
// Abbreviations - Auto-generated via Intl + manual extras
// ============================================

// Cache for generated abbreviation maps
const abbreviationCache = {};

/**
 * Generate weekday abbreviation map using Intl (works for all locales)
 * Returns: {"Mo": "Montag", "Mo.": "Montag", ...}
 */
function generateWeekdayMap(locale) {
  const map = {};
  // Jan 1, 2024 = Monday, so we iterate Mon-Sun
  for (let i = 0; i < 7; i++) {
    const date = new Date(2024, 0, i + 1);
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
    const long = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
    // Add both with and without period
    map[short] = long;
    map[short + '.'] = long;
    // Also lowercase variants
    map[short.toLowerCase()] = long;
    map[short.toLowerCase() + '.'] = long;
  }
  return map;
}

/**
 * Generate month abbreviation map using Intl (works for all locales)
 * Returns: {"Jan": "Januar", "Jan.": "Januar", ...}
 */
function generateMonthMap(locale) {
  const map = {};
  for (let i = 0; i < 12; i++) {
    const date = new Date(2024, i, 15);
    const short = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
    const long = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
    // Add both with and without period
    map[short] = long;
    map[short + '.'] = long;
    // Also lowercase variants
    map[short.toLowerCase()] = long;
    map[short.toLowerCase() + '.'] = long;
  }
  return map;
}

/**
 * Get or create abbreviation map for a locale
 */
function getAbbreviationMap(lang) {
  const langData = LANGUAGE_WORDS[lang] || LANGUAGE_WORDS[DEFAULT_LANG];
  const locale = langData.locale || 'de-DE';

  if (!abbreviationCache[locale]) {
    // Generate auto abbreviations from Intl
    const weekdays = generateWeekdayMap(locale);
    const months = generateMonthMap(locale);

    // Merge with manual extras for this language
    const manualExtras = MANUAL_ABBREVIATIONS[lang] || {};

    abbreviationCache[locale] = { ...weekdays, ...months, ...manualExtras };
  }

  return abbreviationCache[locale];
}

// Manual abbreviations that Intl doesn't cover (street names, common phrases, etc.)
const MANUAL_ABBREVIATIONS = {
  de: {
    'Str.': 'Straße', 'str.': 'straße', 'Nr.': 'Nummer', 'nr.': 'nummer',
    'ca.': 'circa', 'z.B.': 'zum Beispiel', 'z. B.': 'zum Beispiel',
    'd.h.': 'das heißt', 'd. h.': 'das heißt', 'u.a.': 'unter anderem',
    'bzw.': 'beziehungsweise', 'inkl.': 'inklusive', 'exkl.': 'exklusive',
    'zzgl.': 'zuzüglich', 'evtl.': 'eventuell', 'Tel.': 'Telefon',
    'max.': 'maximal', 'min.': 'minimal', 'Min.': 'Minuten',
    'Std.': 'Stunden', 'Teiln.': 'Teilnehmer', 'UE': 'Unterrichtseinheiten',
  },
  en: {
    'St.': 'Street', 'Ave.': 'Avenue', 'Blvd.': 'Boulevard', 'Dr.': 'Drive',
    'No.': 'Number', 'approx.': 'approximately', 'e.g.': 'for example',
    'i.e.': 'that is', 'etc.': 'etcetera', 'incl.': 'including',
  },
  fr: {
    'n°': 'numéro', 'env.': 'environ', 'p.ex.': 'par exemple',
  },
  tr: {
    'Cad.': 'Caddesi', 'Sok.': 'Sokak', 'No.': 'Numara',
  },
};

// ============================================
// Language Detection (using Unicode ranges + franc-min fallback)
// ============================================
let francModule = null;
let francLoadAttempted = false;

async function loadFranc() {
  if (!francModule && !francLoadAttempted) {
    francLoadAttempted = true;
    try {
      francModule = await import('franc-min');
      console.log('[TTS Normalizer] franc-min loaded successfully');
    } catch (error) {
      console.warn('[TTS Normalizer] franc-min not available:', error.message);
    }
  }
  return francModule;
}

// Initialize franc-min on module load
loadFranc().catch(() => {});

/**
 * Detect language from Unicode script ranges
 * franc-min doesn't reliably detect non-Latin scripts, so we check them first
 * Returns ISO 639-1 code or null if no script detected
 */
function detectScriptLanguage(text) {
  if (!text) return null;

  // Count characters in each script range
  const scriptCounts = {
    arabic: 0,      // Arabic, Persian, Urdu
    hebrew: 0,      // Hebrew
    cyrillic: 0,    // Russian, Ukrainian, Serbian, Bulgarian
    greek: 0,       // Greek
    chinese: 0,     // Chinese (CJK Ideographs)
    japanese: 0,    // Japanese (Hiragana + Katakana)
    korean: 0,      // Korean (Hangul)
    thai: 0,        // Thai
    devanagari: 0,  // Hindi, Sanskrit
    bengali: 0,     // Bengali
  };

  for (const char of text) {
    const code = char.charCodeAt(0);

    // Arabic script (U+0600-U+06FF, U+0750-U+077F, U+08A0-U+08FF)
    if ((code >= 0x0600 && code <= 0x06FF) ||
        (code >= 0x0750 && code <= 0x077F) ||
        (code >= 0x08A0 && code <= 0x08FF)) {
      scriptCounts.arabic++;
    }
    // Hebrew script (U+0590-U+05FF)
    else if (code >= 0x0590 && code <= 0x05FF) {
      scriptCounts.hebrew++;
    }
    // Cyrillic script (U+0400-U+04FF, U+0500-U+052F)
    else if ((code >= 0x0400 && code <= 0x04FF) ||
             (code >= 0x0500 && code <= 0x052F)) {
      scriptCounts.cyrillic++;
    }
    // Greek script (U+0370-U+03FF)
    else if (code >= 0x0370 && code <= 0x03FF) {
      scriptCounts.greek++;
    }
    // CJK Unified Ideographs (U+4E00-U+9FFF) - Chinese/Japanese/Korean
    else if (code >= 0x4E00 && code <= 0x9FFF) {
      scriptCounts.chinese++;
    }
    // Japanese Hiragana (U+3040-U+309F) and Katakana (U+30A0-U+30FF)
    else if ((code >= 0x3040 && code <= 0x309F) ||
             (code >= 0x30A0 && code <= 0x30FF)) {
      scriptCounts.japanese++;
    }
    // Korean Hangul Syllables (U+AC00-U+D7AF) and Jamo (U+1100-U+11FF)
    else if ((code >= 0xAC00 && code <= 0xD7AF) ||
             (code >= 0x1100 && code <= 0x11FF)) {
      scriptCounts.korean++;
    }
    // Thai script (U+0E00-U+0E7F)
    else if (code >= 0x0E00 && code <= 0x0E7F) {
      scriptCounts.thai++;
    }
    // Devanagari script (U+0900-U+097F) - Hindi
    else if (code >= 0x0900 && code <= 0x097F) {
      scriptCounts.devanagari++;
    }
    // Bengali script (U+0980-U+09FF)
    else if (code >= 0x0980 && code <= 0x09FF) {
      scriptCounts.bengali++;
    }
  }

  // Find the script with the most characters
  const maxScript = Object.entries(scriptCounts)
    .filter(([_, count]) => count >= 3) // Minimum 3 characters to be confident
    .sort((a, b) => b[1] - a[1])[0];

  if (!maxScript) return null;

  // Map script to language code
  const scriptToLang = {
    arabic: 'ar',      // Could be ar, fa, ur - default to Arabic
    hebrew: 'he',
    cyrillic: 'ru',    // Could be ru, uk, sr, bg - default to Russian
    greek: 'el',
    chinese: 'zh',
    japanese: 'ja',
    korean: 'ko',
    thai: 'th',
    devanagari: 'hi',
    bengali: 'bn',
  };

  return scriptToLang[maxScript[0]] || null;
}

function detectLanguage(text, fallback = DEFAULT_LANG) {
  if (!text || text.length < 10) return fallback;

  try {
    // First: Try Unicode script detection (reliable for non-Latin scripts)
    const scriptLang = detectScriptLanguage(text);
    if (scriptLang && LANGUAGE_WORDS[scriptLang]) {
      return scriptLang;
    }

    // Second: Use franc-min for Latin-based languages
    if (francModule && francModule.franc) {
      const detected = francModule.franc(text);
      if (detected === 'und') return fallback;
      const iso1 = ISO_639_3_TO_1[detected];
      return (iso1 && LANGUAGE_WORDS[iso1]) ? iso1 : fallback;
    }
    return fallback;
  } catch (error) {
    console.warn('[TTS Normalizer] franc detection failed:', error.message);
    return fallback;
  }
}

// Async version for when you can await
async function detectLanguageAsync(text, fallback = DEFAULT_LANG) {
  if (!text || text.length < 10) return fallback;

  try {
    // First: Try Unicode script detection (reliable for non-Latin scripts)
    const scriptLang = detectScriptLanguage(text);
    if (scriptLang && LANGUAGE_WORDS[scriptLang]) {
      return scriptLang;
    }

    // Second: Use franc-min for Latin-based languages
    const franc = await loadFranc();
    if (!franc || !franc.franc) return fallback;

    const detected = franc.franc(text);
    if (detected === 'und') return fallback;

    const iso1 = ISO_639_3_TO_1[detected];
    return (iso1 && LANGUAGE_WORDS[iso1]) ? iso1 : fallback;
  } catch (error) {
    console.warn('[TTS Normalizer] franc-min not available:', error.message);
    return fallback;
  }
}

// ============================================
// Number to Words (using n2words)
// ============================================
function numberToWords(num, lang = DEFAULT_LANG) {
  try {
    const n2words = require('n2words');
    const langData = LANGUAGE_WORDS[lang] || LANGUAGE_WORDS[DEFAULT_LANG];
    return n2words(num, { lang: langData.n2w || 'en' });
  } catch (error) {
    // Fallback: return number as string
    return String(num);
  }
}

// ============================================
// Date Formatting (using Intl.DateTimeFormat)
// ============================================

/**
 * Get ordinal suffix for a day number by language
 * German: 1 → "1ter", 2 → "2ter", 3 → "3ter", etc.
 * English: 1 → "1st", 2 → "2nd", 3 → "3rd", etc.
 */
function getOrdinalDay(day, lang = DEFAULT_LANG) {
  const dayNum = parseInt(day);

  if (lang === 'de') {
    // German: always "ter" suffix for TTS (spoken as "erster", "zweiter", etc.)
    return `${dayNum}ter`;
  } else if (lang === 'en') {
    // English ordinals
    if (dayNum === 1 || dayNum === 21 || dayNum === 31) return `${dayNum}st`;
    if (dayNum === 2 || dayNum === 22) return `${dayNum}nd`;
    if (dayNum === 3 || dayNum === 23) return `${dayNum}rd`;
    return `${dayNum}th`;
  } else if (lang === 'fr') {
    // French: 1er, then just the number
    return dayNum === 1 ? '1er' : String(dayNum);
  } else if (lang === 'es' || lang === 'it' || lang === 'pt') {
    // Spanish/Italian/Portuguese: use ordinal marker
    return `${dayNum}º`;
  }

  // Default: just the number
  return String(dayNum);
}

function formatDate(dateStr, lang = DEFAULT_LANG) {
  try {
    const langData = LANGUAGE_WORDS[lang] || LANGUAGE_WORDS[DEFAULT_LANG];
    const locale = langData.locale || 'de-DE';

    // Parse DD.MM.YYYY or DD/MM/YYYY
    const match = dateStr.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
    if (!match) return dateStr;

    const [, day, month, year] = match;
    const date = new Date(year, month - 1, day);

    if (isNaN(date.getTime())) return dateStr;

    // Get month name from Intl
    const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);

    // Build date string with ordinal day for better TTS
    const ordinalDay = getOrdinalDay(day, lang);

    return `${ordinalDay} ${monthName} ${year}`;
  } catch (error) {
    return dateStr;
  }
}

// ============================================
// Time Formatting
// ============================================
function formatTime(hour, minute, lang = DEFAULT_LANG) {
  const langData = LANGUAGE_WORDS[lang] || LANGUAGE_WORDS[DEFAULT_LANG];
  const hourWord = numberToWords(parseInt(hour), lang);

  if (parseInt(minute) === 0) {
    // "10 Uhr" or "10 o'clock"
    return langData.hour ? `${hourWord} ${langData.hour}` : hourWord;
  } else {
    const minWord = numberToWords(parseInt(minute), lang);
    // "10 Uhr 30" or "10:30"
    return langData.hour ? `${hourWord} ${langData.hour} ${minWord}` : `${hourWord}:${minWord}`;
  }
}

// ============================================
// Main Normalization Function
// ============================================
function normalizeTextForTTS(text, language = 'auto') {
  if (!text || typeof text !== 'string') return '';

  // Detect language if auto
  const lang = (language === 'auto') ? detectLanguage(text, DEFAULT_LANG) : language;
  const langData = LANGUAGE_WORDS[lang] || LANGUAGE_WORDS[DEFAULT_LANG];

  let normalized = text;

  // 1. Remove markdown formatting (universal)
  normalized = removeMarkdown(normalized);

  // 2. Convert numbered lists to ordinals (1. → Erstens,)
  normalized = normalizeNumberedLists(normalized, lang);

  // 3. Remove URLs (universal)
  normalized = removeUrls(normalized);

  // 3. Remove disclaimers (universal)
  normalized = removeDisclaimers(normalized);

  // 4. Spell out course numbers for accessibility (universal)
  normalized = normalizeCourseNumbers(normalized);

  // 5. Expand abbreviations (Sa. → Samstag, Str. → Straße)
  normalized = expandAbbreviations(normalized, lang);

  // 6. Normalize dates (multilingual via Intl)
  normalized = normalizeDates(normalized, lang);

  // 7. Normalize times (multilingual via n2words)
  normalized = normalizeTimes(normalized, lang);

  // 7. Normalize prices (multilingual)
  normalized = normalizePrices(normalized, lang);

  // 8. Normalize repetitions "15x" → "15 mal" (multilingual)
  normalized = normalizeRepetitions(normalized, lang);

  // 9. Add pauses before labels for better TTS flow
  normalized = addPausesBeforeLabels(normalized);

  // 9b. Add pauses after course titles for better TTS flow
  normalized = addPausesAfterTitles(normalized);

  // 10. Clean up separators (universal)
  normalized = cleanupSeparators(normalized);

  // 10. Clean up whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // 11. Limit length
  normalized = limitLength(normalized, 1500);

  return normalized;
}

// ============================================
// Universal Functions (work for all languages)
// ============================================

function removeMarkdown(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')      // **bold**
    .replace(/__([^_]+)__/g, '$1')          // __bold__
    .replace(/\*([^*]+)\*/g, '$1')          // *italic*
    .replace(/_([^_]+)_/g, '$1')            // _italic_
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url)
    .replace(/`([^`]+)`/g, '$1')            // `code`
    .replace(/^#{1,6}\s*/gm, '')            // # headers
    .replace(/^[-*_]{3,}$/gm, '')           // horizontal rules
    .replace(/^>\s*/gm, '');                // > blockquotes
}

/**
 * Convert numbered list items to spoken ordinals for better TTS
 * "1. Finanzbuchführung" → "Erstens, Finanzbuchführung"
 */
function normalizeNumberedLists(text, lang = DEFAULT_LANG) {
  // German ordinal words for list items
  const ordinals = {
    de: ['Erstens', 'Zweitens', 'Drittens', 'Viertens', 'Fünftens', 'Sechstens', 'Siebtens', 'Achtens', 'Neuntens', 'Zehntens'],
    en: ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'],
    fr: ['Premièrement', 'Deuxièmement', 'Troisièmement', 'Quatrièmement', 'Cinquièmement', 'Sixièmement', 'Septièmement', 'Huitièmement', 'Neuvièmement', 'Dixièmement'],
    es: ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo'],
  };

  const langOrdinals = ordinals[lang] || ordinals['de'];

  // Match numbered list items: "1. ", "2. ", etc. at start of line or after newline
  return text.replace(/(?:^|\n)\s*(\d{1,2})\.\s+/g, (match, num) => {
    const index = parseInt(num) - 1;
    if (index >= 0 && index < langOrdinals.length) {
      return `\n${langOrdinals[index]}, `;
    }
    // Fallback for numbers > 10: "Nummer 11, "
    const numberWord = lang === 'de' ? 'Nummer' : lang === 'en' ? 'Number' : 'Número';
    return `\n${numberWord} ${num}, `;
  });
}

function expandAbbreviations(text, lang = DEFAULT_LANG) {
  // Get auto-generated + manual abbreviations for this language
  const abbrevs = getAbbreviationMap(lang);

  // Sort by length (longest first) to avoid partial replacements
  const sortedAbbrevs = Object.entries(abbrevs).sort((a, b) => b[0].length - a[0].length);

  for (const [abbrev, expansion] of sortedAbbrevs) {
    // Escape special regex characters in abbreviation
    const escaped = abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match abbreviation with word boundary or before digits (e.g., "Sa. 06")
    const regex = new RegExp(`\\b${escaped}(?=\\s|\\d|$)`, 'g');
    text = text.replace(regex, expansion);
  }

  return text;
}

function removeUrls(text) {
  return text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/Kurslink:\s*Hier klicken/gi, '')
    .replace(/Kurslink:\s*$/gim, '')
    .replace(/Link:\s*$/gim, '');
}

function removeDisclaimers(text) {
  return text
    .replace(/\*?Ich kann Fehler machen\.[^*]*Entwicklungsphase\.\*?/gi, '')
    .replace(/Ich kann Fehler machen\.[^.]*\./gi, '')
    .replace(/Bitte überprüfe[^.]*\./gi, '');
}

function normalizeCourseNumbers(text) {
  // Universal: Detect course code patterns and spell them out
  // Pattern: 1-2 letters + 4-5 digits + optional letter (R7436, S4209C, AB1234)
  // This works for ALL languages without needing to know the label word

  const spellOut = (code) => {
    // Add space between each character for TTS to spell it out
    return code.split('').join(' ');
  };

  // First: Add pause after "Kurs:" before course code to fix pronunciation
  // "Kurs: S4209C" → "Kurs, S4209C" (comma helps TTS pronounce "Kurs" correctly)
  text = text.replace(/\bKurs:\s*([A-Z]{1,2}\d{4,5}[A-Z]?)/gi, 'Kurs, $1');

  // Match course code patterns: R7436, S4209C, AB12345, etc.
  // Must be preceded by word boundary or colon/space to avoid matching mid-word
  // Pattern: 1-2 uppercase letters + 4-5 digits + optional uppercase letter
  text = text.replace(/(?:^|[\s:,])([A-Z]{1,2}\d{4,5}[A-Z]?)(?=[\s,.\n]|$)/g, (match, code) => {
    // Preserve the leading character (space, colon, or comma)
    const leadingChar = match[0] === code[0] ? '' : match[0];
    return `${leadingChar}${spellOut(code)}`;
  });

  return text;
}

/**
 * Add pauses (commas) before common labels for better TTS flow
 * "15x Ort: Online" → "15x, Ort: Online"
 */
function addPausesBeforeLabels(text) {
  // Common labels that benefit from a pause before them (multilingual)
  const labels = [
    // German
    'Ort', 'Preis', 'Status', 'Kurs', 'Kursnummer', 'Kurslink', 'Start', 'Ende', 'Beginn', 'Dauer', 'Termin',
    // Spanish
    'Ubicación', 'Precio', 'Estado', 'Curso', 'Inicio', 'Fin', 'Duración',
    // English
    'Location', 'Price', 'Course', 'Duration',
    // French
    'Lieu', 'Prix', 'Cours', 'Début', 'Durée',
    // Italian
    'Luogo', 'Prezzo', 'Corso', 'Inizio', 'Fine',
    // Ukrainian/Russian
    'Місце', 'Ціна', 'Курс', 'Початок', 'Статус',
  ];

  for (const label of labels) {
    // Add comma before label if not already preceded by comma, period, or newline
    // Match: word/number followed by space and label with colon
    const regex = new RegExp(`([^,\\.\\n])\\s+(${label}:)`, 'gi');
    text = text.replace(regex, '$1, $2');
  }

  return text;
}

/**
 * Add pauses after course titles for better TTS flow
 * "Drittens, Aqua-Fitness\nEin umfassendes..." → "Drittens, Aqua-Fitness.\nEin umfassendes..."
 */
function addPausesAfterTitles(text) {
  // Match lines that start with ordinal words (result of normalizeNumberedLists)
  // and don't end with punctuation - add a period for pause
  const ordinalStarts = [
    'Erstens', 'Zweitens', 'Drittens', 'Viertens', 'Fünftens',
    'Sechstens', 'Siebtens', 'Achtens', 'Neuntens', 'Zehntens',
    'First', 'Second', 'Third', 'Fourth', 'Fifth',
    'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
    'Nummer', 'Number', 'Número'
  ];

  const ordinalPattern = ordinalStarts.join('|');

  // Match: ordinal + comma + title text (no ending punctuation) + newline
  // Add period before newline for TTS pause
  const regex = new RegExp(`((?:${ordinalPattern}),\\s*[^.!?\\n]+)(?=\\n)`, 'gi');
  text = text.replace(regex, '$1.');

  return text;
}

function cleanupSeparators(text) {
  return text
    .replace(/\s*\|\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/^\s*,\s*/gm, '')
    .replace(/\s*,\s*$/gm, '');
}

function limitLength(text, maxLength = 1500) {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

// ============================================
// Multilingual Functions (use packages)
// ============================================

function normalizeDates(text, lang = DEFAULT_LANG) {
  // Match DD.MM.YYYY or DD/MM/YYYY
  return text.replace(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/g, (match) => {
    return formatDate(match, lang);
  });
}

function normalizeTimes(text, lang = DEFAULT_LANG) {
  // Match time ranges: "10:00 - 12:30 Uhr" or "18.30 - 20.30 Uhr"
  text = text.replace(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})\s*Uhr?/gi,
    (match, h1, m1, h2, m2) => {
      const time1 = formatTime(h1, m1, lang);
      const time2 = formatTime(h2, m2, lang);
      const connector = lang === 'de' ? 'bis' : lang === 'fr' ? 'à' : lang === 'es' ? 'a' : 'to';
      return `${time1} ${connector} ${time2}`;
    });

  // Match single times: "10:00 Uhr"
  text = text.replace(/(\d{1,2})[.:](\d{2})\s*Uhr/gi, (match, h, m) => {
    return formatTime(h, m, lang);
  });

  // English AM/PM times: "6:00 PM" → "six PM", "6:30 PM" → "six thirty PM"
  text = text.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (match, h, m, ampm) => {
    const hourWord = numberToWords(parseInt(h), 'en');
    const minute = parseInt(m);
    if (minute === 0) {
      return `${hourWord} ${ampm.toUpperCase()}`;
    }
    const minWord = numberToWords(minute, 'en');
    return `${hourWord} ${minWord} ${ampm.toUpperCase()}`;
  });

  // English time ranges: "6:00 PM - 8:00 PM" → "six PM to eight PM"
  text = text.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/gi,
    (match, h1, m1, ampm1, h2, m2, ampm2) => {
      const formatEnTime = (h, m, ampm) => {
        const hourWord = numberToWords(parseInt(h), 'en');
        const minute = parseInt(m);
        if (minute === 0) return `${hourWord} ${ampm.toUpperCase()}`;
        return `${hourWord} ${numberToWords(minute, 'en')} ${ampm.toUpperCase()}`;
      };
      return `${formatEnTime(h1, m1, ampm1)} to ${formatEnTime(h2, m2, ampm2)}`;
    });

  return text;
}

function normalizePrices(text, lang = DEFAULT_LANG) {
  const langData = LANGUAGE_WORDS[lang] || LANGUAGE_WORDS[DEFAULT_LANG];
  const currencyWord = langData.currency || 'Euro';

  // "17,50 €" or "17.50€"
  text = text.replace(/(\d+)[,.](\d{2})\s*€/g, (match, euros, cents) => {
    const euroWord = numberToWords(parseInt(euros), lang);
    if (cents === '00') {
      return `${euroWord} ${currencyWord}`;
    }
    const centWord = numberToWords(parseInt(cents), lang);
    return `${euroWord} ${currencyWord} ${centWord}`;
  });

  // Whole amounts: "100 €"
  text = text.replace(/(\d+)\s*€/g, (match, euros) => {
    const euroWord = numberToWords(parseInt(euros), lang);
    return `${euroWord} ${currencyWord}`;
  });

  // "Preis: Nicht angegeben"
  text = text.replace(/Preis:\s*Nicht angegeben/gi, '');

  return text;
}

function normalizeRepetitions(text, lang = DEFAULT_LANG) {
  const langData = LANGUAGE_WORDS[lang] || LANGUAGE_WORDS[DEFAULT_LANG];

  // Singular/plural forms for "Termin/Termine", "session/sessions", etc.
  const singularPlural = {
    de: { singular: 'Termin', plural: 'Termine' },
    en: { singular: 'session', plural: 'sessions' },
    fr: { singular: 'séance', plural: 'séances' },
    es: { singular: 'sesión', plural: 'sesiones' },
    it: { singular: 'sessione', plural: 'sessioni' },
  };

  const forms = singularPlural[lang] || singularPlural['de'];

  // "| 15x" → ", 15 Termine" or "| 1x" → ", ein Termin"
  return text.replace(/\|?\s*(\d+)x\b/g, (match, count) => {
    const num = parseInt(count);
    if (num === 1) {
      // Special case: "ein Termin" (not "eins Termin")
      const oneWord = lang === 'de' ? 'ein' : lang === 'fr' ? 'une' : lang === 'es' ? 'una' : 'one';
      return `, ${oneWord} ${forms.singular}`;
    }
    const numWord = numberToWords(num, lang);
    return `, ${numWord} ${forms.plural}`;
  });
}

// ============================================
// Exports
// ============================================
module.exports = {
  normalizeTextForTTS,
  detectLanguage,
  numberToWords,
  formatDate,
  formatTime,
  LANGUAGE_WORDS,
  ISO_639_3_TO_1,
};
