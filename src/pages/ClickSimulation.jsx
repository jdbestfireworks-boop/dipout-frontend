import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  DollarSign, Clock, Star, Play, RotateCcw, ArrowRight, Sparkles, Zap,
  User, Car, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import RoleSelector from '@/components/simulation/RoleSelector';
import { LocationStep } from '@/components/simulation/LocationStep';
import { FareEstimate } from '@/components/simulation/FareEstimate';
import { DriverAssigned } from '@/components/simulation/DriverAssigned';
import { PostRidePayment } from '@/components/simulation/PostRidePayment';
import { RideRequestCard, ActiveTrip, TripComplete } from '@/components/simulation/DriverSteps';

const RIDER_STEPS = [
  {
    id: 1,
    title: 'Enter Pickup Location',
    description: 'As a rider, you start by entering where you want to be picked up',
    action: () => toast.info('📍 Pickup location entered: "123 Main St, Lafayette, LA"'),
    component: <LocationStep pickup="123 Main St, Lafayette, LA" destination="" showDestination={false} />
  },
  {
    id: 2,
    title: 'Enter Destination',
    description: 'Now enter where you want to go',
    action: () => toast.info('🎯 Destination entered: "Cajun Field, Lafayette, LA"'),
    component: <LocationStep pickup="123 Main St, Lafayette, LA" destination="Cajun Field, Lafayette, LA" showDestination={true} />
  },
  {
    id: 3,
    title: 'Get AI Fare Estimate',
    description: 'Our AI calculates the fare based on distance, demand, and time',
    action: () => toast.success('💰 Fare calculated: $18.50 (2.3 miles)'),
    component: <FareEstimate fare="$18.50" distance="2.3 mi" onSelectPayment={(method) => toast.info(`Payment method selected: ${method}`)} />
  },
  {
    id: 4,
    title: 'Request Ride',
    description: 'Tap to request the ride and find a nearby driver',
    action: async () => {
      toast.loading('🚗 Finding your driver...', { duration: 2000 });
      setTimeout(() => toast.success('✓ Driver found! Mike is 2 min away'), 2000);
    },
    component: (
      <div className="bg-card rounded-xl border border-border p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
          <Car className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="font-bold text-lg">Finding your driver...</p>
          <p className="text-sm text-muted-foreground">Broadcasting to nearby drivers</p>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: 'Driver Assigned',
    description: 'A driver has accepted your ride! Track them in real-time',
    action: () => toast.success('🚙 Mike (4.8★) is on the way - Toyota Camry, Plate: ABC-123'),
    component: <DriverAssigned driverName="Mike" rating="4.8" vehicle="Toyota Camry" plate="ABC-123" eta="2 min" />
  },
  {
    id: 6,
    title: 'Trip Complete & Payment',
    description: 'Rate your driver and complete payment',
    action: () => toast.success('⭐ Trip complete! Payment processed: $18.50'),
    component: <PostRidePayment fare="$18.50" paymentMethod="Card" onConfirm={() => toast.success('✓ Payment confirmed!')} />
  }
];

const DRIVER_STEPS = [
  {
    id: 7,
    title: 'Go Online',
    description: 'As a driver, toggle online to start receiving ride requests',
    action: () => toast.success('✓ You\'re now online! Receiving ride requests...'),
    component: (
      <div className="bg-card rounded-xl border border-border p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-lg font-bold text-green-500">Online</span>
        </div>
        <p className="text-sm text-muted-foreground">You'll see ride requests from nearby riders</p>
        <Badge variant="outline" className="text-xs">
          <Zap className="w-3 h-3 mr-1" /> Ready to accept
        </Badge>
      </div>
    )
  },
  {
    id: 8,
    title: 'Receive Ride Request',
    description: 'A nearby rider needs a ride! Review the details and decide',
    action: () => toast.info('🔔 New ride request: $18.50 fare, 2.3 miles'),
    component: <RideRequestCard earnings="$14.80" pickup="123 Main St" dropoff="Cajun Field" distance="2.3 mi" />
  },
  {
    id: 9,
    title: 'Navigate to Pickup',
    description: 'Accept the ride and navigate to pick up the rider',
    action: () => toast.success('✓ Ride accepted! Navigate to pickup location'),
    component: (
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Rider: Sarah</p>
            <p className="text-sm text-muted-foreground">4.9★ • 123 Main St</p>
          </div>
        </div>
        <Button className="w-full">
          <Car className="w-4 h-4 mr-2" /> Navigate to Pickup (0.8 mi)
        </Button>
      </div>
    )
  },
  {
    id: 10,
    title: 'Start Trip',
    description: 'Pick up the rider and start the trip',
    action: () => toast.success('🚗 Trip started - heading to destination'),
    component: <ActiveTrip status="In Progress" fare="$18.50" destination="Cajun Field" distance="2.3 mi" />
  },
  {
    id: 11,
    title: 'Complete & Earn',
    description: 'Drop off the rider and complete the trip to get paid',
    action: () => toast.success('💰 Trip complete! You earned $14.80'),
    component: <TripComplete earnings="$14.80" rating="5-star rating received!" />
  }
];

export default function ClickSimulation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const autoplayRef = useRef(null);

  const steps = selectedRole === 'rider' ? RIDER_STEPS : selectedRole === 'driver' ? DRIVER_STEPS : [];
  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  useEffect(() => {
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, []);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (steps[nextStep]?.action) {
        steps[nextStep].action();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };

  const handleAutoPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      return;
    }

    setIsPlaying(true);
    autoplayRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < totalSteps - 1) {
          const nextStep = prev + 1;
          if (steps[nextStep]?.action) {
            steps[nextStep].action();
          }
          return nextStep;
        } else {
          setIsPlaying(false);
          if (autoplayRef.current) clearInterval(autoplayRef.current);
          return prev;
        }
      });
    }, 3000);
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setCurrentStep(0);
    toast.success(`✓ Playing as ${role}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-display font-bold flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Interactive Demo
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience how Dip Out works by clicking through a complete ride journey
          </p>
        </div>

        {!selectedRole ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RoleSelector onSelect={handleRoleSelect} />
          </motion.div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{currentStep + 1} / {totalSteps}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Main Content */}
            <Card className="border-2 border-primary/50 bg-primary/5">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{currentStepData?.title}</CardTitle>
                <CardDescription className="text-base">{currentStepData?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStepData?.component}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentStep === 0 || isPlaying}
                    variant="outline"
                    className="px-6"
                  >
                    ← Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="icon"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleAutoPlay}
                      variant="outline"
                      size="icon"
                      title={isPlaying ? 'Pause' : 'Auto-play'}
                    >
                      <Play className={`w-4 h-4 ${isPlaying ? 'fill-primary' : ''}`} />
                    </Button>
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={currentStep === totalSteps - 1 || isPlaying}
                    className="px-6"
                  >
                    Next →
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {steps.map((step, idx) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        setCurrentStep(idx);
                        if (step.action) step.action();
                      }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        idx === currentStep 
                          ? 'bg-primary w-8' 
                          : 'bg-muted hover:bg-primary/50'
                      }`}
                      aria-label={`Go to step ${idx + 1}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {selectedRole === 'rider' ? 'Rider' : 'Driver'} Flow
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(null);
                      handleReset();
                    }}
                  >
                    Change Role
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center space-y-1">
                  <DollarSign className="w-6 h-6 mx-auto text-primary" />
                  <p className="text-2xl font-bold">$18.50</p>
                  <p className="text-xs text-muted-foreground">Avg Ride Fare</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center space-y-1">
                  <Clock className="w-6 h-6 mx-auto text-primary" />
                  <p className="text-2xl font-bold">3 min</p>
                  <p className="text-xs text-muted-foreground">Avg Pickup</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center space-y-1">
                  <Star className="w-6 h-6 mx-auto text-primary" />
                  <p className="text-2xl font-bold">4.8★</p>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </CardContent>
              </Card>
            </div>

            {/* Back to App */}
            <div className="text-center">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Back to App
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}