import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { Utensils, Dumbbell, TrendingUp, CheckCircle, Target, Flame, Activity, BarChart3, Database } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface DashboardProps {
  setView: (view: string) => void;
  userId: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView, userId }) => {
  const [todayLog, setTodayLog] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'offline' | 'error'>('connected');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!userId) {
      console.log('⚠️ No user ID available for Dashboard');
      return;
    }

    console.log('🔄 Setting up Dashboard listeners for user:', userId);
    console.log('📅 Today\'s date:', today);

    try {
      // Diet data listener
      const dietQuery = query(
        collection(db, `artifacts/${appId}/users/${userId}/dietLogs`), 
        where("date", "==", today)
      );
      
      const unsubDiet = onSnapshot(dietQuery, (snapshot) => {
        console.log('🍽️ Diet snapshot received:', snapshot.size, 'documents');
        if (!snapshot.empty) {
          const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          console.log('✅ Today\'s diet data:', data);
          setTodayLog(data);
        } else {
          console.log('📭 No diet data for today');
          setTodayLog(null);
        }
        setConnectionStatus('connected');
      }, (error) => {
        console.error('❌ Diet listener error:', error);
        setConnectionStatus('error');
      });

      // Workout data listener
      const workoutQuery = query(
        collection(db, `artifacts/${appId}/users/${userId}/workoutLogs`), 
        where("date", "==", today)
      );
      
      const unsubWorkout = onSnapshot(workoutQuery, (snapshot) => {
        console.log('💪 Workout snapshot received:', snapshot.size, 'documents');
        if (!snapshot.empty) {
          const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          console.log('✅ Today\'s workout data:', data);
          setTodayWorkout(data);
        } else {
          console.log('📭 No workout data for today');
          setTodayWorkout(null);
        }
        setConnectionStatus('connected');
      }, (error) => {
        console.error('❌ Workout listener error:', error);
        setConnectionStatus('error');
      });

      return () => {
        console.log('🔄 Cleaning up Dashboard listeners');
        unsubDiet();
        unsubWorkout();
      };
    } catch (error) {
      console.error('❌ Error setting up Dashboard listeners:', error);
      setConnectionStatus('error');
    }
  }, [userId, today]);

  const calorieTarget = 2300;
  const proteinTarget = 100;
  const caloriesConsumed = todayLog?.totalCalories || 0;
  const proteinConsumed = todayLog?.totalProtein || 0;

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      <header className="text-center mb-8 sm:mb-12 px-4 relative">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-3 sm:mb-4">
          My 3-Month Transformation
        </h1>
        <p className="text-gray-400 text-base sm:text-lg mb-2">Your personal dashboard for accountability and results</p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Activity size={14} />
            <span>User ID: {userId}</span>
          <div className={`w-2 h-2 rounded-full ml-2 ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'offline' ? 'bg-yellow-500' : 'bg-red-500'
            }`} title={`Firebase: ${connectionStatus}`}></div>
        </div>
      </header>

      {/* Connection Status Banner */}
      {connectionStatus !== 'connected' && (
        <div className={`mx-4 sm:mx-0 p-4 rounded-xl border ${
          connectionStatus === 'offline' 
            ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300' 
            : 'bg-red-900/50 border-red-700 text-red-300'
        }`}>
          <div className="flex items-center">
            <Database className="mr-2" size={16} />
            <span className="text-sm">
              {connectionStatus === 'offline' 
                ? 'Working offline - data will sync when connection is restored' 
                : 'Connection issue - some data may not be up to date'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 px-4 sm:px-0">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center">
            <Utensils className="mr-3 text-red-400" size={24} />
            Today's Nutrition
          </h2>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex justify-between items-baseline mb-2 sm:mb-3">
                <span className="font-medium text-gray-300 flex items-center text-sm sm:text-base">
                  <Flame className="mr-2 text-orange-400" size={16} />
                  Calories
                </span>
                <span className="font-bold text-lg sm:text-xl text-red-400">
                  {caloriesConsumed} / {calorieTarget} kcal
                </span>
              </div>
              <ProgressBar 
                current={caloriesConsumed} 
                target={calorieTarget} 
                color="bg-gradient-to-r from-red-500 to-red-600"
                size="lg"
              />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-2 sm:mb-3">
                <span className="font-medium text-gray-300 flex items-center text-sm sm:text-base">
                  <Target className="mr-2 text-sky-400" size={16} />
                  Protein
                </span>
                <span className="font-bold text-lg sm:text-xl text-sky-400">
                  {proteinConsumed} / {proteinTarget} g
                </span>
              </div>
              <ProgressBar 
                current={proteinConsumed} 
                target={proteinTarget} 
                color="bg-gradient-to-r from-sky-500 to-sky-600"
                size="lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 flex flex-col justify-center">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center">
            <Dumbbell className="mr-3 text-red-400" size={24} />
            Today's Workout
          </h2>
          {todayWorkout ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-4 animate-pulse" />
              <p className="text-xl sm:text-2xl font-bold mb-2 text-green-400">Workout Complete!</p>
              <p className="text-gray-400 text-base sm:text-lg">Awesome job. Rest and recover.</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Target className="text-white" size={28} />
              </div>
              <p className="text-xl sm:text-2xl font-bold mb-2 text-red-400">Ready to Train</p>
              <p className="text-gray-400 text-base sm:text-lg">Time to build muscle. Let's go!</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-0">
        {[
          { 
            title: 'Log Workout', 
            icon: Dumbbell, 
            view: 'workout', 
            gradient: 'from-red-600 to-red-700',
            hoverGradient: 'from-red-700 to-red-800'
          },
          { 
            title: 'Log Meal', 
            icon: Utensils, 
            view: 'diet', 
            gradient: 'from-sky-600 to-sky-700',
            hoverGradient: 'from-sky-700 to-sky-800'
          },
          { 
            title: 'Track Progress', 
            icon: TrendingUp, 
            view: 'progress', 
            gradient: 'from-purple-600 to-purple-700',
            hoverGradient: 'from-purple-700 to-purple-800'
          },
          { 
            title: 'View Analytics', 
            icon: BarChart3, 
            view: 'analytics', 
            gradient: 'from-green-600 to-green-700',
            hoverGradient: 'from-green-700 to-green-800'
          }
        ].map((action) => (
          <button
            key={action.view}
            onClick={() => setView(action.view)}
            className={`bg-gradient-to-r ${action.gradient} hover:${action.hoverGradient} text-white font-bold py-4 sm:py-6 px-4 sm:px-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center text-base sm:text-lg group`}
          >
            <action.icon className="mr-2 sm:mr-3 group-hover:rotate-12 transition-transform duration-300" size={20} />
            <span className="text-sm sm:text-base">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};