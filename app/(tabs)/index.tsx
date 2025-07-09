import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_KEY = '5ab0dfe927d879768a2c3386085bd202'; // Your API key

const backgrounds: Record<string, any> = {
  Clear: require('../../assets/images/clear.jpg'),
  Clouds: require('../../assets/images/clouds.jpg'),
  Drizzle: require('../../assets/images/drizzle.jpg'),
  Mist: require('../../assets/images/mist.jpg'),
  Rain: require('../../assets/images/rain.jpg'),
  Snow: require('../../assets/images/snow.jpg'),
  Thunderstorm: require('../../assets/images/thunderstorm.jpg'),
};

const defaultBackground = require('../../assets/images/clear.jpg'); // default background image

export default function HomeScreen() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const getWeather = async () => {
    if (!city) return;
    setLoading(true);
    setWeather(null);
    setForecast([]);
    setSelectedDay(null);
    try {
      // Current weather
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unit}`
      );

      setWeather(weatherResponse.data);

      // 5-day forecast
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${unit}`
      );

      // Process forecastResponse to get one forecast per day (at 12:00:00)
      const dailyForecasts: any[] = [];
      const forecastList = forecastResponse.data.list;

      const dates = new Set<string>();
      for (const item of forecastList) {
        if (item.dt_txt.includes('12:00:00')) {
          if (!dates.has(item.dt_txt.slice(0, 10))) {
            dailyForecasts.push(item);
            dates.add(item.dt_txt.slice(0, 10));
          }
        }
        if (dailyForecasts.length === 5) break;
      }

      setForecast(dailyForecasts);
      setLastUpdated(new Date());
    } catch (error) {
      alert('City not found or error fetching data!');
      setWeather(null);
      setForecast([]);
      setLastUpdated(null);
      setSelectedDay(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const toggleUnit = () => {
    setUnit((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  };

  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const windUnit = unit === 'metric' ? 'm/s' : 'mph';

  const weatherCondition = weather?.weather?.[0]?.main;
  const backgroundImage =
    weatherCondition && backgrounds[weatherCondition]
      ? backgrounds[weatherCondition]
      : defaultBackground;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={[
            styles.overlay,
            { backgroundColor: weather ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.2)' },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>🌤️ Weather App</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter city name"
            placeholderTextColor="#ccc"
            value={city}
            onChangeText={setCity}
          />
          <View style={styles.buttonRow}>
            <Button title="Get Weather" onPress={getWeather} color="#1E90FF" />
            <TouchableOpacity onPress={toggleUnit} style={styles.unitButton}>
              <Text style={styles.unitButtonText}>
                Switch to {unit === 'metric' ? '°F' : '°C'}
              </Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 20 }} />
          )}

          {weather && !loading && (
            <>
              <View style={styles.result}>
                <Text style={styles.city}>{weather.name}</Text>
                <Text style={styles.temp}>
                  {Math.round(weather.main.temp)}
                  {tempUnit}
                </Text>
                <Text style={styles.condition}>{weather.weather[0].main}</Text>
                <Text style={styles.details}>
                  Feels like: {Math.round(weather.main.feels_like)}
                  {tempUnit}
                </Text>
                <Text style={styles.details}>Humidity: {weather.main.humidity}%</Text>
                <Text style={styles.details}>
                  Wind speed: {weather.wind.speed} {windUnit}
                </Text>
                <Image
                  source={{
                    uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`,
                  }}
                  style={{ width: 150, height: 150 }}
                />
                {lastUpdated && (
                  <Text style={styles.updated}>
                    Last updated: {formatDate(lastUpdated)}
                  </Text>
                )}
              </View>

              <Text style={[styles.title, { marginTop: 20 }]}>5-Day Forecast</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 10 }}
              >
                {forecast.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.forecastCard,
                      selectedDay === index && styles.selectedCard,
                    ]}
                    onPress={() => setSelectedDay(index)}
                  >
                    <Text style={styles.forecastDate}>{day.dt_txt.slice(0, 10)}</Text>
                    <Image
                      source={{
                        uri: `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`,
                      }}
                      style={{ width: 50, height: 50 }}
                    />
                    <Text style={styles.forecastTemp}>
                      {Math.round(day.main.temp)}
                      {tempUnit}
                    </Text>
                    <Text style={styles.forecastCondition}>{day.weather[0].main}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedDay !== null && (
                <View style={styles.forecastDetails}>
                  <Text style={styles.details}>
                    Date: {forecast[selectedDay].dt_txt}
                  </Text>
                  <Text style={styles.details}>
                    Temp: {Math.round(forecast[selectedDay].main.temp)}
                    {tempUnit}
                  </Text>
                  <Text style={styles.details}>
                    Feels like: {Math.round(forecast[selectedDay].main.feels_like)}
                    {tempUnit}
                  </Text>
                  <Text style={styles.details}>
                    Humidity: {forecast[selectedDay].main.humidity}%
                  </Text>
                  <Text style={styles.details}>
                    Wind speed: {forecast[selectedDay].wind.speed} {windUnit}
                  </Text>
                  <Text style={styles.details}>
                    Condition: {forecast[selectedDay].weather[0].main}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  overlay: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    width: '100%',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  unitButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  unitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  result: {
    alignItems: 'center',
  },
  city: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  temp: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
  },
  condition: {
    fontSize: 28,
    color: '#fff',
  },
  details: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
  },
  updated: {
    fontSize: 14,
    color: '#ddd',
    marginTop: 15,
    fontStyle: 'italic',
  },
  forecastCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 10,
    marginHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    width: 100,
  },
  selectedCard: {
    backgroundColor: '#1E90FF',
  },
  forecastDate: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 6,
  },
  forecastTemp: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  forecastCondition: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  forecastDetails: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 15,
    borderRadius: 10,
  },
});
