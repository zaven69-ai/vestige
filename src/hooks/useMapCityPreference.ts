import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cities, type City } from "../data/monuments";
export const MAP_CITY_KEY = "vestige.map.city.v1";
export function useMapCityPreference() {
  const [city, setCity] = useState<City>("Lyon"),
    [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(MAP_CITY_KEY)
      .then((raw) => {
        if (!active) return;
        if (raw && Object.hasOwn(cities, raw)) setCity(raw);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const save = useCallback((value: City) => {
    if (!Object.hasOwn(cities, value)) return;
    setCity(value);
    void AsyncStorage.setItem(MAP_CITY_KEY, value).catch(() => {});
  }, []);
  return { city, ready, save };
}
