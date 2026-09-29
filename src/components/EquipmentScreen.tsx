import React, { useState } from 'react';
import { Shield, Sparkles, Plus, Hammer, ChevronRight, Check, Users, RefreshCw, Package } from 'lucide-react';
import { PlayerProfile, StatType, Equipment, CardItem } from '../types/game';
import { ALL_RO_EQUIPMENT } from '../data/words';
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
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'weapon' | 'armor' | 'headgear' | 'accessory'>('all');
  const [showSocketModal, setShowSocketModal] = useState(false);
  const [showSwapEquipModal, setShowSwapEquipModal] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState<string | null>(null);

  const slotLabels: Record<'weapon' | 'armor' | 'headgear' | 'accessory', string> = {
    weapon: '武器',
    armor: '铠甲',
    headgear: '头饰',
    accessory: '饰品',
  };

  // Equip / Replace an item from inventory into its corresponding slot (returns old item to inventory)
  const handleEquipItem = (targetItem: Equipment) => {
    const slot = targetItem.slot;
    const currentEquip = profile.equipment[slot];
    if (currentEquip && currentEquip.id === targetItem.id) return;

    soundManager.playLevelUp();
    setSelectedSlot(slot);

    onUpdateProfile((prev) => {
      const oldEquip = prev.equipment[slot];
      // Find the actual instance in inventory (preserving any refineLevel it has)
      const invInstance = prev.inventory.find((i) => i.id === targetItem.id) || targetItem;

      // Inherit slotted card from old equipment if the new equipment doesn't have one
      const inheritedCard = invInstance.slottedCard || oldEquip?.slottedCard || null;
      const nextEquipped: Equipment = {
        ...invInstance,
        slottedCard: inheritedCard,
      };

      // Remove newly equipped item from inventory and return old equipped item to inventory (without duplicate card)
      let nextInventory = prev.inventory.filter((i) => i.id !== invInstance.id);
      if (oldEquip) {
        const returnedOldEquip: Equipment = {
          ...oldEquip,
          slottedCard: invInstance.slottedCard ? oldEquip.slottedCard : null,
        };
        if (!nextInventory.some((i) => i.id === returnedOldEquip.id)) {
          nextInventory = [returnedOldEquip, ...nextInventory];
        }
      }

      const nextEquipment = {
        ...prev.equipment,
        [slot]: nextEquipped,
      };

      const totalEquipHp =
        (nextEquipment.armor?.hpBonus || 0) +
        (nextEquipment.headgear?.hpBonus || 0) +
        (nextEquipment.accessory?.hpBonus || 0);
      const nextMaxHp = 180 + prev.stats.vit * 25 + totalEquipHp;

      return {
        ...prev,
        equipment: nextEquipment,
        inventory: nextInventory,
        maxHp: nextMaxHp,
        hp: Math.min(nextMaxHp, Math.max(1, prev.hp + (nextMaxHp - prev.maxHp))),
      };
    });

    setShowSwapEquipModal(false);
    if (currentEquip) {
      const cardMsg = currentEquip.slottedCard ? '（插槽卡片已自动继承）' : '';
      setRefineFeedback(`已将【${currentEquip.name}】替换为【${targetItem.name}】，原装备已放回背包${cardMsg}！`);
    } else {
      setRefineFeedback(`成功穿戴【${targetItem.name}】！`);
    }
    setTimeout(() => setRefineFeedback(null), 2800);
  };

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

  // Socket or Replace Card in slot (returns previous slotted card back to profile.cards)
  const handleSocketCard = (card: CardItem) => {
    const currentEquip = profile.equipment[selectedSlot];
    if (!currentEquip) return;

    soundManager.playLevelUp();
    const prevSlotted = currentEquip.slottedCard;

    onUpdateProfile((prev) => {
      const targetEquip = prev.equipment[selectedSlot];
      if (!targetEquip) return prev;

      const previousCard = targetEquip.slottedCard;
      const updatedEquip: Equipment = {
        ...targetEquip,
        slottedCard: card,
      };

      // Remove newly slotted card from loose cards
      let nextCards = prev.cards.filter((c) => c.id !== card.id);

      // Put the replaced card back into loose cards instead of deleting it
      if (
        previousCard &&
        previousCard.id !== card.id &&
        !nextCards.some((c) => c.id === previousCard.id)
      ) {
        nextCards = [previousCard, ...nextCards];
      }

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
    if (prevSlotted && prevSlotted.id !== card.id) {
      setRefineFeedback(`已将【${prevSlotted.name}】替换为【${card.name}】，原卡片已放回背包！`);
    } else {
      setRefineFeedback(`成功镶嵌【${card.name}】！`);
    }
    setTimeout(() => setRefineFeedback(null), 2500);
  };

  // Unsocket Card from current equipment slot back to loose cards
  const handleUnsocketCard = () => {
    const currentEquip = profile.equipment[selectedSlot];
    if (!currentEquip || !currentEquip.slottedCard) return;

    const removedCard = currentEquip.slottedCard;
    soundManager.playClick();

    onUpdateProfile((prev) => {
      const targetEquip = prev.equipment[selectedSlot];
      if (!targetEquip || !targetEquip.slottedCard) return prev;

      const cardToReturn = targetEquip.slottedCard;
      const updatedEquip: Equipment = {
        ...targetEquip,
        slottedCard: null,
      };

      const nextCards = prev.cards.some((c) => c.id === cardToReturn.id)
        ? prev.cards
        : [cardToReturn, ...prev.cards];

      return {
        ...prev,
        equipment: {
          ...prev.equipment,
          [selectedSlot]: updatedEquip,
        },
        cards: nextCards,
      };
    });

    setRefineFeedback(`已卸下【${removedCard.name}】并放回卡片背包！`);
    setTimeout(() => setRefineFeedback(null), 2500);
  };

  const currentEquippedItem = profile.equipment[selectedSlot];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-6 pb-20">
      {/* Character Profile & RO Stats Allocation Card */}
      <div className="bg-slate-900 rounded-3xl p-4 md:p-5 shadow-md border border-slate-800 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-2xl md:text-3xl shadow-sm shrink-0">
              {profile.avatar || '⚔️'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
                <h3 className="font-black text-slate-100 text-sm sm:text-base md:text-lg truncate">{profile.name}</h3>
                <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/70 text-emerald-300 font-extrabold whitespace-nowrap shrink-0">
                  Lv.{profile.level} 初心者
                </span>
                {onOpenUserModal && (
                  <button
                    onClick={onOpenUserModal}
                    className="text-[10px] md:text-[11px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/70 hover:bg-purple-900 text-purple-300 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                    title="切换或管理学习角色/用户档案"
                  >
                    <Users className="w-3 h-3 shrink-0" />
                    <span>多用户</span>
                  </button>
                )}
              </div>
              <div className="text-[11px] md:text-xs text-slate-400 mt-0.5 truncate">
                经验: {profile.exp} / {profile.maxExp} | 拥有金币: <span className="text-amber-400 font-bold">{profile.zeny} Zeny</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] md:text-xs text-slate-400 font-bold whitespace-nowrap">可用属性点</div>
            <div className="text-base sm:text-lg md:text-2xl font-black text-purple-400 whitespace-nowrap">
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
              className="bg-slate-800/80 rounded-2xl p-2.5 md:p-3 border border-slate-700/80 flex items-center justify-between"
            >
              <div>
                <div className="text-xs md:text-sm font-black text-slate-200">{stat.name}</div>
                <div className="text-[10px] text-slate-400 leading-tight line-clamp-1">{stat.desc}</div>
              </div>
              <div className="flex items-center space-x-1.5 pl-2 shrink-0">
                <span className="text-sm md:text-base font-black text-slate-100">{stat.val}</span>
                {profile.statPoints > 0 && (
                  <button
                    onClick={() => handleAddStat(stat.key as StatType)}
                    className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 active:scale-95 shadow-xs"
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
      <div className="bg-slate-900 rounded-3xl p-4 md:p-5 shadow-md border border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-3.5">
          <h4 className="font-black text-slate-100 text-sm md:text-base flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>冒险者配装与卡片插槽</span>
          </h4>
          <span className="text-xs md:text-sm text-slate-400">
            精炼石: <span className="font-bold text-purple-400">{profile.refineStones} 颗</span>
          </span>
        </div>

        {/* 4 Equipment Slot Selectors */}
        <div className="grid grid-cols-4 gap-2 md:gap-3 mb-4">
          {(['weapon', 'armor', 'headgear', 'accessory'] as const).map((slot) => {
            const item = profile.equipment[slot];
            const isSelected = selectedSlot === slot;
            const standbyForSlot = profile.inventory.filter((i) => i.slot === slot);

            return (
              <button
                key={slot}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedSlot(slot);
                }}
                className={`relative flex flex-col items-center p-2.5 md:p-3 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-sky-950/50 shadow-md shadow-sky-950/40'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                {standbyForSlot.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-950/90 border border-emerald-700/80 text-emerald-300">
                    可换{standbyForSlot.length}
                  </span>
                )}
                <div className="text-2xl md:text-3xl mb-1">{item?.icon || '📦'}</div>
                <span className="text-[11px] md:text-xs font-bold text-slate-200">
                  {slotLabels[slot]}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-full mt-0.5">
                  {item?.name || '未装备'}
                </span>
                {item && item.refineLevel > 0 && (
                  <span className="text-[9px] md:text-[10px] font-black text-amber-300 bg-amber-950/80 border border-amber-850 px-1 rounded-sm mt-0.5">
                    +{item.refineLevel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Slot Detailed Panel */}
        {currentEquippedItem ? (
          <div className="bg-slate-800/80 rounded-2xl p-3.5 md:p-4 border border-slate-700/80 space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-xl md:text-2xl">{currentEquippedItem.icon}</span>
                  <span className="font-black text-slate-100 text-sm md:text-base">
                    {currentEquippedItem.refineLevel > 0 ? `+${currentEquippedItem.refineLevel} ` : ''}
                    {currentEquippedItem.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/80 border border-emerald-800/70 text-emerald-300">
                    当前穿戴
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-950/80 border border-sky-800/70 text-sky-300 uppercase">
                    {currentEquippedItem.rarity}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {currentEquippedItem.description}
                </div>
              </div>

              {/* Swap Equipment Button */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowSwapEquipModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>更换{slotLabels[selectedSlot]}</span>
              </button>
            </div>

            {/* Current Attributes */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {currentEquippedItem.atkBonus && (
                <span className="bg-rose-950/80 border border-rose-800/70 text-rose-300 px-2 py-0.5 rounded-md">
                  攻击力: +{currentEquippedItem.atkBonus}
                </span>
              )}
              {currentEquippedItem.defBonus && (
                <span className="bg-blue-950/80 border border-blue-800/70 text-blue-300 px-2 py-0.5 rounded-md">
                  防御力: +{currentEquippedItem.defBonus}
                </span>
              )}
              {currentEquippedItem.hpBonus && (
                <span className="bg-emerald-950/80 border border-emerald-800/70 text-emerald-300 px-2 py-0.5 rounded-md">
                  生命值: +{currentEquippedItem.hpBonus}
                </span>
              )}
              {currentEquippedItem.critBonus && (
                <span className="bg-amber-950/80 border border-amber-800/70 text-amber-300 px-2 py-0.5 rounded-md">
                  暴击率: +{currentEquippedItem.critBonus}%
                </span>
              )}
            </div>

            {/* Slotted Card Section */}
            <div className="pt-2.5 border-t border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs md:text-sm font-bold text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>插槽卡片</span>
                </span>
                <div className="flex items-center gap-2.5">
                  {currentEquippedItem.slottedCard && (
                    <button
                      onClick={handleUnsocketCard}
                      className="text-xs md:text-sm text-slate-400 hover:text-rose-400 font-bold transition-colors"
                    >
                      卸下卡片
                    </button>
                  )}
                  <button
                    onClick={() => setShowSocketModal(true)}
                    className="text-xs md:text-sm text-purple-400 hover:text-purple-300 font-bold"
                  >
                    {currentEquippedItem.slottedCard ? '更换卡片' : '+ 镶嵌RO魔物卡'}
                  </button>
                </div>
              </div>

              {currentEquippedItem.slottedCard ? (
                <div className="bg-purple-950/40 border border-purple-800/70 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-purple-200">
                      [{currentEquippedItem.slottedCard.name}]
                    </span>
                    <span className="text-purple-300 ml-1.5 text-[11px]">
                      {currentEquippedItem.slottedCard.description}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2.5 rounded-xl border border-dashed border-slate-700 text-center">
                  暂无插卡 (可击败魔物或挑战BOSS获得魔物专属卡片)
                </div>
              )}
            </div>

            {/* Blacksmith Refine Action */}
            <div className="pt-2.5 border-t border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-xs md:text-sm font-bold text-slate-200 flex items-center gap-1">
                  <Hammer className="w-3.5 h-3.5 text-amber-400" />
                  <span>忽克连铁匠铺精炼</span>
                </div>
                <div className="text-[10px] md:text-xs text-slate-400">
                  消耗 1 颗记忆精炼石 (当前: {profile.refineStones})
                </div>
              </div>

              <button
                onClick={() => handleRefineEquipment(selectedSlot)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1"
              >
                <span>强化精炼</span>
              </button>
            </div>

            {/* Quick Standby Equipment List for Current Slot */}
            {(() => {
              const standbyItems = profile.inventory.filter((i) => i.slot === selectedSlot);
              return (
                <div className="pt-2.5 border-t border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-bold text-slate-200 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-emerald-400" />
                      <span>背包备选{slotLabels[selectedSlot]} ({standbyItems.length} 件可替换)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      替换后原装备将自动退回背包
                    </span>
                  </div>
                  {standbyItems.length === 0 ? (
                    <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-dashed border-slate-700 text-center">
                      当前部位暂无其他备选{slotLabels[selectedSlot]}，通关地图讨伐BOSS可收集更多神装！
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {standbyItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-900/80 border border-slate-700/80 hover:border-sky-500/70 rounded-xl p-2.5 flex items-center justify-between gap-2 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl shrink-0">{item.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-xs text-slate-100 truncate">
                                  {item.refineLevel > 0 ? `+${item.refineLevel} ` : ''}
                                  {item.name}
                                </span>
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-sm bg-sky-950 text-sky-300 border border-sky-800/60 font-bold">
                                  {item.rarity}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                {item.atkBonus && <span className="text-rose-300">ATK+{item.atkBonus}</span>}
                                {item.defBonus && <span className="text-blue-300">DEF+{item.defBonus}</span>}
                                {item.hpBonus && <span className="text-emerald-300">HP+{item.hpBonus}</span>}
                                {item.critBonus && <span className="text-amber-300">CRIT+{item.critBonus}%</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEquipItem(item)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold rounded-lg shrink-0 transition-all shadow-xs"
                          >
                            替换穿戴
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {refineFeedback && (
              <div className="text-xs text-center font-bold text-purple-300 bg-purple-950/80 border border-purple-800/80 p-2 rounded-xl animate-bounce">
                {refineFeedback}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-6">未装备</div>
        )}
      </div>

      {/* RO Equipment Collection Codex */}
      {(() => {
        const ownedById = new Map<string, { item: Equipment; isEquipped: boolean }>();
        (['weapon', 'armor', 'headgear', 'accessory'] as const).forEach((s) => {
          const eq = profile.equipment[s];
          if (eq) ownedById.set(eq.id, { item: eq, isEquipped: true });
        });
        profile.inventory.forEach((inv) => {
          if (inv && !ownedById.has(inv.id)) {
            ownedById.set(inv.id, { item: inv, isEquipped: false });
          }
        });

        const totalCollectible = ALL_RO_EQUIPMENT.length;
        const collectedCount = ALL_RO_EQUIPMENT.filter((e) => ownedById.has(e.id)).length;
        const filteredCatalog =
          collectionFilter === 'all'
            ? ALL_RO_EQUIPMENT
            : ALL_RO_EQUIPMENT.filter((e) => e.slot === collectionFilter);

        return (
          <div className="bg-slate-900 rounded-3xl p-4 md:p-5 shadow-md border border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div>
                <h4 className="font-black text-slate-100 text-sm md:text-base flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>RO 神装收集图鉴</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/70 text-amber-300">
                    已收集 {collectedCount} / {totalCollectible}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  击败各大陆关底 BOSS 即可收集全新神装，已收集装备可随时一键替换穿戴（原装备自动退回背包）
                </p>
              </div>

              {/* Slot Filter Pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {(
                  [
                    { key: 'all', label: '全部' },
                    { key: 'weapon', label: '武器' },
                    { key: 'armor', label: '铠甲' },
                    { key: 'headgear', label: '头饰' },
                    { key: 'accessory', label: '饰品' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      soundManager.playClick();
                      setCollectionFilter(tab.key);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      collectionFilter === tab.key
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredCatalog.map((catalogItem) => {
                const ownedInfo = ownedById.get(catalogItem.id);
                const isCollected = !!ownedInfo;
                const isEquipped = !!ownedInfo?.isEquipped;
                const displayItem = ownedInfo?.item || catalogItem;

                const rarityBadge = {
                  normal: 'bg-slate-800 text-slate-300 border-slate-700',
                  refined: 'bg-sky-950/90 text-sky-300 border-sky-800/80',
                  epic: 'bg-purple-950/90 text-purple-300 border-purple-800/80',
                  godly: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
                }[displayItem.rarity];

                return (
                  <div
                    key={catalogItem.id}
                    className={`rounded-2xl p-3 border transition-all flex flex-col justify-between gap-2 ${
                      isEquipped
                        ? 'bg-emerald-950/25 border-emerald-600/70 shadow-xs'
                        : isCollected
                        ? 'bg-slate-800/80 border-slate-700 hover:border-sky-500/60'
                        : 'bg-slate-900/50 border-slate-800/80 opacity-55'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-xl shrink-0">
                          {displayItem.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs md:text-sm text-slate-100">
                              {displayItem.refineLevel > 0 ? `+${displayItem.refineLevel} ` : ''}
                              {displayItem.name}
                            </span>
                            <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded-md border ${rarityBadge}`}>
                              {displayItem.rarity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              [{slotLabels[displayItem.slot]}]
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {displayItem.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 gap-2">
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                        {displayItem.atkBonus && (
                          <span className="text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded">
                            ATK+{displayItem.atkBonus}
                          </span>
                        )}
                        {displayItem.defBonus && (
                          <span className="text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded">
                            DEF+{displayItem.defBonus}
                          </span>
                        )}
                        {displayItem.hpBonus && (
                          <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            HP+{displayItem.hpBonus}
                          </span>
                        )}
                        {displayItem.critBonus && (
                          <span className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded">
                            CRIT+{displayItem.critBonus}%
                          </span>
                        )}
                      </div>

                      {isEquipped ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-[11px] font-extrabold shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>穿戴中</span>
                        </span>
                      ) : isCollected ? (
                        <button
                          onClick={() => handleEquipItem(displayItem)}
                          className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-[11px] font-bold shrink-0 transition-all shadow-xs"
                        >
                          替换穿戴
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                          🔒 讨伐BOSS掉落
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Swap Equipment Modal for Selected Slot */}
      {showSwapEquipModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-5 max-w-sm md:max-w-md w-full shadow-2xl border border-slate-800 animate-scaleUp">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h4 className="font-black text-slate-100 text-sm md:text-base flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>更换{slotLabels[selectedSlot]} (替换后原装备退回背包)</span>
              </h4>
              <button
                onClick={() => setShowSwapEquipModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {currentEquippedItem && (
              <div className="mb-3 p-2.5 rounded-xl bg-slate-800/90 border border-emerald-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentEquippedItem.icon}</span>
                  <div>
                    <div className="text-slate-200 font-bold">
                      当前穿戴: {currentEquippedItem.refineLevel > 0 ? `+${currentEquippedItem.refineLevel} ` : ''}
                      {currentEquippedItem.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      选择下方装备将直接替换，当前装备与精炼等级完整保留在背包中
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const slotStandby = profile.inventory.filter((i) => i.slot === selectedSlot);
              if (slotStandby.length === 0) {
                return (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    背包中暂无其他已收集的{slotLabels[selectedSlot]}，前往世界地图讨伐关底BOSS即可收集！
                  </div>
                );
              }
              return (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {slotStandby.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleEquipItem(item)}
                      className="w-full text-left p-3 rounded-xl border border-slate-700 hover:border-sky-500 bg-slate-800/60 hover:bg-slate-800 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-xs md:text-sm text-slate-100 flex items-center gap-1.5">
                            <span>
                              {item.refineLevel > 0 ? `+${item.refineLevel} ` : ''}
                              {item.name}
                            </span>
                            <span className="text-[9px] uppercase bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.2 rounded-sm">
                              {item.rarity}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 mt-1">
                            {item.atkBonus && <span className="text-rose-300">攻击+{item.atkBonus}</span>}
                            {item.defBonus && <span className="text-blue-300">防御+{item.defBonus}</span>}
                            {item.hpBonus && <span className="text-emerald-300">生命+{item.hpBonus}</span>}
                            {item.critBonus && <span className="text-amber-300">暴击+{item.critBonus}%</span>}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-xs font-bold shrink-0 flex items-center gap-1">
                        <span>替换</span>
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Socket Card Modal */}
      {showSocketModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-5 max-w-sm md:max-w-md w-full shadow-2xl border border-slate-800 animate-scaleUp">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h4 className="font-black text-slate-100 text-sm md:text-base flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>
                  {currentEquippedItem?.slottedCard ? '更换插槽卡片' : '选择镶嵌卡片'} ({selectedSlot})
                </span>
              </h4>
              <button
                onClick={() => setShowSocketModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {currentEquippedItem?.slottedCard && (
              <div className="mb-3 p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between text-xs">
                <div className="text-slate-300">
                  当前已镶嵌: <span className="font-bold text-purple-300">[{currentEquippedItem.slottedCard.name}]</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">选择下方新卡片将自动替换，原卡片会退回背包</div>
                </div>
                <button
                  onClick={() => {
                    handleUnsocketCard();
                    setShowSocketModal(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-rose-900/70 text-slate-200 hover:text-rose-200 text-[11px] font-bold shrink-0 ml-2 transition-colors"
                >
                  卸下
                </button>
              </div>
            )}

            {profile.cards.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                背包中暂无其他闲置卡片，前往击败魔物或挑战关底BOSS掉落吧！
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
                    <span className="text-[11px] font-bold text-purple-400 shrink-0 mt-0.5 ml-2 flex items-center gap-0.5">
                      <span>{currentEquippedItem?.slottedCard ? '替换' : '镶嵌'}</span>
                      <Check className="w-3.5 h-3.5" />
                    </span>
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
