import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageCircle, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminContact() {
  const [searchEmail, setSearchEmail] = useState('');
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'rider' or 'driver'
  const [searching, setSearching] = useState(false);

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setSearching(true);
    try {
      // Search for driver
      const drivers = await base44.entities.DriverProfile.filter({ user_email: searchEmail });
      if (drivers.length > 0) {
        setUser(drivers[0]);
        setUserType('driver');
        return;
      }

      // Search for rider (find by email in rides)
      const rides = await base44.entities.Ride.filter({ rider_email: searchEmail }, '-created_date', 1);
      if (rides.length > 0) {
        setUser({ 
          email: searchEmail,
          phone: rides[0].rider_phone,
          rider_email: searchEmail
        });
        setUserType('rider');
        return;
      }

      toast.error('User not found');
      setUser(null);
      setUserType(null);
    } catch (error) {
      toast.error('Failed to search user');
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') searchUser();
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Contact User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Search for a rider or driver by email to view their contact information
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={handleKey}
              className="flex-1"
            />
            <Button onClick={searchUser} disabled={searching}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {userType === 'driver' ? 'Driver' : 'Rider'} Contact
          </CardTitle>
          <Badge variant="outline" className="capitalize">
            {userType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Email</p>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a href={`mailto:${user.user_email || user.email || user.rider_email}`} className="text-sm text-primary hover:underline flex items-center gap-1">
              {user.user_email || user.email || user.rider_email}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {user.phone && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Phone</p>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a href={`tel:${user.phone}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                {user.phone || 'Not provided'}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {userType === 'driver' && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Vehicle</p>
            <p className="text-sm">{user.vehicle} • {user.plate}</p>
          </div>
        )}

        {userType === 'driver' && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="text-lg font-bold">{user.rating || 'N/A'}★</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trips</p>
              <p className="text-lg font-bold">{user.trips_completed || 0}</p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <Button variant="outline" onClick={() => { setUser(null); setSearchEmail(''); }} className="w-full">
            Search Another User
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}