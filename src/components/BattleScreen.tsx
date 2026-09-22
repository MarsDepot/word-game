import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Volume2, Zap, Shield, Flame, Award, ArrowRight, RefreshCw, Eye, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameMap, Monster, WordItem, PlayerProfile, DamagePopup, RoguelitePerk, CardItem, Equipment } from '../types/game';
import { ROGUELITE_PERKS, ALL_RO_CARDS } from '../data/words';
import { MonsterAvatar } from './MonsterAvatar';
import { soundManager } from '../audio/soundManager';
import { getWordMastery, getMasteryLabel, getMasteryColor, recordWordAnswer } from '../utils/wordMastery';

interface BattleScreenProps {
  map: GameMap;
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onExitBattle: () => void;
  onOpenFurnace: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  map,
  profile,
  onUpdateProfile,
  onExitBattle,
  onOpenFurnace,
}) => {
  // Wave state: 0, 1 -> normal monsters; 2 -> BOSS!
  const [waveIndex, setWaveIndex] = useState(0);
  const totalWaves = 3; // Wave 1, Wave 2, Boss Wave
  const isBossWave = waveIndex === totalWaves - 1;

  // Active perks chosen during this roguelite run
  const [activePerks, setActivePerks] = useState<RoguelitePerk[]>([]);
  const [showPerkSelect, setShowPerkSelect] = useState(false);
  const [perkChoices, setPerkChoices] = useState<RoguelitePerk[]>([]);

  // Combat entities
  const [currentMonster, setCurrentMonster] = useState<Monster>(map.monsters[0]);
  const [monsterHp, setMonsterHp] = useState<number>(map.monsters[0].maxHp);
  const [playerHp, setPlayerHp] = useState<number>(profile.hp);
  const [hasShield, setHasShield] = useState<boolean>(true);

  // Question & Word state
  const [wordPoolIndex, setWordPoolIndex] = useState<number>(0);
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [correctAnswerText, setCorrectAnswerText] = useState<string>('');
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [revealedHint, setRevealedHint] = useState<boolean>(false);

  // Stats in combat
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [earnedZeny, setEarnedZeny] = useState<number>(0);
  const [earnedExp, setEarnedExp] = useState<number>(0);

  // FX animations
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [isMonsterHit, setIsMonsterHit] = useState(false);
  const [isSlashFx, setIsSlashFx] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Result dialogs
  const [battleFinished, setBattleFinished] = useState<'victory' | 'defeat' | null>(null);
  const [droppedItem, setDroppedItem] = useState<Equipment | null>(null);
  const [droppedCard, setDroppedCard] = useState<CardItem | null>(null);

  // Timer countdown
  const baseTime = 10; // 10s base
  // AGI adds +0.35s per point, plus perks
  const perkExtraTime = activePerks.reduce((acc, p) => acc + (p.effect.extraTimePerQuestion || 0), 0);
  const cardExtraTime = profile.equipment.headgear?.slottedCard?.effect.extraTimeSeconds || 0;
  const maxQuestionTime = baseTime + profile.stats.agi * 0.4 + perkExtraTime + cardExtraTime;
  const [timeLeft, setTimeLeft] = useState<number>(maxQuestionTime);
  const timerRef = useRef<number | null>(null);

  // Initialize and switch music on wave load
  useEffect(() => {
    if (isBossWave) {
      soundManager.playBGM('boss');
    } else {
      soundManager.playBGM('town');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBossWave]);

  // Spawn monster for current wave
  useEffect(() => {
    if (isBossWave) {
      setCurrentMonster(map.boss);
      setMonsterHp(map.boss.maxHp);
    } else {
      const regularMonsters = map.monsters;
      const selected = regularMonsters[waveIndex % regularMonsters.length] || regularMonsters[0];
      setCurrentMonster(selected);
      setMonsterHp(selected.maxHp);
    }
    loadNextWord();
  }, [waveIndex]);

  // Timer effect
  useEffect(() => {
    if (isAnswered || battleFinished || showPerkSelect) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleTimeout();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAnswered, battleFinished, showPerkSelect]);

  // Load next word
  const loadNextWord = () => {
    const words = map.availableWords;
    if (!words || words.length === 0) return;
    const baseWord = words[wordPoolIndex % words.length];
    setWordPoolIndex((prev) => prev + 1);
    const randWord = profile.learnedWords[baseWord.id] || baseWord;
    setCurrentWord(randWord);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrectAnswer(null);
    setRevealedHint(false);
    setTimeLeft(maxQuestionTime);

    // Auto-pronounce word for immersive learning!
    soundManager.speakWord(randWord.word);

    // 1. Identify designated correct answer (supports translation matching or standard first-option definition)
    const rawOptions = randWord.options && randWord.options.length > 0
      ? [...randWord.options]
      : [randWord.translation, '错误干扰项A', '错误干扰项B', '错误干扰项C'];

    let correct = randWord.translation;
    if (rawOptions.includes(randWord.translation)) {
      correct = randWord.translation;
    } else {
      correct = rawOptions[0];
    }
    setCorrectAnswerText(correct);

    // 2. Fisher-Yates Random Shuffle so correct answer appears uniformly in random positions (A/B/C/D)
    const randomized = [...rawOptions];
    for (let i = randomized.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
    }
    setShuffledOptions(randomized);

    // Apply DEX chance to eliminate wrong options
    const eliminated: string[] = [];
    const dexChance = profile.stats.dex * 0.08 + (activePerks.some((p) => p.effect.eliminateOneWrongOption) ? 0.7 : 0);
    if (Math.random() < dexChance && randomized.length > 2) {
      const wrongOptions = randomized.filter(
        (o) => o !== correct && o !== randWord.translation && (randWord.options ? o !== randWord.options[0] : true)
      );
      if (wrongOptions.length > 0) {
        const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        eliminated.push(randomWrong);
      }
    }
    setEliminatedOptions(eliminated);
  };

  // Add floating damage popup
  const addDamagePopup = (text: string, isCrit: boolean, isHeal: boolean, isMonster: boolean) => {
    const id = Math.random().toString();
    const xOffset = Math.floor(Math.random() * 60) - 30;
    setDamagePopups((prev) => [...prev, { id, text, isCrit, isHeal, isMonster, xOffset }]);
    setTimeout(() => {
      setDamagePopups((prev) => prev.filter((p) => p.id !== id));
    }, 1100);
  };

  // Handle player answer submission
  const handleSelectOption = (option: string) => {
    if (isAnswered || battleFinished || showPerkSelect || !currentWord) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswered(true);
    setSelectedOption(option);

    // Robust multi-check to ensure clicking correct answer is 100% evaluated as correct
    const isCorrect =
      option === correctAnswerText ||
      option === currentWord.translation ||
      (currentWord.options && currentWord.options.length > 0 && option === currentWord.options[0]);
    setIsCorrectAnswer(isCorrect);

    if (isCorrect) {
      handleAnswerCorrect();
    } else {
      handleAnswerWrong();
    }
  };

  const handleTimeout = () => {
    if (isAnswered || battleFinished || !currentWord) return;
    setIsAnswered(true);
    setIsCorrectAnswer(false);
    handleAnswerWrong(true);
  };

  // Player answered correctly
  const handleAnswerCorrect = () => {
    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);

    // Calculate Damage
    const baseAtk = 25 + profile.stats.str * 4 + (profile.equipment.weapon?.atkBonus || 0);
    const perkExtraDamage = activePerks.reduce((acc, p) => acc + (p.effect.extraDamagePercent || 0), 0);
    const comboBonusMultiplier = 1 + Math.min(newCombo * 0.08, 1.2);

    // Critical Hit Calculation (LUK + Equipment + Perks)
    const perkCrit = activePerks.reduce((acc, p) => acc + (p.effect.critRateFlat || 0), 0);
    const critRate = profile.stats.luk * 0.02 + (profile.equipment.weapon?.critBonus || 0) * 0.01 + perkCrit * 0.01;
    const isCrit = Math.random() < critRate || newCombo % 5 === 0;

    let finalDamage = Math.floor(baseAtk * (1 + perkExtraDamage / 100) * comboBonusMultiplier);
    if (isCrit) {
      const critMultiplier = 1.6 + profile.stats.str * 0.04;
      finalDamage = Math.floor(finalDamage * critMultiplier);
      soundManager.playCritical();
    } else {
      soundManager.playCorrect();
    }

    // Trigger visual hit & slash
    setIsMonsterHit(true);
    setIsSlashFx(true);
    setTimeout(() => {
      setIsMonsterHit(false);
      setIsSlashFx(false);
    }, 450);

    addDamagePopup(isCrit ? `CRITICAL! -${finalDamage}` : `-${finalDamage}`, isCrit, false, true);

    // Heal on answer if perk or card active
    const healPercent = activePerks.reduce((acc, p) => acc + (p.effect.healPercentOnAnswer || 0), 0) +
      (profile.equipment.armor?.slottedCard?.effect.healOnCorrect || 0);
    if (healPercent > 0) {
      const healAmount = Math.max(5, Math.floor(profile.maxHp * (healPercent / 100)));
      setPlayerHp((prev) => Math.min(profile.maxHp, prev + healAmount));
      addDamagePopup(`+${healAmount} HP`, false, true, false);
    }

    // Update word mastery in profile
    if (currentWord) {
      onUpdateProfile((prev) => {
        const existing = prev.learnedWords[currentWord.id] || { ...currentWord };
        const updated = recordWordAnswer(existing, true);
        const furnaceIds = updated.inFurnace
          ? (prev.furnaceWordIds.includes(currentWord.id) ? prev.furnaceWordIds : [...prev.furnaceWordIds, currentWord.id])
          : prev.furnaceWordIds.filter((id) => id !== currentWord.id);
        return {
          ...prev,
          furnaceWordIds: furnaceIds,
          learnedWords: {
            ...prev.learnedWords,
            [currentWord.id]: updated,
          },
        };
      });
    }

    // Apply monster damage
    const newMonsterHp = Math.max(0, monsterHp - finalDamage);
    setMonsterHp(newMonsterHp);

    if (newMonsterHp <= 0) {
      // Monster Defeated!
      handleMonsterDefeated();
    } else {
      // Move to next word after brief reading delay
      setTimeout(() => {
        loadNextWord();
      }, 1200);
    }
  };

  // Player answered wrong or timed out
  const handleAnswerWrong = (isTimeout: boolean = false) => {
    setCombo(0);
    soundManager.playWrong();
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);

    // Word marked for review in Kafra Furnace
    if (currentWord) {
      onUpdateProfile((prev) => {
        const existing = prev.learnedWords[currentWord.id] || { ...currentWord };
        const updated = recordWordAnswer(existing, false);
        const furnaceIds = prev.furnaceWordIds.includes(currentWord.id)
          ? prev.furnaceWordIds
          : [...prev.furnaceWordIds, currentWord.id];
        return {
          ...prev,
          furnaceWordIds: furnaceIds,
          learnedWords: {
            ...prev.learnedWords,
            [currentWord.id]: updated,
          },
        };
      });
    }

    // Check Shield
    if (hasShield && activePerks.some((p) => p.effect.freeShieldPerCombat)) {
      setHasShield(false);
      addDamagePopup('🛡️ 护盾吸收伤害！', false, false, false);
    } else {
      // Monster attacks player
      const baseMonsterAtk = currentMonster.atk;
      const defReduce = Math.min(0.6, profile.stats.vit * 0.02 + (profile.equipment.armor?.defBonus || 0) * 0.01);
      const perkCardReduce = (profile.equipment.armor?.slottedCard?.effect.damageReducePercent || 0) / 100;
      const actualDmg = Math.max(5, Math.floor(baseMonsterAtk * (1 - defReduce) * (1 - perkCardReduce)));

      const nextPlayerHp = Math.max(0, playerHp - actualDmg);
      setPlayerHp(nextPlayerHp);
      addDamagePopup(`-${actualDmg}`, false, false, false);

      if (nextPlayerHp <= 0) {
        // Player defeated
        setTimeout(() => {
          setBattleFinished('defeat');
        }, 1000);
        return;
      }
    }

    // After review delay, next word
    setTimeout(() => {
      loadNextWord();
    }, 1800);
  };

  // Monster Defeated handler
  const handleMonsterDefeated = () => {
    soundManager.playCoin();

    // Rewards calculation
    const goldMultiplier = activePerks.reduce((acc, p) => acc * (p.effect.extraGoldMultiplier || 1), 1) *
      (1 + (profile.equipment.accessory?.slottedCard?.effect.extraGoldPercent || 0) / 100);
    const expMultiplier = activePerks.reduce((acc, p) => acc * (p.effect.extraExpMultiplier || 1), 1) *
      (1 + (profile.equipment.headgear?.slottedCard?.effect.extraExpPercent || 0) / 100);

    const gainZeny = Math.floor(currentMonster.zenyReward * goldMultiplier);
    const gainExp = Math.floor(currentMonster.expReward * expMultiplier);

    setEarnedZeny((prev) => prev + gainZeny);
    setEarnedExp((prev) => prev + gainExp);
    setScore((prev) => prev + (isBossWave ? 1500 : 400) + combo * 50);

    if (isBossWave) {
      // Victory in whole dungeon!
      handleBossVictory(gainZeny, gainExp);
    } else {
      // Offer Roguelite Perk before next wave
      const available = ROGUELITE_PERKS.filter((p) => !activePerks.some((ap) => ap.id === p.id));
      const shuffled = [...available].sort(() => 0.5 - Math.random()).slice(0, 3);
      setPerkChoices(shuffled);
      setTimeout(() => {
        setShowPerkSelect(true);
      }, 700);
    }
  };

  // Roguelite Perk chosen
  const handleChoosePerk = (perk: RoguelitePerk) => {
    soundManager.playLevelUp();
    setActivePerks((prev) => [...prev, perk]);
    setShowPerkSelect(false);
    // Advance to next wave
    setWaveIndex((prev) => prev + 1);
  };

  // Epic Boss Victory
  const handleBossVictory = (finalZeny: number, finalExp: number) => {
    soundManager.playLevelUp();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Determine drops
    let droppedGear: Equipment | null = null;
    let droppedCrd: CardItem | null = null;

    // High chance for boss card or special gear drop!
    const lukDropBonus = profile.stats.luk * 0.03;
    if (Math.random() < 0.85 + lukDropBonus) {
      // 1. Try to find the exact boss card
      const bossKeyword = map.boss.name.split(' ')[0];
      const bossCardMatch = ALL_RO_CARDS.find((c) => c.monsterName.includes(bossKeyword) || bossKeyword.includes(c.monsterName));
      
      // 2. If unowned, definitely drop boss card; otherwise pick an unobtained card or random card
      const unownedCards = ALL_RO_CARDS.filter((c) => !profile.cards.some((pc) => pc.id === c.id));
      if (bossCardMatch && (!profile.cards.some((pc) => pc.id === bossCardMatch.id) || unownedCards.length === 0)) {
        droppedCrd = bossCardMatch;
      } else if (unownedCards.length > 0) {
        droppedCrd = unownedCards[Math.floor(Math.random() * unownedCards.length)];
      } else {
        droppedCrd = bossCardMatch || ALL_RO_CARDS[Math.floor(Math.random() * ALL_RO_CARDS.length)];
      }
      soundManager.playRareDrop();
    }

    // Refined equipment drop
    droppedGear = {
      id: `drop_${Date.now()}`,
      name: `${map.name.slice(0, 4)}守卫法袍`,
      slot: 'armor',
      rarity: 'epic',
      refineLevel: 1,
      hpBonus: 120,
      defBonus: 15,
      description: `从${map.boss.name}身上获取的战利品，散发着优雅的圣洁微光。`,
      icon: '🛡️',
      slottedCard: null,
    };

    setDroppedCard(droppedCrd);
    setDroppedItem(droppedGear);
    setBattleFinished('victory');

    // Update global profile with XP, Zeny, Drops & Unlock Next Map
    onUpdateProfile((prev) => {
      const nextExp = prev.exp + finalExp + earnedExp;
      let newLevel = prev.level;
      let newMaxExp = prev.maxExp;
      let newStatPoints = prev.statPoints;

      // Level up check
      if (nextExp >= prev.maxExp) {
        newLevel += 1;
        newMaxExp = Math.floor(prev.maxExp * 1.5);
        newStatPoints += 3; // +3 stat points per level up!
      }

      // Unlock next map
      const mapOrder = ['map_prontera', 'map_shipwreck', 'map_goblin_forest', 'map_geffen_dungeon', 'map_glast_heim'];
      const currentIndex = mapOrder.indexOf(map.id);
      const nextMapId = mapOrder[currentIndex + 1];
      const newUnlockedMaps = nextMapId && !prev.unlockedMapIds.includes(nextMapId)
        ? [...prev.unlockedMapIds, nextMapId]
        : prev.unlockedMapIds;

      const newDefeated = prev.defeatedBosses.includes(map.boss.id)
        ? prev.defeatedBosses
        : [...prev.defeatedBosses, map.boss.id];

      const newInventory = droppedGear ? [...prev.inventory, droppedGear] : prev.inventory;
      const newCards = droppedCrd && !prev.cards.some((c) => c.id === droppedCrd?.id)
        ? [...prev.cards, droppedCrd]
        : prev.cards;

      return {
        ...prev,
        level: newLevel,
        exp: nextExp % newMaxExp,
        maxExp: newMaxExp,
        statPoints: newStatPoints,
        zeny: prev.zeny + finalZeny + earnedZeny,
        refineStones: prev.refineStones + 2, // reward 2 refining stones for boss defeat
        unlockedMapIds: newUnlockedMaps,
        defeatedBosses: newDefeated,
        inventory: newInventory,
        cards: newCards,
      };
    });
  };

  return (
    <div className={`relative flex flex-col h-full select-none bg-gradient-to-b ${map.bgGradient} ${screenShake ? 'animate-shake' : ''}`}>
      {/* Top Header: Wave, Combo, Score */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-3 md:px-5 py-2 md:py-3 border-b border-sky-100 dark:border-slate-800 flex items-center justify-between text-xs md:text-sm">
        <div className="flex items-center space-x-2 md:space-x-3">
          <button
            onClick={onExitBattle}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs md:text-sm font-semibold transition-colors"
          >
            ← 撤退
          </button>
          <div className="flex flex-col">
            <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100 flex items-baseline gap-1 whitespace-nowrap">
              <span>{map.name.replace(/\s*\(.*?\)/, '')}</span>
              <span className="text-[10px] md:text-xs font-normal text-slate-400 dark:text-slate-500 font-sans">
                {map.name.match(/\((.*?)\)/)?.[0] || ''}
              </span>
              {isBossWave && (
                <span className="bg-red-500 text-white text-[9px] md:text-[10px] px-1.5 py-0.2 rounded-full font-extrabold animate-pulse ml-0.5">
                  BOSS战
                </span>
              )}
            </span>
            <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
              波次: {waveIndex + 1} / {totalWaves}
            </span>
          </div>
        </div>

        {/* Combo & Score badges */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {combo > 1 && (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-[11px] md:text-xs shadow-sm animate-bounce">
              <Zap className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span>{combo} 连击!!</span>
            </div>
          )}
          <div className="text-right">
            <div className="font-bold text-amber-600 dark:text-amber-400">💰 {earnedZeny}</div>
            <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">积分 {score}</div>
          </div>
        </div>
      </div>

      {/* Arena / Monster Stage */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-4 md:p-6 min-h-[220px]">
        {/* Floating Damage Numbers */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {damagePopups.map((popup) => (
            <div
              key={popup.id}
              style={{ transform: `translateX(${popup.xOffset}px)` }}
              className={`absolute z-30 font-black text-xl md:text-3xl animate-float-damage ${
                popup.isCrit
                  ? 'text-amber-500 dark:text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-2xl md:text-4xl'
                  : popup.isHeal
                  ? 'text-emerald-500 dark:text-emerald-400 drop-shadow-md'
                  : popup.isMonster
                  ? 'text-rose-500 drop-shadow-md'
                  : 'text-red-600 drop-shadow-md'
              }`}
            >
              {popup.text}
            </div>
          ))}
        </div>

        {/* Attack Slash Overlay FX */}
        {isSlashFx && (
          <div className="absolute z-20 pointer-events-none w-32 md:w-48 h-32 md:h-48 flex items-center justify-center animate-slash">
            <div className="w-full h-2 md:h-3 bg-gradient-to-r from-transparent via-cyan-300 to-white shadow-[0_0_20px_#38bdf8]" />
          </div>
        )}

        {/* Monster Display & HP Bar */}
        <div className="flex flex-col items-center max-w-sm w-full">
          <div className="w-full mb-1">
            <div className="flex justify-between items-center text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-200 px-1 mb-1">
              <span className="flex items-center gap-1">
                {currentMonster.name}
                <span className="text-slate-500 dark:text-slate-400 font-normal">({currentMonster.title})</span>
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-black">
                {monsterHp} / {currentMonster.maxHp} HP
              </span>
            </div>
            {/* Monster HP Bar */}
            <div className="w-full h-2.5 md:h-3 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, (monsterHp / currentMonster.maxHp) * 100))}%` }}
              />
            </div>
          </div>

          {/* Monster Dialogue / Special Skill alert */}
          {currentMonster.dialogue && (
            <div className="mb-2 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[11px] md:text-xs text-slate-700 dark:text-slate-200 shadow-xs max-w-xs text-center backdrop-blur-xs">
              "{currentMonster.dialogue}"
            </div>
          )}

          {/* Monster Visual Avatar */}
          <MonsterAvatar
            monster={currentMonster}
            isHit={isMonsterHit}
            size={isBossWave ? 'xl' : 'lg'}
          />
        </div>

        {/* Player Status Bar at bottom of stage */}
        <div className="w-full max-w-sm mt-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs rounded-2xl p-2.5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex justify-between items-center text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            <span className="flex items-center gap-1">
              <span>{profile.name} (Lv.{profile.level})</span>
              {hasShield && activePerks.some((p) => p.effect.freeShieldPerCombat) && (
                <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              )}
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {playerHp} / {profile.maxHp} HP
            </span>
          </div>
          <div className="w-full h-2 md:h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (playerHp / profile.maxHp) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Roguelite Combat Question Card */}
      {currentWord && (
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-xl p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-3 md:space-y-4">
          {/* Question Timer Bar & Word Metadata */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-bold">
                  第 {((wordPoolIndex - 1 + map.availableWords.length) % (map.availableWords.length || 1)) + 1} / {map.availableWords.length} 词
                </span>
                {(() => {
                  const currentWordData = profile.learnedWords[currentWord.id] || currentWord;
                  const mState = getWordMastery(currentWordData);
                  const mColor = getMasteryColor(mState);
                  const mLabel = getMasteryLabel(mState);
                  const streak = currentWordData.consecutiveCorrect || 0;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${mColor.bg} ${mColor.text} ${mColor.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${mColor.dot}`} />
                      <span>{mLabel}</span>
                      {mState !== 'new' && (
                        <span className="opacity-80">({streak}/5连对)</span>
                      )}
                    </span>
                  );
                })()}
              </span>

              <span className="font-mono text-xs">
                {Math.ceil(timeLeft)}s
              </span>
            </div>

            <div className="w-full h-1.5 md:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  timeLeft / maxQuestionTime > 0.5
                    ? 'bg-emerald-500'
                    : timeLeft / maxQuestionTime > 0.25
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(0, (timeLeft / maxQuestionTime) * 100)}%` }}
              />
            </div>
          </div>

          {/* Word Header with Audio Pronunciation & Hint */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <span className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-wide font-serif">
                {currentWord.word}
              </span>
              <button
                onClick={() => soundManager.speakWord(currentWord.word)}
                className="p-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
                title="发音朗读"
              >
                <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-mono">
                {currentWord.phonetic}
              </span>
              <span className="text-[10px] md:text-xs bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded-md font-bold">
                {currentWord.partOfSpeech}
              </span>
            </div>

            <button
              onClick={() => setRevealedHint(!revealedHint)}
              className="text-xs md:text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium flex items-center space-x-1"
            >
              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>{revealedHint ? '隐藏例句' : '例句提示'}</span>
            </button>
          </div>

          {/* Example Sentence Context Hint */}
          {revealedHint && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-2.5 md:p-3 text-xs md:text-sm text-amber-900 dark:text-amber-200 animate-fadeIn">
              <div className="font-medium mb-0.5">{currentWord.example}</div>
              <div className="text-[11px] md:text-xs text-amber-800 dark:text-amber-300 font-normal">{currentWord.exampleTranslation}</div>
            </div>
          )}

          {/* 4 Multiple Choice Options (Large touch targets for mobile, responsive grid, randomized positions) */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {(shuffledOptions.length > 0 ? shuffledOptions : currentWord.options).map((option, idx) => {
              const isEliminated = eliminatedOptions.includes(option);
              const isSelected = selectedOption === option;
              const isOptionCorrect =
                option === correctAnswerText ||
                option === currentWord.translation ||
                (currentWord.options && currentWord.options.length > 0 && option === currentWord.options[0]);

              let btnStyle = 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-98 shadow-xs';
              if (isEliminated) {
                btnStyle = 'opacity-40 line-through bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed';
              } else if (isAnswered) {
                if (isOptionCorrect) {
                  btnStyle = 'bg-emerald-500 border-emerald-600 text-white font-bold shadow-md ring-2 ring-emerald-300 dark:ring-emerald-600';
                } else if (isSelected && !isOptionCorrect) {
                  btnStyle = 'bg-rose-500 border-rose-600 text-white font-bold ring-2 ring-rose-300 dark:ring-rose-600';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered || isEliminated}
                  onClick={() => handleSelectOption(option)}
                  className={`min-h-[48px] md:min-h-[56px] py-2.5 px-3 md:px-4 border rounded-2xl text-xs md:text-base font-medium transition-all text-center flex items-center justify-center ${btnStyle}`}
                >
                  <span className="line-clamp-2 leading-tight">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Roguelite Perk Selection Modal (波利神殿祈愿) */}
      {showPerkSelect && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 max-w-sm md:max-w-md w-full shadow-2xl border border-amber-200 dark:border-amber-700/60 animate-scaleUp">
            <div className="text-center mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl md:text-3xl shadow-inner">
                ✨
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">波利祈愿神殿</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                清空魔物区域！挑选一项波利神明赐予的肉鸽祝福：
              </p>
            </div>

            <div className="space-y-2.5 mb-4">
              {perkChoices.map((perk) => (
                <button
                  key={perk.id}
                  onClick={() => handleChoosePerk(perk)}
                  className="w-full text-left p-3 md:p-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all flex items-start space-x-3 group"
                >
                  <span className="text-2xl md:text-3xl group-hover:scale-125 transition-transform">
                    {perk.icon}
                  </span>
                  <div>
                    <div className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {perk.name}
                      <span className="text-[10px] md:text-xs uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.2 rounded-md">
                        {perk.rarity}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                      {perk.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Victory / Defeat Modal */}
      {battleFinished && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm md:max-w-md w-full shadow-2xl text-center animate-scaleUp border border-slate-200/80 dark:border-slate-800">
            {battleFinished === 'victory' ? (
              <>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl md:text-4xl shadow-inner animate-bounce">
                  🏆
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
                  {map.boss.name} 已被讨伐！
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  太棒了！你的词汇力量彻底瓦解了古老魔灵的阻碍！
                </p>

                {/* Drops breakdown */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 text-left space-y-2 mb-4 text-xs md:text-sm">
                  <div className="font-bold text-slate-700 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-700">
                    战斗结算收益
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">💰 获得金币 (Zeny):</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">+{earnedZeny} Zeny</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">⭐ 获得经验 (EXP):</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">+{earnedExp} EXP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">🔥 获得记忆精炼石:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">+2 颗</span>
                  </div>
                  {droppedCard && (
                    <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-950/50 p-2 rounded-xl border border-purple-200 dark:border-purple-800/80 text-purple-900 dark:text-purple-200 mt-1">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div className="text-[11px] md:text-xs">
                        <span className="font-bold">掉落稀有卡片: </span>
                        {droppedCard.name}
                      </div>
                    </div>
                  )}
                  {droppedItem && (
                    <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/50 p-2 rounded-xl border border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-blue-200 mt-1">
                      <span className="text-lg">{droppedItem.icon}</span>
                      <div className="text-[11px] md:text-xs">
                        <span className="font-bold">掉落神装: </span>
                        {droppedItem.name}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={onExitBattle}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-sm md:text-base shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all"
                  >
                    返回世界地图
                  </button>
                  {profile.furnaceWordIds.length > 0 && (
                    <button
                      onClick={onOpenFurnace}
                      className="w-full py-2.5 bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 rounded-2xl font-bold text-xs md:text-sm hover:bg-purple-200 dark:hover:bg-purple-900 transition-all flex items-center justify-center space-x-1"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>前往卡普拉回炉所复习 ({profile.furnaceWordIds.length}个待淬炼词)</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl md:text-4xl shadow-inner">
                  💧
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">战斗败北...</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  魔物击穿了你的防线！刚才失误的生词已记录在卡普拉回炉所。
                </p>

                <div className="space-y-2">
                  <button
                    onClick={onOpenFurnace}
                    className="w-full py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm md:text-base shadow-md hover:bg-purple-700 transition-all flex items-center justify-center space-x-1"
                  >
                    <Flame className="w-4 h-4" />
                    <span>回炉复习生词 (淬炼变强)</span>
                  </button>
                  <button
                    onClick={onExitBattle}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs md:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    返回安全城镇
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
