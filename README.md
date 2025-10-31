# Weather Dashboard Backend

Backend API for the Weather Analytics Dashboard application.

## Features

- Google OAuth authentication
- Weather data proxy with caching
- User favorites management
- User preferences storage
- Rate limiting
- Real-time data (max 60s old)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables:
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID
   - `WEATHER_API_KEY`: OpenWeatherMap API key
   - `FRONTEND_URL`: Frontend URL for CORS

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Run the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google sign-in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Weather
- `GET /api/weather/current/:city` - Get current weather by city name
- `GET /api/weather/current?lat=&lon=` - Get current weather by coordinates
- `GET /api/weather/forecast/:city` - Get 5-day forecast by city name
- `GET /api/weather/forecast?lat=&lon=` - Get 5-day forecast by coordinates
- `GET /api/weather/search?q=` - Search cities (autocomplete)
- `POST /api/weather/batch` - Get weather for multiple cities

### Favorites (Protected)
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add favorite city
- `DELETE /api/favorites/:id` - Remove favorite city

### Preferences (Protected)
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update user preferences

## Technologies

- Express.js
- MongoDB with Mongoose
- JWT authentication
- Google OAuth
- Node-cache for data caching
- Rate limiting

## License

ISC
