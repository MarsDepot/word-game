/**
 * Type definitions for Word Ragnarok Roguelite RPG
 */

export type StatType = 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk';

export interface PlayerStats {
  str: number; // Attack damage, Critical damage multiplier
  agi: number; // Question time extension, Dodge chance
  vit: number; // Max HP, Defense damage reduction
  int: number; // Combo XP/Gold multiplier, Skill charge rate
  dex: number; // Eliminate wrong option chance, Hit accuracy
  luk: number; // Critical hit chance, Rare item/card drop rate
}

export type JobClass = 'novice' | 'swordman' | 'mage' | 'archer' | 'thief' | 'acolyte' | 'merchant';

export interface CardItem {
  id: string;
  name: string;
  monsterName: string;
  monsterType: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  slot: 'weapon' | 'armor' | 'headgear' | 'accessory';
  description: string;
  effect: {
    statBonus?: Partial<PlayerStats>;
    critRateBonus?: number; // e.g. +15%
    damageReducePercent?: number; // e.g. +20%
    extraGoldPercent?: number;
    extraExpPercent?: number;
    healOnCorrect?: number;
    eliminateOptionChance?: number;
    freeSkipCount?: number;
    extraTimeSeconds?: number;
  };
}

export interface Equipment {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'headgear' | 'accessory';
  rarity: 'normal' | 'refined' | 'epic' | 'godly';
  refineLevel: number; // +0 ~ +10
  atkBonus?: number;
  defBonus?: number;
  hpBonus?: number;
  critBonus?: number;
  description: string;
  icon: string;
  slottedCard?: CardItem | null;
}

export interface RoguelitePerk {
  id: string;
  name: string;
  category: 'combat' | 'study' | 'survival' | 'fortune';
  rarity: 'common' | 'rare' | 'epic';
  description: string;
  icon: string;
  effect: {
    extraDamagePercent?: number;
    extraTimePerQuestion?: number;
    eliminateOneWrongOption?: boolean;
    healPercentOnAnswer?: number;
    extraGoldMultiplier?: number;
    extraExpMultiplier?: number;
    critRateFlat?: number;
    freeShieldPerCombat?: number;
    doubleDamageOnStreak?: number; // e.g. every 5 combo
  };
}

export type WordMastery = 'new' | 'familiar' | 'mastered';

export interface WordItem {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  options: string[]; // 4 multiple choice translations
  partOfSpeech: string;
  example: string;
  exampleTranslation: string;
  category: string;
  mastery?: number; // 0: New, 1: Learning, 2: Familiar, 3: Mastered, 4: Expert, 5: Godlike
  wrongCount?: number;
  correctCount?: number;
  consecutiveCorrect?: number; // 连续答对次数 (达到5次即为已掌握)
  appearedCount?: number; // 出现总次数 (0次即为全新)
  inFurnace: boolean; // Needs review in Kafra Furnace
}

export interface Monster {
  id: string;
  name: string;
  title: string;
  isBoss: boolean;
  isElite?: boolean;
  avatar: string; // RO sprite / SVG character design
  color: string;
  maxHp: number;
  atk: number;
  expReward: number;
  zenyReward: number;
  specialSkill?: string;
  dialogue?: string;
  weaknessHint?: string;
}

export interface GameMap {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  minLevel: number;
  wordPackName: string;
  themeColor: string;
  bgGradient: string;
  bgAtmosphere: string;
  monsters: Monster[];
  boss: Monster;
  availableWords: WordItem[];
  unlocked: boolean;
}

export interface PlayerProfile {
  name: string;
  avatar?: string; // Character avatar emoji
  job: JobClass;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  zeny: number; // In-game gold
  refineStones: number; // For equipment refining at blacksmith
  statPoints: number;
  stats: PlayerStats;
  equipment: {
    weapon: Equipment | null;
    armor: Equipment | null;
    headgear: Equipment | null;
    accessory: Equipment | null;
  };
  inventory: Equipment[];
  cards: CardItem[];
  learnedWords: Record<string, WordItem>; // Indexed by id
  furnaceWordIds: string[]; // Words needing review in furnace
  unlockedMapIds: string[];
  defeatedBosses: string[];
  wordsPerBattle?: number; // 每局单词数量 (默认 10)
  selectedMapType?: string; // 选中的地图类型 (solace | qualinesti | sanction | dragon_isles)
}

export interface UserAccount {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  lastPlayedAt: number;
  profile: PlayerProfile;
}

export interface DamagePopup {
  id: string;
  text: string;
  isCrit: boolean;
  isHeal: boolean;
  isMonster: boolean;
  xOffset: number;
}
