/**
 * Utility functions for Word Import, Export, Text Parsing and Distractor generation
 */
import { WordItem } from '../types/game';
import { GAME_MAPS } from '../data/words';

export type ExportFormat = 'standard' | 'simple' | 'csv' | 'json';

// Get fallback pool of all default words across all maps
export function getAllDefaultWords(): WordItem[] {
  return GAME_MAPS.flatMap((m) => m.availableWords);
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
      // Human-readable standard notebook format
      return words
        .map((w, index) => {
          const lines = [
            `${index + 1}. ${w.word} ${w.phonetic ? `[${w.phonetic}]` : ''} ${w.partOfSpeech ? `(${w.partOfSpeech})` : ''} ${w.translation}`,
          ];
          if (w.example) {
            lines.push(`   例句: ${w.example}`);
          }
          if (w.exampleTranslation) {
            lines.push(`   译文: ${w.exampleTranslation}`);
          }
          return lines.join('\n');
        })
        .join('\n\n');
    }
  }
}

/**
 * Parse plain text string into WordItem[]
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
            category: item.category || '导入词汇',
            mastery: typeof item.mastery === 'number' ? item.mastery : 0,
            wrongCount: item.wrongCount || 0,
            correctCount: item.correctCount || 0,
            inFurnace: !!item.inFurnace,
          };
        });

        return { success: true, words: validWords, errors: [] };
      }
    } catch {
      // fallback to line-by-line parser
    }
  }

  // 2. Line by line parsing for CSV, Tab-separated, or Space/Hyphen separated
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  const parsedWords: WordItem[] = [];
  const errors: string[] = [];

  // Check if first line is CSV header
  let startIndex = 0;
  if (lines[0].toLowerCase().includes('单词') || lines[0].toLowerCase().includes('word') || lines[0].toLowerCase().includes('translation')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    // Remove leading numbering like "1. ", "12) ", "1、"
    const line = rawLine.replace(/^\d+[\.\、\)\s]+/, '').trim();
    if (!line) continue;

    let word = '';
    let phonetic = '';
    let pos = 'n.';
    let translation = '';
    let example = '';
    let exampleTranslation = '';

    // Strategy A: Check CSV format (quoted or comma separated)
    if (line.includes(',') || line.includes('\t')) {
      const separator = line.includes('\t') ? '\t' : ',';
      const parts = splitCsvLine(line, separator);

      if (parts.length >= 2) {
        word = parts[0].trim();
        if (parts.length >= 4) {
          phonetic = parts[1].trim();
          pos = parts[2].trim() || 'n.';
          translation = parts[3].trim();
          example = parts[4]?.trim() || '';
          exampleTranslation = parts[5]?.trim() || '';
        } else if (parts.length === 3) {
          // Could be word, phonetic/pos, translation OR word, translation, example
          if (parts[1].startsWith('/') || parts[1].startsWith('[') || parts[1].includes('.')) {
            phonetic = parts[1].trim();
            translation = parts[2].trim();
          } else {
            translation = parts[1].trim();
            example = parts[2].trim();
          }
        } else {
          translation = parts[1].trim();
        }
      }
    }

    // Strategy B: Regex extraction for standard formats
    if (!word || !translation) {
      // Regex 1: word [/phonetic/] (pos.) translation
      // Example: apple /'æpl/ n. 苹果  or  banana [bə'nɑ:nə] n. 香蕉
      const regex1 = /^([a-zA-Z\-\s']+?)\s+(?:[\/\[]([^\/\]]+)[\/\]]\s+)?(?:([a-z]+\.?)\s+)?(.+)$/;
      const match1 = line.match(regex1);

      if (match1) {
        word = match1[1].trim();
        phonetic = match1[2] ? `/${match1[2].trim()}/` : '';
        pos = match1[3] ? match1[3].trim() : 'n.';
        translation = match1[4].trim();

        // Check if translation contains example separated by dash or semicolon
        if (translation.includes(' - ') || translation.includes(' —— ') || translation.includes(' 例:')) {
          const transParts = translation.split(/(?:\s+-\s+|\s+——\s+|\s+例:)/);
          translation = transParts[0].trim();
          example = transParts[1]?.trim() || '';
        }
      } else {
        // Strategy C: Split by first space, colon, or hyphen
        // Example: "apple 苹果" or "apple: 苹果" or "apple - 苹果"
        const separatorMatch = line.match(/^([a-zA-Z\-\s']+?)\s*[:：\-—=]\s*(.+)$/);
        if (separatorMatch) {
          word = separatorMatch[1].trim();
          translation = separatorMatch[2].trim();
        } else {
          // Space separated fallback: first word is english, rest is translation
          const spaceParts = line.split(/\s+/);
          if (spaceParts.length >= 2) {
            word = spaceParts[0].trim();
            translation = spaceParts.slice(1).join(' ').trim();
          }
        }
      }
    }

    // Clean extracted values
    word = word.replace(/^["']|["']$/g, '').trim();
    translation = translation.replace(/^["']|["']$/g, '').trim();

    // Validate English word
    if (word && translation) {
      if (!phonetic) {
        phonetic = `/${word.toLowerCase()}/`;
      }
      if (!example) {
        example = `I love ${word}.`;
        exampleTranslation = `我喜欢${translation.split(/[，,；;]/)[0]}。`;
      }

      const id = `custom_${word.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${i}_${Date.now()}`;
      const options = generateOptionsForTranslation(translation, fallbackTranslations);

      parsedWords.push({
        id,
        word,
        phonetic,
        translation,
        options,
        partOfSpeech: pos || 'n.',
        example,
        exampleTranslation,
        category: '自定义导入',
        mastery: 0,
        wrongCount: 0,
        correctCount: 0,
        inFurnace: false,
      });
    } else {
      errors.push(`第 ${i + 1} 行解析失败: "${rawLine}"`);
    }
  }

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
