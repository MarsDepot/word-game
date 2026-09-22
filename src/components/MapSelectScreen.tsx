import React from 'react';
import { Compass, Lock, CheckCircle2, Skull, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { GameMap, PlayerProfile } from '../types/game';
import { GAME_MAPS } from '../data/words';
import { MonsterAvatar } from './MonsterAvatar';
import { soundManager } from '../audio/soundManager';

interface MapSelectScreenProps {
  profile: PlayerProfile;
  onSelectMap: (map: GameMap) => void;
}

export const MapSelectScreen: React.FC<MapSelectScreenProps> = ({
  profile,
  onSelectMap,
}) => {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 pb-20">
      {/* Top Banner */}
      <div className="bg-emerald-600 dark:bg-emerald-800 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-100 mb-1">
            <Compass className="w-4 h-4" />
            <span>卢恩·米德加尔特 冒险地图</span>
          </div>
          <h2 className="text-xl font-black tracking-wide">
            选择词包地图 · 开启讨伐
          </h2>
          <p className="text-xs text-emerald-50 mt-1 opacity-95 leading-relaxed">
            不同地图蕴含不同难度的核心词汇。击破普通魔物积累连击，挑战关底BOSS赢取极品卡片与神装！
          </p>
        </div>
        {/* Soft background decorative shape */}
        <div className="absolute -right-6 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

              {/* Map Cards List - 1 col on mobile, 2 col on tablet/desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {GAME_MAPS.map((map, index) => {
                  const isUnlocked = profile.unlockedMapIds.includes(map.id);
                  const isBossDefeated = profile.defeatedBosses.includes(map.boss.id);

                  // Calculate mastered words in this map
                  const mapWords = map.availableWords;
                  const masteredCount = mapWords.filter(
                    (w) => (profile.learnedWords[w.id]?.mastery || 0) >= 3
                  ).length;

                  return (
                    <div
                      key={map.id}
                      className={`relative rounded-3xl p-4.5 border-2 transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                        isUnlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-md'
                          : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-65'
                      }`}
                    >
                      {/* Card Top */}
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                MAP 0{index + 1}
                              </span>
                              <h3 className="font-black text-base text-slate-800 dark:text-slate-100">
                                {map.name}
                              </h3>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                              {map.subtitle}
                            </div>
                          </div>

                          {isBossDefeated ? (
                            <span className="flex items-center space-x-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[11px] font-black rounded-full shadow-xs shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>已讨伐通关</span>
                            </span>
                          ) : !isUnlocked ? (
                            <span className="flex items-center space-x-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-full shrink-0">
                              <Lock className="w-3.5 h-3.5" />
                              <span>需先通关上一图</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full shrink-0">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>挑战中</span>
                            </span>
                          )}
                        </div>

                        {/* Word Pack details */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-2.5 mb-3 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                            <BookOpen className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                            <span className="font-medium">{map.wordPackName}</span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 font-bold">
                            熟练度: <span className="text-emerald-600 dark:text-emerald-400">{masteredCount}</span> / {mapWords.length} 词
                          </div>
                        </div>
                      </div>

                      {/* Monster Preview List */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center space-x-2">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">出没魔物:</div>
                          <div className="flex items-center space-x-1.5">
                            {map.monsters.map((m) => (
                              <span
                                key={m.id}
                                className="text-lg bg-slate-100 dark:bg-slate-800 rounded-lg p-1"
                                title={`${m.name} (${m.title})`}
                              >
                                {m.avatar}
                              </span>
                            ))}
                            <span className="text-xs text-slate-300 dark:text-slate-700">|</span>
                            <span
                              className="text-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-1"
                              title={`关底BOSS: ${map.boss.name}`}
                            >
                              {map.boss.avatar}
                            </span>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <button
                            id={`btn-enter-map-${map.id}`}
                            onClick={() => {
                              soundManager.playClick();
                              onSelectMap(map);
                            }}
                            className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1 shrink-0"
                          >
                            <span>出发讨伐</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="py-1.5 px-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed shrink-0"
                          >
                            未解锁
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
    </div>
  );
};
