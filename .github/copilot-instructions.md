# 開発時の追加指示

このファイルには、このリポジトリ固有の内容だけを書きます。共通の harness / agent 指示と重複する一般論は書かなくてよいです。

## 言語

- ユーザー向けの説明、Issue / PR の本文、レビュー返信は日本語で書く
- **プルリクエストのタイトルと本文は日本語で書く**
- 進捗報告のチェックリストも日本語で書く

## このリポジトリの現状

- アプリ本体は TypeScript で、主要なソースは `src/` にある
- `demo-library/` にはライブラリ利用例があり、`npm run build` であわせてビルドされる
- テストは Vitest (`npm test`)
- GitHub Pages デプロイは `.github/workflows/deploy.yml` で行っている
- デプロイ時は `npm ci` → `./setup-mml.sh` → `npm run build` → `./build.sh --build-only` → `./setup-oscilloscope.sh` の順でセットアップとビルドを行う
- `dist/` と `demo-library/demo-library.js` はビルド成果物で、`.gitignore` 済み

## 変更時の注意

- 外部ライブラリや静的アセットを追加・変更する場合は、`README.md` / `README.ja.md` / `MML.md` / `OSCILLOSCOPE.md` と `.github/workflows/deploy.yml` への影響を確認する
- `setup-mml.sh` と `setup-oscilloscope.sh` で取得する配布物に依存する変更では、相対パスと GitHub Pages 配信物への含まれ方を確認する
- cat2151 管理の配布物が 404 の場合は、ローカルビルドや代替手段で隠さず、公開物の問題として失敗を表に出す

## よく使うコマンド

```bash
npm ci
npm run build
npm test
./build.sh --server-only
```
