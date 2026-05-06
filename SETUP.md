# 冷蔵庫管理アプリ セットアップ手順

## 必要なもの
- スマートフォン（iOS/Android）
- パソコン（セットアップ作業用）
- Googleアカウント（Firebaseに使用）
- Vercel アカウント（無料）
- Anthropic API キー（写真認識用）

---

## STEP 1: Firebase のセットアップ（データベース）

1. [firebase.google.com](https://firebase.google.com) を開き、Googleアカウントでログイン
2. 「コンソールへ移動」→「プロジェクトを追加」
   - プロジェクト名: 任意（例: food-inventory）
   - Google アナリティクス: オフでOK
3. 左メニューの「構築」→「Firestore Database」を開く
   - 「データベースの作成」→「本番環境モード」→「asia-northeast1（東京）」で作成
4. 左メニューの「Firestore Database」→「ルール」タブを開き、以下に書き換えて「公開」:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
5. 画面左上の歯車アイコン「プロジェクトの設定」→「マイアプリ」→「</>（Web）」をクリック
   - アプリ名: 任意 → 「アプリを登録」
   - 表示される `firebaseConfig` の値をメモ（後で使用）

---

## STEP 2: Firebase Admin SDK の設定（通知送信用）

1. 「プロジェクトの設定」→「サービスアカウント」タブ
2. 「新しい秘密鍵の生成」→「キーを生成」
3. ダウンロードされた JSONファイルを開き、以下の値をメモ:
   - `project_id`
   - `client_email`
   - `private_key`

---

## STEP 3: 環境変数ファイルの作成

1. このフォルダ内の `.env.local.example` を `.env.local` という名前でコピー
2. `.env.local` を開いて、メモした値を入力:

```
NEXT_PUBLIC_FIREBASE_API_KEY=（firebaseConfigのapiKey）
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=（firebaseConfigのauthDomain）
NEXT_PUBLIC_FIREBASE_PROJECT_ID=（firebaseConfigのprojectId）
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=（firebaseConfigのstorageBucket）
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=（firebaseConfigのmessagingSenderId）
NEXT_PUBLIC_FIREBASE_APP_ID=（firebaseConfigのappId）

FIREBASE_PROJECT_ID=（JSONファイルのproject_id）
FIREBASE_CLIENT_EMAIL=（JSONファイルのclient_email）
FIREBASE_PRIVATE_KEY=（JSONファイルのprivate_key ※ダブルクォートごとコピー）

ANTHROPIC_API_KEY=（お手持ちのAPIキー）
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPBE9Bjy_NB0fjjplk9l6Uo71zcG1tmBmdcvtomrVvjVF6fOPrOJKCfNhju7Wp_SLbj4nvhgP4VHhj36O8hfT_c
VAPID_PRIVATE_KEY=YeHaadSd65lXaJMUaMa3nv-521O8q3DY39HWWl88Cfo
VAPID_SUBJECT=mailto:（あなたのGmailアドレス）
```

---

## STEP 4: Vercel にデプロイ（公開）

1. [vercel.com](https://vercel.com) でGoogleアカウントで無料登録
2. GitHubにリポジトリを作成してこのフォルダをプッシュ:
   ```
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/あなたのID/food-inventory.git
   git push -u origin main
   ```
3. Vercelのダッシュボードで「New Project」→ GitHubリポジトリを選択
4. 「Environment Variables」に `.env.local` の内容を全てコピー＆ペースト
5. 「Deploy」ボタンを押す → 数分でデプロイ完了
6. 表示されたURL（例: `food-inventory.vercel.app`）がアプリのアドレス

---

## STEP 5: スマートフォンにインストール

### iPhone（Safari）
1. SafariでアプリのURLを開く
2. 画面下の「共有」ボタン →「ホーム画面に追加」
3. ホーム画面にアイコンが追加される

### Android（Chrome）
1. ChromeでアプリのURLを開く
2. アドレスバー横の「⋮」→「アプリをインストール」または「ホーム画面に追加」

---

## STEP 6: 消費期限通知を有効にする

1. アプリを開いて「消費期限の通知を受け取る」をタップ
2. 通知を許可する
3. 以下のURLに毎日アクセスすると期限切れ間近の食材を通知:
   ```
   https://あなたのアプリURL/api/push/notify
   ```

### 毎朝自動通知（上級者向け）
`vercel.json` をこのフォルダに作成:
```json
{
  "crons": [
    {
      "path": "/api/push/notify",
      "schedule": "0 23 * * *"
    }
  ]
}
```
（UTC 23:00 = JST 朝8:00）

---

## 家族との共有

アプリのURLをLINEで送るだけでOKです。
全員が同じFirestoreを使うので、誰かが追加・削除するとすぐ反映されます。

---

## トラブルシューティング

**バーコードが読み取れない**
→ ブラウザのカメラアクセスを許可してください

**写真認識が失敗する**
→ 食材が見えやすい明るい場所で撮影してください

**通知が届かない**
→ ホーム画面に追加した後にアプリを一度開き、通知を許可してください
→ iOSの場合はSafariからホーム画面に追加する必要があります
