// netlify/functions/gemini-proxy.js
import axios from 'axios';

// Handler para a função Netlify
exports.handler = async function(event, context) {
    // Define os cabeçalhos CORS para permitir requisições do seu frontend
    const headers = {
        'Access-Control-Allow-Origin': '*', // Permite qualquer origem. Para produção, restrinja ao seu domínio.
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    };

    // Lida com requisições OPTIONS (preflight CORS)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: headers,
            body: ''
        };
    }

    // Garante que a requisição é um POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: headers,
            body: JSON.stringify({ error: 'Método não permitido. Use POST.' })
        };
    }

    // Obtém a chave de API do Gemini das variáveis de ambiente do Netlify
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    // Verifica se a chave de API está configurada
    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: 'Chave de API Gemini não configurada na função.' })
        };
    }

    try {
        const requestBody = JSON.parse(event.body);
        const promptText = requestBody.prompt;

        if (!promptText) {
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({ error: "Corpo da requisição inválido. 'prompt' é necessário." })
            };
        }

        // Prepara o payload para a API do Gemini
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: promptText }
                    ]
                }
            ]
        };

        // Faz a chamada para a API do Gemini usando axios
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            payload, // Axios envia o payload diretamente como objeto JSON
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const geminiResponse = response.data; // Axios retorna os dados na propriedade .data
        
        // Retorna a resposta do Gemini para o frontend
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify(geminiResponse)
        };

    } catch (error) {
        console.error('Erro na Netlify Function:', error);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: `Erro interno do servidor: ${error.message}` })
        };
    }
};s