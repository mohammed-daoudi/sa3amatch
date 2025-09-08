import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const weatherSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  date: z.string().optional(), // ISO date string for future weather
});

interface WeatherData {
  current?: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    visibility: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  };
  hourly?: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number; // probability of precipitation
  }>;
  daily?: Array<{
    dt: number;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feels_like: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = parseFloat(searchParams.get('lat') || '');
    const lon = parseFloat(searchParams.get('lon') || '');
    const date = searchParams.get('date');

    // Validate input
    const validationResult = weatherSchema.safeParse({ lat, lon, date });
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid coordinates',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey || apiKey === 'demo_key_replace_with_real_key') {
      // Return mock weather data for development
      const mockWeatherData = generateMockWeatherData(lat, lon, date);
      return NextResponse.json({
        success: true,
        weather: mockWeatherData,
        location: { lat, lon },
        source: 'mock'
      });
    }

    // Build OpenWeatherMap API URL
    const exclude = 'minutely,alerts'; // Exclude minutely and alerts to reduce response size
    const units = 'metric'; // Use Celsius
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${exclude}&units=${units}&appid=${apiKey}`;

    const response = await fetch(weatherUrl);

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
      if (response.status === 404) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
      }
      throw new Error(`Weather API error: ${response.status}`);
    }

    const weatherData: WeatherData = await response.json();

    // Process and filter weather data if date is specified
    let processedData = weatherData;
    if (date && weatherData.daily) {
      const targetDate = new Date(date);
      const targetTimestamp = Math.floor(targetDate.getTime() / 1000);

      // Filter daily data for the target date (within 24 hours)
      processedData.daily = weatherData.daily.filter(day => {
        const dayDate = new Date(day.dt * 1000);
        const diffHours = Math.abs(dayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24;
      });

      // Filter hourly data for the target date (24 hours window)
      if (weatherData.hourly) {
        processedData.hourly = weatherData.hourly.filter(hour => {
          const hourDate = new Date(hour.dt * 1000);
          const diffHours = Math.abs(hourDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60);
          return diffHours <= 12; // 12 hours before and after
        });
      }
    }

    return NextResponse.json({
      success: true,
      weather: processedData,
      location: { lat, lon },
      source: 'openweathermap'
    });

  } catch (error) {
    console.error('Error fetching weather data:', error);

    // Return mock data on error for development
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '33.8901');
    const lon = parseFloat(searchParams.get('lon') || '-6.9162');
    const date = searchParams.get('date');

    const mockWeatherData = generateMockWeatherData(lat, lon, date);
    return NextResponse.json({
      success: true,
      weather: mockWeatherData,
      location: { lat, lon },
      source: 'mock',
      note: 'Using mock data due to API error'
    });
  }
}

function generateMockWeatherData(lat: number, lon: number, date?: string | null): WeatherData {
  const now = Date.now();
  const targetDate = date ? new Date(date) : new Date();

  // Generate realistic weather based on location (rough approximation)
  const isWinter = targetDate.getMonth() >= 10 || targetDate.getMonth() <= 2;
  const baseTemp = lat > 30 ? (isWinter ? 18 : 28) : (isWinter ? 8 : 22);
  const tempVariation = Math.random() * 10 - 5;
  const currentTemp = Math.round(baseTemp + tempVariation);

  const weatherConditions = [
    { main: 'Clear', description: 'clear sky', icon: '01d' },
    { main: 'Clouds', description: 'few clouds', icon: '02d' },
    { main: 'Clouds', description: 'broken clouds', icon: '04d' },
    { main: 'Rain', description: 'light rain', icon: '10d' },
  ];

  const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

  return {
    current: {
      temp: currentTemp,
      feels_like: currentTemp + Math.random() * 4 - 2,
      humidity: Math.round(40 + Math.random() * 40),
      wind_speed: Math.round(Math.random() * 15),
      wind_deg: Math.round(Math.random() * 360),
      visibility: 10000,
      weather: [randomWeather]
    },
    daily: Array.from({ length: 5 }, (_, i) => {
      const dayTemp = currentTemp + Math.random() * 6 - 3;
      return {
        dt: Math.floor((targetDate.getTime() + i * 24 * 60 * 60 * 1000) / 1000),
        temp: {
          day: Math.round(dayTemp),
          min: Math.round(dayTemp - 5),
          max: Math.round(dayTemp + 5),
          night: Math.round(dayTemp - 3),
          eve: Math.round(dayTemp + 1),
          morn: Math.round(dayTemp - 1)
        },
        feels_like: {
          day: Math.round(dayTemp + 1),
          night: Math.round(dayTemp - 2),
          eve: Math.round(dayTemp + 2),
          morn: Math.round(dayTemp)
        },
        humidity: Math.round(40 + Math.random() * 40),
        wind_speed: Math.round(Math.random() * 15),
        wind_deg: Math.round(Math.random() * 360),
        weather: [weatherConditions[Math.floor(Math.random() * weatherConditions.length)]],
        pop: Math.round(Math.random() * 100) / 100
      };
    }),
    hourly: Array.from({ length: 24 }, (_, i) => {
      const hourTemp = currentTemp + Math.random() * 4 - 2;
      return {
        dt: Math.floor((now + i * 60 * 60 * 1000) / 1000),
        temp: Math.round(hourTemp),
        feels_like: Math.round(hourTemp + Math.random() * 2 - 1),
        humidity: Math.round(40 + Math.random() * 40),
        wind_speed: Math.round(Math.random() * 15),
        wind_deg: Math.round(Math.random() * 360),
        weather: [weatherConditions[Math.floor(Math.random() * weatherConditions.length)]],
        pop: Math.round(Math.random() * 100) / 100
      };
    })
  };
}
