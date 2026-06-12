# Push Notifications Setup Guide

## Overview
Dip Out now supports mobile push notifications for both Android and iPhone using OneSignal. Users receive real-time alerts for:
- Ride requests (drivers)
- Driver arrival (riders)
- Trip status updates
- Promotional offers

## What's Been Added

### Frontend Components
- `hooks/usePushNotifications.js` - OneSignal initialization hook
- `components/notifications/NotificationPermissionBanner.jsx` - Permission request banner
- `components/notifications/NotificationGuide.jsx` - User education modal

### Backend Function
- `functions/sendPushNotification.js` - Send push notifications via OneSignal API

### Integration
- Rider App: Notification permission banner on booking screen
- Driver App: Already has browser notifications for ride requests

## Setup Instructions

### Step 1: Create OneSignal Account
1. Go to https://onesignal.com
2. Sign up for a free account
3. Create a new app
4. Select "Web Push" as the platform
5. Choose "Typical Setup" (custom code)

### Step 2: Configure OneSignal
In OneSignal dashboard:
1. Go to **Settings** → **Keys & IDs**
2. Copy your **App ID** 
3. Copy your **REST API Key**

### Step 3: Add Credentials to Base44
1. Go to Base44 Dashboard → Settings → Secrets
2. Add these secrets:
   - `ONESIGNAL_APP_ID` - Your OneSignal App ID
   - `ONESIGNAL_API_KEY` - Your OneSignal REST API Key

### Step 4: Configure Web Push in OneSignal
In OneSignal dashboard:
1. Go to **Settings** → **Web Push Setup**
2. Set your site URL (your app's domain)
3. Upload your app icon (512x512px recommended)
4. Configure notification sound (optional)
5. Save settings

### Step 5: Test Notifications
1. Open your app
2. Click "Enable" on the notification banner
3. Allow notifications when prompted
4. Test by sending a notification via OneSignal dashboard

## Usage

### For Riders
When riders open the app:
- They see a notification permission banner
- Clicking "Enable" requests browser permission
- Once enabled, they receive:
  - Driver assigned notifications
  - Driver arrival alerts
  - Trip started/completed updates
  - Payment reminders

### For Drivers
Drivers already have notifications enabled:
- New ride request alerts (with sound)
- Browser notifications for each request
- Real-time updates via entity subscriptions

## Sending Notifications

### Via OneSignal Dashboard
1. Go to **Messages** → **New Message**
2. Select "Push Notification"
3. Choose audience (all users or segments)
4. Write title and message
5. Add custom data (optional)
6. Send or schedule

### Via Backend Function
```javascript
// From your frontend
const response = await base44.functions.invoke('sendPushNotification', {
  title: 'Ride Request!',
  message: 'New ride available - $12.50 earnings',
  data: {
    ride_id: 'ride_123',
    type: 'ride_request'
  },
  player_ids: ['driver@email.com'] // Target specific users
});
```

### User Targeting
OneSignal supports multiple targeting methods:
- **All users**: Broadcast to everyone
- **By email**: Use `external_id` alias with user email
- **By segment**: Create segments in OneSignal dashboard
- **By tags**: Tag users based on behavior

## Best Practices

### 1. Permission Timing
- Ask for permission after user sees value
- Don't ask immediately on page load
- Explain benefits before requesting

### 2. Notification Content
- Keep messages short and clear
- Use emojis sparingly (🚗 ✅ ⭐)
- Include actionable information
- Personalize when possible

### 3. Frequency
- Don't spam users
- Only send important updates
- Respect quiet hours (10pm - 8am)
- Allow users to opt-out

### 4. Testing
- Test on both Android and iPhone
- Verify notifications work in background
- Check notification sound
- Test deep links (tap to open specific screen)

## Troubleshooting

### Notifications Not Showing
**Check:**
1. User granted permission
2. OneSignal App ID is correct
3. API key is valid
4. User is subscribed in OneSignal dashboard

### Permission Denied
**Solution:**
- Users must manually enable in browser settings
- Chrome: Settings → Privacy → Site Settings → Notifications
- Safari: Settings → Notifications → Your Site

### iOS Specific Issues
**Requirements:**
- Must be served over HTTPS
- iOS 16.4+ required for web push
- Add to home screen for best experience

### Android Specific Issues
**Check:**
- Chrome/Firefox supports web push
- Battery optimization not blocking
- Background data enabled

## Advanced Features

### Rich Notifications
Add images, buttons, and actions:
```javascript
const notification = {
  app_id: appId,
  contents: { en: 'Message' },
  headings: { en: 'Title' },
  ios_attachments: { id: 'image_url' },
  android_channel_id: 'high_priority',
  buttons: [
    { id: 'accept', text: 'Accept Ride' },
    { id: 'decline', text: 'Decline' }
  ]
};
```

### Deep Linking
Open specific screens when tapped:
```javascript
data: {
  url: '/rides?ride_id=123',
  ride_id: '123',
  action: 'view_ride'
}
```

### Scheduled Notifications
Send at specific times:
```javascript
const notification = {
  // ... other fields
  send_after: new Date('2024-01-15T10:00:00Z').toISOString()
};
```

### A/B Testing
Test different messages:
1. Create variant A and B in OneSignal
2. Split audience 50/50
3. Measure engagement rates
4. Send winner to remaining users

## Analytics & Metrics

Track in OneSignal dashboard:
- **Delivery rate**: % successfully sent
- **Open rate**: % users who tapped
- **Click rate**: % who completed action
- **Unsubscribes**: Users who opted out

## Costs

OneSignal Free Tier Includes:
- Unlimited push notifications
- Up to 10,000 web subscribers
- Basic analytics
- Email support

Paid Plans (if needed):
- More subscribers
- Advanced segmentation
- A/B testing
- Priority support

## Security

### API Key Protection
- Never expose API key in frontend code
- Always send via backend function
- Rotate keys periodically
- Monitor usage in dashboard

### User Privacy
- Only send relevant notifications
- Allow easy opt-out
- Comply with GDPR/CCPA
- Don't share user data

## Production Checklist

Before going live:
- [ ] Test on multiple devices
- [ ] Verify iOS and Android compatibility
- [ ] Set up production OneSignal app
- [ ] Update App ID and API key
- [ ] Configure proper app icons
- [ ] Test deep links
- [ ] Set up analytics tracking
- [ ] Create notification templates
- [ ] Document notification types
- [ ] Train support team

## Support Resources

- OneSignal Docs: https://docs.onesignal.com
- Web Push Guide: https://web.dev/push-notifications
- OneSignal Support: https://onesignal.com/support

## Next Steps

1. Set up OneSignal account
2. Add credentials to Base44
3. Test with small user group
4. Monitor engagement metrics
5. Iterate based on feedback
6. Scale to all users