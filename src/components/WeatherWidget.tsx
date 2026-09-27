'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  CloudSun, 
  CloudMoon, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  CloudFog, 
  MapPin, 
  Droplets, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw 
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface WeatherData {
  city: string;
  temperature: number;
  tempMax: number;
  tempMin: number;
  humidity: number;
  weatherCode: number;
  description: string;
  icon: 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon' | 'cloud' | 'cloud-rain' | 'cloud-lightning' | 'snowflake' | 'cloud-fog';
  isDay: boolean;
  updatedAt: string;
}

export default function WeatherWidget() {
  const { theme } = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch weather for coords
  const fetchWeather = async (lat: number, lon: number, cityName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(cityName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWeather(data);
          try {
            sessionStorage.setItem('bbm_weather_cache', JSON.stringify({
              data,
              timestamp: Date.now()
            }));
          } catch (e) {
            // ignore storage quota errors
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch weather:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    // Check cached weather in session
    try {
      const cached = sessionStorage.getItem('bbm_weather_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Valid for 10 minutes
        if (Date.now() - timestamp < 10 * 60 * 1000) {
          setWeather(data);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    // Try geolocation if supported
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          let cityName = 'Sua Região';
          try {
            // Reverse geocode via free openstreetmap nominatim
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const addr = geoData.address || {};
              const city = addr.city || addr.town || addr.municipality || addr.state_district || 'Sua Cidade';
              const state = addr.state_code || addr.state ? ` - ${addr.state_code || addr.state}` : '';
              cityName = `${city}${state}`;
            }
          } catch {
            // fallback
          }

          fetchWeather(lat, lon, cityName);
        },
        () => {
          // Denied or error: default to São Paulo, SP
          fetchWeather(-23.5505, -46.6333, 'São Paulo, SP');
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(-23.5505, -46.6333, 'São Paulo, SP');
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const renderIcon = (iconName: string, size = 16) => {
    switch (iconName) {
      case 'sun':
        return <Sun size={size} className="text-amber-400" />;
      case 'moon':
        return <Moon size={size} className="text-blue-300" />;
      case 'cloud-sun':
        return <CloudSun size={size} className="text-amber-400" />;
      case 'cloud-moon':
        return <CloudMoon size={size} className="text-blue-300" />;
      case 'cloud':
        return <Cloud size={size} className="text-gray-400" />;
      case 'cloud-rain':
        return <CloudRain size={size} className="text-blue-400" />;
      case 'cloud-lightning':
        return <CloudLightning size={size} className="text-amber-300" />;
      case 'snowflake':
        return <Snowflake size={size} className="text-cyan-300" />;
      case 'cloud-fog':
        return <CloudFog size={size} className="text-gray-400" />;
      default:
        return <Sun size={size} className="text-amber-400" />;
    }
  };

  if (isLoading && !weather) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-muted bg-white/5 border border-white/5 animate-pulse">
        <Sun size={14} className="opacity-40" />
        <span className="hidden sm:inline text-[11px]">Carregando clima...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-outfit font-medium transition-colors cursor-pointer ${
          theme === 'light'
            ? 'bg-black/5 hover:bg-black/10 border-black/8 text-gray-800'
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
        }`}
        title="Ver previsão do tempo detalhada"
      >
        <span className="flex items-center">{renderIcon(weather.icon, 16)}</span>
        <span className="font-bold">{weather.temperature}°C</span>
        <span className="hidden md:inline text-[11px] text-text-secondary truncate max-w-[110px]">
          {weather.city.split(',')[0]}
        </span>
      </button>

      {/* Detailed Weather Popover */}
      {isOpen && (
        <div 
          className={`absolute top-[45px] right-0 w-72 rounded-lg p-4 border shadow-2xl z-50 backdrop-blur-2xl transition-all ${
            theme === 'light'
              ? 'bg-white border-black/10 text-gray-900 shadow-[0_15px_40px_rgba(0,0,0,0.15)]'
              : 'bg-[#14151e] border-white/15 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin size={14} className="text-[#C1FF07] flex-shrink-0" />
              <span className="text-xs font-bold truncate">{weather.city}</span>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('bbm_weather_cache');
                fetchWeather(-23.5505, -46.6333, weather.city);
              }}
              className="p-1 rounded text-text-muted hover:text-white bg-transparent border-0 cursor-pointer"
              title="Atualizar"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Current Temp and Condition */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                {renderIcon(weather.icon, 28)}
              </div>
              <div>
                <div className="text-2xl font-extrabold font-outfit tracking-tight leading-none">
                  {weather.temperature}°C
                </div>
                <div className="text-xs text-text-secondary font-medium mt-1">
                  {weather.description}
                </div>
              </div>
            </div>
          </div>

          {/* Details Row: Max/Min & Humidity */}
          <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-lg text-xs ${
            theme === 'light' ? 'bg-black/5' : 'bg-white/5'
          }`}>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <div className="flex items-center text-emerald-400 font-semibold gap-0.5">
                <ArrowUp size={12} />
                <span>{weather.tempMax}°</span>
              </div>
              <span className="text-text-muted">/</span>
              <div className="flex items-center text-blue-400 font-semibold gap-0.5">
                <ArrowDown size={12} />
                <span>{weather.tempMin}°</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 text-text-secondary font-medium">
              <Droplets size={13} className="text-blue-400" />
              <span>{weather.humidity}% umidade</span>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-text-muted text-center">
            Dados meteorológicos em tempo real (Open-Meteo)
          </div>
        </div>
      )}
    </div>
  );
}
