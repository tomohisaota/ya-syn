# ya-syn 紹介リール — 制作プロンプト

この動画（`reel.html`）を作り直す・直すときの指示書。Claude にこのファイルを渡して
「PROMPT.md に沿って直して」と頼めば、同じ前提から始められる。決まったことはここに足していく。

## 依頼（元の言葉）

- ya-syn はプログラマ向けなので、コアな機能をわかりやすく紹介する動画にする
- 特に LazyInitializer、CachedProvider、TaskExecutor は、このライブラリがないと実装が大変なので重点的に扱う
- 作りは `../loan-tenbin/video`（ローン天秤のリール）と同じにする
- （2 回目）セマフォが効いている部分が動画ではわかりにくい。セマフォによる制御が効いている部分を見せたい
- （3 回目）最初のタイムラインベースのアニメーションはとてもわかりやすいので残す。その中でセマフォの動きを見せる。
  **セマフォは説明の主役ではなく、脇役**
- （4 回目）並列処理の動画は、ya-syn が遅いだけに見える。同時実行数を制限したループと比較すべき
  （最大並列 3 で、それぞれ Promise.all するようなイメージ）

## 作り

- `reel.html` 一枚。`render(t)` が t 秒時点の見た目を決め打ちで描く純関数
  - プレビュー（requestAnimationFrame）と書き出し（1 コマずつ seek）で同じ絵になる
  - `?v=1` で 9:16、`?render=1` で操作 UI なし・等倍表示
- `render.mjs` が puppeteer-core で 1 コマずつ撮り、ffmpeg-static で mp4 にする
  - `reel.html` は `trace.json` を fetch する。`file://` では読めないので、リポジトリの根を配る
    小さな HTTP サーバーを立てて開く
- **動きは作らない。** `trace.mjs` が、ビルドした ya-syn（`../dist/index.mjs`）と素朴な実装を
  同じ呼び出し方で実際に動かし、呼んだ時刻・重い処理の開始と終わり・返った時刻・受け取った値を
  ms で `trace.json` に残す。図も段の本文の数（×5、8 回 → 2 回、同時に 10 本…）も、この記録から組み立てる
  - `trace.json` はコミットしておく（動かすたびに数 ms ずつ揺れるので、動画を安定させるため）。
    ライブラリや場面の条件を変えたら `npm run trace` で取り直す

```
cd video
npm install
npm run trace              # ルートで build → trace.json を取り直す
npm run preview            # http://localhost:8790/video/reel.html（?v=1 で縦）
npm run stills             # out/stills-h-*.png を 0.5 秒おきに（--at=1.2,3.4 で時刻指定）
npm run render             # out/ya-syn-reel-16x9.mp4（約 46 秒）
npm run render:v           # out/ya-syn-reel-9x16.mp4
```

直したら、まず `stills` で要所を画像で確かめてから `render` する（一本 数分かかる）。

## 記録する場面（trace.mjs）

- 01 LazyInitializer：5 人が 0/40/80/120/160ms に `get()`。`connect()` は 400ms
  - 自前：`if (!db) db = await connect()` → connect ×5、5 人が別々の接続（#0〜#4）
  - ya-syn：`new LazyInitializer(() => connect())` → ×1、全員が #0
  - おまけ：a と b が互いを待つ循環依存 → `SynchronizerReentrantExecutionError`（code `ReentrantExecution`）
- 02 CachedProvider：TTL 1000ms、fetch 250ms。起動直後に 3 件、期限切れ直後（1250〜1330ms）に 5 件、ほかにぽつぽつ
  - 自前：期限内なら返し、切れていたら取りに行く → 通して fetch ×8（期限切れ直後の 5 件で ×5）
  - ya-syn：`sp.createCachedProvider({ factory, defaultTTL })` → ×2（待った側はロックの中でキャッシュを見直す）
- 03 TaskExecutor：10 件（長さはばらばら）、7 件目が失敗。**どちらも並列 3** で比べる
  - 自前：3 本ずつ区切って `await Promise.all(chunk.map(run))`。区切りの中の一番遅い 1 本を待つ間、枠が空く
    → 856ms で完了。失敗の扱いは ya-syn と揃える（1 本ずつ catch して報告し、ループは止めない）
  - ya-syn：`maxTasksInFlight: 4, maxTasksInExecution: 3`（実行 3 本、generator から 1 本先に読む）
    → 空いた枠にすぐ次が入り、678ms で完了。失敗は `onTaskError` へ
  - 差は「同時に何本走るか」ではなく「枠を空けずに回せるか」。ms は記録のたびに数 ms 揺れる

- **セマフォの中の区切り（sem）** も同じ実行で記録する。起きた順に積むので、同じ ms の区切りも順番が本当の順
  - Lazy：LazyInitializer の中の `Semaphore(1)` は onEvent の口を持つが、LazyInitializer はそこへ何も渡さない。
    記録のためだけに `db.semaphore.synchronized` の onEvent に ev をつなぐ
  - Cache：`new SynchronizerProvider({ onEvent })` でライブラリ自身の Acquire / Acquired / Release と stats を受ける。
    記録から数えた tasks / running が stats と一致することを trace.mjs が検算する（合わなければ止まる）
  - Tasks：TaskExecutor の中の `CoreSemaphore`（inFlight / inExecution）には onEvent が無いので、
    記録のあいだだけ `CoreSemaphore.prototype.synchronized` を包む（終わったら戻す）
  - どれも動きは変えない。区切りを書き留めるだけ

## 見た目

- 地は明るい灰（`#e8eaed`）、面 `#fbfbfc`、墨 `#0f141a` / `#46505c` / `#7b8490`、罫 `#d3d8de`
- ya-syn は青 `#2f6fdb`、自前の実装は橙 `#e0703a`、失敗は赤 `#c9302c`、キャッシュが効いている間は緑 `#15936a`
- 書体：見出しと本文は Noto Sans JP（見出しは 900）、コード・番号・HUD・ロゴは JetBrains Mono
  （コードは合字を切る。`=>` を `⇒` にしない）
- コードは暗い面に、小さな色づけ（キーワード・文字列・数・ya-syn の API）
- 四隅に HUD。左上「ya-syn · v<package.json の版>」、右上に点と経過時間、左下「trace · real runs · node <版>」、右下「naive vs ya-syn」
- 図の文法は三つの段で揃える：1 行 = 1 回の呼び出し。点 = 呼んだ時刻、破線 = 待っている間、
  太い帯 = その呼び出しが走らせた重い処理、行末の札 = 受け取った値。上が自前、下が ya-syn。
  同じ再生ヘッドで左から右へ流し、右上の数（connect ×N、fetch ×N、running / in flight）がコマごとに変わる

## 構成（約 46 秒・30fps。段の長さは再生の時計から決まる）

| 秒 | 場面 | 中身 |
|---|---|---|
| 0.0–4.5 | ぶつかる | 5 本の `get()` が `connect()` に次々届き、×1 → ×5 と数える。まわりを並行処理の言葉（await・Promise.all・race condition・thundering herd…）が漂う。「その `await`、」「ぶつかっていませんか。」 |
| 4.5–7.5 | 転換 | 青く光る横線で地が上下に割れる。「ya-syn」（syn が青）、`Yet Another Synchronizer for TypeScript`、「非同期の「同時に」を、正しくさばく。」 |
| 7.5–17.3 | 01 一度だけ、作る。 | LazyInitializer。左に見出しとコード、右に記録の図（自前 / ya-syn） |
| 17.3–27.7 | 02 殺到させない。 | CachedProvider。上に「cache」の帯（効いている間） |
| 27.7–38.5 | 03 流して、絞る。 | TaskExecutor。自前は区切りの境目（縦の破線）と、先に終わった枠が待つ間（橙の点線）。両方に「◯ms で完了」の線 |
| 38.5–42.0 | ほかにも | synchronized() / forKey()・forObject() / timeout()・throttle() / 再入の検出 / onEvent / mergeAsyncGenerators |
| 42.0–46.0 | 締め | 「ya-syn」、`yet another synchronizer for typescript.`、黒いボタン `$ npm install ya-syn`、github・MIT・TypeScript・Node.js / Browser |

- 段の中：0〜0.6 秒で入る、コードが 1 行ずつ、1.4 秒から記録を再生、そのあと本文 3 行と ya-syn の枠の縁取り
- **セマフォは脇役として、ya-syn のパネルにだけ小さく添える**（主役は比べるタイムラインと数）
  - 行の破線は「鍵（枠）を待っている間」。鍵を取った時刻に小さな青い縦棒
  - 受け渡し（Release → 次の Acquired が同じ ms）は、前の持ち主の行から次の行へ細い青の縦線。いま渡った 1 本だけ濃く
  - ya-syn の見出しの横に、錠のしるしと「Semaphore(1) · 待ち N」「Synchronizer(1) · 待ち N」
    「inFlight n/4 · inExecution n/3」を ink3 で小さく（受け渡しの瞬間だけ青）
  - 再生の時計は等速。ただし受け渡しの区切りでだけ 0.2 秒止め（`HOLD`）、同じ ms の受け渡しが 1 本ずつ見えるようにする。
    止めている間も ms は記録のまま。順番も記録のまま
- 下に 3 つの点の進み具合（01 LazyInitializer / 02 CachedProvider / 03 TaskExecutor）
- 9:16 版は、段の見出しとコードを上、カードを下に積む

## してはいけないこと

- 図の時刻や回数を作る（必ず trace.json から描く）
- 速さのベンチマークのような言い方（「最速」「〜倍速い」）。記録は振る舞いの違いを見せるためのもの
- 条件のそろわない比較（並列数の違う相手と比べて、ya-syn が遅く見える／速く見える）
- 無い API を出す（出す名前は src/ にあるものだけ）
- セマフォを主役にする（専用の場面を作る、本文をセマフォの話で埋める）

## 気をつけること

- 日本語の書体（Google Fonts）は字の範囲ごとに分かれ、初めて使う字で読み込まれる。`display=block` なので読み込むまで字が透明になる。
  `window.__ready` で全体を一度描いて要る字を読み込ませてから書き出す（これを外すと、段の見出しや軸の字が抜けたコマができる）

## 決めたことの記録

- 2026-09-27 セマフォの効きが見えにくいとのことで、各部品に「中を見る」段（待ち行列・ゲート・記録のログ）を足した（77 秒）が、
  最初のタイムラインがわかりやすいのでそれを残し、その中に脇役として添える形に戻した（約 46 秒）
- 2026-09-27 loan-tenbin のリールと同じ作り（render(t) の純関数 + puppeteer + ffmpeg）で作った。
  「サイトの計算エンジンを呼ぶ」の代わりに「ライブラリを実際に動かした記録を読む」にした
- 2026-09-27 TaskExecutor の相手を「全部いっぺんに Promise.all」から「3 本ずつ Promise.all」に替えた。
  前者と比べると ya-syn が遅いだけに見えるため。あわせて ya-syn を実行 3 本にそろえ、v1.7.0 で記録を取り直した
- BGM は入れていない（音源があれば ffmpeg で重ねる）
