/**
 * Multi-User Game Persistence Manager using LocalStorage
 */
import { PlayerProfile, WordItem, UserAccount } from '../types/game';
import { INITIAL_EQUIPMENT, ALL_RO_CARDS, ALL_RO_EQUIPMENT, GAME_MAPS } from '../data/words';
import { ALL_UNIFIED_WORDS } from '../data/shanghaiWords';
import { sanitizeWordItem } from './wordHelpers';

const USERS_LIST_KEY = 'word_ragnarok_users_v2';
const ACTIVE_USER_ID_KEY = 'word_ragnarok_active_uid_v2';
const LEGACY_STORAGE_KEY = 'word_ragnarok_save_v1';

export const AVATAR_OPTIONS = ['⚔️', '🏹', '🧙‍♂️', '🛡️', '🐱', '🐰', '🌸', '⚡', '🎒', '👑'];

export function getInitialProfile(name: string = '初心冒险者', avatar: string = '⚔️'): PlayerProfile {
  // Populate all words into ONE unified wordbook
  const initialLearnedWords: Record<string, WordItem> = {};
  ALL_UNIFIED_WORDS.forEach((w) => {
    initialLearnedWords[w.id] = {
      ...w,
      consecutiveCorrect: 0,
      appearedCount: 0,
      correctCount: 0,
      wrongCount: 0,
      mastery: 0,
    };
  });

  return {
    name,
    avatar,
    job: 'novice',
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: 200,
    maxHp: 200,
    zeny: 150,
    refineStones: 3, // Initial refining stones
    statPoints: 5, // 5 free initial stat points to allocate!
    stats: {
      str: 3, // Damage & Crit Multiplier
      agi: 3, // Extra question thinking time & Dodge
      vit: 4, // Max HP & Defense
      int: 2, // Combo gold/exp bonus
      dex: 3, // Auto eliminate wrong options chance
      luk: 3, // Crit rate & Card drop rate
    },
    equipment: {
      weapon: { ...INITIAL_EQUIPMENT.weapon },
      armor: { ...INITIAL_EQUIPMENT.armor },
      headgear: { ...INITIAL_EQUIPMENT.headgear },
      accessory: { ...INITIAL_EQUIPMENT.accessory },
    },
    inventory: [
      {
        id: 'w_wooden_bow',
        name: '猎人长弓',
        slot: 'weapon',
        rarity: 'normal',
        refineLevel: 0,
        atkBonus: 16,
        description: '斐扬猎人常备的坚固长弓，射程远且轻便。',
        icon: '🏹',
        slottedCard: null,
      },
      {
        id: 'h_bunny_band',
        name: '兔耳发圈',
        slot: 'headgear',
        rarity: 'refined',
        refineLevel: 0,
        critBonus: 5,
        hpBonus: 50,
        description: 'RO超级经典人气头饰！毛茸茸的白色兔耳朵。',
        icon: '🐰',
        slottedCard: null,
      },
    ],
    cards: [
      { ...ALL_RO_CARDS[0] }, // Poring Card
    ],
    learnedWords: initialLearnedWords,
    deletedWordIds: [],
    furnaceWordIds: [],
    unlockedMapIds: ['map_prontera'],
    defeatedBosses: [],
    mapClearCounts: {},
    wordsPerBattle: 20,
    selectedMapType: 'solace',
  };
}

/**
 * Get list of all registered users
 */
export function getAllUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    if (raw) {
      const parsed: UserAccount[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Migration from legacy single user save
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyProfile: PlayerProfile = JSON.parse(legacyRaw);
      if (legacyProfile && legacyProfile.stats) {
        const initialUser: UserAccount = {
          id: 'user_default',
          name: legacyProfile.name || '初心冒险者',
          avatar: legacyProfile.avatar || '⚔️',
          createdAt: Date.now(),
          lastPlayedAt: Date.now(),
          profile: {
            ...legacyProfile,
            avatar: legacyProfile.avatar || '⚔️',
          },
        };
        const users = [initialUser];
        localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
        localStorage.setItem(ACTIVE_USER_ID_KEY, initialUser.id);
        return users;
      }
    }
  } catch (e) {
    console.error('Failed to load user accounts:', e);
  }

  // Fresh initialization
  const defaultProfile = getInitialProfile('初心冒险者', '⚔️');
  const defaultUser: UserAccount = {
    id: 'user_default',
    name: '初心冒险者',
    avatar: '⚔️',
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
    profile: defaultProfile,
  };
  const users = [defaultUser];
  try {
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
    localStorage.setItem(ACTIVE_USER_ID_KEY, defaultUser.id);
  } catch (e) {
    console.error('Failed to initialize users storage:', e);
  }
  return users;
}

/**
 * Ensure unified words and required fields are present on a UserAccount profile
 */
function hydrateUserProfile(user: UserAccount): boolean {
  let modified = false;
  if (!user.profile) {
    user.profile = getInitialProfile(user.name || '初心冒险者', user.avatar || '⚔️');
    return true;
  }
  if (!user.profile.wordsPerBattle) {
    user.profile.wordsPerBattle = 10;
    modified = true;
  }
  if (!user.profile.selectedMapType) {
    user.profile.selectedMapType = 'solace';
    modified = true;
  }
  if (!user.profile.learnedWords || typeof user.profile.learnedWords !== 'object') {
    user.profile.learnedWords = {};
    modified = true;
  }
  if (!Array.isArray(user.profile.deletedWordIds)) {
    user.profile.deletedWordIds = [];
    modified = true;
  }
  if (!Array.isArray(user.profile.furnaceWordIds)) {
    user.profile.furnaceWordIds = [];
    modified = true;
  }
  if (!user.profile.mapClearCounts || typeof user.profile.mapClearCounts !== 'object') {
    user.profile.mapClearCounts = {};
    modified = true;
  }

  // Ensure initial starter card (card_poring) and any boss-earned cards that were accidentally lost
  // during earlier slot replacements are restored into user.profile.cards
  if (!Array.isArray(user.profile.cards)) {
    user.profile.cards = [];
    modified = true;
  }
  const slottedIds = new Set(
    Object.values(user.profile.equipment || {})
      .map((eq) => eq?.slottedCard?.id)
      .filter(Boolean) as string[]
  );
  const bagIds = new Set(user.profile.cards.map((c) => c.id));

  // 1. Starter Poring Card must always exist in either bag or a slot
  const starterCard = ALL_RO_CARDS[0];
  if (starterCard && !slottedIds.has(starterCard.id) && !bagIds.has(starterCard.id)) {
    user.profile.cards.push({ ...starterCard });
    bagIds.add(starterCard.id);
    modified = true;
  }

  // 2. Ensure total owned cards (bag + slotted) is at least 1 + number of defeated bosses
  const minExpectedCards = Math.min(
    ALL_RO_CARDS.length,
    1 + (Array.isArray(user.profile.defeatedBosses) ? user.profile.defeatedBosses.length : 0)
  );
  for (const cardDef of ALL_RO_CARDS) {
    if (bagIds.size + slottedIds.size >= minExpectedCards) break;
    if (!slottedIds.has(cardDef.id) && !bagIds.has(cardDef.id)) {
      user.profile.cards.push({ ...cardDef });
      bagIds.add(cardDef.id);
      modified = true;
    }
  }

  // 3. Hydrate and normalize equipment inventory (convert legacy `drop_*` items into distinct ALL_RO_EQUIPMENT items)
  if (!Array.isArray(user.profile.inventory)) {
    user.profile.inventory = [];
    modified = true;
  }
  const equippedIds = new Set(
    Object.values(user.profile.equipment || {})
      .map((eq) => eq?.id)
      .filter(Boolean) as string[]
  );
  const normalizedInventory: typeof user.profile.inventory = [];
  const seenInvIds = new Set<string>(equippedIds);

  for (const item of user.profile.inventory) {
    if (!item) continue;
    if (item.id.startsWith('drop_')) {
      // Convert legacy generated drop into an unowned ALL_RO_EQUIPMENT piece
      const replacement =
        ALL_RO_EQUIPMENT.find((e) => e.id === 'a_solace_robe' && !seenInvIds.has(e.id)) ||
        ALL_RO_EQUIPMENT.find((e) => !seenInvIds.has(e.id));
      if (replacement) {
        normalizedInventory.push({
          ...replacement,
          refineLevel: Math.max(replacement.refineLevel, item.refineLevel || 0),
          slottedCard: item.slottedCard || null,
        });
        seenInvIds.add(replacement.id);
      }
      modified = true;
    } else if (!seenInvIds.has(item.id)) {
      normalizedInventory.push(item);
      seenInvIds.add(item.id);
    } else {
      modified = true;
    }
  }

  // Ensure starter inventory items (w_wooden_bow, h_bunny_band) and initial 4 equips are never lost
  const starterIds = ['w_novice_knife', 'a_cotton_shirt', 'h_egg_cap', 'acc_novice_ring', 'w_wooden_bow', 'h_bunny_band'];
  for (const sid of starterIds) {
    if (!seenInvIds.has(sid)) {
      const def = ALL_RO_EQUIPMENT.find((e) => e.id === sid);
      if (def) {
        normalizedInventory.push({ ...def, slottedCard: null });
        seenInvIds.add(sid);
        modified = true;
      }
    }
  }
  user.profile.inventory = normalizedInventory;
  // remove the old 201 default words so only the user's current library remains as the initial baseline.
  const learnedEntries = Object.values(user.profile.learnedWords);
  const customEntries = learnedEntries.filter(
    (w) => w && (w.id.startsWith('custom_') || w.id.startsWith('word_'))
  );
  const legacyEntries = learnedEntries.filter((w) => w && w.id.startsWith('w_'));
  if (customEntries.length >= 1000 && legacyEntries.length > 0 && legacyEntries.length <= 210) {
    legacyEntries.forEach((lw) => {
      delete user.profile.learnedWords[lw.id];
    });
    user.profile.furnaceWordIds = user.profile.furnaceWordIds.filter(
      (id) => !id.startsWith('w_')
    );
    modified = true;
  }

  // Sanitize all existing learnedWords so any `[]` prefix or phonetic artifact in translation/options is cleaned
  Object.keys(user.profile.learnedWords).forEach((id) => {
    const item = user.profile.learnedWords[id];
    if (!item) return;
    const cleaned = sanitizeWordItem(item);
    if (
      cleaned.word !== item.word ||
      cleaned.translation !== item.translation ||
      cleaned.partOfSpeech !== item.partOfSpeech ||
      cleaned.phonetic !== item.phonetic ||
      JSON.stringify(cleaned.options) !== JSON.stringify(item.options)
    ) {
      user.profile.learnedWords[id] = cleaned;
      modified = true;
    }
  });

  // Backfill missing words from ALL_UNIFIED_WORDS (skipping deleted ones and words already present by composite key)
  const deletedSet = new Set(user.profile.deletedWordIds);
  const makeCompositeKey = (w: Partial<WordItem>) =>
    `${String(w.word || '').toLowerCase().trim()}__${String(w.partOfSpeech || '').trim()}__${String(
      w.translation || ''
    ).trim()}`;

  const existingCompositeKeys = new Set(
    Object.values(user.profile.learnedWords)
      .filter(Boolean)
      .map((w) => makeCompositeKey(w))
  );

  // Only backfill from ALL_UNIFIED_WORDS if the user hasn't replaced the 201-word default pack with a larger custom pack
  const skipLegacyDefaultBackfill =
    ALL_UNIFIED_WORDS.length <= 210 && Object.keys(user.profile.learnedWords).length >= 1000;

  if (!skipLegacyDefaultBackfill) {
    ALL_UNIFIED_WORDS.forEach((w) => {
      if (deletedSet.has(w.id)) return;
      const compKey = makeCompositeKey(w);
      if (!user.profile.learnedWords[w.id] && !existingCompositeKeys.has(compKey)) {
        user.profile.learnedWords[w.id] = {
          ...w,
          consecutiveCorrect: 0,
          appearedCount: 0,
          correctCount: 0,
          wrongCount: 0,
          mastery: 0,
        };
        existingCompositeKeys.add(compKey);
        modified = true;
      }
    });
  }

  return modified;
}

/**
 * Get active user account
 */
export function getCurrentUser(): UserAccount {
  const users = getAllUsers();
  const activeUid = localStorage.getItem(ACTIVE_USER_ID_KEY);
  let user = users[0];
  if (activeUid) {
    const found = users.find((u) => u.id === activeUid);
    if (found) user = found;
  }

  const modified = hydrateUserProfile(user);

  if (modified) {
    try {
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to persist hydrated user profile:', e);
    }
  }

  return user;
}

/**
 * Save profile changes for current user
 */
export function saveCurrentUserProfile(profile: PlayerProfile): void {
  try {
    const users = getAllUsers();
    const activeUid = localStorage.getItem(ACTIVE_USER_ID_KEY);
    let index = activeUid ? users.findIndex((u) => u.id === activeUid) : 0;
    if (index === -1) index = 0;

    if (users[index]) {
      users[index].profile = profile;
      users[index].name = profile.name;
      if (profile.avatar) {
        users[index].avatar = profile.avatar;
      }
      users[index].lastPlayedAt = Date.now();
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

/**
 * Switch active user
 */
export function switchUser(userId: string): UserAccount | null {
  try {
    const users = getAllUsers();
    const target = users.find((u) => u.id === userId);
    if (target) {
      hydrateUserProfile(target);
      target.lastPlayedAt = Date.now();
      localStorage.setItem(ACTIVE_USER_ID_KEY, userId);
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
      return target;
    }
  } catch (e) {
    console.error('Failed to switch user:', e);
  }
  return null;
}

/**
 * Create a new user profile and set as active
 */
export function createUser(name: string, avatar: string = '⚔️'): UserAccount {
  const cleanName = name.trim() || `冒险者 ${getAllUsers().length + 1}`;
  const newProfile = getInitialProfile(cleanName, avatar);
  const newUser: UserAccount = {
    id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    avatar,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
    profile: newProfile,
  };

  try {
    const users = getAllUsers();
    users.push(newUser);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
    localStorage.setItem(ACTIVE_USER_ID_KEY, newUser.id);
  } catch (e) {
    console.error('Failed to create new user:', e);
  }

  return newUser;
}

/**
 * Delete a user profile
 */
export function deleteUser(userId: string): { success: boolean; newActiveUser?: UserAccount; error?: string } {
  try {
    const users = getAllUsers();
    if (users.length <= 1) {
      return { success: false, error: '至少需要保留一个用户档案！' };
    }

    const activeUid = localStorage.getItem(ACTIVE_USER_ID_KEY) || users[0].id;
    const filtered = users.filter((u) => u.id !== userId);
    let nextActiveUser = filtered.find((u) => u.id === activeUid) || filtered[0];

    if (activeUid === userId) {
      localStorage.setItem(ACTIVE_USER_ID_KEY, nextActiveUser.id);
    }

    hydrateUserProfile(nextActiveUser);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(filtered));
    return { success: true, newActiveUser: nextActiveUser };
  } catch (e) {
    console.error('Failed to delete user:', e);
    return { success: false, error: '删除档案失败，请稍后重试' };
  }
}

/**
 * Update user name / avatar
 */
export function updateUserMeta(userId: string, name: string, avatar?: string): UserAccount | null {
  try {
    const users = getAllUsers();
    const target = users.find((u) => u.id === userId);
    if (target) {
      target.name = name.trim() || target.name;
      if (avatar) target.avatar = avatar;
      target.profile.name = target.name;
      if (avatar) target.profile.avatar = avatar;
      target.lastPlayedAt = Date.now();

      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
      return target;
    }
  } catch (e) {
    console.error('Failed to update user meta:', e);
  }
  return null;
}

// Backward compatibility methods
export function loadGameProfile(): PlayerProfile {
  return getCurrentUser().profile;
}

export function saveGameProfile(profile: PlayerProfile): void {
  saveCurrentUserProfile(profile);
}
