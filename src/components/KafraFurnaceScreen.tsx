import React, { useState } from 'react';
import { Flame, Sparkles, Volume2, CheckCircle2, RotateCcw, ArrowRight, BookOpen, RotateCw, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerProfile, WordItem } from '../types/game';
import { GAME_MAPS } from '../data/words';
import { soundManager } from '../audio/soundManager';
import { WordFlipReviewModal } from './WordFlipReviewModal';
import { WordImportExportModal } from './WordImportExportModal';

interface KafraFurnaceScreenProps {
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onEnterBattle: () => void;
}

export const KafraFurnaceScreen: React.FC<KafraFurnaceScreenProps> = ({
  profile,
  onUpdateProfile,
  onEnterBattle,
}) => {
  // Extract words that are in furnace
  const furnaceWords: WordItem[] = profile.furnaceWordIds
    .map((id) => profile.learnedWords[id])
    .filter((w): w is WordItem => !!w);

  // Active review session state
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Flip review & Import/Export modal states
  const [showFlipReview, setShowFlipReview] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // Quick add all map words to furnace for comprehensive study
  const handleAddMapWordsToFurnace = () => {
    soundManager.playClick();
    onUpdateProfile((prev) => {
      const allWordIds = GAME_MAPS.flatMap((m) => m.availableWords.map((w) => w.id));
      const newLearned = { ...prev.learnedWords };
      GAME_MAPS.forEach((m) => {
        m.availableWords.forEach((w) => {
          if (!newLearned[w.id]) newLearned[w.id] = { ...w };
        });
      });
      return {
        ...prev,
        learnedWords: newLearned,
        furnaceWordIds: Array.from(new Set([...prev.furnaceWordIds, ...allWordIds])),
      };
    });
  };

  const startReview = () => {
    if (furnaceWords.length === 0) return;
    soundManager.playClick();
    setReviewIndex(0);
    setShowMeaning(false);
    setReviewedCount(0);
    setIsReviewing(true);
    soundManager.speakWord(furnaceWords[0].word);
  };

  // Successfully smelted a word!
  const handleSmeltSuccess = () => {
    soundManager.playCorrect();
    const activeWord = furnaceWords[reviewIndex];
    if (!activeWord) return;

    const nextReviewedCount = reviewedCount + 1;
    setReviewedCount(nextReviewedCount);

    // Update word status and reward
    onUpdateProfile((prev) => {
      const nextFurnaceIds = prev.furnaceWordIds.filter((id) => id !== activeWord.id);
      const existing = prev.learnedWords[activeWord.id] || { ...activeWord };
      
      // Every 2 smelted words grants +1 Refining Stone!
      const bonusStone = nextReviewedCount % 2 === 0 ? 1 : 0;

      return {
        ...prev,
        refineStones: prev.refineStones + bonusStone,
        exp: prev.exp + 40,
        zeny: prev.zeny + 30,
        furnaceWordIds: nextFurnaceIds,
        learnedWords: {
          ...prev.learnedWords,
          [activeWord.id]: {
            ...existing,
            mastery: Math.min(5, (existing.mastery || 0) + 2),
            inFurnace: false,
          },
        },
      };
    });

    if (reviewIndex + 1 < furnaceWords.length) {
      setReviewIndex((prev) => prev + 1);
      setShowMeaning(false);
      soundManager.speakWord(furnaceWords[reviewIndex + 1].word);
    } else {
      // Completed all words in furnace!
      handleFinishReview();
    }
  };

  // Need more practice on this word
  const handleSmeltRetry = () => {
    soundManager.playWrong();
    if (reviewIndex + 1 < furnaceWords.length) {
      setReviewIndex((prev) => prev + 1);
      setShowMeaning(false);
      soundManager.speakWord(furnaceWords[reviewIndex + 1].word);
    } else {
      handleFinishReview();
    }
  };

  const handleFinishReview = () => {
    soundManager.playLevelUp();
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
    setIsReviewing(false);
  };

  const currentWord = furnaceWords[reviewIndex];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 text-slate-100 rounded-3xl p-5 md:p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-xs md:text-sm font-bold text-indigo-300 mb-1">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>卡普拉服务所 · 记忆铁匠回炉所</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-wide text-white">
            回炉淬炼 · 锻造神装之石
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1 opacity-95 leading-relaxed max-w-2xl">
            在战斗中失误或未完全掌握的词汇自动汇聚于此。每次回炉淬炼都能产出【记忆精炼石】，强化装备提升战力！
          </p>
        </div>
        <div className="absolute -right-6 -bottom-8 w-36 h-36 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Main Review Session Mode */}
      {isReviewing && currentWord ? (
        <div className="bg-slate-900 rounded-3xl p-5 md:p-6 shadow-md border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs md:text-sm text-slate-400 font-bold pb-2 border-b border-slate-800">
            <span>回炉进度: {reviewIndex + 1} / {furnaceWords.length}</span>
            <span className="text-purple-400 font-black">已淬炼: {reviewedCount} 词</span>
          </div>

          {/* Flashcard Body */}
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-3xl md:text-5xl font-black text-slate-100 font-serif tracking-wide">
                {currentWord.word}
              </span>
              <button
                onClick={() => soundManager.speakWord(currentWord.word)}
                className="p-2 bg-purple-950/60 text-purple-400 rounded-full hover:bg-purple-900 transition-colors"
                title="发音朗读"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm md:text-base text-slate-400 font-mono mb-4">
              {currentWord.phonetic} <span className="bg-purple-950/80 border border-purple-800/80 text-purple-300 text-xs px-1.5 py-0.5 rounded-md ml-1">{currentWord.partOfSpeech}</span>
            </div>

            {/* Hidden / Revealed Meaning */}
            {showMeaning ? (
              <div className="bg-purple-950/40 border border-purple-800/60 rounded-2xl p-4 md:p-5 w-full max-w-xl text-center space-y-2 animate-fadeIn">
                <div className="text-xl md:text-2xl font-black text-purple-200">
                  {currentWord.translation}
                </div>
                <div className="text-xs md:text-sm text-slate-300 font-medium">
                  {currentWord.example}
                </div>
                <div className="text-[11px] md:text-xs text-slate-400">
                  {currentWord.exampleTranslation}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowMeaning(true)}
                className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm rounded-2xl transition-all active:scale-98 border border-slate-700"
              >
                点击翻转释义与例句 👀
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2 max-w-xl mx-auto">
            <button
              onClick={handleSmeltRetry}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm rounded-2xl transition-all border border-slate-700"
            >
              还需加深记忆
            </button>
            <button
              onClick={handleSmeltSuccess}
              className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs md:text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>完全掌握 · 淬炼出石</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Status & Action Card */}
          <div className="bg-slate-900 rounded-3xl p-5 md:p-6 shadow-md border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center mx-auto text-3xl md:text-4xl shadow-inner">
              🔥
            </div>

            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-100">
                当前熔炉中生词: <span className="text-purple-400 font-black">{furnaceWords.length}</span> 个
              </h3>
              <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
                {furnaceWords.length > 0
                  ? '及时回炉复习不仅巩固记忆，更能稳定获取精炼石，把你的武器铠甲精炼到+10！'
                  : '当前回炉熔炉空空如也！去冒险地图战斗答题，失误的词汇会自动存入这里。'}
              </p>
            </div>

            <div className="space-y-2.5 max-w-md mx-auto">
              {furnaceWords.length > 0 ? (
                <button
                  onClick={startReview}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm md:text-base rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-1.5"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>开始回炉淬炼 ({furnaceWords.length} 词)</span>
                </button>
              ) : (
                <button
                  onClick={onEnterBattle}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm md:text-base rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-1"
                >
                  <span>前往冒险地图答题战斗</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleAddMapWordsToFurnace}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm rounded-2xl border border-slate-700 transition-all flex items-center justify-center space-x-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>将全图词包一键导入回炉预热</span>
              </button>

              {/* Extra Tools: Flip Review & Export */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setShowFlipReview(true);
                  }}
                  className="flex-1 py-2 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>📇 翻阅生词闪卡</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    setShowImportExport(true);
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📤 导出/导入文本</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of words in furnace */}
          {furnaceWords.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-4 md:p-5 shadow-md border border-slate-800">
              <h4 className="font-black text-slate-100 text-sm md:text-base mb-3 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                <span>待淬炼生词列表</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {furnaceWords.map((word) => (
                  <div
                    key={word.id}
                    className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-100 text-sm">{word.word}</span>
                        <span className="text-xs text-slate-400 font-mono">{word.phonetic}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-medium">
                        {word.translation}
                      </div>
                    </div>
                    <button
                      onClick={() => soundManager.speakWord(word.word)}
                      className="p-1.5 text-purple-400 hover:bg-purple-900/60 rounded-full transition-colors"
                      title="朗读发音"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Flip Review Modal for furnace words */}
      {showFlipReview && (
        <WordFlipReviewModal
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onClose={() => setShowFlipReview(false)}
          initialFilter={furnaceWords.length > 0 ? 'furnace' : 'all'}
        />
      )}

      {/* Import / Export Modal */}
      {showImportExport && (
        <WordImportExportModal
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onClose={() => setShowImportExport(false)}
          initialTab="export"
        />
      )}
    </div>
  );
};
