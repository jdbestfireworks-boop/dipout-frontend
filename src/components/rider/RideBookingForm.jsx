import React, { useState } from 'react';
import { MapPin, Navigation, Clock, CreditCard, Banknote, Crosshair, Plus } from 'lucide-react';
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
  gettingLocation
}) {
  const [stops, setStops] = useState([]);
  const [showStops, setShowStops] = useState(false);

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
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Address Inputs with Connection Line */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        {/* Visual connection line with animation */}
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/60 via-primary/40 to-muted-foreground/30 z-10 rounded-full" 
        />
        
        <div className="space-y-3 bg-gradient-to-br from-card to-card/95 rounded-2xl border border-border/50 p-4 shadow-xl backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <span className="text-xs text-green-500 flex items-center gap-1 bg-gradient-to-r from-green-500/10 to-green-500/5 px-2 py-1 rounded-full border border-green-500/20">
                  <MapPin className="w-3 h-3" />
                  GPS set
                </span>
              </motion.div>
            )}
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <AddressAutocomplete
              placeholder="Enter destination"
              value={dropoffAddress}
              onChange={(val, coords) => { 
                setDropoffAddress(val); 
                setDropoffCoords(coords); 
              }}
              icon={<Navigation className="w-4 h-4 text-muted-foreground" />}
            />
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onSetDropoffGps}
              disabled={gettingLocation}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-primary transition-all disabled:opacity-50 border border-primary/20"
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGetQuote}
          disabled={quoting || !pickupAddress || !dropoffAddress}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold text-base hover:from-primary/90 hover:to-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/30 disabled:shadow-none"
        >
          {quoting ? (
            <motion.span 
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 animate-spin" />
              Calculating fare...
            </motion.span>
          ) : (
            'See fare'
          )}
        </motion.button>
      )}

      {/* Fare & Payment Card */}
      {quote && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-card to-card/95 rounded-2xl border border-border/50 p-5 space-y-4 shadow-2xl backdrop-blur-sm"
        >
          {/* Fare Display */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between pb-3 border-b border-border/50"
          >
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Estimated Fare</p>
              <motion.p 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mt-0.5"
              >
                ${quote.fare.toFixed(2)}
              </motion.p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Distance</p>
              <p className="text-lg font-semibold mt-0.5 text-primary">{distanceKm.toFixed(1)} mi</p>
            </div>
          </motion.div>
          
          {/* Surge Warning */}
          {quote.surgeMultiplier > 1 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs text-amber-500 bg-gradient-to-r from-amber-500/10 to-amber-500/5 px-3 py-2 rounded-xl border border-amber-500/20"
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Clock className="w-3.5 h-3.5" />
              </motion.div>
              <span>High demand - {quote.surgeMultiplier}x surge pricing</span>
            </motion.div>
          )}

          {/* Payment Info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-2"
          >
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CreditCard className="w-8 h-8 text-primary mx-auto mb-2" />
              </motion.div>
              <p className="text-sm font-semibold text-primary">Pay Now with Card</p>
              <p className="text-xs text-muted-foreground mt-1">Secure payment processed at booking</p>
            </div>
          </motion.div>

          {/* Request Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.4 }}
            onClick={onRequestRide}
            disabled={isRequesting || !quote}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold text-base hover:from-primary/90 hover:to-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-3 shadow-xl shadow-primary/30 disabled:shadow-none"
          >
            {isRequesting ? (
              <motion.span 
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 animate-spin" />
                Processing payment...
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