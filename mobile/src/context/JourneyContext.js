import React, { createContext, useState, useContext } from 'react';
import { ApiService } from '../services/api';

const JourneyContext = createContext({});

export const JourneyProvider = ({ children }) => {
  // Navigation & Travel Preferences
  const [origin, setOrigin] = useState('College Gate');
  const [destination, setDestination] = useState('Central Library');
  const [vehicle, setVehicle] = useState('personal_vehicle');
  const [departureTime, setDepartureTime] = useState('Now');
  const [safetyPreference, setSafetyPreference] = useState('balanced'); // 'fastest', 'balanced', 'safest'
  const [additionalPrefs, setAdditionalPrefs] = useState({
    wellLit: true,
    avoidIsolated: true,
    highFootTraffic: true,
    emergencyProximity: true
  });

  // Compared Routes & Selection
  const [comparedRoutes, setComparedRoutes] = useState([]);
  const [safeHavens, setSafeHavens] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // Active Journey Tracking State
  const [activeJourney, setActiveJourney] = useState(null);
  const [currentGpsIndex, setCurrentGpsIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState({ latitude: 12.9716, longitude: 77.5946 });
  const [safetyStatus, setSafetyStatus] = useState('GREEN'); // 'GREEN', 'YELLOW', 'RED'
  const [statusMessage, setStatusMessage] = useState('On planned safe route');
  const [isDeviated, setIsDeviated] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [nearestHaven, setNearestHaven] = useState(null);

  // Fetch / Compare Routes
  const fetchRoutes = async (customOrigin, customDest, customVehicle) => {
    setIsLoadingRoutes(true);
    try {
      const res = await ApiService.compareRoutes({
        origin: customOrigin || origin,
        destination: customDest || destination,
        vehicle: customVehicle || vehicle,
        departure_time: departureTime,
        safety_preference: safetyPreference
      });
      if (res.routes && res.routes.length > 0) {
        setComparedRoutes(res.routes);
        setSafeHavens(res.safe_havens || []);
        // Default to the recommended route
        const rec = res.routes.find(r => r.is_recommended) || res.routes[0];
        setSelectedRoute(rec);
      }
      return res;
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Start Active Journey
  const startJourney = async (routeToStart) => {
    const route = routeToStart || selectedRoute || comparedRoutes[0];
    if (!route) return;

    try {
      const res = await ApiService.startJourney({
        origin: origin,
        destination: destination,
        vehicle: vehicle,
        departure_time: departureTime,
        distance_km: route.distance_km,
        duration_min: route.duration_min,
        safety_score: route.safety_score,
        resilience_score: route.resilience_score,
        max_time_to_haven_seconds: route.max_time_to_haven_seconds,
        coordinates: route.coordinates
      });

      const journeyData = res.journey || {
        id: Date.now(),
        origin,
        destination,
        vehicle,
        status: 'IN_PROGRESS'
      };

      setActiveJourney(journeyData);
      setCurrentGpsIndex(0);
      if (route.coordinates && route.coordinates.length > 0) {
        setCurrentLocation(route.coordinates[0]);
      }
      setSafetyStatus('GREEN');
      setStatusMessage('On planned safe route');
      setIsDeviated(false);
      setShowSafetyModal(false);

      // Initialize nearest haven
      const havenRes = await ApiService.getNearestHaven(
        route.coordinates[0]?.latitude || 12.9716,
        route.coordinates[0]?.longitude || 77.5946
      );
      if (havenRes?.data) {
        setNearestHaven(havenRes.data);
      }
    } catch (err) {
      console.error('Error starting journey:', err);
    }
  };

  // Simulate Next GPS Step along Route
  const stepNextGpsPoint = () => {
    if (!selectedRoute || !selectedRoute.coordinates) return;
    const coords = selectedRoute.coordinates;
    const nextIdx = (currentGpsIndex + 1) % coords.length;
    setCurrentGpsIndex(nextIdx);
    const nextLoc = coords[nextIdx];
    setCurrentLocation(nextLoc);

    if (!isDeviated) {
      setSafetyStatus('GREEN');
      setStatusMessage('On planned safe route');
    }
  };

  // Trigger Deterministic Route Deviation for Demo
  const simulateDeviation = async () => {
    setIsDeviated(true);
    setSafetyStatus('RED');
    setStatusMessage('Route deviation detected (120m off planned path)');
    // Diverge coordinates away from corridor
    setCurrentLocation({
      latitude: currentLocation.latitude + 0.0035,
      longitude: currentLocation.longitude - 0.0040
    });

    if (activeJourney?.id) {
      const locRes = await ApiService.updateLocation(activeJourney.id, {
        latitude: currentLocation.latitude + 0.0035,
        longitude: currentLocation.longitude - 0.0040,
        force_deviation: true
      });
      if (locRes.nearest_haven) {
        setNearestHaven(locRes.nearest_haven);
      }
    }

    // Automatically trigger "Are You Safe?" modal
    setShowSafetyModal(true);
  };

  const resetDeviation = () => {
    setIsDeviated(false);
    setSafetyStatus('GREEN');
    setStatusMessage('On planned safe route');
    setShowSafetyModal(false);
    if (selectedRoute?.coordinates && selectedRoute.coordinates[currentGpsIndex]) {
      setCurrentLocation(selectedRoute.coordinates[currentGpsIndex]);
    }
  };

  // Handle "Are You Safe?" Answer
  const handleSafetyCheckResponse = async (isSafe) => {
    setShowSafetyModal(false);
    if (activeJourney?.id) {
      await ApiService.submitSafetyCheck(activeJourney.id, isSafe, currentLocation);
    }
    if (isSafe) {
      setIsDeviated(false);
      setSafetyStatus('GREEN');
      setStatusMessage('Safety confirmed. Resumed journey tracking.');
    }
  };

  return (
    <JourneyContext.Provider
      value={{
        origin, setOrigin,
        destination, setDestination,
        vehicle, setVehicle,
        departureTime, setDepartureTime,
        safetyPreference, setSafetyPreference,
        additionalPrefs, setAdditionalPrefs,
        comparedRoutes, setComparedRoutes,
        safeHavens, setSafeHavens,
        selectedRoute, setSelectedRoute,
        isLoadingRoutes,
        fetchRoutes,
        activeJourney, setActiveJourney,
        currentLocation, setCurrentLocation,
        currentGpsIndex,
        safetyStatus, setSafetyStatus,
        statusMessage,
        isDeviated,
        showSafetyModal, setShowSafetyModal,
        nearestHaven, setNearestHaven,
        startJourney,
        stepNextGpsPoint,
        simulateDeviation,
        resetDeviation,
        handleSafetyCheckResponse
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourney = () => useContext(JourneyContext);
