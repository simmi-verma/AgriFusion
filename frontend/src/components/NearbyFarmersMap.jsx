import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import 'leaflet/dist/leaflet.css';
import { MapPin, Info, ArrowLeft, RefreshCw } from 'lucide-react';

// Custom Map center update component
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function NearbyFarmersMap() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([22.9734, 78.6569]); // default India Center
  const [mapZoom, setMapZoom] = useState(5);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const response = await api.get('/farmers/nearby');
        setFarmers(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch nearby farmer coordinates.');
      } finally {
        setLoading(false);
      }
    };
    fetchFarmers();

    // Check geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setMapCenter([lat, lng]);
          setMapZoom(7); // zoom closer to user
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
        }
      );
    }
  }, []);

  // DivIcons for clean rendering without asset path errors
  const farmerMarkerIcon = new L.divIcon({
    html: `<div class="bg-green-600 text-white w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center font-bold text-sm transform hover:scale-110 transition">🌾</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  const userMarkerIcon = new L.divIcon({
    html: `<div class="bg-blue-600 text-white w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center font-bold text-sm animate-pulse">📍</div>`,
    className: 'custom-leaflet-icon-user',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  return (
    <div className="flex-grow flex flex-col w-full h-[calc(100vh-64px)] relative">
      {/* Search Header Overlay */}
      <div className="absolute top-4 left-4 z-[1000] max-w-sm w-full bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-green-100 shadow-xl">
        <h2 className="text-lg font-bold text-green-955 flex items-center gap-1.5">
          <MapPin className="w-5 h-5 text-green-700" /> Farmers Supply Map
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Locate organic crop locations and chat directly with independent farmers nearby.
        </p>

        {loading ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading markers...
          </div>
        ) : (
          <div className="mt-3 text-xs text-gray-600 flex items-center gap-1">
            <Info className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Showing {farmers.length} crop zones across regions.</span>
          </div>
        )}

        {error && (
          <div className="mt-2 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}
      </div>

      {/* React Leaflet Map Container */}
      <div className="w-full h-full flex-grow z-10">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User circle position */}
          {userLocation && (
            <Marker position={userLocation} icon={userMarkerIcon}>
              <Popup>
                <div className="text-center font-bold text-xs">📍 You are here</div>
              </Popup>
            </Marker>
          )}

          {/* Farmer locations */}
          {farmers.map((farmer, index) => (
            <Marker 
              key={index} 
              position={[farmer.latitude, farmer.longitude]}
              icon={farmerMarkerIcon}
            >
              <Popup>
                <div className="p-1 font-sans text-xs">
                  <div className="font-bold text-green-800 text-sm mb-1">{farmer.state} Region</div>
                  <div className="text-gray-700 font-semibold mb-1">Crops: {farmer.crops}</div>
                  <div className="mt-2 border-t border-gray-100 pt-1.5">
                    {farmer.id ? (
                      <Link 
                        to={`/chat/${farmer.id}`} 
                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded font-bold text-[10px] block text-center transition"
                      >
                        ✉️ Contact Farmer
                      </Link>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No registration record</span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
