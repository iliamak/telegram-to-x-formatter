// MCP Server для адаптации постов из Telegram в формат X
const { MCPServer } = require('@mcpjs/server');
const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config();

// Инициализация Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Функция для подсчета символов в тексте
function countCharacters(text) {
  return text.length;
}

// Основная функция для обработки запросов
async function processRequest(input) {
  try {
    // Получение текста из входных данных
    const { text } = input;
    
    if (!text) {
      return { error: 'Текст не предоставлен' };
    }
    
    // Запрос к Anthropic Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: `You are an expert X (Twitter) post formatter specializing in character-limited adaptations.

SYSTEM INSTRUCTION:
Convert Telegram channel posts to X format with EXACTLY these specifications:
1. CRITICAL: Maximum 220 characters - NO EXCEPTIONS
2. If output exceeds 220 chars, you MUST trim until under limit
3. Add line breaks for readability
4. Maintain key information: names, ranks, achievements, numbers
5. Use emojis to enhance emotion (🔥👀🏆)
6. Create excitement with dynamic, short sentences
7. Always end with brief call-to-action
8. Before submitting, count characters and confirm under 220

FORMAT:
- First line: Display character count: "[X chars]"
- Then display formatted post
- If over 220 chars, rewrite and show updated count`,
      messages: [
        {
          role: 'user',
          content: `Convert this Telegram post to X format following all system instructions: "${text}"`,
        },
      ],
    });
    
    // Извлечение отформатированного текста
    const formattedText = response.content[0].text;
    
    // Проверка лимита символов
    const match = formattedText.match(/\[(\d+) chars\]/i);
    let charCount = match ? parseInt(match[1]) : countCharacters(formattedText);
    let cleanText = formattedText.replace(/\[\d+ chars\]/i, '').trim();
    
    if (charCount > 220) {
      return {
        warning: 'AI вернул текст превышающий 220 символов!',
        formatted_text: cleanText,
        character_count: charCount
      };
    }
    
    return {
      formatted_text: cleanText,
      character_count: charCount
    };
    
  } catch (error) {
    console.error('Error:', error);
    return { error: `Произошла ошибка: ${error.message}` };
  }
}

// Создание MCP сервера
const server = new MCPServer({
  processRequest,
});

// Запуск сервера
server.listen();
console.log('MCP Server запущен на порту', process.env.PORT || 3000);