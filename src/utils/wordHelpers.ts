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
 * Generate 4 multiple choice options with 1 correct and 3 random unique distractors
 */
export function generateOptionsForTranslation(
  correctTranslation: string,
  candidatePool: string[]
): string[] {
  const uniquePool = Array.from(new Set(candidatePool.filter((t) => t && t !== correctTranslation)));

  // Shuffle pool to pick 3 distractors
  const shuffled = [...uniquePool].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 3);

  // Fallback defaults if pool is small
  const defaultFallbacks = ['苹果', '希望；愿望', '勇敢的', '探索；发现', '魔法；法术', '坚固的盾牌', '快速奔跑'];
  while (distractors.length < 3) {
    const pick = defaultFallbacks.find((f) => f !== correctTranslation && !distractors.includes(f));
    distractors.push(pick || `释义 ${distractors.length + 1}`);
  }

  // Combine and shuffle 4 options
  const options = [correctTranslation, ...distractors.slice(0, 3)];
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
