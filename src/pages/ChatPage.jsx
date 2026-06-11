import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

export default function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [asRider, asDriver] = await Promise.all([
        base44.entities.Ride.filter({ rider_email: me.email }, '-created_date', 20),
        base44.entities.Ride.filter({ driver_email: me.email }, '-created_date', 20),
      ]);
      const allRides = [...asRider, ...asDriver].filter(
        (r) => ['accepted', 'in_progress', 'completed'].includes(r.status)
      );
      const seen = new Set();
      const unique = allRides.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
      unique.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setRides(unique);
      if (unique.length) setSelectedRideId(unique[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedRideId) return;
    base44.entities.RideMessage.filter({ ride_id: selectedRideId }, 'created_date', 100).then(setMessages);

    const unsub = base44.entities.RideMessage.subscribe((event) => {
      if (event.data?.ride_id !== selectedRideId) return;
      if (event.type === 'create') setMessages((prev) => [...prev, event.data]);
    });
    return unsub;
  }, [selectedRideId]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !user || !selectedRideId) return;
    const ride = rides.find((r) => r.id === selectedRideId);
    const role = ride?.rider_email === user.email ? 'rider' : 'driver';
    await base44.entities.RideMessage.create({
      ride_id: selectedRideId,
      sender_email: user.email,
      sender_role: role,
      message: text.trim(),
    });
    setText('');
  };

  const handleKey = (e) => { if (e.key === 'Enter') send(); };

  const selectedRide = rides.find((r) => r.id === selectedRideId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6 gap-4">
        <MessageCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-display font-bold">No conversations yet</h2>
        <p className="text-sm text-muted-foreground">
          Your ride chats will appear here once you have an active or completed trip.
        </p>
        <Link to="/" className="text-primary text-sm font-medium hover:underline">Book a ride →</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Back button header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="font-display font-bold text-lg">Messages</h2>
          <p className="text-xs text-muted-foreground">Your ride conversations</p>
        </div>
      </div>
      {/* Sidebar — ride list */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-card flex-shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-bold text-lg">Messages</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Your ride conversations</p>
        </div>
        <div className="overflow-y-auto max-h-48 md:max-h-[calc(100vh-80px)]">
          {rides.map((r) => {
            const isMe = r.rider_email === user?.email;
            const other = isMe ? r.driver_email : r.rider_email;
            const isSelected = r.id === selectedRideId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRideId(r.id)}
                className={`w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-accent/40 ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
              >
                <p className="text-sm font-medium truncate">{other || 'Driver'}</p>
                <p className="text-xs text-muted-foreground truncate">{r.dropoff_address}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(r.created_date), 'MMM d, yyyy')}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col max-h-screen">
        {/* Chat header */}
        <div className="px-5 py-3.5 border-b border-border bg-card/70 backdrop-blur-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {selectedRide?.rider_email === user?.email ? selectedRide?.driver_email : selectedRide?.rider_email}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
              {selectedRide?.pickup_address} → {selectedRide?.dropoff_address}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-10">No messages yet. Say hi!</p>
          )}
          {messages.map((m) => {
            const isMe = m.sender_email === user?.email;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] space-y-1`}>
                  {!isMe && <p className="text-[10px] text-muted-foreground pl-1 capitalize">{m.sender_role}</p>}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  }`}>
                    {m.message}
                  </div>
                  <p className={`text-[10px] text-muted-foreground ${isMe ? 'text-right' : 'text-left'} px-1`}>
                    {format(new Date(m.created_date), 'h:mm a')}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/70 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              className="flex-1 rounded-xl h-10"
            />
            <Button onClick={send} size="icon" className="h-10 w-10 rounded-xl shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}