import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const makeIcon = (color, label) =>
  L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-100%)">
      <div style="background:${color};color:#0c0e12;font-weight:700;font-size:10px;padding:2px 7px;border-radius:9999px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.4)">${label}</div>
      <div style="width:2px;height:10px;background:${color}"></div>
      <div style="width:10px;height:10px;border-radius:9999px;background:${color};box-shadow:0 0 0 4px ${color}33"></div>
    </div>`,
    iconSize: [0, 0],
  });

const pickupIcon = makeIcon('#c8f53a', 'PICKUP');
const dropoffIcon = makeIcon('#ffffff', 'DROPOFF');
const driverIcon = makeIcon('#5ab4ff', 'DRIVER');

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick && onClick(e.latlng) });
  return null;
}

export default function RideMap({ pickup, dropoff, driver, onMapClick, center, className }) {
  const mapCenter = center || pickup || { lat: 40.7128, lng: -74.006 };
  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={13}
      className={className || 'h-full w-full'}
      style={{ background: '#111418' }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <ClickHandler onClick={onMapClick} />
      {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
      {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} />}
      {driver && <Marker position={[driver.lat, driver.lng]} icon={driverIcon} />}
      {pickup && dropoff && (
        <Polyline
          positions={[
            [pickup.lat, pickup.lng],
            [dropoff.lat, dropoff.lng],
          ]}
          pathOptions={{ color: '#c8f53a', weight: 3, dashArray: '8 8', opacity: 0.7 }}
        />
      )}
    </MapContainer>
  );
}