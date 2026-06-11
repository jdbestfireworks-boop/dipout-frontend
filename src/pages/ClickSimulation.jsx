import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  MapPin, Navigation, CreditCard, Banknote, Car, User, Star, Phone, 
  MessageCircle, CheckCircle2, Clock, DollarSign, Loader2, Play, 
  RotateCcw, ArrowRight, ChevronRight, Sparkles, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ClickSimulation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); // 'rider' or 'driver'
  const [simulationData, setSimulationData] = useState(null);

  const steps = [
    {
      id: 0,
      role: 'selection',
      title: 'Choose Your Role',
      description: 'Start by selecting whether you want to experience the app as a rider or driver',
      action: null,
      visual: (
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-lg" onClick={() => setSelectedRole('rider')}>
            <CardContent className="pt-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Rider</h3>
                <p className="text-sm text-muted-foreground">Book and track rides</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-lg" onClick={() => setSelectedRole('driver')}>
            <CardContent className="pt-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Driver</h3>
                <p className="text-sm text-muted-foreground">Accept rides & earn</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    // RIDER FLOW
    {
      id: 1,
      role: 'rider',
      title: 'Enter Pickup Location',
      description: 'As a rider, you start by entering where you want to be picked up',
      action: () => {
        toast.info('📍 Pickup location entered: "123 Main St, Lafayette, LA"');
      },
      visual: (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="font-semibold">123 Main St, Lafayette, LA</p>
            </div>
          </div>
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Navigation className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="text-sm">Enter destination...</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      role: 'rider',
      title: 'Enter Destination',
      description: 'Now enter where you want to go',
      action: () => {
        toast.info('🎯 Destination entered: "Cajun Field, Lafayette, LA"');
      },
      visual: (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="font-semibold">123 Main St, Lafayette, LA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="font-semibold">Cajun Field, Lafayette, LA</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      role: 'rider',
      title: 'Get AI Fare Estimate',
      description: 'Our AI calculates the fare based on distance, demand, and time',
      action: () => {
        toast.success('💰 Fare calculated: $18.50 (2.3 miles)');
      },
      visual: (
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Estimated Fare</p>
              <p className="text-3xl font-bold text-primary">$18.50</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-lg font-semibold">2.3 mi</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline">
              <CreditCard className="w-4 h-4 mr-2" /> Card
            </Button>
            <Button className="flex-1" variant="outline">
              <Banknote className="w-4 h-4 mr-2" /> Cash
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 4,
      role: 'rider',
      title: 'Request Ride',
      description: 'Tap to request the ride and find a nearby driver',
      action: async () => {
        toast.loading('🚗 Finding your driver...', { duration: 2000 });
        setTimeout(() => {
          toast.success('✓ Driver found! Mike is 2 min away');
        }, 2000);
      },
      visual: (
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
      role: 'rider',
      title: 'Driver Assigned',
      description: 'A driver has accepted your ride! Track them in real-time',
      action: () => {
        toast.success('🚙 Mike (4.8★) is on the way - Toyota Camry, Plate: ABC-123');
      },
      visual: (
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Mike • 4.8★</p>
              <p className="text-sm text-muted-foreground">Toyota Camry • ABC-123</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Arriving in</p>
              <p className="font-bold text-primary">2 min</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" size="sm">
              <Phone className="w-4 h-4 mr-2" /> Call
            </Button>
            <Button className="flex-1" variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" /> Message
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 6,
      role: 'rider',
      title: 'Trip Complete & Payment',
      description: 'Rate your driver and complete payment',
      action: () => {
        toast.success('⭐ Trip complete! Payment processed: $18.50');
      },
      visual: (
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-8 h-8 fill-primary text-primary" />
            ))}
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">$18.50</p>
            <p className="text-sm text-muted-foreground">Payment: Card</p>
          </div>
          <Button className="w-full">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm & Pay
          </Button>
        </div>
      )
    },
    // DRIVER FLOW
    {
      id: 7,
      role: 'driver',
      title: 'Go Online',
      description: 'As a driver, toggle online to start receiving ride requests',
      action: () => {
        toast.success('✓ You\'re now online! Receiving ride requests...');
      },
      visual: (
        <div className="bg-card rounded-xl border border-border p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-lg font-bold text-green-500">Online</span>
          </div>
          <p className="text-sm text-muted-foreground">You\'ll see ride requests from nearby riders</p>
          <Badge variant="outline" className="text-xs">
            <Zap className="w-3 h-3 mr-1" /> Ready to accept
          </Badge>
        </div>
      )
    },
    {
      id: 8,
      role: 'driver',
      title: 'Receive Ride Request',
      description: 'A nearby rider needs a ride! Review the details and decide',
      action: () => {
        toast.info('🔔 New ride request: $18.50 fare, 2.3 miles');
      },
      visual: (
        <div className="bg-card rounded-xl border-2 border-primary p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Earnings</p>
            <p className="text-2xl font-bold text-primary">$14.80</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-medium text-sm">123 Main St</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Drop-off</p>
                <p className="font-medium text-sm">Cajun Field</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline">Decline</Button>
            <Button className="flex-1 bg-primary">Accept</Button>
          </div>
        </div>
      )
    },
    {
      id: 9,
      role: 'driver',
      title: 'Navigate to Pickup',
      description: 'Accept the ride and navigate to pick up the rider',
      action: () => {
        toast.success('✓ Ride accepted! Navigate to pickup location');
      },
      visual: (
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
            <Navigation className="w-4 h-4 mr-2" /> Navigate to Pickup (0.8 mi)
          </Button>
        </div>
      )
    },
    {
      id: 10,
      role: 'driver',
      title: 'Start Trip',
      description: 'Pick up the rider and start the trip',
      action: () => {
        toast.success('🚗 Trip started - heading to destination');
      },
      visual: (
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-primary/10 text-primary">
              <Clock className="w-3 h-3 mr-1" /> In Progress
            </Badge>
            <p className="text-2xl font-bold text-primary">$18.50</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Navigation className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">To:</p>
                <p className="font-medium text-sm">Cajun Field (2.3 mi)</p>
              </div>
            </div>
          </div>
          <Button className="w-full">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Trip
          </Button>
        </div>
      )
    },
    {
      id: 11,
      role: 'driver',
      title: 'Complete & Earn',
      description: 'Drop off the rider and complete the trip to get paid',
      action: () => {
        toast.success('💰 Trip complete! You earned $14.80');
      },
      visual: (
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
            <div>
              <p className="text-3xl font-bold text-primary">$14.80</p>
              <p className="text-sm text-muted-foreground">Your earnings (80%)</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span className="font-semibold">5-star rating received!</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      // Skip steps that don't match selected role
      if (selectedRole && steps[nextStep].role && steps[nextStep].role !== selectedRole) {
        setCurrentStep(nextStep);
        handleNext();
      } else {
        setCurrentStep(nextStep);
        if (steps[nextStep].action) {
          steps[nextStep].action();
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      if (selectedRole && steps[prevStep].role && steps[prevStep].role !== selectedRole) {
        setCurrentStep(prevStep);
        handlePrevious();
      } else {
        setCurrentStep(prevStep);
      }
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedRole(null);
    setIsPlaying(false);
  };

  const handleAutoPlay = () => {
    setIsPlaying(true);
    let step = currentStep;
    const interval = setInterval(() => {
      if (step < steps.length - 1) {
        step++;
        if (!selectedRole || !steps[step].role || steps[step].role === selectedRole) {
          setCurrentStep(step);
          if (steps[step].action) {
            steps[step].action();
          }
        }
      } else {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 3000);
  };

  const filteredSteps = steps.filter(step => !step.role || step.role === selectedRole || step.role === 'selection');
  const currentStepData = steps[currentStep];

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

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{currentStep + 1} / {filteredSteps.length}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / filteredSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-base">{currentStepData.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData.visual}
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
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleAutoPlay}
                  disabled={isPlaying}
                  variant="outline"
                  size="icon"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleNext}
                disabled={currentStep === steps.length - 1 || isPlaying}
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
              {filteredSteps.map((step, idx) => (
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
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> Rider Flow
              </span>
              <span className="flex items-center gap-1">
                <Car className="w-3 h-3" /> Driver Flow
              </span>
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
      </div>
    </div>
  );
}