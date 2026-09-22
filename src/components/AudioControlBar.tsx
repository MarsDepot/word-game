import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Sun, Moon, Play, Pause, Users, BookOpen, SkipForward } from 'lucide-react';
import { soundManager, BgmTrack } from '../audio/soundManager';
import { useTheme } from '../context/ThemeContext';

interface AudioControlBarProps {
  currentTrack: 'town' | 'boss' | 'forest' | 'none';
  currentUser?: { name: string; avatar?: string; level?: number };
  onOpenUserModal?: () => void;
  onOpenManual?: () => void;
  onTrackChange?: (track: 'town' | 'boss' | 'forest') => void;
}

export const AudioControlBar: React.FC<AudioControlBarProps> = ({
  currentTrack,
  currentUser,
  onOpenUserModal,
  onOpenManual,
  onTrackChange,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<'town' | 'boss' | 'forest'>(() => 
    currentTrack === 'boss' ? 'boss' : currentTrack === 'forest' ? 'forest' : 'town'
  );

  useEffect(() => {
    // Check initial mute state
    setIsMuted(soundManager.isAudioMuted());
  }, []);

  useEffect(() => {
    if (currentTrack !== 'none') {
      setActiveTrack(currentTrack);
    }
  }, [currentTrack]);

  const getTrackDisplayName = (track: 'town' | 'boss' | 'forest'): string => {
    switch (track) {
      case 'boss':
        return '音乐2';
      case 'forest':
        return '音乐3';
      case 'town':
      default:
        return '音乐1';
    }
  };

  const handleTogglePlay = () => {
    soundManager.enableAudio();
    if (isPlaying) {
      soundManager.stopBGM();
      setIsPlaying(false);
    } else {
      soundManager.playBGM(activeTrack);
      setIsPlaying(true);
    }
  };

  const handleNextTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.enableAudio();
    const tracks: ('town' | 'boss' | 'forest')[] = ['town', 'boss', 'forest'];
    const currentIndex = tracks.indexOf(activeTrack);
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];
    setActiveTrack(nextTrack);
    soundManager.playBGM(nextTrack);
    setIsPlaying(true);
    onTrackChange?.(nextTrack);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundManager.setMute(nextMute);
  };

  return (
    <div className="relative z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-3 md:px-5 py-2 flex items-center justify-between text-xs shadow-xs transition-colors duration-200">
      {/* Current Music Track Info */}
      <div
        onClick={handleTogglePlay}
        className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer group py-0.5 min-w-0 flex-shrink"
        title={isPlaying ? `正在播放: ${getTrackDisplayName(activeTrack)} (点击暂停)` : `点击播放: ${getTrackDisplayName(activeTrack)}`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            activeTrack === 'boss'
              ? 'bg-rose-500 text-white shadow-rose-200 dark:shadow-rose-900/50'
              : activeTrack === 'forest'
              ? 'bg-indigo-500 text-white shadow-indigo-200 dark:shadow-indigo-900/50'
              : 'bg-emerald-500 text-white shadow-emerald-200 dark:shadow-emerald-900/50'
          } shadow-sm group-hover:scale-105 shrink-0`}
        >
          <Music className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
        </div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-[11px] sm:text-xs">
              {getTrackDisplayName(activeTrack)}
            </span>
            {isPlaying && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 animate-pulse shrink-0">
                播放中
              </span>
            )}
            {!isPlaying && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                播放
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
            {getTrackDisplayName(activeTrack)}
          </span>
        </div>
      </div>

      {/* Audio Controls, Manual & Dark Mode Toggle */}
      <div className="flex items-center space-x-1.5">
        <button
          id="btn-toggle-piano-bgm"
          onClick={handleTogglePlay}
          className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
          title={isPlaying ? '暂停音乐' : '启动音乐'}
          aria-label={isPlaying ? '暂停音乐' : '启动音乐'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <button
          id="btn-next-piano-track"
          onClick={handleNextTrack}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
          title={`切换音乐曲目 (当前: ${getTrackDisplayName(activeTrack)})`}
          aria-label="切换下一首音乐"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          id="btn-toggle-sound-mute"
          onClick={handleToggleMute}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isMuted ? '解除静音' : '静音'}
          aria-label={isMuted ? '解除静音' : '静音'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
        </button>

        {/* Instruction Manual Button (Icon only matching other buttons) */}
        {onOpenManual && (
          <button
            id="btn-open-game-manual"
            onClick={() => {
              soundManager.playClick();
              onOpenManual();
            }}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center relative"
            title="查看游戏与考纲说明书"
            aria-label="查看说明书"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        )}

        {/* Multi-User Mode Button */}
        {onOpenUserModal && (
          <button
            id="btn-user-mode"
            onClick={() => {
              soundManager.playClick();
              onOpenUserModal();
            }}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center relative"
            title={`多用户模式: 当前 [${currentUser?.name || '冒险者'}] · 点击切换角色`}
            aria-label="切换用户学习档案"
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* Dark Theme Toggle Button */}
        <button
          id="btn-toggle-theme-mode"
          onClick={() => {
            soundManager.playClick();
            toggleTheme();
          }}
          className="p-1.5 rounded-lg text-slate-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
          title={theme === 'dark' ? '切换为明亮模式' : '切换为深色模式'}
          aria-label={theme === 'dark' ? '切换为明亮模式' : '切换为深色模式'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
};


