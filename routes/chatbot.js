const express = require('express');
const router = express.Router();
const axios = require('axios');
const Groq = require('groq-sdk').default;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE_URL = process.env.WEATHER_API_BASE_URL;

// Extract city name from user query using AI
async function extractCityFromQuery(query) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts city names from weather-related queries. Return ONLY the city name, nothing else. If no city is mentioned, return "unknown".'
        },
        {
          role: 'user',
          content: query
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 50,
    });

    return completion.choices[0]?.message?.content?.trim() || 'unknown';
  } catch (error) {
    console.error('Error extracting city:', error);
    return 'unknown';
  }
}

// Get weather data for a city
async function getWeatherData(city) {
  try {
    const currentWeather = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    });

    const forecast = await axios.get(`${WEATHER_API_BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    });

    return {
      current: currentWeather.data,
      forecast: forecast.data
    };
  } catch (error) {
    throw new Error('Unable to fetch weather data for this city');
  }
}

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Extract city from the query
    const city = await extractCityFromQuery(message);

    let weatherContext = '';
    
    // If a valid city is found, get weather data
    if (city && city !== 'unknown') {
      try {
        const weatherData = await getWeatherData(city);
        weatherContext = `
Current weather data for ${weatherData.current.name}:
- Temperature: ${weatherData.current.main.temp}°C
- Feels like: ${weatherData.current.main.feels_like}°C
- Conditions: ${weatherData.current.weather[0].description}
- Humidity: ${weatherData.current.main.humidity}%
- Wind speed: ${weatherData.current.wind.speed} m/s
- Pressure: ${weatherData.current.main.pressure} hPa

5-day forecast (next 3 periods):
${weatherData.forecast.list.slice(0, 3).map(item => {
  const date = new Date(item.dt * 1000);
  return `- ${date.toLocaleString()}: ${item.main.temp}°C, ${item.weather[0].description}`;
}).join('\n')}
`;
      } catch (error) {
        weatherContext = `I couldn't find weather data for "${city}". Please make sure the city name is correct.`;
      }
    }

    // Build conversation messages
    const messages = [
      {
        role: 'system',
        content: `You are a helpful weather assistant. You provide accurate weather information based on real-time data. 
When answering:
- Be friendly and conversational
- Use the weather data provided to give accurate information
- If asked about future weather beyond 5 days, explain that forecasts are available for up to 5 days
- Include temperatures in Celsius but mention Fahrenheit equivalents when relevant
- Give helpful context about weather conditions
- If no city is mentioned, ask the user which city they want to know about

${weatherContext ? 'Weather data available:\n' + weatherContext : 'No specific weather data loaded yet. Ask the user which city they want to know about.'}`
      },
      ...conversationHistory.slice(-5), // Keep last 5 messages for context
      {
        role: 'user',
        content: message
      }
    ];

    // Get AI response
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    res.json({
      response: aiResponse,
      city: city !== 'unknown' ? city : null
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Failed to process your request',
      details: error.message 
    });
  }
});

module.exports = router;
