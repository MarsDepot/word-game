import React from 'react';
import { Monster } from '../types/game';

interface MonsterAvatarProps {
  monster: Monster;
  isHit?: boolean;
  isAttacking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MonsterAvatar: React.FC<MonsterAvatarProps> = ({
  monster,
  isHit = false,
  isAttacking = false,
  size = 'lg',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
  }[size];

  // Specific custom SVG avatars for classic RO monsters
  const renderMonsterArt = () => {
    switch (monster.id) {
      case 'm_poring':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Poring body */}
            <defs>
              <radialGradient id="poringGrad" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="60%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </radialGradient>
              <linearGradient id="shineGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Soft shadow */}
            <ellipse cx="50" cy="88" rx="34" ry="8" fill="#00000020" />
            {/* Teardrop jelly body */}
            <path
              d="M 50 20 C 65 20, 85 45, 85 66 C 85 82, 70 85, 50 85 C 30 85, 15 82, 15 66 C 15 45, 35 20, 50 20 Z"
              fill="url(#poringGrad)"
            />
            {/* Highlight bubble */}
            <ellipse cx="38" cy="38" rx="14" ry="9" fill="url(#shineGrad)" transform="rotate(-25 38 38)" />
            {/* Cute eyes */}
            <circle cx="42" cy="54" r="4.5" fill="#1e293b" />
            <circle cx="43.5" cy="52.5" r="1.5" fill="#ffffff" />
            <circle cx="62" cy="54" r="4.5" fill="#1e293b" />
            <circle cx="63.5" cy="52.5" r="1.5" fill="#ffffff" />
            {/* Blushing cheeks */}
            <ellipse cx="33" cy="62" rx="5" ry="3" fill="#f43f5e" opacity="0.6" />
            <ellipse cx="71" cy="62" rx="5" ry="3" fill="#f43f5e" opacity="0.6" />
            {/* Happy small mouth */}
            <path d="M 50 62 Q 52 66 54 62" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'boss_angeling':
        return (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl">
            <defs>
              <radialGradient id="angelPoring" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#fecdd3" />
                <stop offset="60%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </radialGradient>
              <linearGradient id="goldHalo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>
            {/* Shadow */}
            <ellipse cx="60" cy="100" rx="38" ry="9" fill="#00000025" />
            
            {/* Angel Wings Left & Right */}
            <g className="animate-pulse">
              <path d="M 28 60 C 10 50, 5 30, 20 25 C 26 35, 24 50, 32 58 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M 92 60 C 110 50, 115 30, 100 25 C 94 35, 96 50, 88 58 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            </g>

            {/* Glowing Angel Halo */}
            <ellipse cx="60" cy="22" rx="26" ry="7" fill="none" stroke="url(#goldHalo)" strokeWidth="4" />
            <ellipse cx="60" cy="22" rx="28" ry="8" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.7" />

            {/* Poring Body */}
            <path
              d="M 60 38 C 76 38, 92 56, 92 78 C 92 92, 78 95, 60 95 C 42 95, 28 92, 28 78 C 28 56, 44 38, 60 38 Z"
              fill="url(#angelPoring)"
            />
            {/* Eyes */}
            <circle cx="52" cy="65" r="4.5" fill="#1e293b" />
            <circle cx="53.5" cy="63.5" r="1.5" fill="#ffffff" />
            <circle cx="70" cy="65" r="4.5" fill="#1e293b" />
            <circle cx="71.5" cy="63.5" r="1.5" fill="#ffffff" />
            {/* Wings on head/blush */}
            <ellipse cx="44" cy="74" rx="5" ry="3" fill="#fda4af" opacity="0.8" />
            <ellipse cx="78" cy="74" rx="5" ry="3" fill="#fda4af" opacity="0.8" />
            <path d="M 59 72 Q 61 76 63 72" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'boss_golden_bug':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
            <defs>
              <linearGradient id="goldCarapace" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="85" rx="36" ry="8" fill="#00000030" />
            {/* Golden Carapace & Horns */}
            <path d="M 50 15 L 42 32 L 58 32 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
            <ellipse cx="50" cy="55" rx="34" ry="28" fill="url(#goldCarapace)" stroke="#facc15" strokeWidth="2" />
            <path d="M 50 30 L 50 82" stroke="#713f12" strokeWidth="3" />
            {/* Glowing Red Eyes */}
            <circle cx="42" cy="40" r="4" fill="#ef4444" />
            <circle cx="58" cy="40" r="4" fill="#ef4444" />
            {/* Golden legs */}
            <path d="M 22 45 L 8 42 M 20 58 L 6 62 M 24 70 L 12 78" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
            <path d="M 78 45 L 92 42 M 80 58 L 94 62 M 76 70 L 88 78" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );

      case 'boss_ghostring':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
            <defs>
              <radialGradient id="ghostGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#a855f7" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.4" />
              </radialGradient>
            </defs>
            <ellipse cx="50" cy="86" rx="32" ry="7" fill="#581c8730" />
            {/* Floating spirit body */}
            <path
              d="M 50 18 C 72 18, 86 38, 86 62 C 86 78, 76 84, 68 76 C 60 86, 44 86, 36 76 C 26 84, 14 78, 14 62 C 14 38, 28 18, 50 18 Z"
              fill="url(#ghostGrad)"
              className="animate-pulse"
            />
            {/* Glowing cyan eyes */}
            <circle cx="40" cy="48" r="5" fill="#38bdf8" />
            <circle cx="60" cy="48" r="5" fill="#38bdf8" />
            <circle cx="41" cy="47" r="1.5" fill="#ffffff" />
            <circle cx="61" cy="47" r="1.5" fill="#ffffff" />
            {/* Ethereal whisper mouth */}
            <ellipse cx="50" cy="62" rx="4" ry="6" fill="#3b0764" opacity="0.6" />
          </svg>
        );

      case 'boss_baphomet':
        return (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
            <defs>
              <linearGradient id="demonHorn" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
            </defs>
            <ellipse cx="60" cy="105" rx="44" ry="10" fill="#00000040" />
            {/* Large Ram Horns */}
            <path
              d="M 40 40 C 20 20, 5 35, 12 55 C 18 45, 28 35, 42 45 Z"
              fill="url(#demonHorn)"
              stroke="#b45309"
              strokeWidth="2"
            />
            <path
              d="M 80 40 C 100 20, 115 35, 108 55 C 102 45, 92 35, 78 45 Z"
              fill="url(#demonHorn)"
              stroke="#b45309"
              strokeWidth="2"
            />
            {/* Dark Hood & Goat Head */}
            <polygon points="60,30 35,80 85,80" fill="#1e1b4b" stroke="#4338ca" strokeWidth="2" />
            <circle cx="60" cy="60" r="22" fill="#262626" />
            {/* Evil Glowing Ruby Eyes */}
            <polygon points="50,56 56,60 50,64" fill="#ef4444" />
            <polygon points="70,56 64,60 70,64" fill="#ef4444" />
            {/* Pentagram on forehead */}
            <path d="M 60 44 L 63 52 L 56 47 L 64 47 L 57 52 Z" fill="#f59e0b" />
            {/* Spiked Dark Mantle */}
            <path d="M 25 82 L 60 102 L 95 82 L 80 100 L 60 92 L 40 100 Z" fill="#0f172a" />
          </svg>
        );

      default:
        // Generic cute RO monster representation
        return (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">
            <span className="transform transition-transform hover:scale-110">
              {monster.avatar}
            </span>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-200 ${sizeClasses} ${
        isHit ? 'brightness-150 scale-95 animate-shake' : ''
      } ${isAttacking ? 'translate-y-3 scale-110' : ''}`}
    >
      <div className="w-full h-full animate-poring-bounce">
        {renderMonsterArt()}
      </div>
      {monster.isBoss && (
        <span className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-500 to-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border border-yellow-200 uppercase tracking-wider">
          BOSS
        </span>
      )}
    </div>
  );
};
