import React, { useState } from 'react';
import { Shield, Sparkles, Plus, Hammer, ChevronRight, Check, Users } from 'lucide-react';
import { PlayerProfile, StatType, Equipment, CardItem } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface EquipmentScreenProps {
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onOpenFurnace: () => void;
  onOpenUserModal?: () => void;
}

export const EquipmentScreen: React.FC<EquipmentScreenProps> = ({
  profile,
  onUpdateProfile,
  onOpenFurnace,
  onOpenUserModal,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<'weapon' | 'armor' | 'headgear' | 'accessory'>('weapon');
  const [showSocketModal, setShowSocketModal] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState<string | null>(null);

  // Allocate Stat point
  const handleAddStat = (stat: StatType) => {
    if (profile.statPoints <= 0) return;
    soundManager.playClick();
    onUpdateProfile((prev) => {
      const nextStats = {
        ...prev.stats,
        [stat]: prev.stats[stat] + 1,
      };
      // Recalculate Max HP if VIT was increased
      const nextMaxHp = 180 + nextStats.vit * 25 + (prev.equipment.armor?.hpBonus || 0);
      return {
        ...prev,
        statPoints: prev.statPoints - 1,
        stats: nextStats,
        maxHp: nextMaxHp,
        hp: Math.min(prev.hp + (stat === 'vit' ? 25 : 0), nextMaxHp),
      };
    });
  };

  // Blacksmith Refinement
  const handleRefineEquipment = (slot: 'weapon' | 'armor' | 'headgear' | 'accessory') => {
    const item = profile.equipment[slot];
    if (!item) return;

    if (profile.refineStones < 1) {
      setRefineFeedback('缺少记忆精炼石！请前往卡普拉回炉所复习单词获取！');
      soundManager.playWrong();
      setTimeout(() => setRefineFeedback(null), 2500);
      return;
    }

    if (item.refineLevel >= 10) {
      setRefineFeedback('该装备已达到最高精炼上限 (+10)！');
      setTimeout(() => setRefineFeedback(null), 2000);
      return;
    }

    // Refinement success!
    soundManager.playLevelUp();
    const nextLevel = item.refineLevel + 1;
    const nextAtk = item.atkBonus ? item.atkBonus + 6 : undefined;
    const nextDef = item.defBonus ? item.defBonus + 4 : undefined;
    const nextHp = item.hpBonus ? item.hpBonus + 25 : undefined;

    onUpdateProfile((prev) => {
      const updatedItem: Equipment = {
        ...item,
        refineLevel: nextLevel,
        atkBonus: nextAtk,
        defBonus: nextDef,
        hpBonus: nextHp,
      };
      return {
        ...prev,
        refineStones: prev.refineStones - 1,
        equipment: {
          ...prev.equipment,
          [slot]: updatedItem,
        },
      };
    });

    setRefineFeedback(`精炼成功！【${item.name}】提升至 +${nextLevel}！`);
    setTimeout(() => setRefineFeedback(null), 2500);
  };

  // Socket Card into slot
  const handleSocketCard = (card: CardItem) => {
    const currentEquip = profile.equipment[selectedSlot];
    if (!currentEquip) return;

    soundManager.playLevelUp();
    onUpdateProfile((prev) => {
      const updatedEquip: Equipment = {
        ...currentEquip,
        slottedCard: card,
      };
      // Remove slotted card from loose cards
      const nextCards = prev.cards.filter((c) => c.id !== card.id);
      return {
        ...prev,
        equipment: {
          ...prev.equipment,
          [selectedSlot]: updatedEquip,
        },
        cards: nextCards,
      };
    });
    setShowSocketModal(false);
  };

  const currentEquippedItem = profile.equipment[selectedSlot];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-6 pb-20">
      {/* Character Profile & RO Stats Allocation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/90 dark:border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-2xl md:text-3xl shadow-sm shrink-0">
              {profile.avatar || '⚔️'}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base md:text-lg">{profile.name}</h3>
                <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold">
                  Lv.{profile.level} 初心者
                </span>
                {onOpenUserModal && (
                  <button
                    onClick={onOpenUserModal}
                    className="text-[10px] md:text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="切换或管理学习角色/用户档案"
                  >
                    <Users className="w-3 h-3" />
                    <span>多用户</span>
                  </button>
                )}
              </div>
              <div className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                经验: {profile.exp} / {profile.maxExp} | 拥有金币: <span className="text-amber-600 dark:text-amber-400 font-bold">{profile.zeny} Zeny</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold">可用属性点</div>
            <div className="text-lg md:text-2xl font-black text-purple-600 dark:text-purple-400">
              {profile.statPoints} 点
            </div>
          </div>
        </div>

        {/* 6 Core Ragnarok Stats Grid - 2 cols on mobile, 3 cols on tablet/PC */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3 mt-3.5">
          {[
            { key: 'str', name: 'STR 力量', val: profile.stats.str, desc: '提升答题攻击与暴击伤害' },
            { key: 'agi', name: 'AGI 敏捷', val: profile.stats.agi, desc: '延长答题思考倒计时(+0.4s)' },
            { key: 'vit', name: 'VIT 体质', val: profile.stats.vit, desc: '增加最大生命值与伤害减免' },
            { key: 'int', name: 'INT 智力', val: profile.stats.int, desc: '提升连击Combo金币与经验' },
            { key: 'dex', name: 'DEX 灵巧', val: profile.stats.dex, desc: '概率自动剔除1个错误选项' },
            { key: 'luk', name: 'LUK 幸运', val: profile.stats.luk, desc: '提升暴击率与稀有卡片掉落' },
          ].map((stat) => (
            <div
              key={stat.key}
              className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-2.5 md:p-3 border border-slate-200/80 dark:border-slate-750 flex items-center justify-between"
            >
              <div>
                <div className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">{stat.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">{stat.desc}</div>
              </div>
              <div className="flex items-center space-x-1.5 pl-2 shrink-0">
                <span className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100">{stat.val}</span>
                {profile.statPoints > 0 && (
                  <button
                    onClick={() => handleAddStat(stat.key as StatType)}
                    className="w-5 h-5 rounded-full bg-purple-600 dark:bg-purple-500 text-white flex items-center justify-center hover:bg-purple-700 active:scale-95 shadow-xs"
                    title="加点"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment Slots Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-3.5">
          <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-sky-500" />
            <span>冒险者配装与卡片插槽</span>
          </h4>
          <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            精炼石: <span className="font-bold text-purple-600 dark:text-purple-400">{profile.refineStones} 颗</span>
          </span>
        </div>

        {/* 4 Equipment Slot Selectors */}
        <div className="grid grid-cols-4 gap-2 md:gap-3 mb-4">
          {(['weapon', 'armor', 'headgear', 'accessory'] as const).map((slot) => {
            const item = profile.equipment[slot];
            const isSelected = selectedSlot === slot;
            const slotLabels = {
              weapon: '武器',
              armor: '铠甲',
              headgear: '头饰',
              accessory: '饰品',
            };

            return (
              <button
                key={slot}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedSlot(slot);
                }}
                className={`flex flex-col items-center p-2.5 md:p-3 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-2xl md:text-3xl mb-1">{item?.icon || '📦'}</div>
                <span className="text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-200">
                  {slotLabels[slot]}
                </span>
                {item && item.refineLevel > 0 && (
                  <span className="text-[9px] md:text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-1 rounded-sm mt-0.5">
                    +{item.refineLevel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Slot Detailed Panel */}
        {currentEquippedItem ? (
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 md:p-4 border border-slate-200/80 dark:border-slate-750 space-y-3.5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl md:text-2xl">{currentEquippedItem.icon}</span>
                  <span className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base">
                    {currentEquippedItem.refineLevel > 0 ? `+${currentEquippedItem.refineLevel} ` : ''}
                    {currentEquippedItem.name}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentEquippedItem.description}
                </div>
              </div>

              {/* Refinement Level Badge */}
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 uppercase">
                  {currentEquippedItem.rarity}
                </span>
              </div>
            </div>

            {/* Current Attributes */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {currentEquippedItem.atkBonus && (
                <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-md">
                  攻击力: +{currentEquippedItem.atkBonus}
                </span>
              )}
              {currentEquippedItem.defBonus && (
                <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md">
                  防御力: +{currentEquippedItem.defBonus}
                </span>
              )}
              {currentEquippedItem.hpBonus && (
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  生命值: +{currentEquippedItem.hpBonus}
                </span>
              )}
              {currentEquippedItem.critBonus && (
                <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md">
                  暴击率: +{currentEquippedItem.critBonus}%
                </span>
              )}
            </div>

            {/* Slotted Card Section */}
            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>插槽卡片</span>
                </span>
                <button
                  onClick={() => setShowSocketModal(true)}
                  className="text-xs md:text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold"
                >
                  {currentEquippedItem.slottedCard ? '更换卡片' : '+ 镶嵌RO魔物卡'}
                </button>
              </div>

              {currentEquippedItem.slottedCard ? (
                <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-purple-900 dark:text-purple-200">
                      [{currentEquippedItem.slottedCard.name}]
                    </span>
                    <span className="text-purple-700 dark:text-purple-300 ml-1.5 text-[11px]">
                      {currentEquippedItem.slottedCard.description}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                  暂无插卡 (可击败魔物或挑战BOSS获得魔物专属卡片)
                </div>
              )}
            </div>

            {/* Blacksmith Refine Action */}
            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Hammer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>忽克连铁匠铺精炼</span>
                </div>
                <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                  消耗 1 颗记忆精炼石 (当前: {profile.refineStones})
                </div>
              </div>

              <button
                onClick={() => handleRefineEquipment(selectedSlot)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1"
              >
                <span>强化精炼</span>
              </button>
            </div>

            {refineFeedback && (
              <div className="text-xs text-center font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 p-2 rounded-xl animate-bounce">
                {refineFeedback}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-6">未装备</div>
        )}
      </div>

      {/* Socket Card Modal */}
      {showSocketModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm md:max-w-md w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-scaleUp">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/90 dark:border-slate-800">
              <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>选择镶嵌卡片 ({selectedSlot})</span>
              </h4>
              <button
                onClick={() => setShowSocketModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {profile.cards.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                背包中暂无闲置卡片，前往击败魔物或挑战关底BOSS掉落吧！
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {profile.cards.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSocketCard(c)}
                    className="w-full text-left p-2.5 md:p-3 rounded-xl border border-purple-100 dark:border-purple-900/60 hover:border-purple-300 dark:hover:border-purple-700 bg-purple-50/40 dark:bg-purple-950/30 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-all flex items-start justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs md:text-sm text-purple-900 dark:text-purple-200 flex items-center gap-1">
                        <span>{c.name}</span>
                        <span className="text-[9px] uppercase bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1 rounded-sm">
                          {c.rarity}
                        </span>
                      </div>
                      <div className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {c.description}
                      </div>
                    </div>
                    <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
