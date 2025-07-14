import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { ViewHeader } from './ViewHeader';
import { Card } from './Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Dumbbell, Utensils, Target, Award, Flame, Activity, Trophy, Zap } from 'lucide-react';

interface AnalyticsProps {
  setView: (view: string) => void;
}

interface WorkoutData {
  id: string;
  date: string;
  exercises: Record<string, Array<{ weight: string; reps: string }>>;
  totalExercises: number;
  createdAt: any;
}

interface DietData {
  id: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  meals: Array<{ name: string; calories: number; protein: number }>;
}

interface ProgressData {
  id: string;
  date: string;
  weight: number;
}

interface ChartDataPoint {
  date: string;
  exercises?: number;
  volume?: number;
  calories?: number;
  protein?: number;
  calorieTarget?: number;
  proteinTarget?: number;
}

interface MuscleGroupData {
  name: string;
  value: number;
  percentage: number;
}
const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6'];

export const Analytics: React.FC<AnalyticsProps> = ({ setView }) => {
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([]);
  const [dietData, setDietData] = useState<DietData[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const { getUserId } = useAuth();
  const { theme } = useTheme();
  const userId = getUserId();

  useEffect(() => {
    if (!userId) return;

    // Fetch workout data
    const workoutQuery = query(
      collection(db, `artifacts/${appId}/users/${userId}/workoutLogs`),
      orderBy('date', 'desc')
    );
    const unsubWorkout = onSnapshot(workoutQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WorkoutData));
      setWorkoutData(data);
    });

    // Fetch diet data
    const dietQuery = query(
      collection(db, `artifacts/${appId}/users/${userId}/dietLogs`),
      orderBy('date', 'desc')
    );
    const unsubDiet = onSnapshot(dietQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DietData));
      setDietData(data);
    });

    // Fetch progress data
    const progressQuery = query(
      collection(db, `artifacts/${appId}/users/${userId}/progress`),
      orderBy('date', 'desc')
    );
    const unsubProgress = onSnapshot(progressQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProgressData));
      setProgressData(data);
    });

    return () => {
      unsubWorkout();
      unsubDiet();
      unsubProgress();
    };
  }, [userId]);

  const filterDataByTimeRange = (data: any[]) => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const filteredWorkouts = filterDataByTimeRange(workoutData);
  const filteredDiet = filterDataByTimeRange(dietData);

  // Calculate stats
  const totalWorkouts = filteredWorkouts.length;
  const avgCaloriesPerDay = filteredDiet.length > 0 
    ? Math.round(filteredDiet.reduce((sum, day) => sum + day.totalCalories, 0) / filteredDiet.length)
    : 0;
  const avgProteinPerDay = filteredDiet.length > 0 
    ? Math.round(filteredDiet.reduce((sum, day) => sum + day.totalProtein, 0) / filteredDiet.length)
    : 0;
  const weightChange = progressData.length > 1 
    ? Number((progressData[0].weight - progressData[progressData.length - 1].weight).toFixed(1))
    : 0;

  // Prepare chart data
  const workoutFrequencyData: ChartDataPoint[] = filteredWorkouts.map(workout => ({
    date: new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    exercises: workout.totalExercises || 0,
    volume: Object.values(workout.exercises || {}).reduce((total: number, sets: Array<{ weight: string; reps: string }>) => {
      return total + sets.reduce((setTotal: number, set: { weight: string; reps: string }) => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseFloat(set.reps) || 0;
        return setTotal + (weight * reps);
      }, 0);
    }, 0)
  })).reverse();

  const nutritionTrendData: ChartDataPoint[] = filteredDiet.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    calories: day.totalCalories,
    protein: day.totalProtein,
    calorieTarget: 2300,
    proteinTarget: 100
  })).reverse();

  // Muscle group distribution
  const muscleGroupData: Record<string, number> = filteredWorkouts.reduce((acc: Record<string, number>, workout) => {
    Object.keys(workout.exercises || {}).forEach(exerciseName => {
      // Simple muscle group detection based on exercise name
      let group = 'Other';
      const name = exerciseName.toLowerCase();
      if (name.includes('chest') || name.includes('push') || name.includes('press')) group = 'Chest';
      else if (name.includes('shoulder') || name.includes('lateral') || name.includes('overhead')) group = 'Shoulders';
      else if (name.includes('bicep') || name.includes('curl') || name.includes('arm')) group = 'Arms';
      else if (name.includes('abs') || name.includes('core') || name.includes('plank')) group = 'Core';
      else if (name.includes('back') || name.includes('row') || name.includes('pull')) group = 'Back';
      
      acc[group] = (acc[group] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const muscleGroupChartData: MuscleGroupData[] = Object.entries(muscleGroupData).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / Object.values(muscleGroupData).reduce((a, b) => a + b, 0)) * 100)
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <ViewHeader title="Fitness Analytics" setView={setView} />

      {/* Time Range Selector */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <Card className="p-2 w-full max-w-md">
          <div className="grid grid-cols-3 gap-1">
            {(['week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <Dumbbell className="text-white" size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-red-500 mb-1">{totalWorkouts}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Workouts</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <Flame className="text-white" size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-orange-500 mb-1">{avgCaloriesPerDay}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Avg Calories</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
              <Target className="text-white" size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-sky-500 mb-1">{avgProteinPerDay}g</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Avg Protein</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-purple-500 mb-1">
            {weightChange > 0 ? '+' : ''}{weightChange}kg
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Weight Change</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workout Volume Chart */}
        <Card className="p-8">
          <h3 className="text-2xl font-semibold mb-6 flex items-center text-gray-900 dark:text-white">
            <Activity className="mr-2 sm:mr-3 text-red-400" size={20} />
            Workout Volume
          </h3>
          {workoutFrequencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workoutFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#4A5568" : "#E5E7EB"} />
                <XAxis dataKey="date" stroke={theme === 'dark' ? "#A0AEC0" : "#6B7280"} tick={{ fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? "#A0AEC0" : "#6B7280"} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#2D3748' : '#FFFFFF',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000',
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="volume" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No workout data available</p>
            </div>
          )}
        </Card>

        {/* Nutrition Trend Chart */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h3 className="text-lg sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center text-white">
            <Utensils className="mr-2 sm:mr-3 text-sky-400" size={20} />
            Nutrition Trends
          </h3>
          {nutritionTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={nutritionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 10 }} />
                <YAxis stroke="#A0AEC0" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2D3748', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="calories" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="protein" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 sm:py-16 text-gray-400">
              <Utensils className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No nutrition data available</p>
            </div>
          )}
        </div>

        {/* Muscle Group Distribution */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h3 className="text-lg sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center text-white">
            <Trophy className="mr-2 sm:mr-3 text-yellow-400" size={20} />
            Muscle Groups
          </h3>
          {muscleGroupChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={muscleGroupChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry: MuscleGroupData) => `${entry.name} ${entry.percentage}%`}
                >
                  {muscleGroupChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2D3748', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 sm:py-16 text-gray-400">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No exercise data available</p>
            </div>
          )}
        </div>

        {/* Achievement Summary */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h3 className="text-lg sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center text-white">
            <Award className="mr-2 sm:mr-3 text-green-400" size={20} />
            Achievements
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {totalWorkouts >= 1 && (
              <div className="flex items-center p-3 sm:p-4 bg-green-900/30 rounded-xl border border-green-700">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <Zap className="text-white" size={16} />
                </div>
                <div>
                  <p className="font-semibold text-green-400 text-sm sm:text-base">First Workout!</p>
                  <p className="text-green-200 text-xs sm:text-sm">Journey started</p>
                </div>
              </div>
            )}
            
            {totalWorkouts >= 5 && (
              <div className="flex items-center p-3 sm:p-4 bg-blue-900/30 rounded-xl border border-blue-700">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <Target className="text-white" size={16} />
                </div>
                <div>
                  <p className="font-semibold text-blue-400 text-sm sm:text-base">Consistency!</p>
                  <p className="text-blue-200 text-xs sm:text-sm">5 workouts done</p>
                </div>
              </div>
            )}
            
            {filteredDiet.length >= 7 && (
              <div className="flex items-center p-3 sm:p-4 bg-orange-900/30 rounded-xl border border-orange-700">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <Utensils className="text-white" size={16} />
                </div>
                <div>
                  <p className="font-semibold text-orange-400 text-sm sm:text-base">Nutrition Tracker!</p>
                  <p className="text-orange-200 text-xs sm:text-sm">7 days logged</p>
                </div>
              </div>
            )}

            {totalWorkouts === 0 && filteredDiet.length === 0 && progressData.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-400">
                <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Start logging to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};