import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car, MapPin, User, Shield, CheckCircle2, Clock, DollarSign, 
  Star, Phone, MessageCircle, ArrowRight, Play, RotateCcw, Database, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const scenarios = [
  {
    title: 'Rider Books a Ride',
    icon: User,
    steps: [
      {
        title: 'Sarah opens the app',
        description: 'Sarah needs to get to the airport for her flight. She opens Dip Out and enters her pickup location (123 Main St) and destination (O\'Hare Airport).',
        visual: '📱 Phone screen with address input'
      },
      {
        title: 'AI calculates fare',
        description: 'Our AI pricing engine analyzes distance (28 km), current demand, and traffic. Fare: $45.50 with 1.2x surge due to moderate demand.',
        visual: '💰 Fare estimate: $45.50 (1.2x surge)'
      },
      {
        title: 'Ride requested',
        description: 'Sarah selects card payment and requests the ride. The system broadcasts to nearby drivers.',
        visual: '🚗 Finding your driver...'
      },
      {
        title: 'Driver accepts',
        description: 'Mike, a nearby driver (4.8★, 342 trips), accepts the ride. Sarah sees his location approaching on the map.',
        visual: '✓ Mike is 3 min away'
      }
    ]
  },
  {
    title: 'Driver Completes Trip',
    icon: Car,
    steps: [
      {
        title: 'Mike receives notification',
        description: 'Mike is online and available. He gets a ride request: $45.50 fare, 28 km to airport. He taps Accept.',
        visual: '📲 New Ride Request - $45.50'
      },
      {
        title: 'Picks up rider',
        description: 'Mike navigates to Sarah\'s location, confirms identity, and starts the trip in the app.',
        visual: '🚙 Trip Started - In Progress'
      },
      {
        title: 'Completes ride',
        description: 'After dropping Sarah at O\'Hare, Mike marks the trip complete. He earns $36.40 (80% of fare).',
        visual: '✓ Trip Complete - Earned $36.40'
      },
      {
        title: 'Gets rated',
        description: 'Sarah rates Mike 5 stars and leaves a tip. His rating stays at 4.8★, boosting his visibility for future rides.',
        visual: '⭐ 5-star rating received'
      }
    ]
  },
  {
    title: 'Admin Oversees Operations',
    icon: Shield,
    steps: [
      {
        title: 'Dashboard overview',
        description: 'Admin logs in and sees real-time metrics: $2,847 revenue today, 63 completed rides, 12 drivers online, avg surge 1.3x.',
        visual: '📊 Live Analytics Dashboard'
      },
      {
        title: 'Approves new driver',
        description: 'New driver application from "John D." with license and insurance uploaded. Admin reviews documents and clicks Approve.',
        visual: '✓ Driver Approved - Can now drive'
      },
      {
        title: 'Manages surge zones',
        description: 'High demand detected at downtown area. Admin activates surge zone with 1.5x multiplier to attract more drivers.',
        visual: '🔥 Surge Zone Active: Downtown (1.5x)'
      },
      {
        title: 'Monitors ride quality',
        description: 'Admin checks recent rides table, ensuring all payments processed and monitoring rider/driver satisfaction.',
        visual: '📋 All systems operating normally'
      }
    ]
  }
];

export default function DemoMode() {
  const [activeScenario, setActiveScenario] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const seedDemoData = async () => {
    setSeeding(true);
    try {
      const response = await base44.functions.invoke('seedDemoData', {});
      if (response.data.success) {
        toast.success(`Demo data loaded: ${response.data.drivers} drivers, ${response.data.rides} rides`);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      toast.error('Failed to load demo data - make sure you\'re logged in as admin');
    } finally {
      setSeeding(false);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    let step = 0;
    const interval = setInterval(() => {
      setActiveStep(step);
      step++;
      if (step > scenarios[activeScenario].steps.length) {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 2500);
  };

  const handleReset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-display font-bold">Dip Out - How It Works</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete ride-sharing ecosystem connecting riders, drivers, and administrators
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveScenario(idx);
                setActiveStep(0);
                setIsPlaying(false);
              }}
              className={`p-6 rounded-2xl border-2 transition-all text-left space-y-3 ${
                activeScenario === idx
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <scenario.icon className={`w-8 h-8 ${activeScenario === idx ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <h3 className="font-bold text-lg">{scenario.title}</h3>
                <p className="text-sm text-muted-foreground">{scenario.steps.length} steps</p>
              </div>
            </button>
          ))}
        </div>

        {/* Demo Data Seeder */}
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Quick Demo Setup
                </h3>
                <p className="text-sm text-muted-foreground">
                  Populate the app with sample drivers and rides for your demo
                </p>
              </div>
              <Button 
                onClick={seedDemoData}
                disabled={seeding}
                className="h-12 px-6 rounded-2xl font-semibold"
              >
                {seeding ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                ) : (
                  <><Database className="w-4 h-4 mr-2" /> Load Demo Data</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button 
            onClick={handlePlay} 
            disabled={isPlaying}
            className="h-12 px-8 rounded-2xl font-semibold"
          >
            <Play className="w-4 h-4 mr-2" /> 
            {isPlaying ? 'Playing...' : 'Play Animation'}
          </Button>
          <Button 
            onClick={handleReset} 
            variant="outline"
            className="h-12 px-8 rounded-2xl font-semibold"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> 
            Reset
          </Button>
        </div>

        {/* Steps Display */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {scenarios[activeScenario].steps.map((step, idx) => (
              idx <= activeStep && (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`border-2 transition-all ${
                    idx === activeStep ? 'border-primary bg-primary/5' : 'border-border opacity-60'
                  }`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          idx === activeStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {idx < activeStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                        {idx === activeStep && (
                          <Badge className="ml-auto">
                            <Clock className="w-3 h-3 mr-1" /> Current
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-muted-foreground">{step.description}</p>
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <ArrowRight className="w-4 h-4" />
                        {step.visual}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <DollarSign className="w-8 h-8 mx-auto text-primary" />
              <p className="text-3xl font-bold">$45.50</p>
              <p className="text-sm text-muted-foreground">Average Ride Fare</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Star className="w-8 h-8 mx-auto text-primary" />
              <p className="text-3xl font-bold">4.8</p>
              <p className="text-sm text-muted-foreground">Average Driver Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Phone className="w-8 h-8 mx-auto text-primary" />
              <p className="text-3xl font-bold">3 min</p>
              <p className="text-sm text-muted-foreground">Avg Pickup Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <MessageCircle className="w-8 h-8 mx-auto text-primary" />
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-muted-foreground">Support Available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}