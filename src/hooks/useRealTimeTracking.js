import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Real-time ride tracking hook
 * Subscribes to ride entity updates for live tracking
 */
export function useRideTracking(rideId) {
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rideId) return;

    let unsubscribe = null;

    const initTracking = async () => {
      try {
        // Load initial ride data
        const rides = await base44.entities.Ride.filter({ id: rideId });
        if (rides.length > 0) {
          setRide(rides[0]);
        }
        setLoading(false);

        // Subscribe to real-time updates
        unsubscribe = base44.entities.Ride.subscribe((event) => {
          if (event.id === rideId && event.type === 'update') {
            setRide(event.data);
            
            // Show toast for status changes
            if (event.data.status !== ride?.status) {
              const statusMessages = {
                accepted: 'Driver accepted your ride! 🚗',
                in_progress: 'Trip in progress 📍',
                completed: 'Trip completed! ⭐',
                cancelled: 'Ride cancelled',
              };
              if (statusMessages[event.data.status]) {
                toast.info(statusMessages[event.data.status]);
              }
            }
          }
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initTracking();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [rideId]);

  return { ride, loading, error };
}

/**
 * Real-time driver location tracking
 * Subscribes to driver profile updates for live location
 */
export function useDriverTracking(driverEmail) {
  const [driver, setDriver] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!driverEmail) return;

    let unsubscribe = null;

    const initTracking = async () => {
      try {
        // Load initial driver data
        const drivers = await base44.entities.DriverProfile.filter({ 
          user_email: driverEmail 
        });
        
        if (drivers.length > 0) {
          const driverData = drivers[0];
          setDriver(driverData);
          setLocation({
            lat: driverData.lat,
            lng: driverData.lng,
          });
        }

        // Subscribe to real-time location updates
        unsubscribe = base44.entities.DriverProfile.subscribe((event) => {
          if (event.type === 'update' && event.data.user_email === driverEmail) {
            setDriver(event.data);
            if (event.data.lat && event.data.lng) {
              setLocation({
                lat: event.data.lat,
                lng: event.data.lng,
              });
            }
          }
        });
      } catch (err) {
        console.error('Driver tracking error:', err);
      }
    };

    initTracking();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [driverEmail]);

  return { driver, location };
}

/**
 * Real-time rider location tracking
 * Subscribes to ride updates for rider location
 */
export function useRiderTracking(rideId) {
  const [riderLocation, setRiderLocation] = useState(null);

  useEffect(() => {
    if (!rideId) return;

    let unsubscribe = null;

    const initTracking = async () => {
      try {
        // Subscribe to ride updates (includes rider location)
        unsubscribe = base44.entities.Ride.subscribe((event) => {
          if (event.id === rideId && event.type === 'update') {
            if (event.data.rider_lat && event.data.rider_lng) {
              setRiderLocation({
                lat: event.data.rider_lat,
                lng: event.data.rider_lng,
              });
            }
          }
        });
      } catch (err) {
        console.error('Rider tracking error:', err);
      }
    };

    initTracking();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [rideId]);

  return { riderLocation };
}

/**
 * Real-time ride request tracking for drivers
 * Subscribes to new ride requests in real-time
 */
export function useRideRequests(userEmail, isOnline) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!userEmail || !isOnline) {
      setRequests([]);
      return;
    }

    let unsubscribe = null;

    const initTracking = async () => {
      try {
        // Load initial requests
        const rides = await base44.entities.Ride.filter(
          { status: 'requested' },
          '-created_date',
          20
        );
        
        // Filter out rides this driver already declined
        const filtered = rides.filter(r => 
          !(r.declined_by || []).includes(userEmail)
        );
        setRequests(filtered);

        // Subscribe to new ride requests
        unsubscribe = base44.entities.Ride.subscribe((event) => {
          if (event.type === 'create' && event.data.status === 'requested') {
            // Check if driver already declined this ride
            const declinedBy = event.data.declined_by || [];
            if (!declinedBy.includes(userEmail)) {
              setRequests(prev => [event.data, ...prev.filter(r => r.id !== event.id)]);
              
              // Play notification sound
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(() => {});
              
              toast.info('New ride request! 💰');
            }
          }
          
          if (event.type === 'update') {
            // Remove accepted/cancelled rides from list
            if (event.data.status !== 'requested') {
              setRequests(prev => prev.filter(r => r.id !== event.id));
            }
          }
        });
      } catch (err) {
        console.error('Ride request tracking error:', err);
      }
    };

    initTracking();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userEmail, isOnline]);

  return { requests, setRequests };
}

/**
 * Real-time active ride tracking
 * Tracks all active rides for admin dashboard
 */
export function useActiveRidesTracking() {
  const [activeRides, setActiveRides] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    requested: 0,
    accepted: 0,
    inProgress: 0,
  });

  useEffect(() => {
    let unsubscribe = null;

    const loadActiveRides = async () => {
      try {
        const rides = await base44.entities.Ride.filter({});
        const active = rides.filter(r => 
          ['requested', 'accepted', 'in_progress'].includes(r.status)
        );
        setActiveRides(active);
        updateStats(active);
      } catch (err) {
        console.error('Active rides tracking error:', err);
      }
    };

    const updateStats = (rides) => {
      setStats({
        total: rides.length,
        requested: rides.filter(r => r.status === 'requested').length,
        accepted: rides.filter(r => r.status === 'accepted').length,
        inProgress: rides.filter(r => r.status === 'in_progress').length,
      });
    };

    loadActiveRides();

    // Subscribe to real-time updates
    unsubscribe = base44.entities.Ride.subscribe((event) => {
      if (event.type === 'create') {
        if (['requested', 'accepted', 'in_progress'].includes(event.data.status)) {
          setActiveRides(prev => [event.data, ...prev]);
          updateStats([...activeRides, event.data]);
        }
      }
      
      if (event.type === 'update') {
        setActiveRides(prev => {
          const updated = prev.map(r => 
            r.id === event.id ? event.data : r
          );
          
          // Remove completed/cancelled rides
          const filtered = updated.filter(r => 
            ['requested', 'accepted', 'in_progress'].includes(r.status)
          );
          
          updateStats(filtered);
          return filtered;
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { activeRides, stats };
}

export default {
  useRideTracking,
  useDriverTracking,
  useRiderTracking,
  useRideRequests,
  useActiveRidesTracking,
};