import { WordItem, WordMastery } from '../types/game';

export type MasteryState = WordMastery;

/**
 * 单词掌握度核心判定规则 (严格遵循用户需求):
 * 1. 全新：一次都没出现过 (appearedCount === 0)
 * 2. 熟悉：出现过，但还是错 (出现过，但连续答对次数还未达到 5 次，比如答错过或连续答对 < 5)
 * 3. 已掌握：全知全会，连续 5 次出现都答对 (consecutiveCorrect >= 5)
 */
export function getWordMastery(word: Partial<WordItem>): WordMastery {
  const appeared = word.appearedCount ?? ((word.correctCount || 0) + (word.wrongCount || 0));
  if (appeared === 0) {
    return 'new'; // 全新（一次都没出现过）
  }
  if ((word.consecutiveCorrect ?? 0) >= 5) {
    return 'mastered'; // 已掌握（全知全会，连续5次出现都答对）
  }
  return 'familiar'; // 熟悉（出现过，但还是错 / 连对未达5次）
}

export function getMasteryLabel(mastery: WordMastery): string {
  switch (mastery) {
    case 'mastered':
      return '已掌握';
    case 'familiar':
      return '熟悉';
    case 'new':
    default:
      return '全新';
  }
}

export function getMasteryDescription(mastery: WordMastery): string {
  switch (mastery) {
    case 'mastered':
      return '全知全会 · 连续5次答对';
    case 'familiar':
      return '曾出现过 · 需巩固强化';
    case 'new':
    default:
      return '全新词汇 · 未曾出题';
  }
}
export interface MasteryStats {
  total: number;
  mastered: number;
  familiar: number;
  new: number;
}

export function getMasteryStats(
  words: Record<string, Partial<WordItem>> | WordItem[] = {}
): MasteryStats {
  const list = Array.isArray(words) ? words : Object.values(words);
  let mastered = 0;
  let familiar = 0;
  let newWords = 0;

  for (const w of list) {
    const m = getWordMastery(w);
    if (m === 'mastered') mastered++;
    else if (m === 'familiar') familiar++;
    else newWords++;
  }

  return {
    total: list.length,
    mastered,
    familiar,
    new: newWords,
  };
}

export function getMasteryColor(mastery: WordMastery) {
  switch (mastery) {
    case 'mastered':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        badge: 'bg-emerald-500 text-white',
        dot: 'bg-emerald-500',
      };
    case 'familiar':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-500 text-white',
        dot: 'bg-amber-500',
      };
    case 'new':
    default:
      return {
        bg: 'bg-sky-50 dark:bg-sky-950/40',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800',
        badge: 'bg-sky-500 text-white',
        dot: 'bg-sky-500',
      };
  }
}

/**
 * 答题结果对单词状态的更新
 */
export function recordWordAnswer(
  word: WordItem,
  isCorrect: boolean
): WordItem {
  const currentAppeared = word.appearedCount ?? ((word.correctCount || 0) + (word.wrongCount || 0));
  const currentConsecutive = word.consecutiveCorrect ?? 0;

  if (isCorrect) {
    const nextConsecutive = currentConsecutive + 1;
    return {
      ...word,
      appearedCount: currentAppeared + 1,
      correctCount: (word.correctCount || 0) + 1,
      consecutiveCorrect: nextConsecutive,
      mastery: nextConsecutive >= 5 ? 5 : Math.min(4, (word.mastery || 0) + 1),
      inFurnace: nextConsecutive >= 5 ? false : word.inFurnace,
    };
  } else {
    // 答错：连对归零，重回熟悉/生词状态，需要回炉复习
    return {
      ...word,
      appearedCount: currentAppeared + 1,
      wrongCount: (word.wrongCount || 0) + 1,
      consecutiveCorrect: 0,
      mastery: Math.max(1, Math.min(2, word.mastery || 1)),
      inFurnace: true,
    };
  }
}
