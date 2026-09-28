import React, { useState } from 'react';
import { Users, Plus, Check, Trash2, Edit2, X, Sparkles, Shield, BookOpen, Coins } from 'lucide-react';
import { UserAccount, PlayerProfile } from '../types/game';
import {
  getAllUsers,
  createUser,
  switchUser,
  deleteUser,
  updateUserMeta,
  AVATAR_OPTIONS,
} from '../utils/storage';
import { soundManager } from '../audio/soundManager';

interface UserModeModalProps {
  currentUser: UserAccount;
  onUserSwitched: (newUser: UserAccount) => void;
  onClose: () => void;
}

export const UserModeModal: React.FC<UserModeModalProps> = ({
  currentUser,
  onUserSwitched,
  onClose,
}) => {
  const [users, setUsers] = useState<UserAccount[]>(() => getAllUsers());
  const [isCreating, setIsCreating] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Switch to selected user
  const handleSelectUser = (user: UserAccount) => {
    if (user.id === currentUser.id) return;
    soundManager.playClick();
    const switched = switchUser(user.id);
    if (switched) {
      soundManager.playLevelUp();
      onUserSwitched(switched);
      onClose();
    }
  };

  // Create new user
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      setErrorMsg('请输入角色名称/昵称');
      return;
    }
    setErrorMsg(null);
    soundManager.playClick();

    const created = createUser(newUserName.trim(), selectedAvatar);
    soundManager.playLevelUp();
    setUsers(getAllUsers());
    setIsCreating(false);
    setNewUserName('');
    onUserSwitched(created);
    onClose();
  };

  // Start editing user
  const handleStartEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditAvatar(user.avatar || '⚔️');
    setErrorMsg(null);
  };

  // Save edited user
  const handleSaveEdit = (userId: string) => {
    if (!editName.trim()) {
      setErrorMsg('角色名不能为空');
      return;
    }
    const updated = updateUserMeta(userId, editName.trim(), editAvatar);
    if (updated) {
      setUsers(getAllUsers());
      if (userId === currentUser.id) {
        onUserSwitched(updated);
      }
      setEditingUserId(null);
      soundManager.playClick();
    }
  };

  // Handle user deletion
  const handleDelete = (userId: string) => {
    if (users.length <= 1) {
      setErrorMsg('至少需保留一个用户档案！');
      return;
    }
    const res = deleteUser(userId);
    if (res.success) {
      soundManager.playClick();
      const updatedUsers = getAllUsers();
      setUsers(updatedUsers);
      setDeleteConfirmId(null);
      if (res.newActiveUser && userId === currentUser.id) {
        onUserSwitched(res.newActiveUser);
      }
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  // Relative time helper
  const formatTimeAgo = (timestamp: number) => {
    const diffMin = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMin < 2) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}小时前`;
    return `${Math.floor(diffHour / 24)}天前`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-3.5 sm:p-4 md:p-5 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-base md:text-lg tracking-tight whitespace-nowrap truncate">
                  多用户模式 · 学习档案管理
                </h3>
                <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0 whitespace-nowrap">
                  {users.length} 个角色
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                支持多人独立背词、独立配装与生词回炉，数据彼此隔离
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-3.5 sm:mx-4 md:mx-5 mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-xl text-xs text-rose-600 dark:text-rose-300 flex items-center justify-between gap-2">
            <span className="truncate">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600 text-xs shrink-0">
              ✕
            </button>
          </div>
        )}

        {/* Body User List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3">
          {users.map((user) => {
            const isActive = user.id === currentUser.id;
            const isEditing = editingUserId === user.id;
            const profile = user.profile;
            const wordCount = Object.keys(profile.learnedWords || {}).length;

            return (
              <div
                key={user.id}
                className={`rounded-2xl p-3 sm:p-3.5 md:p-4 border transition-all ${
                  isActive
                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {isEditing ? (
                  /* Editing Form */
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="输入新角色名"
                        maxLength={12}
                        className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => handleSaveEdit(user.id)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 whitespace-nowrap shrink-0"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium whitespace-nowrap shrink-0"
                      >
                        取消
                      </button>
                    </div>

                    {/* Avatar picker */}
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold mb-1.5 block">选择头像图标:</span>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {AVATAR_OPTIONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setEditAvatar(icon)}
                            className={`h-8 text-base rounded-lg flex items-center justify-center transition-all ${
                              editAvatar === icon
                                ? 'bg-purple-600 text-white scale-105 shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Display User Card */
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 flex items-center justify-center text-xl sm:text-2xl shadow-xs shrink-0">
                        {user.avatar || '⚔️'}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
                          <span className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm md:text-base truncate">
                            {user.name}
                          </span>
                          {isActive && (
                            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                              <span>当前使用</span>
                            </span>
                          )}
                        </div>

                        {/* Stats Pills */}
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                            Lv.{profile.level || 1}
                          </span>
                          <span className="shrink-0">•</span>
                          <span className="inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                            <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{wordCount}词</span>
                          </span>
                          <span className="shrink-0">•</span>
                          <span className="inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                            <Coins className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{profile.zeny || 0}z</span>
                          </span>
                          <span className="hidden sm:inline shrink-0">•</span>
                          <span className="hidden sm:inline text-slate-400 shrink-0 whitespace-nowrap">
                            {formatTimeAgo(user.lastPlayedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      {!isActive ? (
                        <button
                          onClick={() => handleSelectUser(user)}
                          className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center whitespace-nowrap shrink-0"
                        >
                          <span>切换</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(user)}
                          className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center shrink-0"
                          title="修改名称/头像"
                        >
                          <Edit2 className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      )}

                      {!isActive && (
                        <>
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center shrink-0"
                            title="修改名称/头像"
                          >
                            <Edit2 className="w-3.5 h-3.5 shrink-0" />
                          </button>

                          {deleteConfirmId === user.id ? (
                            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-rose-200 dark:border-rose-900 shrink-0 whitespace-nowrap">
                              <span className="text-[10px] text-rose-500 font-bold px-0.5">删?</span>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold hover:bg-rose-700"
                              >
                                是
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded"
                              >
                                否
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(user.id)}
                              className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors flex items-center justify-center shrink-0"
                              title="删除此档案"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Create User Form or Button */}
          {isCreating ? (
            <form
              onSubmit={handleCreateSubmit}
              className="bg-purple-50/50 dark:bg-purple-950/20 border-2 border-dashed border-purple-200 dark:border-purple-800/80 rounded-2xl p-3.5 sm:p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-purple-900 dark:text-purple-300 inline-flex items-center gap-1 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>创建新学习角色/用户档案</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 whitespace-nowrap shrink-0"
                >
                  取消
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  用户昵称 / 孩子名字
                </label>
                <input
                  type="text"
                  placeholder="例如：小明、Alice、萌萌..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  maxLength={12}
                  autoFocus
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
                  挑选角色头像
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {AVATAR_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedAvatar(icon)}
                      className={`h-8 rounded-xl flex items-center justify-center text-base sm:text-lg transition-all ${
                        selectedAvatar === icon
                          ? 'bg-purple-600 text-white scale-105 shadow-xs ring-2 ring-purple-300 dark:ring-purple-700'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>立即创建并开启学习</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                soundManager.playClick();
                setIsCreating(true);
              }}
              className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 rounded-2xl text-xs md:text-sm font-bold transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>新建学习角色 / 用户档案</span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200/90 dark:border-slate-800 text-center">
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
            💡 提示：所有角色档案保存在本地浏览器中，切换角色即刻载入该角色的独立学习与配装数据。
          </p>
        </div>
      </div>
    </div>
  );
};
