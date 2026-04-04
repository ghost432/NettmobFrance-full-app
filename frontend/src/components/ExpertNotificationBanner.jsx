import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useExpertNotifications } from '@/hooks/useExpertNotifications';

/**
 * Bannière discrète pour activer les notifications
 */
export default function ExpertNotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const {
    isEnabled,
    isLoading,
    isSupported,
    requestPermission,
  } = useExpertNotifications();

  useEffect(() => {
    const dismissed = localStorage.getItem('expert-notifications-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }
    if (!isLoading && isSupported && !isEnabled) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isLoading, isSupported, isEnabled]);

  const handleActivate = async () => {
    const ok = await requestPermission();
    if (ok) setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('expert-notifications-dismissed', 'true');
  };

  if (!isSupported || !isVisible || isDismissed || isLoading) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 mx-4 mt-3 rounded-lg text-sm">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <span>Activez les notifications pour recevoir vos missions et candidatures.</span>
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <button
          onClick={handleActivate}
          className="bg-blue-600 text-white px-3 py-1 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          Activer
        </button>
        <button
          onClick={handleDismiss}
          className="text-blue-400 hover:text-blue-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
