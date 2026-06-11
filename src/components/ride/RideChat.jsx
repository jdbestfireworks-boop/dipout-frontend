import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Phone, Send, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RideChat({ ride, myEmail, myRole, otherEmail, driverPhone, riderPhone }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);

  // Use masked phone number (show last 4 digits only)
  const maskPhoneNumber = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return null;
    return '***-***-' + cleaned.slice(-4);
  };

  const myPhone = myRole === 'rider' ? riderPhone : driverPhone;
  const maskedPhone = maskPhoneNumber(myPhone);
  const otherPhone = myRole === 'rider' ? driverPhone : riderPhone;
  const maskedOtherPhone = maskPhoneNumber(otherPhone);
  const hasPhone = otherPhone && otherPhone.trim();

  useEffect(() => {
    if (!ride?.id) return;
    base44.entities.RideMessage.filter({ ride_id: ride.id }, 'created_date', 50)
      .then(setMessages);

    const unsub = base44.entities.RideMessage.subscribe((event) => {
      if (event.data?.ride_id !== ride.id) return;
      if (event.type === 'create') {
        setMessages((prev) => [...prev, event.data]);
        if (!open) setUnread((n) => n + 1);
      }
    });
    return unsub;
  }, [ride?.id]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages]);

  const send = async () => {
    if (!text.trim()) return;
    await base44.entities.RideMessage.create({
      ride_id: ride.id,
      sender_email: myEmail,
      sender_role: myRole,
      message: text.trim(),
    });
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') send();
  };

  return (
    <div className="space-y-2">
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 rounded-xl gap-2 relative"
          onClick={() => setOpen((o) => !o)}
        >
          <MessageCircle className="w-4 h-4" />
          Chat
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </Button>
        {hasPhone ? (
          <a href={`tel:${otherPhone}`} className="flex-1" title="Call (your number is private)">
            <Button variant="outline" className="w-full rounded-xl gap-2">
              <Phone className="w-4 h-4" />
              <span className="text-xs">{maskedOtherPhone || 'Call'}</span>
            </Button>
          </a>
        ) : (
          <div className="flex-1 text-xs text-muted-foreground text-center py-2">
            Phone not available
          </div>
        )}
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-sm font-semibold">
                Chat with your {myRole === 'rider' ? 'driver' : 'rider'}
              </span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-2 p-3 max-h-56 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Say hi!</p>
              )}
              {messages.map((m) => {
                const isMe = m.sender_email === myEmail;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-foreground rounded-bl-sm'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-border">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message…"
                className="flex-1 rounded-xl h-9"
              />
              <Button size="icon" onClick={send} className="h-9 w-9 rounded-xl shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}