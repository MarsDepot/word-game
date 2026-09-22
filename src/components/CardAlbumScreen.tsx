import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  Volume2,
  Search,
  Check,
  Star,
  FileText,
  RotateCw,
  Plus,
  Pencil,
  Trash2,
  Flame,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { PlayerProfile, CardItem, WordItem } from '../types/game';
import { ALL_RO_CARDS } from '../data/words';
import { getAllDefaultWords } from '../utils/wordHelpers';
import { soundManager } from '../audio/soundManager';
import { WordFlipReviewModal } from './WordFlipReviewModal';
import { WordImportExportModal } from './WordImportExportModal';
import { WordEditModal } from './WordEditModal';
import {
  getWordMastery,
  getMasteryLabel,
  getMasteryColor,
  getMasteryStats,
  MasteryState,
} from '../utils/wordMastery';

interface CardAlbumScreenProps {
  profile: PlayerProfile;
  onUpdateProfile?: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const CardAlbumScreen: React.FC<CardAlbumScreenProps> = ({ profile, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'words' | 'cards'>('words');
  const [searchQuery, setSearchQuery] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<'all' | MasteryState>('all');
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  // Batch deletion & selection
  const [batchMode, setBatchMode] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    count: number;
    wordIds: string[];
    wordName?: string;
  }>({ isOpen: false, count: 0, wordIds: [] });

  // Word edit modal state
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Modals
  const [showFlipReview, setShowFlipReview] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importExportInitialTab, setImportExportInitialTab] = useState<'export' | 'import'>('export');

  // Unified single word book (default game words + learned/custom user words)
  const allCombinedWords = useMemo(() => {
    const defaultWords = getAllDefaultWords();
    const map = new Map<string, WordItem>();

    defaultWords.forEach((w) => map.set(w.id, w));
    Object.values(profile.learnedWords || {}).forEach((w) => map.set(w.id, { ...w }));

    return Array.from(map.values());
  }, [profile.learnedWords]);

  // Overall statistics for mastery
  const masteryStats = useMemo(() => {
    return getMasteryStats(profile.learnedWords || {});
  }, [profile.learnedWords]);

  // Filtered words by query and mastery filter
  const filteredWords = useMemo(() => {
    return allCombinedWords.filter((w) => {
      // Mastery filter
      const latestData = profile.learnedWords[w.id] || w;
      const mState = getWordMastery(latestData);
      if (masteryFilter !== 'all' && mState !== masteryFilter) {
        return false;
      }

      // Search query filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        w.word.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q) ||
        (w.example && w.example.toLowerCase().includes(q))
      );
    });
  }, [allCombinedWords, masteryFilter, searchQuery, profile.learnedWords]);

  // Toggle batch selection of a word
  const toggleSelectWord = (id: string) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all filtered words
  const selectAllFiltered = () => {
    setSelectedWordIds(new Set(filteredWords.map((w) => w.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedWordIds(new Set());
  };

  // Perform deletion of specified word IDs
  const executeDeleteWords = (ids: string[]) => {
    if (!onUpdateProfile || ids.length === 0) return;
    soundManager.playClick();

    onUpdateProfile((prev) => {
      const nextLearned = { ...prev.learnedWords };
      ids.forEach((id) => {
        delete nextLearned[id];
      });

      const nextFurnace = prev.furnaceWordIds.filter((id) => !ids.includes(id));

      return {
        ...prev,
        furnaceWordIds: nextFurnace,
        learnedWords: nextLearned,
      };
    });

    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

    setConfirmDeleteModal({ isOpen: false, count: 0, wordIds: [] });
  };

  // Save edited or created word
  const handleSaveWord = (savedWord: WordItem) => {
    if (!onUpdateProfile) return;
    onUpdateProfile((prev) => {
      return {
        ...prev,
        learnedWords: {
          ...prev.learnedWords,
          [savedWord.id]: savedWord,
        },
      };
    });
  };

  // Toggle furnace status
  const handleToggleFurnace = (word: WordItem) => {
    if (!onUpdateProfile) return;
    soundManager.playClick();
    const isCurrentlyIn = profile.furnaceWordIds.includes(word.id);

    onUpdateProfile((prev) => {
      const nextFurnace = isCurrentlyIn
        ? prev.furnaceWordIds.filter((id) => id !== word.id)
        : [...prev.furnaceWordIds, word.id];

      const nextLearned = { ...prev.learnedWords };
      if (!nextLearned[word.id]) {
        nextLearned[word.id] = { ...word };
      }
      nextLearned[word.id].inFurnace = !isCurrentlyIn;

      return {
        ...prev,
        furnaceWordIds: nextFurnace,
        learnedWords: nextLearned,
      };
    });
  };

  return (
    <div className="flex-1 flex flex-col p-3 md:p-6 overflow-y-auto space-y-3.5 md:space-y-5 pb-20">
      {/* Top Banner & Quick Action Tools */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 rounded-3xl p-4 md:p-5 text-slate-100 shadow-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📚</span>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
              统一单词宝典 & RO卡片图鉴
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            全本统一收录 {allCombinedWords.length} 词 · 已掌握 {masteryStats.mastered} 词 · 熟悉 {masteryStats.familiar} 词 · 全新 {masteryStats.new} 词
          </p>
        </div>

        {/* Action Buttons: Flip Review, Add Word & Text Import/Export */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setEditingWord(null);
              setShowEditModal(true);
            }}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm rounded-2xl shadow-md transition-all flex items-center space-x-1"
            title="添加单个新单词"
          >
            <Plus className="w-4 h-4" />
            <span>新建单词</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setShowFlipReview(true);
            }}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm rounded-2xl shadow-md transition-all flex items-center space-x-1 hover:scale-102"
          >
            <RotateCw className="w-4 h-4" />
            <span>翻阅复习</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setImportExportInitialTab('export');
              setShowImportExport(true);
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-black text-xs md:text-sm rounded-2xl transition-all flex items-center space-x-1"
            title="导入导出单词文本"
          >
            <FileText className="w-4 h-4" />
            <span>导入/导出</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md flex space-x-1.5 max-w-xl mx-auto w-full">
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('words');
          }}
          className={`flex-1 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'words'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>统一词库 ({allCombinedWords.length})</span>
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('cards');
          }}
          className={`flex-1 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'cards'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>RO魔物卡片册 ({profile.cards.length} / {ALL_RO_CARDS.length})</span>
        </button>
      </div>

      {activeTab === 'words' ? (
        /* =================== VOCABULARY CODEX TAB =================== */
        <div className="space-y-3.5">
          {/* Search & Mastery Filter Bar */}
          <div className="flex flex-col gap-2.5 max-w-3xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="搜索英文单词、中文释义或例句..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-3 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              {/* Batch Mode Toggle */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setBatchMode(!batchMode);
                  if (batchMode) setSelectedWordIds(new Set());
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs md:text-sm font-bold border transition-all flex items-center justify-center space-x-1.5 shrink-0 ${
                  batchMode
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{batchMode ? '退出批量管理' : '批量管理'}</span>
              </button>
            </div>

            {/* Mastery Degree Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setMasteryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  masteryFilter === 'all'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750'
                }`}
              >
                全部 ({allCombinedWords.length})
              </button>

              <button
                onClick={() => setMasteryFilter('mastered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  masteryFilter === 'mastered'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>已掌握 (全知全会 · {masteryStats.mastered})</span>
              </button>

              <button
                onClick={() => setMasteryFilter('familiar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  masteryFilter === 'familiar'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-800 text-amber-400 border border-amber-800/60 hover:bg-amber-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>熟悉 (仍需强化 · {masteryStats.familiar})</span>
              </button>

              <button
                onClick={() => setMasteryFilter('new')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  masteryFilter === 'new'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-800 text-sky-400 border border-sky-800/60 hover:bg-sky-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>全新 (未曾出现 · {masteryStats.new})</span>
              </button>
            </div>

            {/* Batch Operation Action Bar */}
            {batchMode && (
              <div className="bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-rose-200">
                    已勾选 {selectedWordIds.size} / {filteredWords.length} 个单词
                  </span>
                  <button
                    onClick={selectAllFiltered}
                    className="text-xs text-rose-300 underline font-medium hover:text-rose-100"
                  >
                    全选当前
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-slate-400 underline font-medium hover:text-slate-200"
                  >
                    取消选择
                  </button>
                </div>

                <button
                  disabled={selectedWordIds.size === 0}
                  onClick={() => {
                    setConfirmDeleteModal({
                      isOpen: true,
                      count: selectedWordIds.size,
                      wordIds: Array.from(selectedWordIds),
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 transition-all ${
                    selectedWordIds.size > 0
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>批量删除选中 ({selectedWordIds.size})</span>
                </button>
              </div>
            )}
          </div>

          {/* Words Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredWords.map((word) => {
              const learned = profile.learnedWords[word.id] || word;
              const mastery = getWordMastery(learned);
              const mColor = getMasteryColor(mastery);
              const mLabel = getMasteryLabel(mastery);
              const isInFurnace = profile.furnaceWordIds.includes(word.id);
              const isSelected = selectedWordIds.has(word.id);
              const streak = learned.consecutiveCorrect || 0;

              return (
                <div
                  key={word.id}
                  className={`bg-slate-900 rounded-2xl p-3 md:p-3.5 border transition-all flex items-start justify-between ${
                    isSelected
                      ? 'border-rose-500 ring-2 ring-rose-950/60 shadow-sm'
                      : 'border-slate-800 hover:border-slate-700 shadow-xs'
                  }`}
                >
                  {/* Batch Select Checkbox */}
                  {batchMode && (
                    <button
                      onClick={() => toggleSelectWord(word.id)}
                      className="mr-2.5 mt-0.5 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-rose-500 fill-rose-950/60" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  )}

                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-black text-slate-100 text-sm md:text-base font-serif">
                        {word.word}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {word.phonetic}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                        {word.partOfSpeech}
                      </span>

                      {/* Mastery Badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center space-x-1 ${mColor.bg} ${mColor.text} ${mColor.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${mColor.dot}`} />
                        <span>{mLabel}</span>
                        {mastery !== 'new' && (
                          <span className="opacity-80">({streak}/5连对)</span>
                        )}
                      </span>
                    </div>

                    <div className="text-xs md:text-sm text-slate-200 font-medium">
                      {word.translation}
                    </div>

                    {word.example && (
                      <div className="text-[11px] text-slate-400 line-clamp-1 italic">
                        {word.example}
                      </div>
                    )}
                  </div>

                  {/* Actions & Mastery */}
                  <div className="flex flex-col items-end space-y-1.5 shrink-0 pl-2">
                    <div className="flex items-center space-x-1">
                      {/* Speak button */}
                      <button
                        onClick={() => soundManager.speakWord(word.word)}
                        className="p-1.5 text-emerald-400 hover:bg-emerald-950/60 rounded-full transition-colors"
                        title="朗读"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      {/* Edit Word */}
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setEditingWord(learned);
                          setShowEditModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-950/60 rounded-full transition-colors"
                        title="编辑单词"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete Word */}
                      <button
                        onClick={() => {
                          setConfirmDeleteModal({
                            isOpen: true,
                            count: 1,
                            wordIds: [word.id],
                            wordName: word.word,
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-full transition-colors"
                        title="删除该单词"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Add/Remove Furnace */}
                      {onUpdateProfile && (
                        <button
                          onClick={() => handleToggleFurnace(word)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isInFurnace
                              ? 'text-rose-400 bg-rose-950/80 border border-rose-800/80'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                          }`}
                          title={isInFurnace ? '已在生词回炉本' : '加入生词回炉本'}
                        >
                          <Flame className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Consecutive Correct Progress Indicators */}
                    <div className="flex items-center space-x-1" title={`当前连续答对: ${streak}次 (满5次转为已掌握)`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            streak >= s
                              ? 'bg-emerald-500'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredWords.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <div className="text-3xl">🔍</div>
              <p className="font-bold text-slate-600 dark:text-slate-400 text-sm">
                未找到匹配 "{searchQuery}" 的单词
              </p>
            </div>
          )}
        </div>
      ) : (
        /* =================== RO MONSTER CARD ALBUM TAB =================== */
        <div className="space-y-3">
          <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium px-1">
            仙境传说经典卡片图鉴！插在对应装备插槽中，激活独有被动光环与属性：
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {ALL_RO_CARDS.map((card) => {
              const isOwned =
                profile.cards.some((c) => c.id === card.id) ||
                Object.values(profile.equipment).some((e) => e?.slottedCard?.id === card.id);

              const rarityColors = {
                common: 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80',
                rare: 'border-amber-300 dark:border-amber-600/80 bg-amber-50/40 dark:bg-amber-950/30',
                epic: 'border-purple-300 dark:border-purple-600/80 bg-purple-50/40 dark:bg-purple-950/30',
                legendary: 'border-rose-300 dark:border-rose-600/80 bg-rose-50/50 dark:bg-rose-950/30 animate-pulse-gold',
              }[card.rarity];

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedCard(card);
                  }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-102 flex flex-col justify-between min-h-[140px] md:min-h-[160px] relative overflow-hidden ${rarityColors} ${
                    !isOwned ? 'opacity-45 grayscale' : 'shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] md:text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300">
                        {card.slot}
                      </span>
                      <span className="text-[10px] md:text-xs font-extrabold text-purple-700 dark:text-purple-300">
                        {card.rarity}
                      </span>
                    </div>
                    <div className="font-black text-xs md:text-sm text-slate-800 dark:text-slate-100 mt-1">
                      {card.name}
                    </div>
                    <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">
                      属: {card.monsterType}
                    </div>
                  </div>

                  <div className="text-[10px] md:text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-tight">
                    {card.description}
                  </div>

                  {isOwned && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-2.5 text-rose-600 dark:text-rose-400">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/80 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-slate-850 dark:text-slate-100">
                确认删除单词？
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmDeleteModal.wordName ? (
                <>
                  确定要从词库中删除单词{' '}
                  <span className="font-bold text-rose-600">
                    "{confirmDeleteModal.wordName}"
                  </span>{' '}
                  吗？删除后该单词将不再参与各关卡出题。
                </>
              ) : (
                <>
                  确定要批量删除选中的{' '}
                  <span className="font-bold text-rose-600">
                    {confirmDeleteModal.count}
                  </span>{' '}
                  个单词条目吗？该操作不可撤销。
                </>
              )}
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteModal({ isOpen: false, count: 0, wordIds: [] })}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => executeDeleteWords(confirmDeleteModal.wordIds)}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Detail Popup Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 max-w-xs md:max-w-sm w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-scaleUp text-center">
            <div className="text-3xl mb-1">🃏</div>
            <h3 className="font-black text-base md:text-lg text-slate-800 dark:text-slate-100">
              {selectedCard.name}
            </h3>
            <div className="text-[10px] md:text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2">
              {selectedCard.rarity} · 插槽: {selectedCard.slot}
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/40 rounded-2xl p-3 text-xs md:text-sm text-slate-700 dark:text-slate-200 mb-4 text-left leading-relaxed border border-purple-100 dark:border-purple-900/60">
              {selectedCard.description}
            </div>
            <button
              onClick={() => setSelectedCard(null)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs md:text-sm text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Word Edit & Creation Modal */}
      <WordEditModal
        word={editingWord}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveWord}
      />

      {/* Interactive Word Flip Flashcards Modal */}
      {showFlipReview && onUpdateProfile && (
        <WordFlipReviewModal
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onClose={() => setShowFlipReview(false)}
        />
      )}

      {/* Text Import & Export Modal */}
      {showImportExport && onUpdateProfile && (
        <WordImportExportModal
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onClose={() => setShowImportExport(false)}
          initialTab={importExportInitialTab}
        />
      )}
    </div>
  );
};
