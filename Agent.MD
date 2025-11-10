# Agent.md - プロジェクト技術仕様書

## 概要
本プロジェクトの技術スタックと開発優先順位を定義します。

## サーバーレス環境（優先順位順）

### 第一優先: Google Cloud Functions
- Google Cloud Functionsを使用可能な場合は最優先で採用
- スケーラブルなサーバーレス実行環境
- Firebaseサービスとのシームレスな統合

### 第二優先: AWS Lambda
- Google Cloud Functionsが利用できない場合の代替
- AWS エコシステムとの統合

## データベース

### Google Firebase
以下のいずれかを使用：

#### Realtime Database
- リアルタイム同期が必要な場合に使用
- JSON形式のデータ構造
- オフライン対応

#### Firestore Database
- より柔軟なクエリが必要な場合に使用
- ドキュメント指向NoSQLデータベース
- 複雑なデータ構造とスケーラビリティ

## プログラミング言語（優先順位順）

### 第一優先: Go
- 高パフォーマンスと効率的なメモリ管理
- Cloud Functions/Lambdaでの優れたコールドスタート性能
- 並行処理のネイティブサポート

### 第二優先: Node.js
- **バージョン: 20.x**
- JavaScriptエコシステムの活用
- Firebaseとの優れた統合

### 第三優先: C#
- .NET環境での開発
- 型安全性と豊富なライブラリ

## 技術選定フロー

```
1. 実行環境の選定
   ├─ Google Cloud Functions 利用可能？
   │  ├─ Yes → Google Cloud Functions を使用
   │  └─ No  → AWS Lambda を使用
   │
2. データベースの選定
   ├─ Realtime Database vs Firestore
   │  ├─ リアルタイム同期が必要 → Realtime Database
   │  └─ 複雑なクエリが必要 → Firestore
   │
3. 言語の選定
   ├─ Go が要件を満たす？
   │  ├─ Yes → Go を使用
   │  ├─ No  → Node.js 20.x を検討
   │  └─ No  → C# を検討
```

## 開発環境要件

### Node.js（使用時）
- Node.js バージョン: **20.x** (LTS)
- パッケージマネージャー: npm または yarn

### Go（使用時）
- Go バージョン: 1.20以降推奨
- モジュール管理: Go Modules

### C#（使用時）
- .NET バージョン: .NET 6以降推奨

## デプロイメント

### Google Cloud Functions
```bash
# Goの場合
gcloud functions deploy FUNCTION_NAME --runtime go120 --trigger-http

# Node.jsの場合
gcloud functions deploy FUNCTION_NAME --runtime nodejs20 --trigger-http

# C#の場合
gcloud functions deploy FUNCTION_NAME --runtime dotnet6 --trigger-http
```

### AWS Lambda
- SAM (Serverless Application Model) または Serverless Framework を使用
- 各言語のランタイムに対応したデプロイ設定

## Firebase設定

### 初期化（プロジェクト共通）
```javascript
// Node.js example
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.database(); // Realtime Database
// または
const firestore = admin.firestore(); // Firestore
```

```go
// Go example
import (
    firebase "firebase.google.com/go"
    "firebase.google.com/go/db"
)

app, err := firebase.NewApp(context.Background(), nil)
client, err := app.Database(context.Background())
```

## ベストプラクティス

1. **環境変数の管理**
   - APIキーや接続情報は環境変数として管理
   - `.env`ファイルをgitで追跡しない

2. **エラーハンドリング**
   - すべての非同期処理で適切なエラーハンドリングを実装

3. **セキュリティ**
   - Firebase Security Rulesの適切な設定
   - 認証・認可の実装

4. **モニタリング**
   - Cloud Logging/CloudWatchの活用
   - パフォーマンスメトリクスの監視

## 参考リンク

- [Google Cloud Functions Documentation](https://cloud.google.com/functions/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Node.js 20.x Documentation](https://nodejs.org/docs/latest-v20.x/api/)

---

**最終更新日**: 2025-11-10
