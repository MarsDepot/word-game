import React, { useState } from 'react';
import { X, Save, BookOpen, Volume2 } from 'lucide-react';
import { WordItem } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface WordEditModalProps {
  word: WordItem | null; // null for creating a new word
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: WordItem) => void;
}

export const WordEditModal: React.FC<WordEditModalProps> = ({
  word,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = !!word;

  const [englishWord, setEnglishWord] = useState(word?.word || '');
  const [phonetic, setPhonetic] = useState(word?.phonetic || '');
  const [partOfSpeech, setPartOfSpeech] = useState(word?.partOfSpeech || 'n.');
  const [translation, setTranslation] = useState(word?.translation || '');
  const [example, setExample] = useState(word?.example || '');
  const [exampleTranslation, setExampleTranslation] = useState(word?.exampleTranslation || '');
  const [distractor1, setDistractor1] = useState(word?.options?.[1] || '');
  const [distractor2, setDistractor2] = useState(word?.options?.[2] || '');
  const [distractor3, setDistractor3] = useState(word?.options?.[3] || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = () => {
    const cleanWord = englishWord.trim();
    const cleanTrans = translation.trim();

    if (!cleanWord) {
      setErrorMsg('请输入英文单词');
      return;
    }
    if (!cleanTrans) {
      setErrorMsg('请输入中文释义');
      return;
    }

    const options = [
      cleanTrans,
      distractor1.trim() || '选项B',
      distractor2.trim() || '选项C',
      distractor3.trim() || '选项D',
    ];

    const updatedWord: WordItem = {
      id: word?.id || `word_${cleanWord.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      word: cleanWord,
      phonetic: phonetic.trim() || `/${cleanWord.toLowerCase()}/`,
      translation: cleanTrans,
      options,
      partOfSpeech: partOfSpeech.trim() || 'n.',
      example: example.trim() || `Sue has the ability to use ${cleanWord}.`,
      exampleTranslation: exampleTranslation.trim() || `例句释义`,
      category: word?.category || '中考核心词汇库',
      mastery: word?.mastery ?? 0,
      wrongCount: word?.wrongCount ?? 0,
      correctCount: word?.correctCount ?? 0,
      consecutiveCorrect: word?.consecutiveCorrect ?? 0,
      appearedCount: word?.appearedCount ?? 0,
      inFurnace: word?.inFurnace ?? false,
    };

    soundManager.playCorrect();
    onSave(updatedWord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-800 dark:text-slate-100">
                {isEditing ? '编辑单词条目' : '新增单词条目'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                支持编辑音标、词性、中文释义及双语例句
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs md:text-sm">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/60">
              {errorMsg}
            </div>
          )}

          {/* Word & Phonetic */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                英文单词 *
              </label>
              <input
                type="text"
                value={englishWord}
                onChange={(e) => {
                  setEnglishWord(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="例如: ability"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                音标 (选填)
              </label>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="例如: [/əˈbɪləti/]"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* POS & Meaning */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-1">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                词性
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="n.">n. 名词</option>
                <option value="v.">v. 动词</option>
                <option value="vt.">vt. 及物动词</option>
                <option value="vi.">vi. 不及物动词</option>
                <option value="adj.">adj. 形容词</option>
                <option value="adv.">adv. 副词</option>
                <option value="prep.">prep. 介词</option>
                <option value="conj.">conj. 连词</option>
                <option value="pron.">pron. 代词</option>
                <option value="interj.">interj. 感叹词</option>
                <option value="phrase">phrase 短语</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                中文释义 (正确释义) *
              </label>
              <input
                type="text"
                value={translation}
                onChange={(e) => {
                  setTranslation(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="例如: 能力，才能，本领"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Example Sentence */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              英文例句 (选填)
            </label>
            <textarea
              rows={2}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="例如: Sue has the ability to succeed in business."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Example Translation */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              例句中文译文 (选填)
            </label>
            <input
              type="text"
              value={exampleTranslation}
              onChange={(e) => setExampleTranslation(e.target.value)}
              placeholder="例如: 苏有能力在商业上取得成功。"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Optional: Distractor options preview */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              干扰项设置 (不填将自动基于词库随机生成)：
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <input
                type="text"
                placeholder="干扰项1"
                value={distractor1}
                onChange={(e) => setDistractor1(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-200"
              />
              <input
                type="text"
                placeholder="干扰项2"
                value={distractor2}
                onChange={(e) => setDistractor2(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-200"
              />
              <input
                type="text"
                placeholder="干扰项3"
                value={distractor3}
                onChange={(e) => setDistractor3(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存条目</span>
          </button>
        </div>
      </div>
    </div>
  );
};
