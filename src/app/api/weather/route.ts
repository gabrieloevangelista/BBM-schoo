import { NextRequest, NextResponse } from 'next/server';

interface WeatherInterpretation {
  description: string;
  icon: 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon' | 'cloud' | 'cloud-rain' | 'cloud-lightning' | 'snowflake' | 'cloud-fog';
}

function getWeatherInfo(code: number, isDay: boolean): WeatherInterpretation {
  switch (code) {
    case 0:
      return isDay 
        ? { description: 'Céu limpo', icon: 'sun' } 
        : { description: 'Céu limpo', icon: 'moon' };
    case 1:
      return isDay 
        ? { description: 'Predomínio de sol', icon: 'cloud-sun' } 
        : { description: 'Poucas nuvens', icon: 'cloud-moon' };
    case 2:
      return isDay 
        ? { description: 'Parcialmente nublado', icon: 'cloud-sun' } 
        : { description: 'Parcialmente nublado', icon: 'cloud-moon' };
    case 3:
      return { description: 'Nublado / Encoberto', icon: 'cloud' };
    case 45:
    case 48:
      return { description: 'Nevoeiro', icon: 'cloud-fog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Garoa leve', icon: 'cloud-rain' };
    case 61:
    case 63:
    case 65:
      return { description: 'Chuva', icon: 'cloud-rain' };
    case 80:
    case 81:
    case 82:
      return { description: 'Pancadas de chuva', icon: 'cloud-rain' };
    case 71:
    case 73:
    case 75:
      return { description: 'Queda de neve', icon: 'snowflake' };
    case 95:
    case 96:
    case 99:
      return { description: 'Tempestade', icon: 'cloud-lightning' };
    default:
      return isDay 
        ? { description: 'Tempo estável', icon: 'sun' } 
        : { description: 'Tempo estável', icon: 'moon' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat') || '-23.5505';
    const lon = searchParams.get('lon') || '-46.6333';
    const city = searchParams.get('city') || 'São Paulo, SP';

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

    const res = await fetch(url, {
      next: { revalidate: 600 } // cache for 10 minutes
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao consultar serviço meteorológico' }, { status: 502 });
    }

    const data = await res.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const isDay = current.is_day === 1;
    const weatherCode = typeof current.weather_code === 'number' ? current.weather_code : 0;
    const weatherInfo = getWeatherInfo(weatherCode, isDay);

    const temperature = Math.round(current.temperature_2m ?? 22);
    const humidity = current.relative_humidity_2m ?? 60;
    const tempMax = Math.round(daily.temperature_2m_max?.[0] ?? temperature + 4);
    const tempMin = Math.round(daily.temperature_2m_min?.[0] ?? temperature - 4);

    return NextResponse.json({
      success: true,
      city,
      temperature,
      tempMax,
      tempMin,
      humidity,
      weatherCode,
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      isDay,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Não foi possível carregar a previsão do tempo'
    }, { status: 500 });
  }
}
