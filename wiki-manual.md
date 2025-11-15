# Wiki運用マニュアル

このドキュメントは、ya-syn wikiの更新ガイドラインと手順を説明します。

---

## 目次

- [基本方針](#基本方針)
- [Wiki構成](#wiki構成)
- [更新手順](#更新手順)
- [コンテンツガイドライン](#コンテンツガイドライン)
- [ファイル命名規則](#ファイル命名規則)

---

## 基本方針

### 多言語対応

Wikiは**英語**と**日本語**の両方をサポートします。

**更新の優先順位:**
- **日本語版をメイン**として更新する
- 英語版は日本語版の**翻訳版として追従**する
- 日本語版を更新した後、英語版も更新することを推奨

**構成:**
- すべてのアーキテクチャおよび技術ドキュメントは両言語で提供する
- Homeページは言語選択として機能
- 各言語は専用のページを持つ

### コンテンツの範囲

Wikiの焦点：

- **アーキテクチャ**: 設計の決定、コンポーネント間の関係、実装の詳細
- **コンセプト**: APIドキュメントより深い説明が必要な核となる概念
- **パターン**: 一般的な使用パターンとベストプラクティス
- **内部実装**: コントリビューターがコードベースを理解するのに役立つ実装の詳細

**注意**: 基本的な使用例とAPIリファレンスはメインのREADME.mdに記載

---

## Wiki構成

```
wiki/
├── Home.md          # 言語選択
├── English.md       # 英語版ドキュメント
└── Japanese.md      # 日本語版ドキュメント
```

### 将来の構成

Wikiが成長するにつれて、トピック別の整理を検討：

```
wiki/
├── Home.md
├── en/
│   ├── Architecture.md
│   ├── Advanced-Patterns.md
│   └── Contributing.md
└── ja/
    ├── Architecture.md
    ├── Advanced-Patterns.md
    └── Contributing.md
```

---

## 更新手順

### 1. Wikiディレクトリに移動

```bash
cd wiki
```

### 2. 最新版を確認

```bash
git pull origin master
```

### 3. ファイルを編集

マークダウンファイルを直接編集（**日本語版を先に更新**）：

```bash
# まず日本語版を編集・更新
vim Japanese.md

# 次に英語版を翻訳・更新
vim English.md
```

### 4. 変更をコミット

```bash
git add .
git commit -m "Update architecture documentation"
git push origin master
```

### 5. メインリポジトリのサブモジュール参照を更新

```bash
cd ..  # メインリポジトリに戻る
git add wiki
git commit -m "Update wiki submodule reference"
git push
```

### 代替方法: GitHubで編集

GitHubで直接wikiページを編集することもできます：

1. https://github.com/tomohisaota/ya-syn/wiki にアクセス
2. 変更したいページで「Edit」をクリック
3. 変更を保存
4. メインリポジトリでサブモジュール参照を更新

---

## コンテンツガイドライン

### 執筆スタイル

- 明確で簡潔な技術文書を書く
- コンセプトを説明するためにコード例を使用
- 有用な場合は図を含める（MermaidまたはASCII）

### コード例

- すべてのコード例にTypeScriptを使用
- 明確さのためにコメントを含める
- APIの使用方法と期待される動作の両方を示す
- 例は最小限だが完全なものにする

### 言語間の一貫性

- 英語版と日本語版で構造と見出しの一貫性を保つ
- 技術的な概念は正確に翻訳し、直訳しない
- **日本語版を先に更新し、その後英語版を翻訳・更新する**
- 変更を行う際は必ず両言語版を更新

### リンク

- Wikiページへのリンクには相対リンクを使用: `[Page Title](Page-Name)`
- コードを参照する際はメインリポジトリのファイルにリンク: `[file.ts](../src/file.ts)`
- 必要に応じて特定の行番号にリンク: `[file.ts#L10-L20](../src/file.ts#L10-L20)`

---

## ファイル命名規則

### 現在の規則

- `Home.md` - 言語選択（固定名）
- `English.md` - 英語版ドキュメント
- `Japanese.md` - 日本語版ドキュメント

### 将来の規則

新しいページを作成する場合：

- 英語ページにはkebab-caseを使用: `Advanced-Patterns.md`
- 日本語ページには日本語文字を使用: `高度なパターン.md`
- または、ディレクトリベースの構成を使用: `en/Advanced-Patterns.md`, `ja/高度なパターン.md`

---

## レビュープロセス

### コミット前のチェックリスト

- [ ] **日本語版が更新されているか確認**（メイン）
- [ ] **英語版が日本語版に追従して更新されているか確認**（翻訳）
- [ ] 両言語版の構造と見出しが一貫しているか確認
- [ ] すべてのコード例が正しく実行可能か検証
- [ ] すべての内部リンクをテスト
- [ ] マークダウンのフォーマットが正しくレンダリングされるか確認
- [ ] 技術的な正確性を保証

---

## ヒント

### ローカルでWikiを表示

マークダウンファイルのプレビュー方法：

- VS Code with Markdown Preview
- コマンドライン: `grip` または `mdcat`
- GitHub-style preview: https://github.com/grip/grip

### サブモジュールを最新に保つ

wikiサブモジュールを含むリポジトリをクローンする場合：

```bash
# サブモジュールを含めてクローン
git clone --recurse-submodules https://github.com/tomohisaota/ya-syn.git

# クローン後に初期化
git submodule update --init --recursive

# すべてのサブモジュールを最新に更新
git submodule update --remote
```

---

## 質問がありますか？

Wikiの内容やこのマニュアルに関する質問は、メインリポジトリでissueを開いてください。
