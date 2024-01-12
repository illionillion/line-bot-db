# メモ

LINE Developersでアカウントを作成、チャンネルを作成してトークン等を取得

```env
PORT= # ポート
CHANNEL_ACCESS_TOKEN= # アクセストークン
CHANNEL_SECRET= # チャンネルシークレット
```

```sh
npm run build:watch
```

```sh
npm run start:dev
```

```sh
ngrok http {PORT}
```

```sql
CREATE TABLE message_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    content TEXT DEFAULT '',
    image_path TEXT DEFAULT '',
    date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```