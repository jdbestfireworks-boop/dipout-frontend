# Push Notifications Setup Guide

## Overview
Dip Out now supports mobile push notifications for both Android and iPhone using OneSignal. This guide will help you configure and test push notifications.

## Prerequisites
- OneSignal account (free tier available)
- Published app URL (push notifications work best in production)

## OneSignal Setup Steps

### 1. Create OneSignal Account
1. Go to [https://onesignal.com](https://onesignal.com)
2. Sign up for a free account
3. Create a new app

### 2. Configure App Type
When creating your OneSignal app:
- Select **"Website"** as the platform
- Choose **"Typical Site"** integration
- Select **"Service Worker"** implementation

### 3. Get Your Credentials
After creating the app, you'll find:
- **App ID** (in OneSignal dashboard → Settings)
- **REST API Key** (in OneSignal dashboard → Settings → Keys)

### 4. Add Credentials to Base44
1. Go to Base44 Dashboard → Settings → Secrets
2. Add these secrets:
   - `ONESIGNAL_APP_ID` - Your OneSignal App ID
   - `ONESIGNAL_API_KEY` - Your OneSignal REST API Key

### 5. Configure Site URL
In OneSignal dashboard:
- Go to Settings → Site URL
- Enter your published app URL (e.g., `https://your-app.base44.app`)

### 6. Enable HTTPS
Push notifications require HTTPS:
- Base44 apps automatically use HTTPS when published
- Local testing works with `localhost`

## Features

### Rider Notifications
- Ride request confirmation
- Driver assigned
- Driver arriving
- Trip started
- Trip completed
- Payment reminders

### Driver Notifications
- New ride requests (with sound alert)
- Ride acceptance confirmation
- Surge zone alerts
- Earnings updates

## Testing Push Notifications

### Test as Rider
1. Open the rider app (`/rider`)
2. Click "Enable" on the notification banner
3. Allow browser notifications when prompted
4. Book a test ride
5. You'll receive notifications for each ride status change

### Test as Driver
1. Open the driver app (`/driver`)
2. Complete driver registration
3. Click "Enable" on the notification banner
4. Allow browser notifications
5. Go online
6. You'll receive ride request notifications with sound alerts

## Browser Support
- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iPhone & Mac)
- ✅ Firefox (Desktop)
- ⚠️ Some browsers may require the app to be installed as PWA

## PWA Installation (Recommended)

### Android
1. Open app in Chrome
2. Tap menu (⋮) → "Install app"
3. Add to home screen
4. Notifications work automatically

### iPhone (iOS 16.4+)
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Add the app
5. Enable notifications when prompted

## Troubleshooting

### Notifications Not Showing
1. Check browser notification permissions
2. Verify OneSignal credentials are set
3. Ensure app is served over HTTPS
4. Check OneSignal dashboard for delivery stats

### Sound Not Playing (Driver App)
- Browser may block autoplay - user must interact with page first
- Try clicking anywhere on the page first
- Check browser audio permissions

### iOS Issues
- iOS requires app to be added to home screen
- Minimum iOS version: 16.4
- Use Safari for best compatibility

## Backend Function

The `sendPushNotification` function is available for sending notifications:

```javascript
await base44.functions.invoke('sendPushNotification', {
  title: 'Ride Update',
  message: 'Your driver has arrived!',
  data: { ride_id: '123', type: 'driver_arrived' }
});
```

## OneSignal Dashboard Features

- View notification delivery stats
- Segment users by behavior
- Schedule campaigns
- A/B test messages
- Track engagement metrics

## Production Tips

1. **Test thoroughly** before going live
2. **Monitor delivery rates** in OneSignal dashboard
3. **Respect user preferences** - don't spam
4. **Use meaningful notifications** - only send important updates
5. **Localize messages** for different regions if needed

## Support

For OneSignal-specific issues:
- Documentation: https://docs.onesignal.com
- Support: https://onesignal.com/support

For app-specific issues:
- Check Base44 dashboard logs
- Review function logs in `sendPushNotification