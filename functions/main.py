import functions_framework
import os
import requests
import json

# Obtém a chave de API do Gemini das variáveis de ambiente configuradas no Firebase
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

@functions_framework.http
def gemini_proxy(request):
    # Define os cabeçalhos CORS para permitir requisições do seu frontend
    headers = {
        'Access-Control-Allow-Origin': '*', # Permite qualquer origem. Para produção, restrinja ao seu domínio.
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }

    # Lida com requisições OPTIONS (preflight CORS)
    if request.method == 'OPTIONS':
        return ('', 204, headers)

    # Garante que a requisição é um POST
    if request.method != 'POST':
        return (json.dumps({"error": "Método não permitido. Use POST."}), 405, headers)

    # Verifica se a chave de API está configurada
    if not GEMINI_API_KEY:
        return (json.dumps({"error": "Chave de API Gemini não configurada na função."}), 500, headers)

    try:
        request_json = request.get_json(silent=True)
        if not request_json or 'prompt' not in request_json:
            return (json.dumps({"error": "Corpo da requisição inválido. 'prompt' é necessário."}), 400, headers)

        prompt_text = request_json['prompt']

        # Prepara o payload para a API do Gemini
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt_text}
                    ]
                }
            ]
        }

        # Faz a chamada para a API do Gemini
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=payload
        )
        response.raise_for_status() # Lança um erro para status de resposta HTTP ruins (4xx ou 5xx)

        gemini_response = response.json()

        # Retorna a resposta do Gemini para o frontend
        return (json.dumps(gemini_response), 200, headers)

    except requests.exceptions.RequestException as e:
        print(f"Erro ao chamar a API Gemini: {e}")
        return (json.dumps({"error": f"Erro de conexão com a API Gemini: {str(e)}"}), 500, headers)
    except Exception as e:
        print(f"Erro inesperado na função: {e}")
        return (json.dumps({"error": f"Erro interno do servidor: {str(e)}"}), 500, headers)