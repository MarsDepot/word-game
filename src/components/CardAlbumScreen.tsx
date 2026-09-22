import React, { useState, useMemo } from 'react';
import { Sparkles, BookOpen, Volume2, Search, Check, Star, Download, Upload, Flame, FileText, Layers, RotateCw, Plus } from 'lucide-react';
import { PlayerProfile, CardItem, WordItem } from '../types/game';
import { ALL_RO_CARDS, GAME_MAPS } from '../data/words';
import { getAllDefaultWords } from '../utils/wordHelpers';
import { soundManager } from '../audio/soundManager';
import { WordFlipReviewModal } from './WordFlipReviewModal';
import { WordImportExportModal } from './WordImportExportModal';

interface CardAlbumScreenProps {
  profile: PlayerProfile;
  onUpdateProfile?: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const CardAlbumScreen: React.FC<CardAlbumScreenProps> = ({ profile, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'words'>('words');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  // Modals
  const [showFlipReview, setShowFlipReview] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importExportInitialTab, setImportExportInitialTab] = useState<'export' | 'import'>('export');

  // All combined words (default game maps + learned custom words)
  const allCombinedWords = useMemo(() => {
    const defaultWords = getAllDefaultWords();
    const map = new Map<string, WordItem>();

    defaultWords.forEach((w) => map.set(w.id, w));
    Object.values(profile.learnedWords || {}).forEach((w) => map.set(w.id, { ...w }));

    return Array.from(map.values());
  }, [profile.learnedWords]);

  // Filtered words by query and map
  const filteredWords = useMemo(() => {
    return allCombinedWords.filter((w) => {
      // Map category filter
      if (selectedMapFilter !== 'all') {
        const targetMap = GAME_MAPS.find((m) => m.id === selectedMapFilter);
        if (targetMap && !targetMap.availableWords.some((mw) => mw.id === w.id)) {
          return false;
        }
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
  }, [allCombinedWords, selectedMapFilter, searchQuery]);

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

  // Set mastery stars
  const handleSetMastery = (word: WordItem, stars: number) => {
    if (!onUpdateProfile) return;
    soundManager.playCorrect();
    onUpdateProfile((prev) => {
      const nextLearned = { ...prev.learnedWords };
      if (!nextLearned[word.id]) {
        nextLearned[word.id] = { ...word };
      }
      nextLearned[word.id].mastery = stars;

      return {
        ...prev,
        learnedWords: nextLearned,
      };
    });
  };

  return (
    <div className="flex-1 flex flex-col p-3 md:p-6 overflow-y-auto space-y-3.5 md:space-y-5 pb-20">
      {/* Top Banner & Quick Action Tools */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-4 md:p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📚</span>
            <h2 className="text-lg md:text-xl font-black tracking-tight">
              全图词汇宝典 & RO卡片图鉴
            </h2>
          </div>
          <p className="text-xs text-emerald-100 font-medium">
            总收录 {allCombinedWords.length} 词 · 已掌握 {Object.keys(profile.learnedWords || {}).length} 词 · 收集 {profile.cards.length} 张魔物卡片
          </p>
        </div>

        {/* Action Buttons: Flip Review & Text Import/Export */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              setShowFlipReview(true);
            }}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs md:text-sm rounded-2xl shadow-md transition-all flex items-center space-x-1.5 hover:scale-102"
          >
            <RotateCw className="w-4 h-4" />
            <span>📇 翻阅复习</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setImportExportInitialTab('export');
              setShowImportExport(true);
            }}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white font-black text-xs md:text-sm rounded-2xl backdrop-blur-xs transition-all flex items-center space-x-1.5"
            title="导入导出单词文本"
          >
            <FileText className="w-4 h-4" />
            <span>文本导入/导出</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex space-x-1.5 max-w-xl mx-auto w-full">
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('words');
          }}
          className={`flex-1 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'words'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>全图词汇宝典 ({allCombinedWords.length})</span>
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('cards');
          }}
          className={`flex-1 py-2.5 text-xs md:text-sm font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'cards'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>RO魔物卡片册 ({profile.cards.length} / {ALL_RO_CARDS.length})</span>
        </button>
      </div>

      {activeTab === 'words' ? (
        /* =================== VOCABULARY CODEX TAB =================== */
        <div className="space-y-3.5">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 max-w-2xl mx-auto w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="搜索英文单词、中文释义或例句..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-3 py-2.5 text-xs md:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-xs"
              />
            </div>

            <select
              value={selectedMapFilter}
              onChange={(e) => setSelectedMapFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              <option value="all">全部章节地图 ({allCombinedWords.length}词)</option>
              {GAME_MAPS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.availableWords.length}词)
                </option>
              ))}
            </select>
          </div>

          {/* Words Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredWords.map((word) => {
              const learned = profile.learnedWords[word.id];
              const mastery = learned?.mastery ?? word.mastery ?? 0;
              const isInFurnace = profile.furnaceWordIds.includes(word.id);

              return (
                <div
                  key={word.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-3 md:p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                >
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-black text-slate-850 dark:text-slate-100 text-sm md:text-base font-serif">
                        {word.word}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {word.phonetic}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        {word.partOfSpeech}
                      </span>
                      {word.category && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                          {word.category}
                        </span>
                      )}
                    </div>

                    <div className="text-xs md:text-sm text-slate-800 dark:text-slate-200 font-medium">
                      {word.translation}
                    </div>

                    {word.example && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
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
                        className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-full transition-colors"
                        title="朗读"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      {/* Add/Remove Furnace */}
                      {onUpdateProfile && (
                        <button
                          onClick={() => handleToggleFurnace(word)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isInFurnace
                              ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/80'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={isInFurnace ? '已在生词回炉本' : '加入生词回炉本'}
                        >
                          <Flame className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Mastery stars */}
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSetMastery(word, s)}
                          className="hover:scale-125 transition-transform"
                          title={`设为 ${s} 星掌握`}
                        >
                          <Star
                            className={`w-3 h-3 ${
                              mastery >= s
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        </button>
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
