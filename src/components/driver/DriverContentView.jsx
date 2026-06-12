import React from 'react';
import { AnimatePresence } from 'framer-motion';
import ActiveTripView from './ActiveTripView';
import HistoryView from './HistoryView';
import RequestsView from './RequestsView';

export default function DriverContentView({
  activeRide,
  showHistory,
  tripHistory,
  profile,
  requests,
  user,
  onStartTrip,
  onCompleteTrip,
  onCancelRide,
  onSelectRide,
  onShowHistory,
  onBackFromHistory,
}) {
  return (
    <AnimatePresence mode="wait">
      {activeRide ? (
        <ActiveTripView
          key="active"
          ride={activeRide}
          user={user}
          onStartTrip={onStartTrip}
          onCompleteTrip={onCompleteTrip}
          onCancelRide={onCancelRide}
        />
      ) : showHistory ? (
        <HistoryView
          key="history"
          tripHistory={tripHistory}
          user={user}
          onBack={onBackFromHistory}
        />
      ) : (
        <RequestsView
          key="requests"
          profile={profile}
          requests={requests}
          tripHistory={tripHistory}
          user={user}
          onSelectRide={onSelectRide}
          onShowHistory={onShowHistory}
        />
      )}
    </AnimatePresence>
  );
}