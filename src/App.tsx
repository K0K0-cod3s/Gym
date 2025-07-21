import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { WorkoutTracker } from './components/WorkoutTracker';
import { DietTracker } from './components/DietTracker';
import { ProgressTracker } from './components/ProgressTracker';
import { Analytics } from './components/Analytics';
import { SuccessNotification } from './components/SuccessNotification';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";


function App() {
  const [view, setView] = useState('dashboard');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { userId, isAuthReady } = useAuth();

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  const hideSuccessNotification = () => {
    setShowSuccess(false);
    setSuccessMessage('');
  };

  const renderView = () => {
    if (!isAuthReady) {
      return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-white px-4">
          <div className="animate-spin w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-500 border-t-transparent rounded-full mb-6 sm:mb-8"></div>
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Loading Your Dashboard...</h2>
            <p className="text-gray-400 text-sm sm:text-base">Setting up your personalized fitness experience</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'workout': 
        return <WorkoutTracker setView={setView} onSuccess={showSuccessNotification} />;
      case 'diet': 
        return <DietTracker setView={setView} onSuccess={showSuccessNotification} />;
      case 'progress': 
        return <ProgressTracker setView={setView} onSuccess={showSuccessNotification} />;
      case 'analytics':
        return <Analytics setView={setView} />;
      default: 
        return <Dashboard setView={setView} userId={userId} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen font-sans">
          <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
            {renderView()}
          </div>
          
          {/* Success Notification */}
          <SuccessNotification 
            message={successMessage}
            isVisible={showSuccess}
            onClose={hideSuccessNotification}
          />

          <div>
              {/* ... */}
              <SpeedInsights />
          </div>
          
          {/* Subtle background pattern */}
          <div className="fixed inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #ef4444 0%, transparent 50%), 
                               radial-gradient(circle at 75% 75%, #0ea5e9 0%, transparent 50%)`,
              backgroundSize: '100px 100px'
            }}></div>
          </div>
      </div>
        {/* Vercel Analytics */}
        <VercelAnalytics />
    </ThemeProvider>
  );
}

export default App;