import { useEffect } from 'react';
// Note: Deno.env is available in backend functions only
// Frontend should use environment variables from Base44 config

export function usePushNotifications() {
  useEffect(() => {
    // Initialize OneSignal - App ID should be configured in OneSignal dashboard
    const appId = process.env.ONESIGNAL_APP_ID || window.env?.ONESIGNAL_APP_ID;
    
    if (!appId) {
      console.warn('OneSignal App ID not configured');
      return;
    }

    OneSignal.init({
      appId,
      notifyButton: {
        enable: false,
      },
      persistNotification: true,
      allowLocalhostAsSecureOrigin: true,
    }).then(() => {
      console.log('OneSignal initialized');
    });

    // Request permission on mount
    OneSignal.Notifications.requestPermission(true).then((accepted) => {
      console.log('User accepted notifications:', accepted);
    });

    // Set external user ID when user logs in
    OneSignal.login = async (email) => {
      await OneSignal.login(email);
    };

    // Listen for notification clicks
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('Notification clicked:', event);
      // Handle navigation based on notification data
      if (event.notification.additionalData?.ride_id) {
        window.location.href = `/rides?ride_id=${event.notification.additionalData.ride_id}`;
      }
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  const sendNotification = async (title, message, data = {}) => {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, data }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  };

  return { sendNotification };
}