import React, { useState, useEffect } from 'react';
import { MEDICINE_DATA } from '../data/mockData';
import { MapPin, Search, Navigation, AlertCircle, Phone, Map, Crosshair, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import './Pages.css';

// Fix for default Leaflet icon not showing correctly in Vite/React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for status
const safeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const avoidIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const PHARMACY_LOCATIONS = [
  { id: 'p1', name: 'Sudhir Medical',    city: 'Raigarh', lat: 21.8974, lng: 83.3950, phone: '+91-9876543210', address: 'Main Road, Raigarh' },
  { id: 'p2', name: 'Shree Medical',     city: 'Raigarh', lat: 21.8950, lng: 83.3980, phone: '+91-9876543211', address: 'Chandni Chowk, Raigarh' },
  { id: 'p3', name: 'City Care Medical', city: 'Raigarh', lat: 21.8900, lng: 83.4000, phone: '+91-9876543212', address: 'Station Road, Raigarh' },
  { id: 'p4', name: 'Apollo Medical',    city: 'Raipur',  lat: 21.2514, lng: 81.6296, phone: '+91-9876543213', address: 'Civil Lines, Raipur' },
  { id: 'p5', name: 'Bilaspur Medical',  city: 'Bilaspur',lat: 22.0797, lng: 82.1409, phone: '+91-9876543214', address: 'Vyapar Vihar, Bilaspur' },
  { id: 'p6', name: 'Bhilai Medical',    city: 'Bhilai',  lat: 21.1938, lng: 81.3509, phone: '+91-9876543215', address: 'Sector 6, Bhilai' },
  { id: 'p7', name: 'Durg Medical',      city: 'Durg',    lat: 21.1904, lng: 81.2849, phone: '+91-9876543216', address: 'Indira Market, Durg' },
];

const PHARMACY_INVENTORY = {
  'p1': { 'BECOSULES': 10, 'GELUSIL': 5, 'ALMOX': 0, 'IBUGESIC': 20, 'DEXORANGE': 15, 'ZEDEX': 5 },
  'p2': { 'GELUSIL': 12, 'ZEDEX': 8, 'REXCOF LS': 10, 'BECOSULES': 0 },
  'p3': { 'ALMOX': 30, 'FLUMONT LC': 15, 'CIPCAL': 40, 'BECOSULES': 25, 'ZEDEX': 10 },
  'p4': { 'NEOPEPTINE': 5, 'ZERODOL SP': 10, 'NICIP PLUS': 20, 'BECOSULES': 40, 'GELUSIL': 50 },
  'p5': { 'DULCOFLEX': 18, 'BETADINE': 12, 'ARISTOZYME': 8, 'DIGEGEL': 22, 'GELUSIL': 15 },
  'p6': { 'BECOSULES': 50, 'ZEDEX': 20, 'IBUGESIC': 10, 'ALMOX': 15, 'REXCOF LS': 5 },
  'p7': { 'GELUSIL': 8, 'DEXORANGE': 25, 'CIPCAL': 30, 'ZERODOL SP': 12, 'BETADINE': 15 }
};

const USER_LOCATIONS = [
  { label: 'Raigarh (Center)', lat: 21.8960, lng: 83.3965 },
  { label: 'Raipur (Center)', lat: 21.2500, lng: 81.6300 },
  { label: 'Bilaspur (Center)', lat: 22.0800, lng: 82.1400 }
];

// Helper to update map view
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center, map]);
  return null;
}

// Haversine distance in km
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function NearbyAvailability() {
  const [query, setQuery] = useState('');
  const [searchedMedicine, setSearchedMedicine] = useState('');
  const [searching, setSearching] = useState(false);
  const [userLoc, setUserLoc] = useState(USER_LOCATIONS[0]);
  const [results, setResults] = useState([]);
  const [radiusUsed, setRadiusUsed] = useState(5);
  const [selectedPin, setSelectedPin] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [useGeo, setUseGeo] = useState(false);

  // Initial geolocation try
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newLoc = { label: 'My Current Location', lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(newLoc);
        setUseGeo(true);
      }, (err) => {
        console.warn("Geolocation failed or denied, using Raigarh center.");
      });
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSelectedPin(null);
    
    setTimeout(() => {
      let q = query.toUpperCase().trim();
      let foundMed = MEDICINE_DATA.find(m => m.name.toUpperCase() === q || m.name.toUpperCase().includes(q));
      let searchKey = foundMed ? foundMed.name.toUpperCase() : q;
      
      let pharms = PHARMACY_LOCATIONS.map(p => {
        let inv = PHARMACY_INVENTORY[p.id] || {};
        let qty = inv[searchKey] || 0;
        let dist = calcDistance(userLoc.lat, userLoc.lng, p.lat, p.lng);
        return { ...p, distance: dist, qty, available: qty > 0 };
      });

      // Filter 5km radius
      let nearby = pharms.filter(p => p.distance <= 5).sort((a,b) => a.distance - b.distance);
      let rUsed = 5;

      // Unavailability logic
      let actuallyAvailable = nearby.filter(p => p.available);
      
      // If none available in 5km, try 10km
      if (actuallyAvailable.length === 0) {
        let nearby10 = pharms.filter(p => p.distance <= 10).sort((a,b) => a.distance - b.distance);
        if (nearby10.filter(p=>p.available).length > 0) {
          nearby = nearby10;
          rUsed = 10;
          actuallyAvailable = nearby.filter(p => p.available);
        }
      }

      setResults(nearby);
      setRadiusUsed(rUsed);
      setSearchedMedicine(searchKey);

      // Handle suggestions if totally unavailable nearby
      if (actuallyAvailable.length === 0 && foundMed) {
        // Find alternative with same category/composition
        let alt = MEDICINE_DATA.find(m => m.category === foundMed.category && m.name !== foundMed.name);
        
        // Find nearest pharmacy anywhere that has it
        let allPharms = pharms.sort((a,b) => a.distance - b.distance).filter(p => p.available);
        
        setSuggestion({
          altBrand: alt ? alt.name : 'Unknown',
          nearestOverall: allPharms.length > 0 ? allPharms[0] : null
        });
      } else {
        setSuggestion(null);
      }

      setSearching(false);
    }, 600);
  };

  const handleGetDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${lat},${lng}`, "_blank");
  };

  return (
    <div className="page-animate">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Nearby Availability</h1>
          <p className="page-subtitle">Find medicines at local pharmacies via geolocation.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Crosshair size={18} color="var(--primary-blue)" />
          <select value={userLoc.label} onChange={(e) => {
            const l = USER_LOCATIONS.find(l => l.label === e.target.value);
            if (l) setUserLoc(l);
          }} style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 500 }}>
            {useGeo && <option value="My Current Location">My Current Location</option>}
            {USER_LOCATIONS.map(l => <option key={l.label} value={l.label}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <form className="search-container" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={24} />
          <input 
            type="text" 
            className="search-input"
            placeholder="Search medicine (e.g., BECOSULES, GELUSIL, ALMOX)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary search-btn">
          Find Stock
        </button>
      </form>

      {searching ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <Search size={48} className="animate-pulse" style={{ margin: '0 auto 1rem' }} />
          <p>Scanning pharmacy inventory & calculating distances...</p>
        </div>
      ) : searchedMedicine && (
        <div className="grid-2">
          {/* Results List */}
          <div className="card" style={{ order: 1 }}>
            <h2 className="card-title" style={{ marginBottom: '1rem' }}>
              <MapPin size={20} /> Results in {radiusUsed}km radius
            </h2>

            {results.filter(p => p.available).length === 0 && suggestion && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ color: '#dc2626', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16}/> Not available nearby
                </h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#7f1d1d' }}><strong>{searchedMedicine}</strong> is out of stock in your {radiusUsed}km radius.</p>
                
                {suggestion.altBrand && (
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#991b1b' }}>
                    <strong>Alternative Composition:</strong> Try searching for <u>{suggestion.altBrand}</u>
                  </div>
                )}
                {suggestion.nearestOverall && (
                  <div style={{ fontSize: '0.9rem', background: 'white', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                    <strong>Closest Pharmacy Available:</strong><br/>
                    {suggestion.nearestOverall.name} ({suggestion.nearestOverall.distance.toFixed(1)} km away in {suggestion.nearestOverall.city})
                  </div>
                )}
              </div>
            )}

            <div className="pharmacy-list" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {results.length === 0 && !suggestion && <p style={{ color: 'var(--text-secondary)' }}>No pharmacies found in your area.</p>}
              
              {results.map(pharmacy => (
                <div key={pharmacy.id} className="pharmacy-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', border: selectedPin === pharmacy.id ? '2px solid var(--primary-blue)' : '1px solid var(--border-color)' }} onClick={() => setSelectedPin(pharmacy.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{pharmacy.name}</h3>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{pharmacy.address} • <strong style={{ color: 'var(--primary-blue)' }}>{pharmacy.distance.toFixed(1)} km</strong> away</div>
                    </div>
                    <div>
                      {pharmacy.available ? (
                         <div style={{ background: '#ecfdf5', color: '#059669', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Avail: {pharmacy.qty} units</div>
                      ) : (
                         <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Out of Stock</div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleGetDirections(pharmacy.lat, pharmacy.lng); }}
                      className="btn outline"
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <Navigation size={14} style={{ marginRight: '0.3rem' }} /> Directions
                    </button>
                    <button 
                      className={`btn ${pharmacy.available ? 'btn-primary' : 'btn-secondary'}`}
                      disabled={!pharmacy.available}
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0.4rem', fontSize: '0.85rem' }}
                    >
                      {pharmacy.available ? 'View Inventory' : 'Notify Me'} <ArrowRight size={14} style={{ marginLeft: '0.3rem' }}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map View */}
          <div className="card" style={{ order: 2, padding: 0, overflow: 'hidden', position: 'relative', height: '100%', minHeight: '520px' }}>
            <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap center={userLoc} />
              
              {/* User Location Marker */}
              <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <strong>You are here</strong><br/>
                    Searching within {radiusUsed}km
                  </div>
                </Popup>
              </Marker>

              {/* 5km Radius Circle */}
              <Circle 
                center={[userLoc.lat, userLoc.lng]} 
                radius={5000} 
                pathOptions={{ color: 'var(--primary-blue)', fillColor: 'var(--primary-blue)', fillOpacity: 0.1 }}
              />

              {/* Pharmacy Markers */}
              {results.map(p => (
                <Marker 
                  key={p.id} 
                  position={[p.lat, p.lng]} 
                  icon={p.available ? safeIcon : avoidIcon}
                  eventHandlers={{
                    click: () => setSelectedPin(p.id),
                  }}
                  ref={(ref) => {
                    if (ref && selectedPin === p.id && !ref.isPopupOpen()) {
                      ref.openPopup();
                    }
                  }}
                >
                  <Popup>
                    <div className="map-popup-card">
                      <h4 style={{ margin: '0 0 5px 0', color: 'var(--primary-blue)' }}>{p.name}</h4>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b' }}>{p.address}</p>
                      <div style={{ marginBottom: '10px' }}>
                        {p.available ? (
                          <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.8rem' }}>✓ In Stock: {p.qty} Units</span>
                        ) : (
                          <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.8rem' }}>✗ Out of Stock</span>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '3px', fontWeight: 600 }}>Distance: {p.distance.toFixed(2)} km</div>
                      </div>
                      <button 
                        onClick={() => handleGetDirections(p.lat, p.lng)}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '8px', fontSize: '0.8rem', fontWeight: 800, borderRadius: '8px' }}
                      >
                        <Navigation size={12} style={{ marginRight: '5px' }} /> Get Directions
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            {/* Map Legend */}
            <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 1000, background: 'white', padding: '12px 16px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
               <div className="map-legend-item">
                 <div className="map-legend-dot" style={{ background: '#22c55e' }} /> In Stock
               </div>
               <div className="map-legend-item">
                 <div className="map-legend-dot" style={{ background: '#ef4444' }} /> Out of Stock
               </div>
               <div className="map-legend-item" style={{ marginBottom: 0 }}>
                 <div className="map-legend-dot" style={{ background: '#3b82f6' }} /> Your Location
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

