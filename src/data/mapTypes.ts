import { WordItem, Monster, GameMap } from '../types/game';
import { getWordMastery } from '../utils/wordMastery';

export type MapTypeId = 'solace' | 'qualinesti' | 'sanction' | 'dragon_isles';

export interface MapTypeDefinition {
  id: MapTypeId;
  index: number;
  name: string;
  englishName: string;
  themeColor: string;
  bgGradient: string;
  bgAtmosphere: string;
  icon: string;
  titleBadge: string;
  description: string;
  ratioDescription: string;
  targetRatio: {
    mastered: number; // e.g. 0.10
    familiar: number; // e.g. 0.20
    new: number;      // e.g. 0.70
  };
  monsters: Monster[];
  boss: Monster;
}

export const MAP_TYPE_DEFINITIONS: MapTypeDefinition[] = [
  {
    id: 'solace',
    index: 1,
    name: '索拉斯 (Solace)',
    englishName: 'Solace Canopy City',
    themeColor: '#059669', // Emerald
    bgGradient: 'from-emerald-50 via-teal-50/60 to-emerald-100/50 dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-950',
    bgAtmosphere: '温和的晨光洒在巨木树冠与苔藓石阶上，树影斑驳，微风惬意',
    icon: '🌳',
    titleBadge: '标准进阶 · 温故知新',
    description: '建于巨大维伦巨木之上的树冠之城。10%已掌握 + 20%熟悉 + 70%全新。初次探索或熟词不足时自动以全新词铺路！',
    ratioDescription: '10%已掌握 · 20%熟悉 · 70%全新',
    targetRatio: {
      mastered: 0.10,
      familiar: 0.20,
      new: 0.70,
    },
    monsters: [
      {
        id: 'm_solace_poring',
        name: '树冠波利 (Canopy Poring)',
        title: '林地采摘小萌物',
        isBoss: false,
        avatar: '🍎',
        color: '#10b981',
        maxHp: 75,
        atk: 8,
        expReward: 25,
        zenyReward: 35,
        dialogue: '噗呦~ 欢迎来到索拉斯巨木城！今天也要温故知新哦！',
      },
      {
        id: 'm_solace_rabbit',
        name: '翡翠蹦兔 (Emerald Hare)',
        title: '林间敏捷精灵',
        isBoss: false,
        avatar: '🐰',
        color: '#34d399',
        maxHp: 110,
        atk: 12,
        expReward: 38,
        zenyReward: 50,
        dialogue: '咕唧！连续答对5次才能彻底掌握单词哦，加油！',
      },
      {
        id: 'm_solace_rocker',
        name: '吟游蝗虫 (Canopy Bard)',
        title: '持琴漫步者',
        isBoss: false,
        avatar: '🦗',
        color: '#6ee7b7',
        maxHp: 150,
        atk: 16,
        expReward: 55,
        zenyReward: 70,
        dialogue: '听我为你弹奏一曲索拉斯风之歌！',
      },
    ],
    boss: {
      id: 'boss_solace_angel',
      name: '巨木圣使·光翼天使 (Angeling of Solace)',
      title: '索拉斯天空回廊的守护者',
      isBoss: true,
      avatar: '👼',
      color: '#fbbf24',
      maxHp: 420,
      atk: 22,
      expReward: 240,
      zenyReward: 360,
      specialSkill: '【圣树甘霖】：光芒笼罩，考验答题熟练度！',
      dialogue: '冒险者，展示你在索拉斯学习的单词成果吧！',
      weaknessHint: '保持连击Combo，暴击将破除圣树护盾！',
    },
  },
  {
    id: 'qualinesti',
    index: 2,
    name: '奎灵那斯提 (Qualinesti)',
    englishName: 'Qualinesti Elven Haven',
    themeColor: '#0284c7', // Sky Blue
    bgGradient: 'from-sky-50 via-cyan-50/60 to-blue-100/50 dark:from-slate-900 dark:via-sky-950/40 dark:to-slate-950',
    bgAtmosphere: '幽深神秘的精灵古林，纯净的清泉与未曾涉足的远古碑文',
    icon: '🏹',
    titleBadge: '纯粹新知 · 崭新开拓',
    description: '精灵王国的远古秘林。100%全抽取未曾出现过的全新单词，适合快速开拓新词汇边疆！',
    ratioDescription: '100% 全新词汇',
    targetRatio: {
      mastered: 0.0,
      familiar: 0.0,
      new: 1.0,
    },
    monsters: [
      {
        id: 'm_quali_fairy',
        name: '迷踪妖精 (Pixie Sprite)',
        title: '幽林幻彩精灵',
        isBoss: false,
        avatar: '🧚',
        color: '#38bdf8',
        maxHp: 90,
        atk: 10,
        expReward: 30,
        zenyReward: 40,
        dialogue: '这里全都是你未曾见过的全新单词，能一次认出我吗？',
      },
      {
        id: 'm_quali_butterfly',
        name: '荧光幻蝶 (Starlight Moth)',
        title: '夜光指引者',
        isBoss: false,
        avatar: '🦋',
        color: '#818cf8',
        maxHp: 130,
        atk: 14,
        expReward: 45,
        zenyReward: 60,
        dialogue: '扑闪扑闪~ 记录每一个陌生词汇，开启精灵之语！',
      },
      {
        id: 'm_quali_ent',
        name: '古树守护者 (Ancient Treant)',
        title: '万年古树之灵',
        isBoss: false,
        avatar: '🌲',
        color: '#22c55e',
        maxHp: 170,
        atk: 18,
        expReward: 65,
        zenyReward: 80,
        dialogue: '扎根深林，新知识犹如甘露浇灌智慧之树！',
      },
    ],
    boss: {
      id: 'boss_quali_stag',
      name: '奎灵幻鹿·赛兰迪尔 (Celestial White Stag)',
      title: '精灵古林的精神图腾',
      isBoss: true,
      avatar: '🦌',
      color: '#38bdf8',
      maxHp: 480,
      atk: 25,
      expReward: 280,
      zenyReward: 420,
      specialSkill: '【幻林迷雾】：选项扰乱，专注于新词释义！',
      dialogue: '凡人，踏入奎灵那斯提者，唯有敏锐专注者方能通过考炼！',
      weaknessHint: '仔细听读音，音标发音是指引迷雾的灯塔！',
    },
  },
  {
    id: 'sanction',
    index: 3,
    name: '圣克仙城 (Sanction)',
    englishName: 'Sanction Molten Fortress',
    themeColor: '#e11d48', // Rose / Molten Red
    bgGradient: 'from-rose-50 via-amber-50/60 to-red-100/50 dark:from-slate-900 dark:via-rose-950/40 dark:to-slate-950',
    bgAtmosphere: '火山脚下的坚固石城，熔炉的烈焰热浪与铁砧重击的轰鸣声',
    icon: '🌋',
    titleBadge: '错题熔炉 · 强化巩固',
    description: '熔岩与石堡之都，针对曾有错漏或记忆不牢的单词进行重点回炉淬炼。30%已掌握 + 70%熟悉！',
    ratioDescription: '30%已掌握 · 70%熟悉',
    targetRatio: {
      mastered: 0.30,
      familiar: 0.70,
      new: 0.0,
    },
    monsters: [
      {
        id: 'm_sanction_salamander',
        name: '熔火火蜥 (Lava Salamander)',
        title: '地火攀爬者',
        isBoss: false,
        avatar: '🦎',
        color: '#f97316',
        maxHp: 110,
        atk: 14,
        expReward: 40,
        zenyReward: 50,
        dialogue: '嘶嘶~ 那些曾经错过的单词，这次可别再犹豫了！',
      },
      {
        id: 'm_sanction_bat',
        name: '岩浆红蝠 (Fire Bat)',
        title: '暗穴炽翼',
        isBoss: false,
        avatar: '🦇',
        color: '#ef4444',
        maxHp: 140,
        atk: 17,
        expReward: 55,
        zenyReward: 70,
        dialogue: '吱吱！把熟词牢牢焊死在记忆深处！',
      },
      {
        id: 'm_sanction_golem',
        name: '铁砧重铠卫 (Iron Fortress Guard)',
        title: '黑铁城门军',
        isBoss: false,
        avatar: '🛡️',
        color: '#64748b',
        maxHp: 190,
        atk: 20,
        expReward: 75,
        zenyReward: 95,
        dialogue: '千锤百炼，方成神兵！错词在此彻底粉碎重铸！',
      },
    ],
    boss: {
      id: 'boss_sanction_ifrit',
      name: '熔火领主·伊芙利特 (Ifrit of Sanction)',
      title: '圣克仙城地心深渊霸主',
      isBoss: true,
      avatar: '👹',
      color: '#dc2626',
      maxHp: 560,
      atk: 30,
      expReward: 350,
      zenyReward: 500,
      specialSkill: '【地狱烈焰】：熔炉高温，答题失误将承受双倍反震！',
      dialogue: '在烈火中重生的记忆才最为牢固！让我看看你的巩固成果！',
      weaknessHint: '利用防具防御力抵消熔火反震，准确答题直接造成巨额破防伤害！',
    },
  },
  {
    id: 'dragon_isles',
    index: 4,
    name: '巨龙列岛 (Dragon Isles)',
    englishName: 'Dragon Isles Tempest',
    themeColor: '#7c3aed', // Purple
    bgGradient: 'from-purple-50 via-indigo-50/60 to-violet-100/50 dark:from-slate-900 dark:via-purple-950/40 dark:to-slate-950',
    bgAtmosphere: '怒海滔天，紫电雷鸣，云层深处隐约传来远古巨龙的低沉咆哮',
    icon: '🐲',
    titleBadge: '随机试炼 · 巨龙惊险',
    description: '惊涛与雷暴环绕的巨龙之巢。掌握、熟悉与全新单词按完全随机比例混合出击，不可预测的冒险挑战！',
    ratioDescription: '全库随机比例组合',
    targetRatio: {
      mastered: 0.33,
      familiar: 0.33,
      new: 0.34,
    },
    monsters: [
      {
        id: 'm_dragon_whelp',
        name: '紫电幼龙 (Thunder Whelp)',
        title: '雷霆翱翔者',
        isBoss: false,
        avatar: '🐲',
        color: '#a855f7',
        maxHp: 120,
        atk: 15,
        expReward: 45,
        zenyReward: 60,
        dialogue: '吼！下一题会是新词还是老朋友？谁也猜不到！',
      },
      {
        id: 'm_dragon_seabird',
        name: '暴风海鸟 (Storm Gull)',
        title: '洋流斥候',
        isBoss: false,
        avatar: '🦅',
        color: '#6366f1',
        maxHp: 160,
        atk: 19,
        expReward: 65,
        zenyReward: 85,
        dialogue: '狂风撕扯着题目，保持冷静，随机应变！',
      },
      {
        id: 'm_dragon_wyvern',
        name: '双足飞龙 (Black Wyvern)',
        title: '列岛巡逻铁翼',
        isBoss: false,
        avatar: '🐉',
        color: '#4f46e5',
        maxHp: 210,
        atk: 24,
        expReward: 90,
        zenyReward: 120,
        dialogue: '巨龙列岛只接纳真正的冒险大师！',
      },
    ],
    boss: {
      id: 'boss_dragon_lord',
      name: '黑龙王·耐萨里奥 (Black Dragon Sovereign)',
      title: '巨龙列岛群岛主宰',
      isBoss: true,
      avatar: '🐉',
      color: '#7e22ce',
      maxHp: 640,
      atk: 34,
      expReward: 420,
      zenyReward: 600,
      specialSkill: '【龙息风暴】：随机比例词汇风暴降临！',
      dialogue: '凡人，你竟敢挑战巨龙的权能？展现你毫无死角的词汇底蕴吧！',
      weaknessHint: '保持高Combo连击，暴击可打断龙息准备！',
    },
  },
];

/**
 * Shuffle array in-place using Fisher-Yates
 */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 核心算法：根据地图类型与每局题目数量，从用户全本词库中智能抽取对应比例的单词列表
 */
export function selectWordsForBattle(
  wordBook: Record<string, WordItem> | WordItem[],
  mapTypeId: MapTypeId,
  targetCount: number = 10
): { words: WordItem[]; stats: { mastered: number; familiar: number; new: number } } {
  const allWords = Array.isArray(wordBook) ? wordBook : Object.values(wordBook);

  if (allWords.length === 0) {
    return { words: [], stats: { mastered: 0, familiar: 0, new: 0 } };
  }

  // 1. 按用户实际掌握度将单词分为三大池
  const masteredPool: WordItem[] = [];
  const familiarPool: WordItem[] = [];
  const newPool: WordItem[] = [];

  allWords.forEach((w) => {
    const m = getWordMastery(w);
    if (m === 'mastered') masteredPool.push(w);
    else if (m === 'familiar') familiarPool.push(w);
    else newPool.push(w);
  });

  const shuffledMastered = shuffleArray(masteredPool);
  const shuffledFamiliar = shuffleArray(familiarPool);
  const shuffledNew = shuffleArray(newPool);

  const safeTargetCount = Math.max(1, Math.min(targetCount, allWords.length));
  const selected: WordItem[] = [];

  const takeFrom = (pool: WordItem[], num: number): WordItem[] => {
    return pool.splice(0, num);
  };

  if (mapTypeId === 'qualinesti') {
    // map2 奎灵那斯提：100%全新
    const fromNew = takeFrom(shuffledNew, safeTargetCount);
    selected.push(...fromNew);

    // 若全新词不足，依次从熟悉、已掌握词补充
    if (selected.length < safeTargetCount) {
      const needed = safeTargetCount - selected.length;
      selected.push(...takeFrom(shuffledFamiliar, needed));
    }
    if (selected.length < safeTargetCount) {
      const needed = safeTargetCount - selected.length;
      selected.push(...takeFrom(shuffledMastered, needed));
    }
  } else if (mapTypeId === 'sanction') {
    // map2 圣克仙城：30%已掌握，70%熟悉
    const targetM = Math.round(safeTargetCount * 0.3);
    const targetF = safeTargetCount - targetM;

    const fromM = takeFrom(shuffledMastered, targetM);
    const fromF = takeFrom(shuffledFamiliar, targetF);
    selected.push(...fromM, ...fromF);

    // 缺额回退补齐
    if (selected.length < safeTargetCount) {
      const needed = safeTargetCount - selected.length;
      selected.push(...takeFrom(shuffledFamiliar, needed));
    }
    if (selected.length < safeTargetCount) {
      const needed = safeTargetCount - selected.length;
      selected.push(...takeFrom(shuffledMastered, needed));
    }
    if (selected.length < safeTargetCount) {
      const needed = safeTargetCount - selected.length;
      selected.push(...takeFrom(shuffledNew, needed));
    }
  } else if (mapTypeId === 'dragon_isles') {
    // map2 巨龙列岛：随机比例
    // 随机分配权重或全随机抽取
    const allShuffled = shuffleArray(allWords);
    selected.push(...allShuffled.slice(0, safeTargetCount));
  } else {
    // map1 索拉斯：10%已掌握，20%熟悉，70%全新（第一次使用时，100%全新）
    // 计算理论配比
    let targetM = Math.round(safeTargetCount * 0.1);
    let targetF = Math.round(safeTargetCount * 0.2);
    let targetN = safeTargetCount - targetM - targetF;

    // 第一次使用时 (或已掌握和熟悉库均为空时)，自动 100% 全新
    const hasHistory = masteredPool.length > 0 || familiarPool.length > 0;
    if (!hasHistory) {
      targetM = 0;
      targetF = 0;
      targetN = safeTargetCount;
    }

    const fromM = takeFrom(shuffledMastered, targetM);
    const fromF = takeFrom(shuffledFamiliar, targetF);
    const fromN = takeFrom(shuffledNew, targetN);
    selected.push(...fromM, ...fromF, ...fromN);

    // 若已掌握或熟悉词数量不足需求，优先用全新词补齐 (保证第一次或前期使用时顺畅平滑)
    if (selected.length < safeTargetCount) {
      const needed = safeTargetCount - selected.length;
      selected.push(...takeFrom(shuffledNew, needed));
    }
    // 若全新词也耗尽，则用剩余词库全量补齐
    if (selected.length < safeTargetCount) {
      const needed = safeTargetCount - selected.length;
      selected.push(...takeFrom(shuffledFamiliar, needed));
    }
    if (selected.length < safeTargetCount) {
      const needed = safeTargetCount - selected.length;
      selected.push(...takeFrom(shuffledMastered, needed));
    }
  }

  // 统计本次出战题目中三类词的实际占比
  const stats = { mastered: 0, familiar: 0, new: 0 };
  selected.forEach((w) => {
    const m = getWordMastery(w);
    if (m === 'mastered') stats.mastered++;
    else if (m === 'familiar') stats.familiar++;
    else stats.new++;
  });

  return {
    words: shuffleArray(selected),
    stats,
  };
}

/**
 * 将 MapTypeDefinition 和选出的单词结合，生成当前局所需的动态 GameMap 结构
 */
export function buildDynamicGameMap(
  def: MapTypeDefinition,
  selectedWords: WordItem[]
): GameMap {
  return {
    id: `map_${def.id}`,
    name: def.name,
    subtitle: def.ratioDescription,
    description: def.description,
    minLevel: 1,
    wordPackName: def.ratioDescription,
    themeColor: def.themeColor,
    bgGradient: def.bgGradient,
    bgAtmosphere: def.bgAtmosphere,
    monsters: def.monsters,
    boss: def.boss,
    availableWords: selectedWords,
    unlocked: true,
  };
}
