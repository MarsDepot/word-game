import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Volume2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Flame,
  Star,
  CheckCircle2,
  BookOpen,
  Filter,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { WordItem, PlayerProfile } from '../types/game';
import { GAME_MAPS } from '../data/words';
import { getAllDefaultWords } from '../utils/wordHelpers';
import { soundManager } from '../audio/soundManager';

interface WordFlipReviewModalProps {
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onClose: () => void;
  initialFilter?: 'all' | 'learned' | 'furnace';
}

export const WordFlipReviewModal: React.FC<WordFlipReviewModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  initialFilter = 'all',
}) => {
  // Pool of all game words + learned custom words
  const allGameWords = useMemo(() => {
    const defaultWords = getAllDefaultWords();
    const learnedMap = profile.learnedWords || {};
    const map = new Map<string, WordItem>();

    defaultWords.forEach((w) => map.set(w.id, w));
    Object.values(learnedMap).forEach((w) => map.set(w.id, { ...w }));

    return Array.from(map.values());
  }, [profile.learnedWords]);

  // Filters
  const [scopeFilter, setScopeFilter] = useState<'all' | 'learned' | 'furnace' | string>(initialFilter);
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'unlearned' | 'mastered'>('all');
  const [isShuffle, setIsShuffle] = useState(false);
  const [autoPronounce, setAutoPronounce] = useState(true);
  const [autoSlideshowSpeed, setAutoSlideshowSpeed] = useState<number>(0); // 0 = off, 3 = 3s, 5 = 5s, 8 = 8s

  // Card view state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filtered words list
  const filteredWords = useMemo(() => {
    let list: WordItem[] = [];

    if (scopeFilter === 'all') {
      list = allGameWords;
    } else if (scopeFilter === 'learned') {
      list = Object.values(profile.learnedWords || {});
    } else if (scopeFilter === 'furnace') {
      const furnaceIds = new Set(profile.furnaceWordIds || []);
      list = allGameWords.filter((w) => furnaceIds.has(w.id));
    } else {
      // Filter by specific map ID
      const targetMap = GAME_MAPS.find((m) => m.id === scopeFilter);
      if (targetMap) {
        list = targetMap.availableWords.map((w) => profile.learnedWords[w.id] || w);
      } else {
        list = allGameWords;
      }
    }

    // Apply mastery filter
    if (masteryFilter === 'unlearned') {
      list = list.filter((w) => {
        const m = profile.learnedWords[w.id]?.mastery || w.mastery || 0;
        return m < 3;
      });
    } else if (masteryFilter === 'mastered') {
      list = list.filter((w) => {
        const m = profile.learnedWords[w.id]?.mastery || w.mastery || 0;
        return m >= 3;
      });
    }

    if (isShuffle) {
      // Deterministic shuffle copy
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    return list;
  }, [scopeFilter, masteryFilter, isShuffle, allGameWords, profile.learnedWords, profile.furnaceWordIds]);

  // Current active word
  const activeWord: WordItem | undefined = filteredWords[currentIndex];

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [scopeFilter, masteryFilter, isShuffle]);

  // Auto-pronounce on word change
  useEffect(() => {
    if (activeWord && autoPronounce) {
      soundManager.speakWord(activeWord.word);
    }
  }, [currentIndex, activeWord, autoPronounce]);

  // Auto slideshow timer
  useEffect(() => {
    if (autoSlideshowSpeed <= 0 || filteredWords.length <= 1) return;

    const timer = setInterval(() => {
      setIsFlipped((prev) => {
        if (!prev) {
          // If not flipped, flip to reveal meaning
          return true;
        } else {
          // If flipped, move to next card and unflip
          setCurrentIndex((idx) => (idx + 1) % filteredWords.length);
          return false;
        }
      });
    }, autoSlideshowSpeed * 1000);

    return () => clearInterval(timer);
  }, [autoSlideshowSpeed, filteredWords.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'v' || e.key === 'V') {
        if (activeWord) soundManager.speakWord(activeWord.word);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredWords.length, currentIndex, activeWord]);

  // Navigation handlers
  const handlePrev = () => {
    if (filteredWords.length === 0) return;
    soundManager.playClick();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredWords.length - 1));
  };

  const handleNext = () => {
    if (filteredWords.length === 0) return;
    soundManager.playClick();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < filteredWords.length - 1 ? prev + 1 : 0));
  };

  const handleFlip = () => {
    soundManager.playClick();
    setIsFlipped((prev) => !prev);
  };

  // Toggle furnace status
  const handleToggleFurnace = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeWord) return;

    soundManager.playClick();
    const isCurrentlyIn = profile.furnaceWordIds.includes(activeWord.id);

    onUpdateProfile((prev) => {
      const nextFurnace = isCurrentlyIn
        ? prev.furnaceWordIds.filter((id) => id !== activeWord.id)
        : [...prev.furnaceWordIds, activeWord.id];

      const nextLearned = { ...prev.learnedWords };
      if (!nextLearned[activeWord.id]) {
        nextLearned[activeWord.id] = { ...activeWord };
      }
      nextLearned[activeWord.id].inFurnace = !isCurrentlyIn;

      return {
        ...prev,
        furnaceWordIds: nextFurnace,
        learnedWords: nextLearned,
      };
    });
  };

  // Adjust mastery
  const handleSetMastery = (e: React.MouseEvent, stars: number) => {
    e.stopPropagation();
    if (!activeWord) return;

    soundManager.playCorrect();
    onUpdateProfile((prev) => {
      const nextLearned = { ...prev.learnedWords };
      if (!nextLearned[activeWord.id]) {
        nextLearned[activeWord.id] = { ...activeWord };
      }
      nextLearned[activeWord.id].mastery = stars;

      return {
        ...prev,
        learnedWords: nextLearned,
      };
    });
  };

  // Check furnace status of active word
  const isInFurnace = activeWord ? profile.furnaceWordIds.includes(activeWord.id) : false;
  const currentMastery = activeWord
    ? profile.learnedWords[activeWord.id]?.mastery ?? activeWord.mastery ?? 0
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-3.5 md:p-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base">
                  沉浸翻阅复习 · 单词闪卡
                </h3>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  {filteredWords.length} 词
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                支持点击翻转、自动发音、键盘左右键翻页与生词标记
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Scope selection */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">范围:</span>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-2xs"
            >
              <option value="all">📚 全部词库 ({allGameWords.length}词)</option>
              <option value="learned">
                ⭐ 已学词汇 ({Object.keys(profile.learnedWords || {}).length}词)
              </option>
              <option value="furnace">🔥 生词回炉本 ({profile.furnaceWordIds.length}词)</option>
              <optgroup label="各章节地图词包">
                {GAME_MAPS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.availableWords.length}词)
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Mastery filter */}
            <select
              value={masteryFilter}
              onChange={(e) => setMasteryFilter(e.target.value as 'all' | 'unlearned' | 'mastered')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-2xs"
            >
              <option value="all">全部熟练度</option>
              <option value="unlearned">生疏需练 (0-2星)</option>
              <option value="mastered">已熟记 (3-5星)</option>
            </select>
          </div>

          {/* Quick toggle settings */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`px-2 py-1 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all ${
                isShuffle
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
              title="乱序随机翻阅"
            >
              <Shuffle className="w-3 h-3" />
              <span>随机</span>
            </button>

            <button
              onClick={() => setAutoPronounce(!autoPronounce)}
              className={`px-2 py-1 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all ${
                autoPronounce
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
              title="切换单词时自动朗读"
            >
              <Volume2 className="w-3 h-3" />
              <span>自动读</span>
            </button>

            {/* Auto slideshow speed */}
            <select
              value={autoSlideshowSpeed}
              onChange={(e) => setAutoSlideshowSpeed(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none shadow-2xs"
              title="自动轮播翻页"
            >
              <option value={0}>⏱️ 轮播: 关</option>
              <option value={3}>3秒</option>
              <option value={5}>5秒</option>
              <option value={8}>8秒</option>
            </select>
          </div>
        </div>

        {/* Card Body & Interactive Flip Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-center items-center select-none">
          {filteredWords.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">📭</div>
              <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                当前筛选条件下暂无单词
              </p>
              <button
                onClick={() => {
                  setScopeFilter('all');
                  setMasteryFilter('all');
                }}
                className="px-3.5 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
              >
                查看全部词库
              </button>
            </div>
          ) : activeWord ? (
            <div className="w-full max-w-md space-y-4">
              {/* Progress & Quick Index */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-1">
                <span>
                  第 <strong className="text-slate-800 dark:text-slate-100">{currentIndex + 1}</strong> / {filteredWords.length} 词
                </span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                    {activeWord.category || '基础词汇'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / filteredWords.length) * 100}%` }}
                />
              </div>

              {/* Interactive Flip Card */}
              <div
                onClick={handleFlip}
                className="w-full min-h-[260px] md:min-h-[300px] bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-xl border-2 border-slate-200 dark:border-slate-750 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 cursor-pointer flex flex-col justify-between relative group hover:scale-[1.01]"
              >
                {!isFlipped ? (
                  /* ================= CARD FRONT (English & Phonetics) ================= */
                  <div className="flex-1 flex flex-col justify-between text-center animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-black border border-purple-200 dark:border-purple-800">
                        {activeWord.partOfSpeech || 'n.'}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.speakWord(activeWord.word);
                        }}
                        className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="朗读发音 (V键)"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="py-6 space-y-2">
                      <h2 className="text-3xl md:text-4xl font-black text-slate-850 dark:text-slate-100 font-serif tracking-tight">
                        {activeWord.word}
                      </h2>
                      <div className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-mono">
                        {activeWord.phonetic}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-1">
                      <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                      <span>点击卡片或按空格键翻转查看释义与例句</span>
                    </div>
                  </div>
                ) : (
                  /* ================= CARD BACK (Meaning, Example, Actions) ================= */
                  <div className="flex-1 flex flex-col justify-between text-left animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-800 dark:text-slate-100 font-serif text-lg">
                          {activeWord.word}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {activeWord.phonetic}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.speakWord(activeWord.word);
                        }}
                        className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Translation & Example */}
                    <div className="py-3 space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">中文释义:</span>
                        <div className="text-lg md:text-xl font-black text-amber-600 dark:text-amber-400">
                          {activeWord.translation}
                        </div>
                      </div>

                      {activeWord.example && (
                        <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium italic">
                            "{activeWord.example}"
                          </p>
                          {activeWord.exampleTranslation && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {activeWord.exampleTranslation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Bar on Card Back */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      {/* Mastery Rating */}
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-400 font-bold mr-0.5">掌握:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={(e) => handleSetMastery(e, star)}
                            className="p-0.5 hover:scale-125 transition-transform"
                            title={`标记掌握度为 ${star} 星`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                currentMastery >= star
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Furnace toggle */}
                      <button
                        onClick={handleToggleFurnace}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-colors ${
                          isInFurnace
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600'
                        }`}
                        title={isInFurnace ? '移出生词回炉本' : '加入生词回炉本以强化复习'}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>{isInFurnace ? '已在回炉本' : '加入回炉本'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrev}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-black text-xs md:text-sm rounded-2xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>上一词 (←)</span>
                </button>

                <button
                  onClick={handleFlip}
                  className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs md:text-sm rounded-2xl shadow-xs transition-colors flex items-center justify-center space-x-1"
                  title="翻转卡片"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>翻面</span>
                </button>

                <button
                  onClick={handleNext}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm rounded-2xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>下一词 (→)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/90 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            ⌨️ 快捷键：<strong>← / →</strong> 切换前后单词，<strong>空格键 / ↑ / ↓</strong> 翻转卡片，<strong>V 键</strong> 朗读发音
          </p>
        </div>
      </div>
    </div>
  );
};
