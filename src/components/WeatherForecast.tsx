'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  AlertTriangle
} from 'lucide-react';

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
    pop: number;
  }>;
  daily?: Array<{
    dt: number;
    temp: {
      day: number;
      min: number;
      max: number;
    };
    humidity: number;
    wind_speed: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number;
  }>;
}

interface WeatherForecastProps {
  lat: number;
  lon: number;
  date?: string; // ISO date string
  className?: string;
  compact?: boolean; // For smaller displays
}

export default function WeatherForecast({ lat, lon, date, className = '', compact = false }: WeatherForecastProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'openweathermap' | 'mock'>('mock');

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          lat: lat.toString(),
          lon: lon.toString()
        });

        if (date) {
          params.append('date', date);
        }

        const response = await fetch(`/api/weather?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();
        setWeather(data.weather);
        setSource(data.source);
      } catch (error) {
        console.error('Error fetching weather:', error);
        setError('Unable to load weather data');
      } finally {
        setLoading(false);
      }
    };

    if (lat && lon) {
      fetchWeather();
    }
  }, [lat, lon, date]);

  const getWeatherIcon = (weatherMain: string, large = false) => {
    const iconSize = large ? 'h-8 w-8' : 'h-5 w-5';

    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return <Sun className={`${iconSize} text-yellow-500`} />;
      case 'clouds':
        return <Cloud className={`${iconSize} text-gray-500`} />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className={`${iconSize} text-blue-500`} />;
      case 'snow':
        return <CloudSnow className={`${iconSize} text-blue-200`} />;
      default:
        return <Cloud className={`${iconSize} text-gray-400`} />;
    }
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPrecipitationText = (pop: number) => {
    if (pop === 0) return 'No rain expected';
    if (pop < 0.3) return 'Light chance of rain';
    if (pop < 0.7) return 'Moderate chance of rain';
    return 'High chance of rain';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Cloud className="mr-2 h-4 w-4" />
            Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">{error || 'Weather data unavailable'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact && weather.current) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getWeatherIcon(weather.current.weather[0].main, true)}
              <div>
                <div className="text-2xl font-bold">{Math.round(weather.current.temp)}°C</div>
                <div className="text-sm text-gray-600 capitalize">
                  {weather.current.weather[0].description}
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Feels like {Math.round(weather.current.feels_like)}°C</div>
              <div>{weather.current.humidity}% humidity</div>
            </div>
          </div>
          {source === 'mock' && (
            <Badge variant="outline" className="mt-2 text-xs">
              Demo weather data
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center">
            <Cloud className="mr-2 h-5 w-5" />
            Weather Forecast
          </span>
          {source === 'mock' && (
            <Badge variant="outline" className="text-xs">
              Demo Data
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather */}
        {weather.current && (
          <div className="border-b pb-4">
            <h4 className="font-medium mb-3">Current Conditions</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                {getWeatherIcon(weather.current.weather[0].main, true)}
                <div>
                  <div className="text-2xl font-bold">{Math.round(weather.current.temp)}°C</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {weather.current.weather[0].description}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Thermometer className="mr-2 h-3 w-3 text-gray-400" />
                  Feels like {Math.round(weather.current.feels_like)}°C
                </div>
                <div className="flex items-center">
                  <Droplets className="mr-2 h-3 w-3 text-gray-400" />
                  {weather.current.humidity}% humidity
                </div>
                <div className="flex items-center">
                  <Wind className="mr-2 h-3 w-3 text-gray-400" />
                  {Math.round(weather.current.wind_speed)} km/h {getWindDirection(weather.current.wind_deg)}
                </div>
                <div className="flex items-center">
                  <Eye className="mr-2 h-3 w-3 text-gray-400" />
                  {(weather.current.visibility / 1000).toFixed(1)} km visibility
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hourly Forecast for Today */}
        {weather.hourly && weather.hourly.length > 0 && (
          <div className="border-b pb-4">
            <h4 className="font-medium mb-3">Today's Hourly Forecast</h4>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {weather.hourly.slice(0, 12).map((hour, index) => (
                <div key={index} className="flex-shrink-0 text-center min-w-[60px]">
                  <div className="text-xs text-gray-600 mb-1">
                    {formatTime(hour.dt)}
                  </div>
                  <div className="flex justify-center mb-1">
                    {getWeatherIcon(hour.weather[0].main)}
                  </div>
                  <div className="text-sm font-medium">
                    {Math.round(hour.temp)}°
                  </div>
                  {hour.pop > 0.2 && (
                    <div className="text-xs text-blue-600 mt-1">
                      {Math.round(hour.pop * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Forecast */}
        {weather.daily && weather.daily.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">5-Day Forecast</h4>
            <div className="space-y-2">
              {weather.daily.slice(0, 5).map((day, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-12 text-sm text-gray-600">
                      {index === 0 ? 'Today' : formatDate(day.dt)}
                    </div>
                    {getWeatherIcon(day.weather[0].main)}
                    <div className="flex-1">
                      <div className="text-sm capitalize">{day.weather[0].description}</div>
                      <div className="text-xs text-gray-600">
                        {getPrecipitationText(day.pop)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">{Math.round(day.temp.max)}°</span>
                    <span className="text-gray-500">{Math.round(day.temp.min)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weather Tips for Football */}
        {weather.current && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">⚽ Playing Conditions</h5>
            <div className="text-sm text-blue-800">
              {(() => {
                const temp = weather.current.temp;
                const humidity = weather.current.humidity;
                const windSpeed = weather.current.wind_speed;
                const condition = weather.current.weather[0].main.toLowerCase();

                let tips = [];

                if (temp < 10) {
                  tips.push("🧥 Dress warmly - cold weather");
                } else if (temp > 30) {
                  tips.push("🌡️ Stay hydrated - hot weather");
                } else {
                  tips.push("👍 Perfect temperature for football");
                }

                if (condition === 'rain') {
                  tips.push("🌧️ Consider rescheduling - wet field conditions");
                } else if (condition === 'clear') {
                  tips.push("☀️ Great visibility - perfect playing conditions");
                }

                if (windSpeed > 15) {
                  tips.push("💨 Strong winds may affect ball movement");
                }

                if (humidity > 80) {
                  tips.push("💧 High humidity - take extra breaks");
                }

                return tips.length > 0 ? tips.join(" • ") : "Good conditions for football!";
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
