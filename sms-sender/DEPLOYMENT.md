# デプロイ手順

## 前提条件の確認

### 1. AWS CLI のインストール確認
```bash
aws --version
```

インストールされていない場合:
```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# https://awscli.amazonaws.com/AWSCLIV2.msi をダウンロードしてインストール
```

### 2. AWS SAM CLI のインストール確認
```bash
sam --version
```

インストールされていない場合:
```bash
# macOS
brew install aws-sam-cli

# Linux
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install

# Windows
# https://github.com/aws/aws-sam-cli/releases/latest/download/AWS_SAM_CLI_64_PY3.msi
```

### 3. AWS認証情報の設定
```bash
aws configure
```

以下を入力:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name: `ap-northeast-1`
- Default output format: `json`

確認:
```bash
aws sts get-caller-identity
```

## AWS SNS サンドボックス設定

### 送信先電話番号の検証

1. AWS Consoleにログイン
2. SNS サービスを開く
3. 左メニューから「Text messaging (SMS)」→「Sandbox destination phone numbers」を選択
4. 「Add phone number」をクリック
5. 電話番号を国際フォーマット（例: +819012345678）で入力
6. 送信される確認コードを受信して入力
7. 検証完了

**重要**: サンドボックスモードでは、この手順で検証した電話番号にのみSMSを送信できます。

## デプロイ手順

### 1. プロジェクトディレクトリに移動
```bash
cd /home/user/webapp/sms-sender
```

### 2. 依存関係のインストール（初回のみ）
```bash
cd src
npm install
cd ..
```

### 3. SAM Build
```bash
sam build
```

出力例:
```
Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml
```

### 4. SAM Deploy（初回）

初回はガイド付きデプロイを実行:
```bash
sam deploy --guided
```

以下のように回答:

```
Setting default arguments for 'sam deploy'
=========================================
Stack Name [sam-app]: sms-sender-stack
AWS Region [ap-northeast-1]: ap-northeast-1
#Shows you resources changes to be deployed and require a 'Y' to initiate deploy
Confirm changes before deploy [y/N]: y
#SAM needs permission to be able to create roles to connect to the resources in your template
Allow SAM CLI IAM role creation [Y/n]: Y
#Preserves the state of previously provisioned resources when an operation fails
Disable rollback [y/N]: N
SmsSenderFunction has no authentication. Is this okay? [y/N]: y
Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]: (Enter)
SAM configuration environment [default]: (Enter)
```

デプロイが開始されます（5-10分程度かかります）。

### 5. デプロイ完了

デプロイが成功すると、以下のように出力されます:

```
CloudFormation outputs from deployed stack
-----------------------------------------------------------------
Outputs
-----------------------------------------------------------------
Key                 SmsSenderFunctionUrl
Description         Lambda Function URL
Value               https://xxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/

Key                 SmsSenderFunction
Description         SMS Sender Lambda Function ARN
Value               arn:aws:lambda:ap-northeast-1:xxxxxxxxxxxx:function:sms-sender-stack-SmsSenderFunction-xxxxx
-----------------------------------------------------------------

Successfully created/updated stack - sms-sender-stack in ap-northeast-1
```

### 6. Function URLにアクセス

`SmsSenderFunctionUrl` の値をコピーしてブラウザでアクセスしてください。

例:
```
https://xxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/
```

## 2回目以降のデプロイ

コードを修正した後は、以下のコマンドで再デプロイできます:

```bash
# Build
sam build

# Deploy（設定ファイルを使用）
sam deploy
```

または、一度にビルドとデプロイ:
```bash
sam build && sam deploy
```

## デプロイの確認

### Lambda関数の確認
```bash
aws lambda list-functions --region ap-northeast-1 | grep sms-sender
```

### Function URLの取得
```bash
aws lambda get-function-url-config \
  --function-name sms-sender-stack-SmsSenderFunction-xxxxx \
  --region ap-northeast-1
```

### CloudWatch Logsの確認
```bash
# ロググループ一覧
aws logs describe-log-groups --region ap-northeast-1 | grep sms-sender

# ログストリーム一覧
aws logs describe-log-streams \
  --log-group-name /aws/lambda/sms-sender-stack-SmsSenderFunction-xxxxx \
  --region ap-northeast-1
```

## トラブルシューティング

### デプロイエラー: "Unable to upload artifact"
原因: S3バケットへのアップロード権限不足
解決:
```bash
# IAMユーザーにS3権限を追加
aws iam attach-user-policy \
  --user-name YOUR_USER_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### デプロイエラー: "User is not authorized to perform: cloudformation:CreateStack"
原因: CloudFormation権限不足
解決: IAMユーザーに以下の権限を追加
- CloudFormationFullAccess
- IAMFullAccess
- LambdaFullAccess

### SMS送信エラー: "Invalid parameter: PhoneNumber"
原因: 電話番号フォーマットが不正
解決: 国際フォーマット（+819012345678）で入力

### SMS送信エラー: "Destination phone number is not verified"
原因: 送信先電話番号がSNSサンドボックスで検証されていない
解決: AWS Console > SNS > Sandbox destination phone numbers で電話番号を検証

## リソースの削除

アプリケーションを完全に削除する場合:

```bash
sam delete
```

確認メッセージに `y` を入力してください。

以下のリソースが削除されます:
- Lambda関数
- IAMロール
- CloudWatch Logs
- CloudFormationスタック

**注意**: S3バケット（SAMが自動作成）は手動で削除する必要がある場合があります。

## コスト

このアプリケーションは以下の無料枠内で動作します:

- **Lambda**: 月間100万リクエスト、40万GB秒の無料枠
- **SNS**: 月間1,000件のSMS無料（サンドボックスモードの場合も課金対象）
- **CloudWatch Logs**: 月間5GBの無料枠

**重要**: SNSのSMSは送信ごとに課金されます（日本宛約8円/通）。

## セキュリティ

### 本番環境での推奨設定

1. **Lambda Function URLs認証の有効化**
   - `template.yaml` の `AuthType` を `AWS_IAM` に変更

2. **CORS設定の厳格化**
   - `AllowOrigins` を特定のドメインに制限

3. **レート制限の実装**
   - API GatewayまたはWAFでレート制限を設定

4. **サンドボックスモードの解除**
   - AWSサポートに連絡してSNSの本番モードを有効化

5. **CloudWatch Alarmの設定**
   - 異常な送信量を検知するアラームを設定
