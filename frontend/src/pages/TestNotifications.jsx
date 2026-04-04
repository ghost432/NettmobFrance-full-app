import { TestNotificationCard } from '@/components/TestNotificationCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const TestNotifications = () => {
  useDocumentTitle('Test - Carte Notifications');
  
  return <TestNotificationCard />;
};

export default TestNotifications;
