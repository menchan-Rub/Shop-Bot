# Discord ショップボット

Discord上でデジタルコンテンツを販売・管理できるショップボットと管理用Webダッシュボードです。

## 機能

- Discord上でのデジタルコンテンツの販売と管理
- カテゴリーごとの商品分類
- カート機能
- 手動決済とポイント決済のサポート
- 注文の追跡と管理
- ユーザーポイントシステム
- 管理者用Webダッシュボード

## 必要条件

- Docker と Docker Compose
- Discord Bot アプリケーション（https://discord.com/developers/applications）

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://your-repository-url/discord-shop.git
cd discord-shop
```

### 2. 環境変数の設定

`.env.example` ファイルを `.env` にコピーして必要な変数を設定します。

```bash
cp .env.example .env
```

`.env` ファイルを編集して、以下の情報を設定します：

- Discord Bot のトークンと認証情報
- MongoDBのユーザー名とパスワード
- JWTシークレットキー
- その他の設定

### 3. Dockerコンテナの起動

```bash
docker-compose up -d
```

これにより、以下の3つのコンテナが起動します：

- Discord Bot
- Webダッシュボード
- MongoDB データベース

### 4. Botの招待

Discord開発者ポータルからBotを自分のサーバーに招待します。必要な権限：

- `bot`
- `applications.commands`
- メッセージの読み取り/送信
- チャンネルの閲覧
- ダイレクトメッセージの送信

### 5. ウェブダッシュボードへのアクセス

ブラウザで `http://localhost:3000` （または設定したポート）にアクセスすると、ダッシュボードが表示されます。

## コンテナの管理

### ログの確認

```bash
# Botのログを確認
docker logs discord-shop-bot

# Webダッシュボードのログを確認
docker logs discord-shop-web

# MongoDBのログを確認
docker logs discord-shop-db
```

### コンテナの再起動

```bash
docker-compose restart
```

### コンテナの停止

```bash
docker-compose down
```

### コンテナの停止（データベースボリュームも削除）

```bash
docker-compose down -v
```

## 開発とカスタマイズ

### ローカル開発

Dockerコンテナを起動したまま、コードを変更すると、自動的に変更が適用されます（Node.jsのプロセスを再起動する必要がある場合は、コンテナを再起動してください）。

### ディレクトリ構造

- `src/` - ソースコード
  - `commands/` - Discordスラッシュコマンド
  - `components/` - インタラクションハンドラ
  - `models/` - データモデル
  - `utils/` - ユーティリティ関数
  - `dashboard/` - Webダッシュボード
- `logs/` - ログファイル（Docker volumeでマウント）
- `uploads/` - アップロードされたファイル（Docker volumeでマウント）

## ライセンス

このプロジェクトは [ライセンス名] のもとで公開されています。詳細は LICENSE ファイルを参照してください。 