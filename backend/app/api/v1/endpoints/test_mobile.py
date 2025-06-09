from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()

@router.get("/mobile-test", response_class=HTMLResponse)
def mobile_test():
    """
    Простая тестовая страница для мобильных устройств
    """
    html_content = """
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧪 Тест API (прямой доступ)</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f0f0f0;
        }
        .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        button {
            width: 100%;
            padding: 15px;
            margin: 10px 0;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        }
        button:hover {
            background-color: #0056b3;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 12px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
        }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Тест API (Backend)</h1>
        
        <button onclick="showInfo()">Показать информацию</button>
        <button onclick="testAPI()">Тест API авторизации</button>
        <button onclick="testProfileAPI()">Тест получения профиля</button>
        <button onclick="clearResult()">Очистить</button>
        
        <div id="result" class="result" style="display: none;"></div>
    </div>

    <script>
        let authToken = null;
        
        function showResult(message, type = 'info') {
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = message;
            resultDiv.className = `result ${type}`;
            resultDiv.style.display = 'block';
        }
        
        function clearResult() {
            document.getElementById('result').style.display = 'none';
        }
        
        function showInfo() {
            const info = `
Тестирование API через Backend (порт 8000):
==========================================
URL: ${window.location.href}
Протокол: ${window.location.protocol}
Хост: ${window.location.hostname}
Порт: ${window.location.port || 'по умолчанию'}
User Agent: ${navigator.userAgent}
Время: ${new Date().toLocaleString()}

Этот тест работает через прямое подключение к Backend API.
Если вы видите эту страницу - значит API доступен!

Тестовые данные:
- Email: valet@test.com
- Пароль: valet123
            `.trim();
            showResult(info, 'info');
        }
        
        async function testAPI() {
            try {
                showResult('Тестируем авторизацию...', 'info');
                
                const response = await fetch('/api/v1/valet-auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: 'valet@test.com',
                        password: 'valet123'
                    })
                });
                
                const responseText = await response.text();
                
                if (response.ok) {
                    const data = JSON.parse(responseText);
                    authToken = data.access_token;
                    showResult(`✅ Авторизация успешна!
Статус: ${response.status}
Токен получен: ${authToken ? 'Да' : 'Нет'}
Ответ сервера:
${JSON.stringify(data, null, 2)}`, 'success');
                } else {
                    showResult(`❌ Ошибка авторизации!
Статус: ${response.status}
Ответ: ${responseText}`, 'error');
                }
            } catch (error) {
                showResult(`❌ Ошибка при авторизации!
Ошибка: ${error.message}
Проверьте подключение к серверу.`, 'error');
            }
        }
        
        async function testProfileAPI() {
            if (!authToken) {
                showResult('❌ Сначала выполните авторизацию!', 'error');
                return;
            }
            
            try {
                showResult('Получаем профиль пользователя...', 'info');
                
                const response = await fetch('/api/v1/valet-auth/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    }
                });
                
                const responseText = await response.text();
                
                if (response.ok) {
                    const data = JSON.parse(responseText);
                    showResult(`✅ Профиль получен!
Статус: ${response.status}
Данные профиля:
${JSON.stringify(data, null, 2)}`, 'success');
                } else {
                    showResult(`❌ Ошибка получения профиля!
Статус: ${response.status}
Ответ: ${responseText}`, 'error');
                }
            } catch (error) {
                showResult(`❌ Ошибка при получении профиля!
Ошибка: ${error.message}`, 'error');
            }
        }
        
        // Автоматически показываем информацию при загрузке
        window.onload = function() {
            showInfo();
        };
    </script>
</body>
</html>
    """
    return HTMLResponse(content=html_content, status_code=200) 