import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Swords,
  Shield,
  Flame,
  Zap,
  HelpCircle,
  Keyboard,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Layers,
  Heart,
  Timer,
  BookMarked
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GameManualModalProps {
  onClose: () => void;
}

type ManualSection = 'syllabus' | 'battle' | 'stats' | 'furnace' | 'shortcuts';

export const GameManualModal: React.FC<GameManualModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<ManualSection>('syllabus');

  const handleClose = () => {
    soundManager.playClick();
    onClose();
  };

  const handleTabChange = (tab: ManualSection) => {
    soundManager.playClick();
    setActiveTab(tab);
  };

  return (
    <div
      id="game-manual-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        id="game-manual-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 md:px-6 py-3.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-sky-500/10 dark:from-amber-950/30 dark:via-emerald-950/30 dark:to-sky-950/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                仙境考纲·冒险者使用说明书
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300/60 dark:border-amber-700/60">
                  上海中考全4单元
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                初中英语考纲备战指南 · 战斗答题机制 · 六维加点与错题复习
              </p>
            </div>
          </div>

          <button
            id="btn-close-manual"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="关闭说明书"
            aria-label="关闭说明书"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-3 md:px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex space-x-1 md:space-x-2 overflow-x-auto no-scrollbar">
          <button
            id="tab-manual-syllabus"
            onClick={() => handleTabChange('syllabus')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'syllabus'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>考纲4单元</span>
          </button>

          <button
            id="tab-manual-battle"
            onClick={() => handleTabChange('battle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'battle'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>战斗与答题</span>
          </button>

          <button
            id="tab-manual-stats"
            onClick={() => handleTabChange('stats')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'stats'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>六维属性配点</span>
          </button>

          <button
            id="tab-manual-furnace"
            onClick={() => handleTabChange('furnace')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'furnace'
                ? 'bg-purple-500 text-white shadow-sm shadow-purple-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>回炉错题库</span>
          </button>

          <button
            id="tab-manual-shortcuts"
            onClick={() => handleTabChange('shortcuts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'shortcuts'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>快捷键指南</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 text-xs md:text-sm leading-relaxed">
          {/* TAB 1: 考纲四单元 */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
                <div className="flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                      官方全体系权威收录 (2026年上海市中考规格)
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                      本游戏严格依据上海市教育考试院及新课标规范，将初中英语考纲分为 4 大权威单元与 1 个综合满分冲刺决战场：
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Unit 1 */}
                <div className="p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      第一单元 · 考纲手册核心词
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-md">
                      普隆德拉原野
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>词源出处：</strong>《上海市初中毕业统一学业考试考试手册》考纲单词与词组。
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    重点包含初中核心生活品格、日常交际、情感态度与基础语法高频动词。
                  </p>
                </div>

                {/* Unit 2 */}
                <div className="p-3 rounded-xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      第二单元 · 课标三级拓展词
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 rounded-md">
                      沉没之船海风港
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>词源出处：</strong>教育部《义务教育英语课程标准》三级词汇（2022年版）。
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    涵盖自然风光、跨文化旅行、现代交通与地理环境核心认知词汇。
                  </p>
                </div>

                {/* Unit 3 */}
                <div className="p-3 rounded-xl border border-green-200/80 dark:border-green-900/60 bg-green-50/40 dark:bg-green-950/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-green-800 dark:text-green-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      第三单元 · 学科教学基本要求
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 rounded-md">
                      哥布灵繁花密林
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>词源出处：</strong>《上海市初中英语学科教学基本要求（试验本）》。
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    侧重生特环保、社区生活、人际交往、社会服务与高阶动宾搭配。
                  </p>
                </div>

                {/* Unit 4 */}
                <div className="p-3 rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      第四单元 · 沪教版新教材词汇
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-md">
                      吉芬魔法地下城
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>词源出处：</strong>上海初中最新沪教版六、七年级新教材重点词汇。
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    涵盖科学技术探索、信息素养、人工智能与跨学科阅读高频词。
                  </p>
                </div>
              </div>

              {/* Final Battle */}
              <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    👑 终极试炼 · 克雷斯特汉姆古城 (2026全四单元综合大决战)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 rounded-md">
                    Lv.25 开启
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  融汇第一至第四单元全部高难度辨析词与逻辑推理词汇，中考满分冲刺必修！
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: 战斗与答题 */}
          {activeTab === 'battle' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold mb-1.5">
                    <Swords className="w-4 h-4" />
                    <span>快速反应与暴击斩击</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    进入战斗后，魔物会出示单词与四个中文含义。答对即刻发动攻击；剩余倒计时越多，额外速度伤害加成越高！
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold mb-1.5">
                    <Zap className="w-4 h-4" />
                    <span>连击 (Combo) 暴击机制</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    连续答对题目将累计 Combo 连击数！达到 2 连击、5 连击、10 连击时，暴击几率、金币收益与经验值呈阶梯倍率激增！
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-bold mb-1.5">
                    <Layers className="w-4 h-4" />
                    <span>选项随机化与精准核验</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    每次加载题目均使用经典 Fisher-Yates 算法打乱选项次序，彻底防止死记位置。判定逻辑双向比对语义，保证答题精确公正。
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold mb-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>怪物反击与 HP 扣除</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    答错或超时倒计时耗尽，魔物将发起凶猛反扑并扣除玩家生命值。答错的单词会自动录入卡普拉复习熔炉。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 六维属性配点 */}
          {activeTab === 'stats' && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-150">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                每次升级或击败 BOSS 将获得自由属性点数 (Stat Points)，可在「加点配装」界面自由定制培养流派：
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* STR */}
                <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                    STR
                  </div>
                  <div>
                    <div className="font-bold text-rose-900 dark:text-rose-200 text-xs">
                      力量 · 物理斩击威力
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      每点提升 <strong className="text-rose-600 dark:text-rose-400">+2 攻击力 (ATK)</strong>。大幅提升单次答对对怪物的生命扣减，更快击倒高血量 BOSS。
                    </div>
                  </div>
                </div>

                {/* AGI */}
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                    AGI
                  </div>
                  <div>
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                      敏捷 · 答题时间与闪避
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      每点延长 <strong className="text-emerald-600 dark:text-emerald-400">+0.15 秒答题宽限</strong>，并提升受击时的闪避概率。慢热记词选手的福音！
                    </div>
                  </div>
                </div>

                {/* VIT */}
                <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/60 flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                    VIT
                  </div>
                  <div>
                    <div className="font-bold text-sky-900 dark:text-sky-200 text-xs">
                      体质 · 生命上限与防御
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      每点提升 <strong className="text-sky-600 dark:text-sky-400">+25 最大生命值 (HP)</strong>，降低受到的伤害。极大增加挑战时的容错率。
                    </div>
                  </div>
                </div>

                {/* INT */}
                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                    INT
                  </div>
                  <div>
                    <div className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                      智力 · 收益与升级加速
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      提升每道题的 <strong className="text-indigo-600 dark:text-indigo-400">经验值与金币 Zeny 加成</strong>，大幅加快人物升级与买药成型速度。
                    </div>
                  </div>
                </div>

                {/* DEX */}
                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                    DEX
                  </div>
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                      灵巧 · 识破主动技能
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      赋予战斗专属技能 <strong className="text-amber-600 dark:text-amber-400">「神圣识破」</strong>，每场战斗可主动使用，瞬间剔除一个错误干扰项！
                    </div>
                  </div>
                </div>

                {/* LUK */}
                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/60 flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                    LUK
                  </div>
                  <div>
                    <div className="font-bold text-purple-900 dark:text-purple-200 text-xs">
                      幸运 · 暴击与掉宝率
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      提升 <strong className="text-purple-600 dark:text-purple-400">+1% 物理暴击率</strong>，并大幅提高击杀魔物后掉落稀有魔物卡片的几率。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 回炉错题库 */}
          {activeTab === 'furnace' && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-150">
              <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 flex items-start space-x-2.5">
                <Flame className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-purple-950 dark:text-purple-200 text-sm">
                    卡普拉回炉复习熔炉 (艾宾浩斯智能强化)
                  </h3>
                  <p className="text-purple-700 dark:text-purple-300 text-xs mt-1">
                    在冒险探索中答错的任何单词，都会被卡普拉女仆安全收录进专属回炉熔炉。
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>单词闪卡翻转 (Flashcard)：</strong>
                    提供中英快速翻面、词性标注、全真音标及中考典型搭配，利用碎片时间高效温习。
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>高炉回炉精炼 (Furnace Quiz)：</strong>
                    专门针对错题进行专项实战测试。每答对一次增加记忆熟练度，满熟练度后即可将错词移出熔炉。
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>词库导入与导出 (Import & Export)：</strong>
                    支持导出当前错题本为 JSON，或导入教师布置的中考特色强化生词包。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: 快捷键指南 */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-150">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                PC 网页端或连接蓝牙键盘时，可使用以下无延迟快捷按键：
              </p>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    答题选择选项 A / B / C / D
                  </span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono font-bold shadow-xs">
                      1
                    </kbd>
                    <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono font-bold shadow-xs">
                      2
                    </kbd>
                    <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono font-bold shadow-xs">
                      3
                    </kbd>
                    <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono font-bold shadow-xs">
                      4
                    </kbd>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    使用「DEX 神圣识破」技能
                  </span>
                  <kbd className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono font-bold shadow-xs">
                    Space 空格键
                  </kbd>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    关闭当前弹窗 / 说明书
                  </span>
                  <kbd className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono font-bold shadow-xs">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            祝各位初中冒险者中考英语斩获满分！🌟
          </span>
          <button
            id="btn-manual-confirm-ok"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            开始冒险
          </button>
        </div>
      </div>
    </div>
  );
};
