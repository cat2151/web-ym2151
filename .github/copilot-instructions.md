## 言語

- プルリクエストは日本語で書く

## このリポジトリの現状

- アプリ本体は TypeScript で、主要なソースは `src/` にある
- `demo-library/` にはライブラリ利用例があり、`npm run build` であわせてビルドされる
- テストは Vitest (`npm test`)
- GitHub Pages デプロイは `.github/workflows/deploy.yml` で行っている
- デプロイ時は `npm ci` → `./setup-mml.sh` → `npm run build` → GitHub Actions 上で `mymindstorm/setup-emsdk@v14` を使って Emscripten をセットアップ → `./build.sh --build-only` → `./setup-oscilloscope.sh` の順でセットアップとビルドを行う
- `dist/` と `demo-library/demo-library.js` はビルド成果物で、`.gitignore` 済み

## 変更時の注意

- 外部ライブラリや静的アセットを追加・変更する場合は、`README.md` / `README.ja.md` / `MML.md` / `OSCILLOSCOPE.md` と `.github/workflows/deploy.yml` への影響を確認する
- `setup-mml.sh` と `setup-oscilloscope.sh` で取得する配布物に依存する変更では、相対パスと GitHub Pages 配信物への含まれ方を確認する
- cat2151 管理の配布物が 404 の場合は、ローカルビルドや代替手段で隠さず、ビルド・検証を失敗として扱い、公開物の問題であることをエラーとして報告する

## よく使うコマンド

```bash
npm ci
npm run build
npm test
./build.sh --server-only
```
