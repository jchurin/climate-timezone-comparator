export type City = {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  population?: number;
};

/** Raw Open-Meteo forecast (metric units, unix-second timestamps). */
export type Forecast = {
  utc_offset_seconds: number;
  current: {
    time: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    uv_index: number;
    visibility: number;
  };
  hourly: {
    time: number[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: (number | null)[];
    is_day: number[];
  };
  daily: {
    time: number[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: number[];
    sunset: number[];
    precipitation_probability_max: (number | null)[];
    precipitation_sum: number[];
    uv_index_max: number[];
    wind_speed_10m_max: number[];
    daylight_duration: number[];
  };
};
