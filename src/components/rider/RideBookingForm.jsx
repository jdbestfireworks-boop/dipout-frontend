import React from 'react';
import { MapPin, Navigation, Clock, CreditCard, Banknote, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import AddressAutocomplete from './AddressAutocomplete';

export default function RideBookingForm({ 
  pickupAddress, 
  setPickupAddress, 
  pickupCoords, 
  setPickupCoords,
  dropoffAddress, 
  setDropoffAddress, 
  dropoffCoords, 
  setDropoffCoords,
  onGetQuote,
  quoting,
  quote,
  distanceKm,
  payMethod,
  setPayMethod,
  onRequestRide,
  isRequesting,
  onSetDropoffGps,
  gettingLocation
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Address Inputs with Connection Line */}
      <div className="relative">
        {/* Visual connection line */}
        <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/50 to-muted-foreground/30 z-10" />
        
        <div className="space-y-3 bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="relative">
            <AddressAutocomplete
              placeholder="Enter pickup location"
              value={pickupAddress}
              onChange={(val, coords) => { 
                setPickupAddress(val); 
                setPickupCoords(coords); 
              }}
              icon={<MapPin className="w-4 h-4 text-primary" />}
            />
            {pickupCoords && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-xs text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
                  <MapPin className="w-3 h-3" />
                  GPS set
                </span>
              </div>
            )}
          </div>
          <div className="relative">
            <AddressAutocomplete
              placeholder="Enter destination"
              value={dropoffAddress}
              onChange={(val, coords) => { 
                setDropoffAddress(val); 
                setDropoffCoords(coords); 
              }}
              icon={<Navigation className="w-4 h-4 text-muted-foreground" />}
            />
            <button
              type="button"
              onClick={onSetDropoffGps}
              disabled={gettingLocation}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all disabled:opacity-50"
              title="Use current location"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Get Quote Button */}
      {!quote && (
        <button
          onClick={onGetQuote}
          disabled={quoting || !pickupAddress || !dropoffAddress}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
        >
          {quoting ? (
            <span className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 animate-spin" />
              Calculating fare...
            </span>
          ) : (
            'See fare'
          )}
        </button>
      )}

      {/* Fare & Payment Card */}
      {quote && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-lg"
        >
          {/* Fare Display */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Estimated Fare</p>
              <p className="text-3xl font-bold text-primary mt-0.5">${quote.fare.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Distance</p>
              <p className="text-lg font-semibold mt-0.5">{distanceKm.toFixed(1)} mi</p>
            </div>
          </div>
          
          {/* Surge Warning */}
          {quote.surgeMultiplier > 1 && (
            <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-xl">
              <Clock className="w-3.5 h-3.5" />
              <span>High demand - {quote.surgeMultiplier}x surge pricing</span>
            </div>
          )}

          {/* Payment Method */}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPayMethod('card')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                  payMethod === 'card'
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-transparent text-muted-foreground hover:border-primary/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Card</span>
              </button>
              <button
                onClick={() => setPayMethod('cash')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                  payMethod === 'cash'
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-transparent text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-sm font-medium">Cash</span>
              </button>
            </div>
          </div>

          {/* Request Button */}
          <button
            onClick={onRequestRide}
            disabled={isRequesting || !payMethod}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-3 shadow-lg shadow-primary/20"
          >
            {isRequesting ? (
              <span className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                Requesting ride...
              </span>
            ) : (
              payMethod ? `Request ${payMethod === 'card' ? 'Card' : 'Cash'} Ride` : 'Select Payment Method'
            )}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}