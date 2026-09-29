/**
 * Utility functions for Word Import, Export, Text Parsing and Distractor generation
 */
import { WordItem } from '../types/game';
import { GAME_MAPS } from '../data/words';
import { ALL_UNIFIED_WORDS } from '../data/shanghaiWords';

export type ExportFormat = 'standard' | 'simple' | 'csv' | 'json';

// Get fallback pool of all default words across all maps
export function getAllDefaultWords(): WordItem[] {
  return ALL_UNIFIED_WORDS;
}

/**
 * Export WordItem array into various text formats
 */
export function exportWordsToText(words: WordItem[], format: ExportFormat): string {
  if (!words || words.length === 0) {
    return '暂无单词数据';
  }

  switch (format) {
    case 'simple': {
      // Format: word 释义 (e.g. apple 苹果)
      return words.map((w) => `${w.word} ${w.translation}`).join('\n');
    }

    case 'csv': {
      const header = '英文单词,音标,词性,中文释义,英文例句,例句中文翻译,掌握度(0-5),错误次数,正确次数';
      const rows = words.map((w) => {
        const escapeCsv = (str: string = '') => `"${str.replace(/"/g, '""')}"`;
        return [
          escapeCsv(w.word),
          escapeCsv(w.phonetic || ''),
          escapeCsv(w.partOfSpeech || 'n.'),
          escapeCsv(w.translation),
          escapeCsv(w.example || ''),
          escapeCsv(w.exampleTranslation || ''),
          w.mastery ?? 0,
          w.wrongCount ?? 0,
          w.correctCount ?? 0,
        ].join(',');
      });
      return [header, ...rows].join('\n');
    }

    case 'json': {
      return JSON.stringify(words, null, 2);
    }

    case 'standard':
    default: {
      // Human-readable standard notebook format matching requirement 4:
      // 序号. 单词 [音标] (词性.) 中文意思
      // 例句: ...
      // 译文: ...
      const entries = words.map((w, index) => {
        let phoneticFormatted = w.phonetic ? w.phonetic.trim() : '';
        if (phoneticFormatted && !phoneticFormatted.startsWith('/') && !phoneticFormatted.startsWith('[')) {
          phoneticFormatted = `[/${phoneticFormatted}/]`;
        } else if (phoneticFormatted && !phoneticFormatted.startsWith('[')) {
          phoneticFormatted = `[${phoneticFormatted}]`;
        }
        const posFormatted = w.partOfSpeech ? `(${w.partOfSpeech.replace(/^\(|\)$/g, '')})` : '';

        const lines = [
          `${index + 1}. ${w.word} ${phoneticFormatted ? `${phoneticFormatted} ` : ''}${posFormatted ? `${posFormatted} ` : ''}${w.translation}`,
        ];
        if (w.example) {
          lines.push(`例句: ${w.example}`);
        }
        if (w.exampleTranslation) {
          lines.push(`译文: ${w.exampleTranslation}`);
        }
        return lines.join('\n');
      });

      return `/*****************************************\n${entries.join('\n\n')}\n*****************************************/`;
    }
  }
}

/**
 * Parse plain text string into WordItem[]
 * Robustly supports requirement 4's format:
 * 序号. 单词 [音标] (词性.) 中文意思
 * 例句: ...
 * 译文: ...
 */
export function parseWordsFromText(
  inputText: string,
  existingPool: WordItem[] = []
): { success: boolean; words: WordItem[]; errors: string[]; warning?: string } {
  const text = inputText.trim();
  if (!text) {
    return { success: false, words: [], errors: ['输入文本为空，请输入或粘贴单词内容'] };
  }

  const allWordsPool = existingPool.length > 0 ? existingPool : getAllDefaultWords();
  const fallbackTranslations = allWordsPool.map((w) => w.translation);

  // 1. Try parsing JSON format first
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validWords: WordItem[] = parsed.map((item, idx) => {
          const word = String(item.word || '').trim();
          const translation = String(item.translation || '').trim();
          const id = item.id || `custom_${word.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx}_${Date.now()}`;
          const options =
            Array.isArray(item.options) && item.options.length >= 4
              ? item.options
              : generateOptionsForTranslation(translation, fallbackTranslations);

          return {
            id,
            word: word || `Word_${idx + 1}`,
            phonetic: item.phonetic || `/${word}/`,
            translation: translation || '未知释义',
            options,
            partOfSpeech: item.partOfSpeech || 'n.',
            example: item.example || `This is an example of ${word}.`,
            exampleTranslation: item.exampleTranslation || `这是 ${word} 的例句。`,
            category: item.category || '自定义导入',
            mastery: typeof item.mastery === 'number' ? item.mastery : 0,
            wrongCount: item.wrongCount || 0,
            correctCount: item.correctCount || 0,
            consecutiveCorrect: item.consecutiveCorrect || 0,
            appearedCount: item.appearedCount || 0,
            inFurnace: !!item.inFurnace,
          };
        });

        return { success: true, words: validWords, errors: [] };
      }
    } catch {
      // fallback to multi-line parser
    }
  }

  // 2. Multi-line state machine parser
  const lines = text.split(/\r?\n/);
  const parsedWords: WordItem[] = [];
  const errors: string[] = [];

  interface PendingWord {
    word: string;
    phonetic: string;
    partOfSpeech: string;
    translation: string;
    example: string;
    exampleTranslation: string;
    rawLine: string;
    lineNum: number;
  }

  let currentPending: PendingWord | null = null;

  const commitPending = () => {
    if (!currentPending) return;
    const { word, phonetic, partOfSpeech, translation, example, exampleTranslation, rawLine, lineNum } = currentPending;
    currentPending = null;

    if (!word || !translation) {
      errors.push(`第 ${lineNum} 行未能识别有效英文单词或中文释义: "${rawLine}"`);
      return;
    }

    const cleanWord = word.replace(/^["']|["']$/g, '').trim();
    const cleanTrans = translation.replace(/^["']|["']$/g, '').trim();
    if (!cleanWord || !cleanTrans) return;

    const id = `custom_${cleanWord.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${parsedWords.length}_${Date.now()}`;
    const options = generateOptionsForTranslation(cleanTrans, fallbackTranslations);

    parsedWords.push({
      id,
      word: cleanWord,
      phonetic: phonetic || `/${cleanWord.toLowerCase()}/`,
      translation: cleanTrans,
      options,
      partOfSpeech: partOfSpeech || 'n.',
      example: example || `This is an example of ${cleanWord}.`,
      exampleTranslation: exampleTranslation || `这是 ${cleanWord} 的例句。`,
      category: '自定义导入',
      mastery: 0,
      wrongCount: 0,
      correctCount: 0,
      consecutiveCorrect: 0,
      appearedCount: 0,
      inFurnace: false,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    const lineNum = i + 1;

    // Skip empty lines or comment borders
    if (!raw) continue;
    if (raw.startsWith('/*') || raw.startsWith('*/') || raw.startsWith('***') || raw.startsWith('---') || raw.startsWith('===') || raw.startsWith('//') || raw.startsWith('#')) {
      continue;
    }

    // Skip template placeholder header lines like "序号. 单词 [音标] (词性.) 中文意思"
    if (raw.includes('序号') && raw.includes('单词') && raw.includes('中文意思')) {
      continue;
    }
    if ((raw === '例句:' || raw === '例句：' || raw === '译文:' || raw === '译文：') && !currentPending) {
      continue;
    }

    // Check if it's an example line: "例句: ..." or "例句：..." or "Example: ..."
    const exampleMatch = raw.match(/^(?:例句|Example|例)[:：]\s*(.*)$/i);
    if (exampleMatch) {
      if (currentPending) {
        currentPending.example = exampleMatch[1].trim();
      }
      continue;
    }

    // Check if it's a translation line: "译文: ..." or "译文：..." or "翻译: ..." or "Translation: ..."
    const transMatch = raw.match(/^(?:译文|翻译|Translation|译)[:：]\s*(.*)$/i);
    if (transMatch) {
      if (currentPending) {
        currentPending.exampleTranslation = transMatch[1].trim();
      }
      continue;
    }

    // Check if it's CSV header
    if (i === 0 && (raw.includes('单词') || raw.includes('word')) && (raw.includes('释义') || raw.includes('translation'))) {
      continue;
    }

    // New word definition line encountered! Commit previous word first
    commitPending();

    // Remove leading numbering like "1. ", "12) ", "1、"
    let line = raw.replace(/^\d+[\.\、\)\s]+/, '').trim();

    // Check CSV line
    if (line.includes(',') || line.includes('\t')) {
      const separator = line.includes('\t') ? '\t' : ',';
      const parts = splitCsvLine(line, separator);
      if (parts.length >= 2) {
        currentPending = {
          word: parts[0].trim(),
          phonetic: parts.length >= 4 ? parts[1].trim() : '',
          partOfSpeech: parts.length >= 4 ? parts[2].trim() : 'n.',
          translation: parts.length >= 4 ? parts[3].trim() : parts[1].trim(),
          example: parts.length >= 5 ? parts[4].trim() : '',
          exampleTranslation: parts.length >= 6 ? parts[5].trim() : '',
          rawLine: raw,
          lineNum,
        };
        continue;
      }
    }

    // Standard format Regex:
    // "ability [/əˈbɪləti/] (n.) 能力，才能，本领"
    // "ability [əˈbɪləti] (n.) 能力，才能，本领"
    // "ability (n.) 能力，才能，本领"
    // "ability [/əˈbɪləti/] 能力，才能，本领"
    // "ability 能力，才能，本领"
    const standardRegex = /^([a-zA-Z\-\s']+?)\s+(?:\[(?:\/)?([^\/\]]+)(?:\/)?\]\s+)?(?:\(([a-zA-Z\.\/\s]+)\)\s+)?(.+)$/;
    const stdMatch = line.match(standardRegex);

    if (stdMatch) {
      const word = stdMatch[1].trim();
      const phonetic = stdMatch[2] ? `[/${stdMatch[2].trim()}/]` : '';
      const partOfSpeech = stdMatch[3] ? stdMatch[3].trim() : 'n.';
      let translation = stdMatch[4].trim();
      let example = '';

      // Check if translation contains inline example separated by dash
      if (translation.includes(' - ') || translation.includes(' —— ')) {
        const parts = translation.split(/(?:\s+-\s+|\s+——\s+)/);
        translation = parts[0].trim();
        example = parts[1]?.trim() || '';
      }

      currentPending = {
        word,
        phonetic,
        partOfSpeech,
        translation,
        example,
        exampleTranslation: '',
        rawLine: raw,
        lineNum,
      };
      continue;
    }

    // Fallback: Split by colon, hyphen, or space
    const sepMatch = line.match(/^([a-zA-Z\-\s']+?)\s*[:：\-—=]\s*(.+)$/);
    if (sepMatch) {
      currentPending = {
        word: sepMatch[1].trim(),
        phonetic: '',
        partOfSpeech: 'n.',
        translation: sepMatch[2].trim(),
        example: '',
        exampleTranslation: '',
        rawLine: raw,
        lineNum,
      };
      continue;
    }

    // Space separated fallback: first word is english, rest is translation
    const spaceParts = line.split(/\s+/);
    if (spaceParts.length >= 2) {
      currentPending = {
        word: spaceParts[0].trim(),
        phonetic: '',
        partOfSpeech: 'n.',
        translation: spaceParts.slice(1).join(' ').trim(),
        example: '',
        exampleTranslation: '',
        rawLine: raw,
        lineNum,
      };
      continue;
    }

    errors.push(`第 ${lineNum} 行未能识别: "${raw}"`);
  }

  // Commit last item
  commitPending();

  if (parsedWords.length === 0) {
    return {
      success: false,
      words: [],
      errors: errors.length > 0 ? errors : ['未能从输入文本中解析出有效的单词与中文释义对'],
    };
  }

  return {
    success: true,
    words: parsedWords,
    errors,
  };
}

/**
 * Split CSV line respecting double quotes
 */
function splitCsvLine(line: string, separator: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Strip any phonetic brackets `[...]` or redundant leading POS/synonym markers from an option/translation string
 */
export function sanitizeOptionText(raw: string): string {
  return String(raw || '')
    .replace(/^\[\]\s*/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\(\s*=\s*[^)]*\)/g, '')
    .replace(/\(\s*〈[美英]〉[^)]*\)/g, '')
    .replace(/^\s*\/\s*[a-zA-Z\-\s]+\s*(?:\([^)]*\))?\s*/g, '')
    .replace(/\/\s*policewoman\s*(?:\([^)]*\))?/gi, '')
    .replace(/^\s*\((?:a\.m\.|p\.m\.)\)\s*/i, '')
    .replace(
      /\((?:n|v|vt|vi|adj|adv|prep|conj|pron|det|num|art|interj|abbr|aux\.\s*v|modal\s*v)(?:[\.\/\s]+(?:n|v|vt|vi|adj|adv|prep|conj|pron|det|num|art|interj|abbr|aux\.\s*v|modal\s*v))*\.?\)/gi,
      ''
    )
    .replace(/\(\s*hostess\s+n\.\s*/gi, '(hostess ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean a WordItem entry's word, phonetic, partOfSpeech, translation, and options so no `[]` artifacts remain
 */
export function sanitizeWordItem(w: WordItem): WordItem {
  let word = String(w.word || '').trim();
  let phonetic = String(w.phonetic || '').trim();
  let pos = String(w.partOfSpeech || 'n.').trim();
  let rawTrans = String(w.translation || '').trim();

  if (word.startsWith('be [/biː/]')) {
    word = 'be';
    phonetic = '[/biː/]';
    pos = 'v.';
    rawTrans = '是；成为(原形，其人称和时态形式有 am, is, are, was, were, being, been)';
  } else if (word.startsWith('maths [/mæθs/]')) {
    word = 'maths';
    phonetic = '[/mæθs/]';
    pos = 'n.';
    rawTrans = '(通常作单数用)数学';
  } else if (word.startsWith('mother [/ˈmʌðə(r)/]')) {
    word = 'mother';
    phonetic = '[/ˈmʌðə(r)/]';
    pos = 'n.';
    rawTrans = '母亲';
  } else if (word === 'ought' && pos === 'to') {
    word = 'ought to';
    pos = 'aux. v.';
  } else if (word === 'Britain' && pos === 'U.K.') {
    pos = 'n.';
  } else if (word === 'e-mail' && pos === 'email') {
    pos = 'n./v.';
  } else if (word === 'television' && pos === 'TV') {
    pos = 'n.';
  }

  const phoMatch = rawTrans.match(/\[\/[^\[\]]+\/\]/);
  if (phoMatch && (!phonetic || !phonetic.startsWith('[/'))) {
    phonetic = phoMatch[0];
  }

  const posMatches = [...rawTrans.matchAll(/\(([a-z\.\s\/]+)\)/gi)];
  for (const pm of posMatches) {
    const candidate = pm[1].trim();
    if (
      /^(?:n|v|vt|vi|adj|adv|prep|conj|pron|det|num|art|interj|abbr|aux\.\s*v|modal\s*v)(?:[\.\/\s]+(?:n|v|vt|vi|adj|adv|prep|conj|pron|det|num|art|interj|abbr|aux\.\s*v|modal\s*v))*\.?$/i.test(
        candidate
      )
    ) {
      pos = candidate;
    }
  }

  const cleanTrans = sanitizeOptionText(rawTrans) || rawTrans;
  const cleanOpts = (w.options || [])
    .map((o) => sanitizeOptionText(o))
    .filter(Boolean);

  if (!cleanOpts.includes(cleanTrans)) {
    cleanOpts.unshift(cleanTrans);
  }
  const defaultFallbacks = ['苹果', '希望；愿望', '勇敢的', '探索；发现', '魔法；法术', '坚固的盾牌', '快速奔跑'];
  while (cleanOpts.length < 4) {
    const pick = defaultFallbacks.find((f) => f !== cleanTrans && !cleanOpts.includes(f));
    cleanOpts.push(pick || `选项 ${cleanOpts.length + 1}`);
  }

  return {
    ...w,
    word,
    phonetic,
    partOfSpeech: pos,
    translation: cleanTrans,
    options: Array.from(new Set(cleanOpts)).slice(0, 4),
  };
}

/**
 * Generate 4 multiple choice options with 1 correct and 3 random unique distractors
 */
export function generateOptionsForTranslation(
  correctTranslation: string,
  candidatePool: string[]
): string[] {
  const cleanCorrect = sanitizeOptionText(correctTranslation) || correctTranslation;
  const uniquePool = Array.from(
    new Set(
      candidatePool
        .map((t) => sanitizeOptionText(t))
        .filter((t) => t && t !== cleanCorrect)
    )
  );

  // Shuffle pool to pick 3 distractors
  const shuffled = [...uniquePool].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 3);

  // Fallback defaults if pool is small
  const defaultFallbacks = ['苹果', '希望；愿望', '勇敢的', '探索；发现', '魔法；法术', '坚固的盾牌', '快速奔跑'];
  while (distractors.length < 3) {
    const pick = defaultFallbacks.find((f) => f !== cleanCorrect && !distractors.includes(f));
    distractors.push(pick || `释义 ${distractors.length + 1}`);
  }

  // Combine and shuffle 4 options
  const options = [cleanCorrect, ...distractors.slice(0, 3)];
  return options.sort(() => Math.random() - 0.5);
}

/**
 * Browser download text content as file
 */
export function downloadTextFile(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download file:', err);
  }
}

/**
 * Copy text to clipboard
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Get the unified active wordbook for a profile, preserving all distinct entries
 * (including homographs with the same English spelling but different meanings/POS)
 * and stripping legacy 201 words if a large custom library (>= 1000 words) is present.
 */
export function getUnifiedWordBook(profile: {
  learnedWords?: Record<string, WordItem>;
  deletedWordIds?: string[];
}): WordItem[] {
  const deletedSet = new Set(profile.deletedWordIds || []);
  const learnedEntries = Object.values(profile.learnedWords || {}).filter(
    (w) => w && !deletedSet.has(w.id)
  );

  const customOnly = learnedEntries.filter(
    (w) => w.id.startsWith('custom_') || w.id.startsWith('word_')
  );
  const baseLearned =
    customOnly.length === 1785 ||
    (customOnly.length >= 1000 && learnedEntries.length - customOnly.length <= 210)
      ? customOnly
      : learnedEntries;

  const defaultWords = getAllDefaultWords().filter((w) => !deletedSet.has(w.id));

  // If the profile already holds the full vocabulary (e.g. 1785 words), return baseLearned directly
  // so homographs (same English word, different entry ID / meaning) are never collapsed.
  if (baseLearned.length >= defaultWords.length && baseLearned.length > 0) {
    return baseLearned.map((w) => sanitizeWordItem(w));
  }

  const includeDefaults = !(defaultWords.length <= 210 && baseLearned.length >= 1000);

  const makeCompositeKey = (w: WordItem) =>
    `${String(w.word || '').toLowerCase().trim()}__${String(w.partOfSpeech || '').trim()}__${String(
      w.translation || ''
    ).trim()}`;

  const byKey = new Map<string, WordItem>();

  if (includeDefaults) {
    defaultWords.forEach((w) => {
      const clean = sanitizeWordItem(w);
      byKey.set(makeCompositeKey(clean), clean);
    });
  }

  baseLearned.forEach((w) => {
    const clean = sanitizeWordItem(w);
    byKey.set(makeCompositeKey(clean), clean);
  });

  return Array.from(byKey.values());
}

/**
 * Extract the user's current active vocabulary list from their profile,
 * handling both direct 1785-word combined libraries and 1785-word custom imports.
 */
export function extractTargetVocabularyFromProfile(profile: {
  learnedWords?: Record<string, WordItem>;
  deletedWordIds?: string[];
}): { words: WordItem[]; shouldReplaceLegacyInProfile: boolean } {
  const deletedSet = new Set(profile.deletedWordIds || []);
  const learnedEntries = Object.values(profile.learnedWords || {}).filter(
    (w) => w && !deletedSet.has(w.id)
  );
  const customOnly = learnedEntries.filter(
    (w) => w.id.startsWith('custom_') || w.id.startsWith('word_')
  );

  if (
    customOnly.length === 1785 ||
    (customOnly.length >= 1000 && learnedEntries.length - customOnly.length > 0 && learnedEntries.length - customOnly.length <= 210)
  ) {
    return {
      words: customOnly.map((w) => sanitizeWordItem(w)),
      shouldReplaceLegacyInProfile: true,
    };
  }

  return {
    words: getUnifiedWordBook(profile),
    shouldReplaceLegacyInProfile: false,
  };
}

/**
 * Sync the given vocabulary array into `/src/data/shanghaiWords.ts` on the server
 * so that it becomes the initial built-in vocabulary for GitHub sync and new profiles.
 */
export async function syncVocabularyToSourceFile(
  words: WordItem[],
  force: boolean = false
): Promise<{
  ok: boolean;
  updated?: boolean;
  count?: number;
  words?: WordItem[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/sync-default-words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, force }),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
