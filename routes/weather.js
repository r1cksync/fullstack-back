const express = require('express');
const router = express.Router();
const axios = require('axios');
const { cacheMiddleware } = require('../middleware/cache');

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE_URL = process.env.WEATHER_API_BASE_URL;

// Get current weather for a city
router.get('/current/:city', cacheMiddleware(60), async (req, res) => {
  try {
    const { city } = req.params;
    const { units = 'metric' } = req.query;

    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units
      }
    });

    res.json({
      ...response.data,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch weather data'
    });
  }
});

// Get current weather by coordinates
router.get('/current', cacheMiddleware(60), async (req, res) => {
  try {
    const { lat, lon, units = 'metric' } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units
      }
    });

    res.json({
      ...response.data,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch weather data'
    });
  }
});

// Get 5-day/3-hour forecast
router.get('/forecast/:city', cacheMiddleware(60), async (req, res) => {
  try {
    const { city } = req.params;
    const { units = 'metric' } = req.query;

    const response = await axios.get(`${WEATHER_API_BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units
      }
    });

    res.json({
      ...response.data,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Forecast API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch forecast data'
    });
  }
});

// Get forecast by coordinates
router.get('/forecast', cacheMiddleware(60), async (req, res) => {
  try {
    const { lat, lon, units = 'metric' } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const response = await axios.get(`${WEATHER_API_BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units
      }
    });

    res.json({
      ...response.data,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Forecast API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch forecast data'
    });
  }
});

// Search cities (autocomplete)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    // Using geocoding API for city search
    const response = await axios.get('http://api.openweathermap.org/geo/1.0/direct', {
      params: {
        q,
        limit: 5,
        appid: WEATHER_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Search API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to search cities'
    });
  }
});

// Get multiple cities weather (for dashboard)
router.post('/batch', cacheMiddleware(60), async (req, res) => {
  try {
    const { cities } = req.body;
    const { units = 'metric' } = req.query;

    if (!Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({ error: 'Cities array is required' });
    }

    const weatherPromises = cities.map(city => {
      const params = city.lat && city.lon
        ? { lat: city.lat, lon: city.lon, appid: WEATHER_API_KEY, units }
        : { q: city.name, appid: WEATHER_API_KEY, units };

      return axios.get(`${WEATHER_API_BASE_URL}/weather`, { params })
        .then(response => ({ success: true, data: response.data }))
        .catch(error => ({ success: false, error: error.message, city }));
    });

    const results = await Promise.all(weatherPromises);

    res.json({
      results: results.filter(r => r.success).map(r => r.data),
      errors: results.filter(r => !r.success),
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Batch weather error:', error);
    res.status(500).json({ error: 'Failed to fetch batch weather data' });
  }
});

module.exports = router;
