# SMS送信アプリ

AWS Lambda + SNSを使用したシンプルなSMS送信Webアプリケーション

## 機能

- 電話番号とメッセージを入力するシンプルなWebフォーム
- AWS SNSを使用してSMSを送信
- Lambda Function URLsを使用（API Gateway不要）
- エラーハンドリング付き

## 技術スタック

- **Runtime**: Node.js 20.x
- **AWS Services**: Lambda, SNS
- **Deployment**: AWS SAM
- **Region**: ap-northeast-1 (東京)
- **Phone Format**: 日本 (+81)

## 前提条件

1. AWS CLIがインストールされ、設定されていること
2. AWS SAM CLIがインストールされていること
3. AWS SNSがサンドボックスモードで設定され、送信先電話番号が検証済みであること
4. Lambda実行に必要なIAMロールの権限（SNS Publish権限）

## セットアップ

### 1. 依存関係のインストール

```bash
cd src
npm install
cd ..
```

### 2. SAM Build

```bash
sam build
```

### 3. SAM Deploy

初回デプロイ時（ガイド付き）:

```bash
sam deploy --guided
```

設定項目:
- Stack Name: `sms-sender-stack`（任意の名前）
- AWS Region: `ap-northeast-1`
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback: `N`
- SmsSenderFunction has no authentication: `Y` (重要！認証なしを許可)
- Save arguments to configuration file: `Y`
- SAM configuration file: `samconfig.toml`
- SAM configuration environment: `default`

2回目以降のデプロイ:

```bash
sam deploy
```

### 4. Function URLの取得

デプロイ完了後、Outputsセクションに表示される `SmsSenderFunctionUrl` の値をコピーしてください。

例:
```
Outputs
Key                 SmsSenderFunctionUrl
Description         Lambda Function URL
Value               https://xxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/
```

## 使用方法

1. デプロイ後に取得したFunction URLにブラウザでアクセス
2. 電話番号を国際フォーマット（+819012345678）で入力
3. 送信したいメッセージを入力
4. 「送信」ボタンをクリック

## AWS SNS サンドボックスモードについて

AWS SNSは初期状態でサンドボックスモードになっています。このモードでは:

- **検証済み電話番号のみ**にSMSを送信可能
- 電話番号の検証手順:
  1. AWS Console > SNS > Text messaging (SMS) > Sandbox destination phone numbers
  2. "Add phone number" をクリック
  3. 電話番号を国際フォーマット（+819012345678）で入力
  4. 送信される確認コードを入力して検証完了

本番環境で使用する場合は、AWSサポートに連絡してサンドボックスモードを解除する必要があります。

## ディレクトリ構造

```
sms-sender/
├── template.yaml          # SAM テンプレート
├── README.md             # このファイル
├── samconfig.toml        # SAM設定ファイル（deploy後に自動生成）
└── src/
    ├── index.js          # Lambda関数のコード
    └── package.json      # Node.js依存関係
```

## IAMポリシー

Lambda関数には以下の権限が自動的に付与されます:

```yaml
Policies:
  - SNSPublishMessagePolicy:
      TopicName: '*'
```

これにより、Lambda関数がSNSを使用してSMSを送信できます。

## ローカル開発・テスト

### SAM Localでのテスト

```bash
sam local start-api
```

ただし、SNSへの実際の送信にはAWS認証情報が必要です。

### 環境変数

Lambda関数は以下の環境変数を使用します:

- `AWS_REGION_SNS`: ap-northeast-1（デフォルト）

## トラブルシューティング

### SMS送信失敗

1. **電話番号が検証済みか確認**
   - AWS Console > SNS > Sandbox destination phone numbers で確認

2. **電話番号のフォーマット**
   - 国際フォーマット（+819012345678）で入力されているか確認
   - ハイフンやスペースは含めない

3. **IAM権限の確認**
   - Lambda実行ロールに `sns:Publish` 権限があるか確認

4. **CloudWatch Logsの確認**
   - AWS Console > CloudWatch > Log groups > /aws/lambda/sms-sender-stack-SmsSenderFunction-xxx
   - エラーログを確認

### デプロイエラー

- AWS CLIとSAM CLIが最新版か確認
- AWS認証情報が正しく設定されているか確認: `aws sts get-caller-identity`

## クリーンアップ

リソースを削除する場合:

```bash
sam delete
```

## ライセンス

MIT
