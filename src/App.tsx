import React, { useState, useEffect } from 'react';
import { Compass, Shield, Flame, BookOpen, Sparkles, Smartphone } from 'lucide-react';
import { PlayerProfile, GameMap, UserAccount } from './types/game';
import { getCurrentUser, saveCurrentUserProfile } from './utils/storage';
import { GAME_MAPS } from './data/words';
import { AudioControlBar } from './components/AudioControlBar';
import { MapSelectScreen } from './components/MapSelectScreen';
import { BattleScreen } from './components/BattleScreen';
import { EquipmentScreen } from './components/EquipmentScreen';
import { KafraFurnaceScreen } from './components/KafraFurnaceScreen';
import { CardAlbumScreen } from './components/CardAlbumScreen';
import { UserModeModal } from './components/UserModeModal';
import { GameManualModal } from './components/GameManualModal';
import { soundManager } from './audio/soundManager';

type NavigationTab = 'map' | 'equipment' | 'furnace' | 'album';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => getCurrentUser());
  const [profile, setProfile] = useState<PlayerProfile>(() => currentUser.profile);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('map');
  const [activeBattleMap, setActiveBattleMap] = useState<GameMap | null>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);

  // Auto-save on profile change
  useEffect(() => {
    saveCurrentUserProfile(profile);
  }, [profile]);

  // Handle switching to a different user profile
  const handleUserSwitched = (newUser: UserAccount) => {
    // Persist current state before switching
    saveCurrentUserProfile(profile);
    setCurrentUser(newUser);
    setProfile(newUser.profile);
    setActiveBattleMap(null); // safely leave battle if active
    soundManager.playBGM('town');
  };

  // Audio track mode: boss if in battle on boss wave, town otherwise
  const currentTrack = activeBattleMap ? 'town' : 'town';

  // Handle entering a map battle
  const handleStartMapBattle = (map: GameMap) => {
    soundManager.enableAudio();
    setActiveBattleMap(map);
  };

  // Exit battle back to map screen
  const handleExitBattle = () => {
    soundManager.playClick();
    setActiveBattleMap(null);
    soundManager.playBGM('town');
  };

  // Switch to furnace review
  const handleOpenFurnace = () => {
    setActiveBattleMap(null);
    setCurrentTab('furnace');
    soundManager.playClick();
    soundManager.playBGM('town');
  };

  return (
    <div className="min-h-screen bg-[#dde7ee] dark:bg-slate-950 flex items-center justify-center p-0 md:p-4 lg:p-6 text-slate-800 dark:text-slate-100 font-sans transition-colors">
      {/* Responsive Container: Fluid and spacious on PC/Tablet, phone-framed or wide */}
      <main
        id="app-mobile-frame"
        className="w-full md:max-w-3xl lg:max-w-4xl h-screen md:h-[90vh] md:max-h-[920px] bg-[#f8fafc] dark:bg-slate-900 md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative border-0 md:border-4 md:border-slate-300 dark:md:border-slate-800 transition-colors"
      >
        {/* Top Audio & BGM Status Bar */}
        <AudioControlBar
          currentTrack={activeBattleMap ? 'boss' : 'town'}
          currentUser={{ name: currentUser.name, avatar: currentUser.avatar, level: profile.level }}
          onOpenUserModal={() => setShowUserModal(true)}
          onOpenManual={() => setShowManualModal(true)}
        />

        {/* Content View Router */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeBattleMap ? (
            <BattleScreen
              map={activeBattleMap}
              profile={profile}
              onUpdateProfile={setProfile}
              onExitBattle={handleExitBattle}
              onOpenFurnace={handleOpenFurnace}
            />
          ) : (
            <>
              {currentTab === 'map' && (
                <MapSelectScreen
                  profile={profile}
                  onSelectMap={handleStartMapBattle}
                />
              )}
              {currentTab === 'equipment' && (
                <EquipmentScreen
                  profile={profile}
                  onUpdateProfile={setProfile}
                  onOpenFurnace={handleOpenFurnace}
                  onOpenUserModal={() => setShowUserModal(true)}
                />
              )}
              {currentTab === 'furnace' && (
                <KafraFurnaceScreen
                  profile={profile}
                  onUpdateProfile={setProfile}
                  onEnterBattle={() => setCurrentTab('map')}
                />
              )}
              {currentTab === 'album' && (
                <CardAlbumScreen
                  profile={profile}
                  onUpdateProfile={setProfile}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation Bar (Hidden during active battle for immersion) */}
        {!activeBattleMap && (
          <nav
            id="main-navigation-tabs"
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 md:px-8 py-2 md:py-3 flex justify-around items-center z-30 shadow-lg safe-bottom transition-colors"
          >
            {/* Map tab */}
            <button
              id="tab-btn-map"
              onClick={() => {
                soundManager.playClick();
                setCurrentTab('map');
              }}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all ${
                currentTab === 'map'
                  ? 'text-emerald-600 dark:text-emerald-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Compass className={`w-5 h-5 md:w-6 md:h-6 ${currentTab === 'map' ? 'scale-110' : ''}`} />
              <span className="text-[10px] md:text-xs mt-0.5">冒险地图</span>
            </button>

            {/* Equipment tab */}
            <button
              id="tab-btn-equipment"
              onClick={() => {
                soundManager.playClick();
                setCurrentTab('equipment');
              }}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all relative ${
                currentTab === 'equipment'
                  ? 'text-sky-600 dark:text-sky-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Shield className={`w-5 h-5 md:w-6 md:h-6 ${currentTab === 'equipment' ? 'scale-110' : ''}`} />
              <span className="text-[10px] md:text-xs mt-0.5">加点配装</span>
              {profile.statPoints > 0 && (
                <span className="absolute top-1 right-3.5 md:right-8 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                  {profile.statPoints}
                </span>
              )}
            </button>

            {/* Furnace Review tab */}
            <button
              id="tab-btn-furnace"
              onClick={() => {
                soundManager.playClick();
                setCurrentTab('furnace');
              }}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all relative ${
                currentTab === 'furnace'
                  ? 'text-purple-600 dark:text-purple-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Flame className={`w-5 h-5 md:w-6 md:h-6 ${currentTab === 'furnace' ? 'scale-110 text-amber-500' : ''}`} />
              <span className="text-[10px] md:text-xs mt-0.5">回炉复习</span>
              {profile.furnaceWordIds.length > 0 && (
                <span className="absolute top-1 right-3.5 md:right-8 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {profile.furnaceWordIds.length}
                </span>
              )}
            </button>

            {/* Card Album tab */}
            <button
              id="tab-btn-album"
              onClick={() => {
                soundManager.playClick();
                setCurrentTab('album');
              }}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-2xl transition-all ${
                currentTab === 'album'
                  ? 'text-amber-600 dark:text-amber-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className={`w-5 h-5 md:w-6 md:h-6 ${currentTab === 'album' ? 'scale-110' : ''}`} />
              <span className="text-[10px] md:text-xs mt-0.5">图鉴宝典</span>
            </button>
          </nav>
        )}

        {/* Multi-User Mode Modal */}
        {showUserModal && (
          <UserModeModal
            currentUser={currentUser}
            onUserSwitched={handleUserSwitched}
            onClose={() => setShowUserModal(false)}
          />
        )}

        {/* Game & Syllabus Manual Modal */}
        {showManualModal && (
          <GameManualModal
            onClose={() => setShowManualModal(false)}
          />
        )}
      </main>
    </div>
  );
}
