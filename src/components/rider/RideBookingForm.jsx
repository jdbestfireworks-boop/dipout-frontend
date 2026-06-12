import React, { useState } from 'react';
import { MapPin, Navigation, Clock, CreditCard, Crosshair, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import AddressAutocomplete from './AddressAutocomplete';
import StopsManager from './StopsManager';

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
  onRequestRide,
  isRequesting,
  onSetDropoffGps,
  gettingLocation,
  stops,
  setStops
}) {
  const addStop = (stop) => {
    setStops([...stops, stop]);
  };

  const removeStop = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const updateStop = (index, stop) => {
    const newStops = [...stops];
    newStops[index] = stop;
    setStops(newStops);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-5"
    >
      {/* Address Inputs with Connection Line */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="relative"
      >
        {/* Visual connection line with animation */}
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute left-[1.1rem] top-10 bottom-10 w-0.5 bg-gradient-to-b from-primary/70 via-primary/50 to-transparent z-10" 
        />
        
        <div className="space-y-3.5 bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-2xl rounded-3xl border border-white/10 p-5 shadow-2xl">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="relative group"
          >
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
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <span className="text-[10px] font-medium text-green-400 flex items-center gap-1.5 bg-gradient-to-r from-green-500/15 to-green-500/5 px-2.5 py-1.5 rounded-full border border-green-500/25 shadow-lg">
                  <MapPin className="w-3 h-3" />
                  GPS set
                </span>
              </motion.div>
            )}
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="relative group"
          >
            <AddressAutocomplete
              placeholder="Enter destination"
              value={dropoffAddress}
              onChange={(val, coords) => { 
                setDropoffAddress(val); 
                setDropoffCoords(coords); 
              }}
              icon={<Navigation className="w-4 h-4 text-muted-foreground/70" />}
            />
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={onSetDropoffGps}
              disabled={gettingLocation}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 hover:from-primary/25 hover:to-primary/15 text-primary transition-all disabled:opacity-50 border border-primary/20 shadow-md hover:shadow-lg hover:shadow-primary/20"
              title="Use current location"
            >
              <Crosshair className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stops Manager */}
      {pickupCoords && dropoffCoords && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <StopsManager
            stops={stops}
            onAddStop={addStop}
            onRemoveStop={removeStop}
            onUpdateStop={updateStop}
            pickupAddress={pickupAddress}
            dropoffAddress={dropoffAddress}
          />
        </div>
      )}

      {/* Get Quote Button */}
      {!quote && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03, translateY: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onGetQuote}
          disabled={quoting || !pickupAddress || !dropoffAddress}
          className="w-full h-[3.5rem] rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/85 text-primary-foreground font-semibold text-sm tracking-wide hover:from-primary/95 hover:via-primary/90 hover:to-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/35 disabled:shadow-none border border-white/10"
        >
          {quoting ? (
            <motion.span 
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center justify-center gap-2.5"
            >
              <Clock className="w-4 h-4 animate-spin" />
              <span>Calculating fare...</span>
            </motion.span>
          ) : (
            'See fare'
          )}
        </motion.button>
      )}

      {/* Fare & Payment Card */}
      {quote && (
        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 space-y-5 shadow-2xl"
        >
          {/* Fare Display */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-between pb-4 border-b border-white/5"
          >
            <div>
              <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-[0.15em]">Estimated Fare</p>
              <motion.p 
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 400 }}
                className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent mt-1"
              >
                ${quote.fare.toFixed(2)}
              </motion.p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-[0.15em]">Distance</p>
              <p className="text-xl font-semibold mt-1 text-primary/90">{distanceKm.toFixed(1)} mi</p>
            </div>
          </motion.div>
          
          {/* Surge Warning */}
          {quote.surgeMultiplier > 1 && (
            <motion.div 
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2.5 text-xs text-amber-400 bg-gradient-to-r from-amber-500/15 to-amber-500/8 px-4 py-3 rounded-2xl border border-amber-500/25 shadow-lg"
            >
              <motion.div animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                <Clock className="w-4 h-4" />
              </motion.div>
              <span className="font-medium">High demand - {quote.surgeMultiplier}x surge pricing</span>
            </motion.div>
          )}

          {/* Payment Info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="pt-1"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/12 via-primary/8 to-transparent border border-primary/20 rounded-2xl p-5 text-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-2.5 shadow-lg"
              >
                <CreditCard className="w-6 h-6 text-primary" />
              </motion.div>
              <p className="text-sm font-semibold text-primary/90">Pay Now with Card</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 leading-relaxed">Secure payment processed at booking</p>
            </div>
          </motion.div>

          {/* Request Button */}
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.03, translateY: -2, shadow: "0 20px 40px -10px rgba(234, 179, 8, 0.4)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ delay: 0.4 }}
            onClick={onRequestRide}
            disabled={isRequesting || !quote}
            className="w-full h-[3.5rem] rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/85 text-primary-foreground font-semibold text-sm tracking-wide hover:from-primary/95 hover:via-primary/90 hover:to-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-2xl shadow-primary/35 disabled:shadow-none border border-white/10"
          >
            {isRequesting ? (
              <motion.span 
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center justify-center gap-2.5"
              >
                <Clock className="w-4 h-4 animate-spin" />
                <span>Processing payment...</span>
              </motion.span>
            ) : (
              'Book & Pay Now'
            )}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}