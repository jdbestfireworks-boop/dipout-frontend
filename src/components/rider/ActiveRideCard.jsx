import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ExternalLink, Car, AlertTriangle, Shield, Gauge, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RideChat from '@/components/ride/RideChat';
import RealTimeTrackingMap from '@/components/RealTimeTrackingMap';
import { motion } from 'framer-motion';
import { haversineMiles } from '@/lib/geo';

function mapsLink(address) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

function dirLink(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}

export default function ActiveRideCard({ 
  ride, 
  user, 
  gpsEnabled, 
  onToggleGps,
  onCancelRide,
  onCompleteTrip,
  onBookNewRide,
  onInitiateCancel
}) {
  const [distanceToPickup, setDistanceToPickup] = useState(null);
  const [distanceToDropoff, setDistanceToDropoff] = useState(null);

  useEffect(() => {
    if (gpsEnabled && user?.lat && user?.lng && ride?.pickup_lat && ride?.pickup_lng) {
      const dist = haversineMiles(user.lat, user.lng, ride.pickup_lat, ride.pickup_lng);
      setDistanceToPickup(dist.toFixed(1));
    } else {
      setDistanceToPickup(null);
    }

    if (ride?.dropoff_lat && ride?.dropoff_lng) {
      if (gpsEnabled && user?.lat && user?.lng) {
        const dist = haversineMiles(user.lat, user.lng, ride.dropoff_lat, ride.dropoff_lng);
        setDistanceToDropoff(dist.toFixed(1));
      } else if (ride?.pickup_lat && ride?.pickup_lng) {
        const dist = haversineMiles(ride.pickup_lat, ride.pickup_lng, ride.dropoff_lat, ride.dropoff_lng);
        setDistanceToDropoff(dist.toFixed(1));
      } else {
        setDistanceToDropoff(null);
      }
    }
  }, [gpsEnabled, user?.lat, user?.lng, ride?.pickup_lat, ride?.pickup_lng, ride?.dropoff_lat, ride?.dropoff_lng]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-card/95 via-card to-card/85 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-2xl">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl"
        />
        
        {/* Status Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 pb-4 border-b border-white/5"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 shadow-lg">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-[0.12em]">Your Driver</p>
            <p className="font-semibold text-sm mt-0.5">{ride.driver_email || 'Finding driver...'}</p>
          </div>
        </motion.div>

        {/* Chat & Contact */}
        <RideChat
          ride={ride}
          myEmail={user?.email}
          myRole="rider"
          otherEmail={ride.driver_email}
          driverPhone={ride.driver_phone}
          riderPhone={user?.phone_number}
        />

        {/* GPS Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 p-4 flex items-center justify-between bg-gradient-to-br from-muted/40 to-muted/20 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              animate={gpsEnabled ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-3 h-3 rounded-full ${gpsEnabled ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30' : 'bg-gray-400'}`} 
            />
            <div>
              <p className="text-sm font-medium tracking-wide">GPS Location Sharing</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {gpsEnabled ? 'Your driver can see your real-time location' : 'Location is hidden from driver'}
              </p>
            </div>
          </div>
          <button
            onClick={onToggleGps}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${
              gpsEnabled ? 'bg-gradient-to-r from-primary to-primary/85 shadow-lg shadow-primary/30' : 'bg-gray-400'
            }`}
          >
            <motion.span
              animate={{ x: gpsEnabled ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500 }}
              className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md"
            />
          </button>
        </motion.div>

        {/* Proximity Map */}
        {gpsEnabled && (ride?.driver_lat || ride?.rider_lat) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl"
          >
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                <Map className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">Live Proximity Map</p>
                <p className="text-[10px] text-muted-foreground/70">Real-time driver location</p>
              </div>
            </div>
            <div className="h-64 w-full mt-12">
              <RealTimeTrackingMap
                ride={ride}
                showDriver={true}
                showRider={true}
                autoCenter={true}
                className="h-full w-full rounded-none"
              />
            </div>
          </motion.div>
        )}

        {/* Route Info */}
        <div className="space-y-4 pt-1">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Pickup Location</p>
              <p className="text-sm font-medium leading-snug">{ride.pickup_address}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {distanceToPickup && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    <Gauge className="w-3 h-3 mr-1" />
                    {distanceToPickup} mi away
                  </Badge>
                )}
                <a
                  href={mapsLink(ride.pickup_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  Open in Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <Navigation className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Destination</p>
              <p className="text-sm font-medium leading-snug">{ride.dropoff_address}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {distanceToDropoff && (
                  <Badge variant="outline" className="text-[10px] bg-muted/50 text-foreground border-border">
                    <Navigation className="w-3 h-3 mr-1" />
                    {distanceToDropoff} mi to destination
                  </Badge>
                )}
                <a
                  href={mapsLink(ride.dropoff_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  Open in Maps <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={dirLink(ride.pickup_address, ride.dropoff_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  Get Directions <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Summary */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Fare</p>
            <p className="text-2xl font-bold text-primary">${ride.fare?.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Payment</p>
            <p className="text-sm font-medium capitalize">{ride.payment_method}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {['requested', 'accepted'].includes(ride.status) && (
          <Button 
            variant="ghost" 
            onClick={onInitiateCancel}
            className="w-full text-destructive hover:bg-destructive/10 h-11"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Cancel Ride
          </Button>
        )}

        {ride.status === 'in_progress' && (
          <Button 
            variant="outline" 
            onClick={onCompleteTrip}
            className="w-full h-11"
          >
            Mark Trip as Completed
          </Button>
        )}

        {ride.status === 'cancelled' && (
          <Button 
            variant="outline" 
            onClick={onBookNewRide}
            className="w-full h-11"
          >
            Book Another Ride
          </Button>
        )}
      </div>
  );
}