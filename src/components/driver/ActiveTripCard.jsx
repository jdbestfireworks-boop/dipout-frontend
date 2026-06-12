import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Navigation, ExternalLink, CreditCard, Phone, MessageCircle, Clock, Gauge, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RideChat from '@/components/ride/RideChat';
import RealTimeTrackingMap from '@/components/RealTimeTrackingMap';
import { toast } from 'sonner';
import { haversineMiles } from '@/lib/geo';

function mapsLink(address) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

function dirLink(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}

export default function ActiveTripCard({ 
  ride, 
  user, 
  onStartTrip, 
  onCompleteTrip,
  onCancelRide
}) {
  const [paymentMode, setPaymentMode] = useState(ride.payment_mode || 'mile');
  const [distanceToPickup, setDistanceToPickup] = useState(null);
  const [distanceToDropoff, setDistanceToDropoff] = useState(null);

  useEffect(() => {
    const calculateDistances = async () => {
      try {
        const driverProfile = await base44.entities.DriverProfile.filter({ user_email: user.email });
        const driverLat = driverProfile[0]?.lat;
        const driverLng = driverProfile[0]?.lng;

        if (driverLat && driverLng && ride?.pickup_lat && ride?.pickup_lng) {
          const dist = haversineMiles(driverLat, driverLng, ride.pickup_lat, ride.pickup_lng);
          setDistanceToPickup(dist.toFixed(1));
        } else {
          setDistanceToPickup(null);
        }

        if (ride?.dropoff_lat && ride?.dropoff_lng) {
          if (driverLat && driverLng) {
            const dist = haversineMiles(driverLat, driverLng, ride.dropoff_lat, ride.dropoff_lng);
            setDistanceToDropoff(dist.toFixed(1));
          } else if (ride?.pickup_lat && ride?.pickup_lng) {
            const dist = haversineMiles(ride.pickup_lat, ride.pickup_lng, ride.dropoff_lat, ride.dropoff_lng);
            setDistanceToDropoff(dist.toFixed(1));
          } else {
            setDistanceToDropoff(null);
          }
        }
      } catch (error) {
        console.error('Failed to calculate distances:', error);
      }
    };

    calculateDistances();
  }, [user.email, ride?.pickup_lat, ride?.pickup_lng, ride?.dropoff_lat, ride?.dropoff_lng]);

  const handlePaymentModeChange = async (mode) => {
    try {
      // Update the ride's payment mode
      await base44.entities.Ride.update(ride.id, { payment_mode: mode });
      setPaymentMode(mode);
      
      // Also update driver's default preference for future rides
      const driverProfile = await base44.entities.DriverProfile.filter({ user_email: user.email });
      if (driverProfile && driverProfile.length > 0) {
        await base44.entities.DriverProfile.update(driverProfile[0].id, { earnings_mode: mode });
      }
      
      toast.success(`Earnings mode set to ${mode === 'mile' ? 'per mile' : 'per hour'}`);
    } catch (error) {
      console.error('Failed to update earnings mode:', error);
      toast.error('Failed to update earnings mode');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Current Trip</h2>
        <Badge className="capitalize bg-primary/10 text-primary border-primary/20">
          {ride.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Rider Info Card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rider</p>
            <p className="font-semibold text-base">{ride.rider_email}</p>
          </div>
        </div>

        {/* Chat & Contact */}
        <RideChat
          ride={ride}
          myEmail={user?.email}
          myRole="driver"
          otherEmail={ride.rider_email}
          driverPhone={ride.driver_phone}
          riderPhone={ride.rider_phone}
        />

        {/* Fare & Payment */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Fare</p>
            <p className="text-2xl font-bold text-primary">${ride.fare?.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Payment</p>
            <Badge variant="outline" className="capitalize flex items-center gap-1.5 mt-1">
              {ride.payment_method === 'cash' ? (
                <><span className="text-xs">💵</span> Cash</>
              ) : (
                <><CreditCard className="w-3.5 h-3.5" /> Card</>
              )}
            </Badge>
          </div>
        </div>

        {/* Payment Mode Selector - Only visible on active rides */}
        {(ride.status === 'accepted' || ride.status === 'in_progress') && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Earnings Mode</p>
              <Badge variant="outline" className="text-[10px]">
                {paymentMode === 'mile' ? (
                  <><Gauge className="w-3 h-3 mr-1" /> Per Mile</>
                ) : (
                  <><Clock className="w-3 h-3 mr-1" /> Per Hour</>
                )}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant={paymentMode === 'mile' ? 'default' : 'outline'}
                className={`flex-1 ${paymentMode === 'mile' ? '' : 'hover:bg-accent'}`}
                onClick={() => handlePaymentModeChange('mile')}
              >
                <Gauge className="w-4 h-4 mr-1.5" />
                Per Mile
              </Button>
              <Button
                variant={paymentMode === 'hour' ? 'default' : 'outline'}
                className={`flex-1 ${paymentMode === 'hour' ? '' : 'hover:bg-accent'}`}
                onClick={() => handlePaymentModeChange('hour')}
              >
                <Clock className="w-4 h-4 mr-1.5" />
                Per Hour
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {paymentMode === 'mile' 
                ? 'Earn based on distance traveled' 
                : 'Earn based on time spent on trip'}
            </p>
          </div>
        )}
      </div>

      {/* Proximity Map */}
      {(ride?.driver_lat || ride?.rider_lat) && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Map className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary">Live Proximity Map</p>
              <p className="text-[10px] text-muted-foreground/70">See your distance to rider</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <RealTimeTrackingMap
              ride={ride}
              showDriver={true}
              showRider={true}
              autoCenter={true}
              className="h-full w-full rounded-none"
            />
          </div>
        </div>
      )}

      {/* Route Info Card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Pickup Location</p>
            <p className="text-sm font-medium leading-snug">{ride.pickup_address}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {distanceToPickup && (
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                  <Gauge className="w-3 h-3 mr-1" />
                  {distanceToPickup} mi to pickup
                </Badge>
              )}
              <a
                href={mapsLink(ride.pickup_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                Open in Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <Navigation className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Destination</p>
            <p className="text-sm font-medium leading-snug">{ride.dropoff_address}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                Open in Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Full Directions Button */}
        <a
          href={dirLink(ride.pickup_address, ride.dropoff_address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <Navigation className="w-4 h-4" /> Get Full Directions
        </a>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {ride.status === 'accepted' && (
          <>
            <button
              onClick={onStartTrip}
              className="w-full h-14 rounded-2xl bg-secondary text-secondary-foreground font-semibold text-base hover:bg-secondary/80 transition-all shadow-sm"
            >
              Start Trip - Rider Picked Up
            </button>
            {onCancelRide && (
              <button
                onClick={onCancelRide}
                className="w-full h-12 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-all border border-destructive/30"
              >
                Cancel Ride
              </button>
            )}
          </>
        )}

        {ride.status === 'in_progress' && (
          <>
            <button
              onClick={onCompleteTrip}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Complete Trip
            </button>
            {onCancelRide && (
              <button
                onClick={onCancelRide}
                className="w-full h-12 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-all border border-destructive/30"
              >
                Cancel Ride
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}