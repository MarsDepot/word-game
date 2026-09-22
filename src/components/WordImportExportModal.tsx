import React, { useState, useMemo } from 'react';
import { X, Copy, Download, Upload, Check, FileText, Sparkles, AlertCircle, RefreshCw, Flame, BookOpen, Layers } from 'lucide-react';
import { WordItem, PlayerProfile } from '../types/game';
import { GAME_MAPS } from '../data/words';
import {
  ExportFormat,
  exportWordsToText,
  parseWordsFromText,
  downloadTextFile,
  copyTextToClipboard,
  getAllDefaultWords,
} from '../utils/wordHelpers';
import { soundManager } from '../audio/soundManager';

interface WordImportExportModalProps {
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onClose: () => void;
  initialTab?: 'export' | 'import';
}

export const WordImportExportModal: React.FC<WordImportExportModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  initialTab = 'export',
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialTab);

  // --- Export State ---
  const [exportScope, setExportScope] = useState<'all' | 'learned' | 'furnace'>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('standard');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // --- Import State ---
  const [importText, setImportText] = useState('');
  const [importTarget, setImportTarget] = useState<'learned' | 'furnace'>('learned');
  const [importFeedback, setImportFeedback] = useState<{
    success: boolean;
    message: string;
    parsedWords: WordItem[];
    errors: string[];
  } | null>(null);

  // Gather all unique words
  const allGameWords = useMemo(() => {
    const defaultWords = getAllDefaultWords();
    const learnedMap = profile.learnedWords || {};
    const map = new Map<string, WordItem>();

    defaultWords.forEach((w) => map.set(w.id, w));
    Object.values(learnedMap).forEach((w) => map.set(w.id, w));

    return Array.from(map.values());
  }, [profile.learnedWords]);

  const learnedWordsList = useMemo(() => {
    return Object.values(profile.learnedWords || {});
  }, [profile.learnedWords]);

  const furnaceWordsList = useMemo(() => {
    return (profile.furnaceWordIds || [])
      .map((id) => profile.learnedWords[id] || allGameWords.find((w) => w.id === id))
      .filter((w): w is WordItem => !!w);
  }, [profile.furnaceWordIds, profile.learnedWords, allGameWords]);

  // Words selected for export
  const exportTargetWords = useMemo(() => {
    switch (exportScope) {
      case 'learned':
        return learnedWordsList;
      case 'furnace':
        return furnaceWordsList;
      case 'all':
      default:
        return allGameWords;
    }
  }, [exportScope, learnedWordsList, furnaceWordsList, allGameWords]);

  // Generated export text
  const exportedText = useMemo(() => {
    return exportWordsToText(exportTargetWords, exportFormat);
  }, [exportTargetWords, exportFormat]);

  // Copy export text
  const handleCopyExport = async () => {
    soundManager.playClick();
    const ok = await copyTextToClipboard(exportedText);
    if (ok) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2200);
    }
  };

  // Download export text
  const handleDownloadExport = () => {
    soundManager.playClick();
    const ext = exportFormat === 'json' ? 'json' : exportFormat === 'csv' ? 'csv' : 'txt';
    const filename = `仙境词语物语_单词导出_${exportScope}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    const mime =
      exportFormat === 'json'
        ? 'application/json;charset=utf-8'
        : exportFormat === 'csv'
        ? 'text/csv;charset=utf-8'
        : 'text/plain;charset=utf-8';
    downloadTextFile(filename, exportedText, mime);
  };

  // Parse import text in real-time
  const handleParseImport = (text: string) => {
    setImportText(text);
    if (!text.trim()) {
      setImportFeedback(null);
      return;
    }

    const res = parseWordsFromText(text, allGameWords);
    if (res.success) {
      setImportFeedback({
        success: true,
        message: `成功解析出 ${res.words.length} 个有效单词！`,
        parsedWords: res.words,
        errors: res.errors,
      });
    } else {
      setImportFeedback({
        success: false,
        message: res.errors[0] || '未能识别有效单词格式',
        parsedWords: [],
        errors: res.errors,
      });
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        handleParseImport(content);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  // Confirm import into player profile
  const handleConfirmImport = () => {
    if (!importFeedback || !importFeedback.success || importFeedback.parsedWords.length === 0) return;

    soundManager.playLevelUp();
    const newWords = importFeedback.parsedWords;

    onUpdateProfile((prev) => {
      const nextLearned = { ...prev.learnedWords };
      const newWordIds: string[] = [];

      newWords.forEach((w) => {
        nextLearned[w.id] = {
          ...w,
          inFurnace: importTarget === 'furnace' ? true : w.inFurnace,
        };
        newWordIds.push(w.id);
      });

      const nextFurnace =
        importTarget === 'furnace'
          ? Array.from(new Set([...prev.furnaceWordIds, ...newWordIds]))
          : prev.furnaceWordIds;

      return {
        ...prev,
        learnedWords: nextLearned,
        furnaceWordIds: nextFurnace,
      };
    });

    alert(`🎉 成功导入 ${newWords.length} 个单词到${importTarget === 'furnace' ? '生词回炉本' : '已学词库'}！`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-base md:text-lg">
                单词文本导入与导出
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                支持纯文本、背词本、CSV表格与JSON格式，方便备份与自由扩展词库
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 md:px-5 pt-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex space-x-1">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('export');
              }}
              className={`flex-1 py-2 text-xs md:text-sm font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>📤 导出单词文本 ({exportTargetWords.length} 词)</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('import');
              }}
              className={`flex-1 py-2 text-xs md:text-sm font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'import'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>📥 导入新单词</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {activeTab === 'export' ? (
            /* =================== EXPORT TAB =================== */
            <div className="space-y-4">
              {/* Export Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800">
                {/* Scope selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    选择导出范围:
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setExportScope('all')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
                        exportScope === 'all'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750'
                      }`}
                    >
                      全部词库 ({allGameWords.length})
                    </button>
                    <button
                      onClick={() => setExportScope('learned')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
                        exportScope === 'learned'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750'
                      }`}
                    >
                      已学词汇 ({learnedWordsList.length})
                    </button>
                    <button
                      onClick={() => setExportScope('furnace')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
                        exportScope === 'furnace'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750'
                      }`}
                    >
                      生词本 ({furnaceWordsList.length})
                    </button>
                  </div>
                </div>

                {/* Format selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    选择文本格式:
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setExportFormat('standard')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
                        exportFormat === 'standard'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750'
                      }`}
                    >
                      标准背词本 (.txt)
                    </button>
                    <button
                      onClick={() => setExportFormat('simple')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
                        exportFormat === 'simple'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750'
                      }`}
                    >
                      简洁词对 (word 释义)
                    </button>
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
                        exportFormat === 'csv'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750'
                      }`}
                    >
                      CSV表格 (Excel/Anki)
                    </button>
                    <button
                      onClick={() => setExportFormat('json')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all ${
                        exportFormat === 'json'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750'
                      }`}
                    >
                      JSON完整数据
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Preview Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-1">
                  <span>导出文本预览 (共 {exportTargetWords.length} 个单词):</span>
                  <span>{exportedText.length} 字符</span>
                </div>
                <textarea
                  readOnly
                  value={exportedText}
                  className="w-full h-48 md:h-56 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none resize-none leading-relaxed select-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={handleCopyExport}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>已复制到剪贴板！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>一键复制全部文本</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadExport}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black text-xs md:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>下载文本文件 (.{exportFormat === 'json' ? 'json' : exportFormat === 'csv' ? 'csv' : 'txt'})</span>
                </button>
              </div>
            </div>
          ) : (
            /* =================== IMPORT TAB =================== */
            <div className="space-y-4">
              {/* Target & Upload Options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">导入目的地:</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setImportTarget('learned')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        importTarget === 'learned'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      已学词库
                    </button>
                    <button
                      onClick={() => setImportTarget('furnace')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        importTarget === 'furnace'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      生词回炉本
                    </button>
                  </div>
                </div>

                {/* Upload File button */}
                <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>上传文件 (.txt / .csv / .json)</span>
                  <input
                    type="file"
                    accept=".txt,.csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Text Input area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-1">
                  <span>粘贴要导入的单词文本 (支持多种常见格式):</span>
                  <button
                    onClick={() => {
                      const sample = `adventure [əd'ventʃə] n. 冒险；刺激经历 - Life is a great adventure.
brave /breɪv/ adj. 勇敢的；无畏的 - The brave warrior fought the dragon.
potion n. 药水；魔药 - She drank a healing potion.
sword 剑；短剑
shield: 盾牌；防护`;
                      handleParseImport(sample);
                    }}
                    className="text-purple-600 dark:text-purple-400 hover:underline text-[11px]"
                  >
                    填入示例数据
                  </button>
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => handleParseImport(e.target.value)}
                  placeholder="在此直接粘贴单词文本，每行一个单词，支持例如：
1. apple /'æpl/ n. 苹果 - An apple a day...
2. banana 香蕉
3. courage: 勇气
4. CSV格式: sword,/'sɔːd/,n.,剑"
                  className="w-full h-36 md:h-44 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              {/* Real-time Parsed Feedback */}
              {importFeedback && (
                <div
                  className={`p-3 rounded-2xl border text-xs ${
                    importFeedback.success
                      ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center space-x-1.5">
                      {importFeedback.success ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span>{importFeedback.message}</span>
                    </div>
                  </div>

                  {/* Parsed Preview Table */}
                  {importFeedback.parsedWords.length > 0 && (
                    <div className="mt-2.5 max-h-32 overflow-y-auto rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-white/80 dark:bg-slate-900/80 p-2 space-y-1">
                      {importFeedback.parsedWords.slice(0, 15).map((w, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 dark:text-slate-100 font-serif">
                              {w.word}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {w.phonetic}
                            </span>
                            <span className="text-[9px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                              {w.partOfSpeech}
                            </span>
                          </div>
                          <span className="text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                            {w.translation}
                          </span>
                        </div>
                      ))}
                      {importFeedback.parsedWords.length > 15 && (
                        <div className="text-[10px] text-center text-slate-400 py-1">
                          ... 以及另外 {importFeedback.parsedWords.length - 15} 个单词
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Import Button */}
              <button
                disabled={!importFeedback || !importFeedback.success || importFeedback.parsedWords.length === 0}
                onClick={handleConfirmImport}
                className={`w-full py-2.5 rounded-xl font-black text-xs md:text-sm transition-all shadow-xs flex items-center justify-center space-x-1.5 ${
                  importFeedback && importFeedback.success && importFeedback.parsedWords.length > 0
                    ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  确认导入 {importFeedback?.parsedWords.length || 0} 个单词到
                  {importTarget === 'furnace' ? '生词回炉本' : '已学词库'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/90 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            💡 提示：所有导出的单词包含例句与词性，导入后的单词会自动适配战斗出题与卡普拉回炉系统。
          </p>
        </div>
      </div>
    </div>
  );
};
