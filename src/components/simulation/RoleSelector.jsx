import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Car } from 'lucide-react';

export default function RoleSelector({ onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
      <Card 
        className="cursor-pointer hover:border-primary transition-all hover:shadow-lg" 
        onClick={() => onSelect('rider')}
      >
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
      <Card 
        className="cursor-pointer hover:border-primary transition-all hover:shadow-lg" 
        onClick={() => onSelect('driver')}
      >
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
  );
}