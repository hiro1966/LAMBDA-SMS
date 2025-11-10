const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({ region: process.env.AWS_REGION_SNS || 'ap-northeast-1' });

// HTMLページを返す関数
function getHtmlPage() {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMS送信アプリ</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
            font-size: 28px;
        }
        .form-group {
            margin-bottom: 24px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
            font-size: 14px;
        }
        input, textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
            font-family: inherit;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        textarea {
            resize: vertical;
            min-height: 120px;
        }
        .hint {
            font-size: 12px;
            color: #888;
            margin-top: 4px;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        button:active {
            transform: translateY(0);
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        .message {
            margin-top: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            display: none;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-left: 8px;
            vertical-align: middle;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 SMS送信</h1>
        <form id="smsForm">
            <div class="form-group">
                <label for="phoneNumber">電話番号</label>
                <input 
                    type="tel" 
                    id="phoneNumber" 
                    name="phoneNumber" 
                    placeholder="+819012345678"
                    required
                >
                <div class="hint">国際フォーマット（例: +819012345678）で入力してください</div>
            </div>
            <div class="form-group">
                <label for="message">メッセージ</label>
                <textarea 
                    id="message" 
                    name="message" 
                    placeholder="送信するメッセージを入力してください"
                    required
                ></textarea>
            </div>
            <button type="submit" id="submitBtn">
                送信
            </button>
        </form>
        <div id="resultMessage" class="message"></div>
    </div>

    <script>
        const form = document.getElementById('smsForm');
        const submitBtn = document.getElementById('submitBtn');
        const resultMessage = document.getElementById('resultMessage');
        const phoneNumberInput = document.getElementById('phoneNumber');
        const messageInput = document.getElementById('message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phoneNumber = phoneNumberInput.value.trim();
            const message = messageInput.value.trim();

            // バリデーション
            if (!phoneNumber || !message) {
                showMessage('電話番号とメッセージを入力してください', 'error');
                return;
            }

            // 送信中の状態に
            submitBtn.disabled = true;
            submitBtn.innerHTML = '送信中<span class="loading"></span>';
            resultMessage.style.display = 'none';

            try {
                const response = await fetch(window.location.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phoneNumber: phoneNumber,
                        message: message
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showMessage('✅ SMSを送信しました！', 'success');
                    // フォームをリセット
                    form.reset();
                } else {
                    showMessage('❌ 送信に失敗しました: ' + (data.error || '不明なエラー'), 'error');
                }
            } catch (error) {
                showMessage('❌ 送信に失敗しました: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '送信';
            }
        });

        function showMessage(text, type) {
            resultMessage.textContent = text;
            resultMessage.className = 'message ' + type;
            resultMessage.style.display = 'block';
        }
    </script>
</body>
</html>
  `;
}

// Lambda Handlerメイン関数
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // GETリクエスト: HTMLページを返す
  if (event.requestContext.http.method === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: getHtmlPage(),
    };
  }

  // POSTリクエスト: SMS送信処理
  if (event.requestContext.http.method === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { phoneNumber, message } = body;

      // バリデーション
      if (!phoneNumber || !message) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            success: false,
            error: '電話番号とメッセージは必須です',
          }),
        };
      }

      // SNSでSMS送信
      const params = {
        PhoneNumber: phoneNumber,
        Message: message,
      };

      const command = new PublishCommand(params);
      const result = await snsClient.send(command);

      console.log('SMS sent successfully:', result);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          messageId: result.MessageId,
        }),
      };
    } catch (error) {
      console.error('Error sending SMS:', error);

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: error.message || 'SMS送信中にエラーが発生しました',
        }),
      };
    }
  }

  // その他のメソッド
  return {
    statusCode: 405,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: false,
      error: 'Method Not Allowed',
    }),
  };
};
