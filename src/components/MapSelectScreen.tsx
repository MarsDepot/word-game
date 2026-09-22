import React, { useState, useMemo } from 'react';
import {
  Compass,
  Swords,
  Sparkles,
  BookOpen,
  Sliders,
  CheckCircle2,
  ChevronRight,
  Flame,
  Info,
  Layers,
  Minus,
  Plus,
} from 'lucide-react';
import { GameMap, PlayerProfile } from '../types/game';
import {
  MAP_TYPE_DEFINITIONS,
  MapTypeDefinition,
  MapTypeId,
  selectWordsForBattle,
  buildDynamicGameMap,
} from '../data/mapTypes';
import { MonsterAvatar } from './MonsterAvatar';
import { soundManager } from '../audio/soundManager';
import { getMasteryStats } from '../utils/wordMastery';

interface MapSelectScreenProps {
  profile: PlayerProfile;
  onUpdateProfile?: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onSelectMap: (map: GameMap) => void;
}

export const MapSelectScreen: React.FC<MapSelectScreenProps> = ({
  profile,
  onUpdateProfile,
  onSelectMap,
}) => {
  // Current chosen map type (defaults to profile.selectedMapType or 'solace')
  const [selectedMapId, setSelectedMapId] = useState<MapTypeId>(
    (profile.selectedMapType as MapTypeId) || 'solace'
  );

  // Current words per battle round (defaults to profile.wordsPerBattle or 20)
  const currentWordsCount = profile.wordsPerBattle || 20;

  // Active map definition
  const selectedDef = useMemo<MapTypeDefinition>(() => {
    return (
      MAP_TYPE_DEFINITIONS.find((m) => m.id === selectedMapId) ||
      MAP_TYPE_DEFINITIONS[0]
    );
  }, [selectedMapId]);

  // Overall dictionary stats
  const poolStats = useMemo(() => {
    return getMasteryStats(profile.learnedWords || {});
  }, [profile.learnedWords]);

  // Compute selected words preview for current map & count
  const selectionPreview = useMemo(() => {
    return selectWordsForBattle(
      profile.learnedWords || {},
      selectedMapId,
      currentWordsCount
    );
  }, [profile.learnedWords, selectedMapId, currentWordsCount]);

  // Handle changing map type
  const handleSelectMapType = (mapId: MapTypeId) => {
    soundManager.playClick();
    setSelectedMapId(mapId);
    if (onUpdateProfile) {
      onUpdateProfile((prev) => ({
        ...prev,
        selectedMapType: mapId,
      }));
    }
  };

  // Handle updating word count per battle
  const handleSetWordsPerBattle = (count: number) => {
    soundManager.playClick();
    const clamped = Math.max(5, Math.min(100, count));
    if (onUpdateProfile) {
      onUpdateProfile((prev) => ({
        ...prev,
        wordsPerBattle: clamped,
      }));
    }
  };

  // Launch Battle with dynamically assembled GameMap
  const handleLaunchBattle = () => {
    soundManager.playCorrect();
    const dynamicMap = buildDynamicGameMap(selectedDef, selectionPreview.words);
    onSelectMap(dynamicMap);
  };

  // Helper to separate Chinese name and English subtitle
  const parseMapName = (rawName: string) => {
    const match = rawName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { zh: match[1], en: `(${match[2]})` };
    }
    return { zh: rawName, en: '' };
  };

  return (
    <div className="flex-1 flex flex-col p-3.5 md:p-6 overflow-y-auto space-y-4 pb-20">
      {/* Top Banner - Single Unified Map Entrance */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-3xl p-4 md:p-5 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-100">
            <Compass className="w-4 h-4 text-emerald-200" />
            <span>卢恩·米德加尔特 冒险讨伐入口</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-wide">
            选择地图类型 · 开启出战
          </h2>
          <p className="text-xs text-emerald-50 opacity-90 max-w-xl leading-relaxed">
            统一单词库智能分流出题。四种地图类型拥有不同的掌握度抽取算法，可自由修改每局出战词数。
          </p>

          {/* Quick Mastery Status in Word Pool */}
          <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-bold">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-white backdrop-blur-xs">
              词库总计: {poolStats.total} 词
            </span>
            <span className="bg-emerald-500/80 px-2.5 py-0.5 rounded-full text-white">
              已掌握: {poolStats.mastered} 词
            </span>
            <span className="bg-amber-500/80 px-2.5 py-0.5 rounded-full text-white">
              熟悉: {poolStats.familiar} 词
            </span>
            <span className="bg-sky-500/80 px-2.5 py-0.5 rounded-full text-white">
              全新: {poolStats.new} 词
            </span>
          </div>
        </div>

        {/* Decorative backdrop glow */}
        <div className="absolute -right-8 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Configuration Card: Words Per Battle (Requirement 6) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 rounded-xl">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm md:text-base text-slate-800 dark:text-slate-100">
                每局单词数量配置
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                可自由设置单局讨伐考核的单词题量（建议 20~50 词）
              </p>
            </div>
          </div>

          {/* Stepper with - and + */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => handleSetWordsPerBattle(currentWordsCount - 10)}
              disabled={currentWordsCount <= 10}
              className={`p-1.5 rounded-xl transition-colors ${
                currentWordsCount <= 10
                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs'
              }`}
              title="减少 10 词"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="font-black text-sm md:text-base text-emerald-600 dark:text-emerald-400 px-3 font-mono min-w-[50px] text-center">
              {currentWordsCount} 词
            </span>

            <button
              onClick={() => handleSetWordsPerBattle(currentWordsCount + 10)}
              disabled={currentWordsCount >= 100}
              className={`p-1.5 rounded-xl transition-colors ${
                currentWordsCount >= 100
                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs'
              }`}
              title="增加 10 词"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick word count chip buttons: 20, 30, 40, 50 */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold mr-1">快捷预设:</span>
          {[20, 30, 40, 50].map((num) => (
            <button
              key={num}
              onClick={() => handleSetWordsPerBattle(num)}
              className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all ${
                currentWordsCount === num
                  ? 'bg-purple-600 text-white shadow-xs scale-105'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {num} 词
            </button>
          ))}
        </div>
      </div>

      {/* Map Type Options - Grid of 4 Types (Requirement 3) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-sm md:text-base text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
            <span>🗺️</span>
            <span>选择出战地图类型</span>
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            点击切换当前讨伐模式
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MAP_TYPE_DEFINITIONS.map((def) => {
            const isSelected = def.id === selectedMapId;
            return (
              <div
                key={def.id}
                onClick={() => handleSelectMapType(def.id)}
                className={`relative rounded-3xl p-4.5 border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950/80 shadow-md'
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0">
                        MAP 0{def.index}
                      </span>
                      <h4 className="font-black text-base text-slate-850 dark:text-slate-100 flex items-baseline gap-1 whitespace-nowrap min-w-0">
                        <span>{parseMapName(def.name).zh}</span>
                        {parseMapName(def.name).en && (
                          <span className="text-xs font-normal text-slate-400 dark:text-slate-400 font-sans tracking-tight">
                            {parseMapName(def.name).en}
                          </span>
                        )}
                      </h4>
                    </div>

                    {isSelected ? (
                      <span className="flex items-center space-x-1 px-2.5 py-0.8 bg-emerald-100 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已选定</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        点击选择
                      </span>
                    )}
                  </div>

                  {/* Ratio Tag (Exact user requirements displayed prominently) */}
                  <div className="mb-2.5">
                    <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                      🎯 {def.ratioDescription}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {def.description}
                  </p>
                </div>

                {/* Boss & Monsters Mini Preview */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">
                      {def.boss.avatar}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      关底BOSS: <span className="font-bold text-slate-800 dark:text-slate-200">{def.boss.name.split(' ')[0]}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    3 波次迎战
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Battle Preparation Box: Selected Map Breakdown & Launch Button */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-5 border-2 border-emerald-500/40 dark:border-emerald-600/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2 min-w-0 flex-nowrap">
              <span className="text-lg md:text-xl shrink-0">⚔️</span>
              <h3 className="font-black text-sm sm:text-base md:text-lg text-slate-850 dark:text-slate-100 flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden">
                <span>出战准备 · {parseMapName(selectedDef.name).zh}</span>
                {parseMapName(selectedDef.name).en && (
                  <span className="text-[11px] sm:text-xs font-normal text-slate-400 dark:text-slate-400 font-sans tracking-tight">
                    {parseMapName(selectedDef.name).en}
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              本局将精选 <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectionPreview.words.length}</span> 个单词投入战斗，配比如下：
            </p>
          </div>

          {/* Current Selection Word Count Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              已掌握: {selectionPreview.stats.mastered} 词
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              熟悉: {selectionPreview.stats.familiar} 词
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              全新: {selectionPreview.stats.new} 词
            </span>
          </div>
        </div>

        {/* Visual Distribution Ratio Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          {selectionPreview.words.length > 0 && (
            <>
              <div
                style={{
                  width: `${(selectionPreview.stats.mastered / selectionPreview.words.length) * 100}%`,
                }}
                className="h-full bg-emerald-500 transition-all duration-300"
                title={`已掌握 ${selectionPreview.stats.mastered} 词`}
              />
              <div
                style={{
                  width: `${(selectionPreview.stats.familiar / selectionPreview.words.length) * 100}%`,
                }}
                className="h-full bg-amber-500 transition-all duration-300"
                title={`熟悉 ${selectionPreview.stats.familiar} 词`}
              />
              <div
                style={{
                  width: `${(selectionPreview.stats.new / selectionPreview.words.length) * 100}%`,
                }}
                className="h-full bg-sky-500 transition-all duration-300"
                title={`全新 ${selectionPreview.stats.new} 词`}
              />
            </>
          )}
        </div>

        {/* Primary Action Button: Enter Battle */}
        <button
          onClick={handleLaunchBattle}
          className="w-full py-3.5 md:py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl font-black text-xs sm:text-sm md:text-base tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-1.5 active:scale-98 whitespace-nowrap overflow-hidden px-3"
        >
          <Swords className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
          <span className="flex items-baseline space-x-1 truncate">
            <span>开启讨伐 · 进军</span>
            <strong className="font-black">{parseMapName(selectedDef.name).zh}</strong>
            {parseMapName(selectedDef.name).en && (
              <span className="text-[11px] md:text-xs font-normal opacity-85 font-sans">
                {parseMapName(selectedDef.name).en}
              </span>
            )}
            <span className="font-bold">({selectionPreview.words.length} 词)</span>
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
