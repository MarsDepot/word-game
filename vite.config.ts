import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function syncDefaultVocabularyPlugin(): Plugin {
  return {
    name: 'sync-default-vocabulary-plugin',
    configureServer(server) {
      server.middlewares.use('/api/sync-default-words', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const targetPath = path.resolve(__dirname, 'src/data/shanghaiWords.ts');
            const content = fs.readFileSync(targetPath, 'utf-8');
            const match = content.match(/export const ALL_UNIFIED_WORDS:\s*WordItem\[\]\s*=\s*(\[[\s\S]*?\]);\n/);
            let count = 0;
            if (match) {
              const parsed = JSON.parse(match[1]);
              count = Array.isArray(parsed) ? parsed.length : 0;
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, count }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          }
          return;
        }

        if (req.method !== 'POST') {
          next();
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}');
            const rawWords = payload.words;
            const force = !!payload.force;

            if (!Array.isArray(rawWords) || rawWords.length === 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Invalid or empty words array' }));
              return;
            }

            const targetPath = path.resolve(__dirname, 'src/data/shanghaiWords.ts');
            if (!force && fs.existsSync(targetPath)) {
              try {
                const existingContent = fs.readFileSync(targetPath, 'utf-8');
                const match = existingContent.match(/export const ALL_UNIFIED_WORDS:\s*WordItem\[\]\s*=\s*(\[[\s\S]*?\]);\n/);
                if (match) {
                  const existingArr = JSON.parse(match[1]);
                  if (
                    Array.isArray(existingArr) &&
                    existingArr.length === rawWords.length &&
                    existingArr[0]?.word === rawWords[0]?.word &&
                    existingArr[existingArr.length - 1]?.word === rawWords[rawWords.length - 1]?.word
                  ) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ ok: true, updated: false, count: existingArr.length }));
                    return;
                  }
                }
              } catch {
                // proceed to write
              }
            }

            const cleanOpt = (s: any) =>
              String(s || '')
                .replace(/^\[\]\s*/g, '')
                .replace(/\[[^\]]*\]/g, '')
                .replace(/^\s*\/\s*[a-zA-Z\-\s]+\s*(?:\([^)]*\))?\s*/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            const allTranslations = rawWords
              .map((w: any) => cleanOpt(w?.translation))
              .filter(Boolean);

            const cleanWords = rawWords.map((w: any, idx: number) => {
              const wordStr = String(w?.word || `word_${idx + 1}`).trim();
              const slug = wordStr.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `${idx + 1}`;
              const id = `w_${idx + 1}_${slug}`;
              const translation = cleanOpt(w?.translation) || '未知释义';

              let options: string[] = Array.isArray(w?.options)
                ? w.options.map((o: any) => cleanOpt(o)).filter(Boolean)
                : [];

              if (!options.includes(translation)) {
                options = [translation, ...options];
              }
              let offset = 1;
              while (options.length < 4 && allTranslations.length >= 4) {
                const candidate = allTranslations[(idx + offset * 17) % allTranslations.length];
                if (candidate && !options.includes(candidate)) {
                  options.push(candidate);
                }
                offset++;
                if (offset > allTranslations.length + 5) break;
              }
              while (options.length < 4) {
                options.push(`干扰项${options.length}`);
              }
              options = options.slice(0, 4);

              return {
                id,
                word: wordStr,
                phonetic: String(w?.phonetic || `/${wordStr.toLowerCase()}/`).trim(),
                translation,
                partOfSpeech: String(w?.partOfSpeech || 'n.').trim(),
                options,
                example: String(w?.example || '').trim(),
                exampleTranslation: String(w?.exampleTranslation || '').trim(),
                category: String(w?.category || '上海初中考纲核心词汇').trim(),
                mastery: 0,
                wrongCount: 0,
                correctCount: 0,
                consecutiveCorrect: 0,
                appearedCount: 0,
                inFurnace: false,
              };
            });

            const total = cleanWords.length;
            const chunkSize = Math.ceil(total / 5);
            const u1 = cleanWords.slice(0, chunkSize);
            const u2 = cleanWords.slice(chunkSize, chunkSize * 2);
            const u3 = cleanWords.slice(chunkSize * 2, chunkSize * 3);
            const u4 = cleanWords.slice(chunkSize * 3, chunkSize * 4);
            const u5 = cleanWords.slice(chunkSize * 4);

            const fileContent = [
              `import { WordItem } from '../types/game';`,
              ``,
              `export const ALL_UNIFIED_WORDS: WordItem[] = ${JSON.stringify(cleanWords)};`,
              ``,
              `export const SH_UNIT1_WORDS: WordItem[] = ${JSON.stringify(u1)};`,
              `export const SH_UNIT2_WORDS: WordItem[] = ${JSON.stringify(u2)};`,
              `export const SH_UNIT3_WORDS: WordItem[] = ${JSON.stringify(u3)};`,
              `export const SH_UNIT4_WORDS: WordItem[] = ${JSON.stringify(u4)};`,
              `export const SH_UNIT5_COMPREHENSIVE_WORDS: WordItem[] = ${JSON.stringify(u5)};`,
              ``,
              `export const SH_MIDDLE_SCHOOL_MAP1_WORDS = SH_UNIT1_WORDS;`,
              `export const SH_MIDDLE_SCHOOL_MAP2_WORDS = SH_UNIT2_WORDS;`,
              `export const SH_MIDDLE_SCHOOL_MAP3_WORDS = SH_UNIT3_WORDS;`,
              `export const SH_MIDDLE_SCHOOL_MAP4_WORDS = SH_UNIT4_WORDS;`,
              `export const SH_MIDDLE_SCHOOL_MAP5_WORDS = SH_UNIT5_COMPREHENSIVE_WORDS;`,
              ``,
            ].join('\n');

            fs.writeFileSync(targetPath, fileContent, 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: true,
                updated: true,
                count: cleanWords.length,
                words: cleanWords,
              })
            );
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), syncDefaultVocabularyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
