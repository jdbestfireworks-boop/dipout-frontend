import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, Clock, Star, Play, RotateCcw, ArrowRight, Sparkles,
  User, Car, CheckCircle2, ChevronRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ScenarioSelector from '@/components/simulation/ScenarioSelector';
import { LocationInput, RideRequest, FindingDriver, DriverAssigned, TripInProgress } from '@/components/simulation/RiderSteps';
import { GoOnline, RideRequestCard, NavigateToPickup, ActiveTrip, TripComplete } from '@/components/simulation/DriverSteps';

const SCENARIOS = {
  rider: {
    title: 'Rider Experience',
    icon: User,
    steps: [
      {
        title: 'Open the App',
        description: 'Sarah needs a ride to the airport. She opens Dip Out on her phone.',
        visual: (
          <div className="bg-card rounded-xl border border-border p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center mx-auto">
              <Car className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Dip Out</h3>
              <p className="text-sm text-muted-foreground">Simple, affordable rides</p>
            </div>
            <Button className="w-full max-w-xs">Book a Ride</Button>
          </div>
        ),
        action: () => toast.info('📱 App opened - Ready to book a ride')
      },
      {
        title: 'Enter Locations',
        description: 'Sarah enters her pickup location (123 Main St) and destination (Airport).',
        visual: <LocationInput pickup="123 Main St, Lafayette, LA" destination="Airport Terminal" />,
        action: () => toast.info('📍 Locations entered')
      },
      {
        title: 'Get Fare Estimate',
        description: 'AI calculates the fare based on distance, demand, and current traffic.',
        visual: <RideRequest fare="$32.50" distance="18.2 mi" surge={1.2} />,
        action: () => toast.success('💰 Fare calculated: $32.50 (1.2x surge)')
      },
      {
        title: 'Request Ride',
        description: 'Sarah selects card payment and requests the ride.',
        visual: <FindingDriver />,
        action: async () => {
          toast.loading('🚗 Finding your driver...', { duration: 2000 });
          setTimeout(() => toast.success('✓ Driver found!'), 2000);
        }
      },
      {
        title: 'Driver Assigned',
        description: 'Mike accepts the ride. Sarah can track his location in real-time.',
        visual: <DriverAssigned name="Mike" rating="4.8" vehicle="Toyota Camry" plate="ABC-123" eta="3 min" />,
        action: () => toast.success('🚙 Mike (4.8★) is on the way')
      },
      {
        title: 'Trip In Progress',
        description: 'Sarah is on her way to the airport. She can track the route.',
        visual: <TripInProgress destination="Airport Terminal" distance="18.2 mi" fare="$32.50" />,
        action: () => toast.info('🛣️ Trip in progress to airport')
      },
      {
        title: 'Complete & Pay',
        description: 'Sarah rates Mike 5 stars and completes payment.',
        visual: (
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-8 h-8 fill-primary text-primary" />
              ))}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">$32.50</p>
              <p className="text-sm text-muted-foreground">Payment: Card</p>
            </div>
            <Button className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm & Pay
            </Button>
          </div>
        ),
        action: () => toast.success('⭐ Trip complete! Payment processed')
      }
    ]
  },
  driver: {
    title: 'Driver Experience',
    icon: Car,
    steps: [
      {
        title: 'Go Online',
        description: 'Mike toggles online to start receiving ride requests.',
        visual: <GoOnline />,
        action: () => toast.success('✓ You\'re now online!')
      },
      {
        title: 'Receive Request',
        description: 'Mike receives a ride request to the airport. He reviews the details.',
        visual: <RideRequestCard earnings="$26.00" pickup="123 Main St" dropoff="Airport Terminal" distance="18.2 mi" />,
        action: () => toast.info('🔔 New ride request: $26.00 earnings')
      },
      {
        title: 'Accept & Navigate',
        description: 'Mike accepts the ride and navigates to pick up Sarah.',
        visual: <NavigateToPickup riderName="Sarah" rating="4.9" address="123 Main St" distance="0.8 mi" />,
        action: () => toast.success('✓ Ride accepted! Navigate to pickup')
      },
      {
        title: 'Start Trip',
        description: 'Mike picks up Sarah and starts the trip.',
        visual: <ActiveTrip status="In Progress" fare="$32.50" destination="Airport Terminal" distance="18.2 mi" />,
        action: () => toast.success('🚗 Trip started')
      },
      {
        title: 'Complete & Earn',
        description: 'Mike drops off Sarah and completes the trip to get paid.',
        visual: <TripComplete earnings="$26.00" rating="5-star rating received!" />,
        action: () => toast.success('💰 Trip complete! You earned $26.00')
      }
    ]
  }
};

export default function SimulationGuide() {
  const [activeScenario, setActiveScenario] = useState('rider');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoplayRef = useRef(null);

  const currentScenario = SCENARIOS[activeScenario];

  useEffect(() => {
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, []);

  const handleNext = () => {
    if (currentStep < currentScenario.steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (currentScenario.steps[nextStep]?.action) {
        currentScenario.steps[nextStep].action();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
        if (prev < currentScenario.steps.length - 1) {
          const nextStep = prev + 1;
          if (currentScenario.steps[nextStep]?.action) {
            currentScenario.steps[nextStep].action();
          }
          return nextStep;
        }
        setIsPlaying(false);
        if (autoplayRef.current) clearInterval(autoplayRef.current);
        return prev;
      });
    }, 3000);
  };

  const handleScenarioSelect = (scenario) => {
    setActiveScenario(scenario);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-display font-bold flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            How Dip Out Works
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Interactive simulation showing the complete rider and driver experience
          </p>
        </div>

        {/* Scenario Selector */}
        <ScenarioSelector
          scenarios={SCENARIOS}
          activeScenario={activeScenario}
          onSelect={handleScenarioSelect}
        />

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{currentStep + 1} / {currentScenario.steps.length}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / currentScenario.steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardContent className="pt-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">{currentScenario.steps[currentStep].title}</h2>
                  <p className="text-muted-foreground">{currentScenario.steps[currentStep].description}</p>
                </div>
                {currentScenario.steps[currentStep].visual}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                className="px-6"
              >
                ← Previous
              </Button>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentStep(0)}
                  variant="outline"
                  size="icon"
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleAutoPlay}
                  variant="outline"
                  size="icon"
                  title={isPlaying ? 'Pause' : 'Auto-play'}
                >
                  {isPlaying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <Button
                onClick={handleNext}
                disabled={currentStep === currentScenario.steps.length - 1}
                className="px-6"
              >
                Next →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step Indicators */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {currentScenario.steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentStep(idx);
                    step.action();
                  }}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentStep
                      ? 'bg-primary w-8'
                      : 'bg-muted hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center space-y-1">
              <DollarSign className="w-6 h-6 mx-auto text-primary" />
              <p className="text-2xl font-bold">$32.50</p>
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
      </div>
    </div>
  );
}