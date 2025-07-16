// import React, { useState, useEffect } from 'react';
// import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
// import { db, appId } from '../config/firebase';
// import { useAuth } from '../hooks/useAuth';
// import { useTheme } from '../contexts/ThemeContext';
// import { callGemini } from '../services/gemini';
// import { ViewHeader } from './ViewHeader';
// import { Card } from './Card';
// import { Button } from './Button';
// import {
//   Dumbbell,
//   Play,
//   CheckCircle,
//   Plus,
//   Minus,
//   Timer,
//   Target,
//   Zap,
//   Award,
//   Sparkles,
//   RotateCcw,
//   TrendingUp
// } from 'lucide-react';
//
// interface WorkoutTrackerProps {
//   setView: (view: string) => void;
//   onSuccess: (message: string) => void;
// }
//
// interface Exercise {
//   name: string;
//   sets: number;
//   reps: string;
//   muscle_group: string;
//   instructions: string;
// }
//
// interface SetData {
//   weight: string;
//   reps: string;
//   completed: boolean;
// }
//
// interface WorkoutSession {
//   exercises: Exercise[];
//   currentExercise: number;
//   startTime: Date;
//   workoutLog: Record<string, SetData[]>;
//   isActive: boolean;
// }
//
// const WORKOUT_TYPES = [
//   {
//     id: 'upper_body',
//     name: 'Upper Body Power',
//     description: 'Build chest, shoulders, arms and back',
//     icon: Dumbbell,
//     color: 'red',
//     muscles: ['chest', 'shoulders', 'arms', 'back']
//   },
//   {
//     id: 'lower_body',
//     name: 'Lower Body Strength',
//     description: 'Target glutes, quads, hamstrings',
//     icon: Target,
//     color: 'blue',
//     muscles: ['glutes', 'quadriceps', 'hamstrings', 'calves']
//   },
//   {
//     id: 'full_body',
//     name: 'Full Body Blast',
//     description: 'Complete workout for all muscles',
//     icon: Zap,
//     color: 'purple',
//     muscles: ['full body', 'compound movements']
//   },
//   {
//     id: 'core_abs',
//     name: 'Core & Abs',
//     description: 'Strengthen your core foundation',
//     icon: RotateCcw,
//     color: 'green',
//     muscles: ['abs', 'core', 'obliques', 'lower back']
//   }
// ];
//
// export const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({ setView, onSuccess }) => {
//   const [currentStep, setCurrentStep] = useState<'select' | 'workout' | 'complete'>('select');
//   const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [hasWorkoutToday, setHasWorkoutToday] = useState(false);
//   const [workoutStats, setWorkoutStats] = useState({ duration: 0, totalVolume: 0, completedSets: 0 });
//   const { getUserId } = useAuth();
//   const { theme } = useTheme();
//   const userId = getUserId();
//   const today = new Date().toISOString().split('T')[0];
//
//   // Check if user has workout today
//   useEffect(() => {
//     if (!userId) return;
//
//     const docRef = doc(db, `artifacts/${appId}/users/${userId}/workoutLogs`, `${userId}_${today}`);
//     const unsubscribe = onSnapshot(docRef, (docSnap) => {
//       setHasWorkoutToday(docSnap.exists());
//     });
//
//     return () => unsubscribe();
//   }, [userId, today]);
//
//   // Generate AI workout
//   const generateWorkout = async (workoutType: typeof WORKOUT_TYPES[0]) => {
//     setIsGenerating(true);
//
//     const prompt = `Create a ${workoutType.name.toLowerCase()} workout for a 55kg male beginner-intermediate level.
//     Focus on: ${workoutType.muscles.join(', ')}.
//
//     Return exactly 5-6 exercises in this JSON format:
//     {
//       "exercises": [
//         {
//           "name": "Exercise Name",
//           "sets": 3,
//           "reps": "8-12",
//           "muscle_group": "Primary Muscle",
//           "instructions": "Clear, concise instructions for proper form and execution"
//         }
//       ]
//     }
//
//     Make exercises suitable for home/gym with basic equipment. Focus on compound movements and proper progression.`;
//
//     try {
//       const result = await callGemini(prompt);
//       const workoutData = JSON.parse(result);
//
//       if (workoutData.exercises && workoutData.exercises.length > 0) {
//         startWorkout(workoutData.exercises);
//         onSuccess(`🔥 ${workoutType.name} workout generated! ${workoutData.exercises.length} exercises ready.`);
//       } else {
//         throw new Error('Invalid workout data received');
//       }
//     } catch (error) {
//       console.error('Workout generation error:', error);
//       onSuccess('❌ Failed to generate workout. Please try again.');
//     } finally {
//       setIsGenerating(false);
//     }
//   };
//
//   // Start workout session
//   const startWorkout = (exercises: Exercise[]) => {
//     const initialLog: Record<string, SetData[]> = {};
//     exercises.forEach(exercise => {
//       initialLog[exercise.name] = Array(exercise.sets).fill(null).map(() => ({
//         weight: '',
//         reps: '',
//         completed: false
//       }));
//     });
//
//     setWorkoutSession({
//       exercises,
//       currentExercise: 0,
//       startTime: new Date(),
//       workoutLog: initialLog,
//       isActive: true
//     });
//     setCurrentStep('workout');
//   };
//
//   // Update set data
//   const updateSet = (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
//     if (!workoutSession) return;
//
//     const newLog = { ...workoutSession.workoutLog };
//     const sets = [...newLog[exerciseName]];
//     sets[setIndex] = {
//       ...sets[setIndex],
//       [field]: value,
//       completed: sets[setIndex].weight !== '' && sets[setIndex].reps !== '' && (field === 'reps' ? value !== '' : sets[setIndex].reps !== '')
//     };
//     newLog[exerciseName] = sets;
//
//     setWorkoutSession({ ...workoutSession, workoutLog: newLog });
//   };
//
//   // Complete set
//   const completeSet = (exerciseName: string, setIndex: number) => {
//     if (!workoutSession) return;
//
//     const sets = workoutSession.workoutLog[exerciseName];
//     if (!sets[setIndex].weight || !sets[setIndex].reps) {
//       onSuccess('⚠️ Please enter weight and reps before completing the set.');
//       return;
//     }
//
//     const newLog = { ...workoutSession.workoutLog };
//     newLog[exerciseName][setIndex].completed = true;
//     setWorkoutSession({ ...workoutSession, workoutLog: newLog });
//     onSuccess(`✅ Set ${setIndex + 1} completed!`);
//   };
//
//   // Navigate exercises
//   const nextExercise = () => {
//     if (!workoutSession || workoutSession.currentExercise >= workoutSession.exercises.length - 1) return;
//     setWorkoutSession({ ...workoutSession, currentExercise: workoutSession.currentExercise + 1 });
//   };
//
//   const prevExercise = () => {
//     if (!workoutSession || workoutSession.currentExercise <= 0) return;
//     setWorkoutSession({ ...workoutSession, currentExercise: workoutSession.currentExercise - 1 });
//   };
//
//   // Complete workout
//   const completeWorkout = async () => {
//     if (!workoutSession) return;
//
//     const completedSets = Object.values(workoutSession.workoutLog)
//       .flat()
//       .filter(set => set.completed).length;
//
//     if (completedSets === 0) {
//       onSuccess('⚠️ Please complete at least one set before finishing.');
//       return;
//     }
//
//     const duration = Math.round((new Date().getTime() - workoutSession.startTime.getTime()) / 60000);
//     const totalVolume = Object.values(workoutSession.workoutLog)
//       .flat()
//       .filter(set => set.completed)
//       .reduce((total, set) => total + (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0), 0);
//
//     try {
//       const docRef = doc(db, `artifacts/${appId}/users/${userId}/workoutLogs`, `${userId}_${today}`);
//       await setDoc(docRef, {
//         userId,
//         date: today,
//         exercises: workoutSession.workoutLog,
//         workoutPlan: workoutSession.exercises,
//         totalExercises: workoutSession.exercises.length,
//         completedSets,
//         duration,
//         totalVolume: Math.round(totalVolume),
//         createdAt: serverTimestamp(),
//         completedAt: new Date().toISOString()
//       });
//
//       setWorkoutStats({ duration, totalVolume: Math.round(totalVolume), completedSets });
//       setCurrentStep('complete');
//       onSuccess(`🎉 Workout completed! ${duration} minutes, ${Math.round(totalVolume)}kg total volume.`);
//     } catch (error) {
//       console.error('Error saving workout:', error);
//       onSuccess('❌ Failed to save workout. Please try again.');
//     }
//   };
//
//   // Reset workout
//   const resetWorkout = () => {
//     setCurrentStep('select');
//     setWorkoutSession(null);
//     setWorkoutStats({ duration: 0, totalVolume: 0, completedSets: 0 });
//   };
//
//   // Calculate progress
//   const getWorkoutProgress = () => {
//     if (!workoutSession) return 0;
//     const totalSets = Object.values(workoutSession.workoutLog).flat().length;
//     const completedSets = Object.values(workoutSession.workoutLog).flat().filter(set => set.completed).length;
//     return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
//   };
//
//   // Workout Complete Screen
//   if (currentStep === 'complete') {
//     return (
//       <div className="animate-fade-in space-y-6">
//         <ViewHeader title="Workout Complete!" setView={setView} />
//
//         <Card variant="gradient" className="text-center p-8">
//           <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
//             <Award className="text-white" size={32} />
//           </div>
//
//           <h2 className="text-3xl font-bold mb-4 text-green-600 dark:text-green-400">
//             Amazing Work! 🎉
//           </h2>
//           <p className="text-gray-600 dark:text-gray-300 mb-8">
//             You've successfully completed your training session. Every rep counts towards your goals!
//           </p>
//
//           <div className="grid grid-cols-3 gap-6 mb-8">
//             <div className="text-center">
//               <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
//                 {workoutStats.duration}
//               </div>
//               <div className="text-sm text-gray-500">Minutes</div>
//             </div>
//             <div className="text-center">
//               <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
//                 {workoutStats.totalVolume}
//               </div>
//               <div className="text-sm text-gray-500">Total Volume (kg)</div>
//             </div>
//             <div className="text-center">
//               <div className="text-2xl font-bold text-red-600 dark:text-red-400">
//                 {workoutStats.completedSets}
//               </div>
//               <div className="text-sm text-gray-500">Sets Completed</div>
//             </div>
//           </div>
//
//           <div className="flex gap-4 justify-center">
//             <Button onClick={() => setView('dashboard')} variant="outline">
//               Back to Dashboard
//             </Button>
//             <Button onClick={resetWorkout}>
//               Start New Workout
//             </Button>
//           </div>
//         </Card>
//       </div>
//     );
//   }
//
//   // Active Workout Screen
//   if (currentStep === 'workout' && workoutSession) {
//     const currentExercise = workoutSession.exercises[workoutSession.currentExercise];
//     const currentSets = workoutSession.workoutLog[currentExercise.name];
//     const progress = getWorkoutProgress();
//
//     return (
//       <div className="animate-fade-in space-y-6">
//         <ViewHeader title="Active Workout" setView={setView} />
//
//         {/* Progress Header */}
//         <Card className="p-6">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">
//                 Exercise {workoutSession.currentExercise + 1} of {workoutSession.exercises.length}
//               </h2>
//               <p className="text-gray-600 dark:text-gray-400">
//                 {Math.round(progress)}% Complete
//               </p>
//             </div>
//             <div className="text-right">
//               <div className="text-2xl font-bold text-red-500">
//                 {Math.round((new Date().getTime() - workoutSession.startTime.getTime()) / 60000)}
//               </div>
//               <div className="text-sm text-gray-500">Minutes</div>
//             </div>
//           </div>
//
//           <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
//             <div
//               className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
//               style={{ width: `${progress}%` }}
//             />
//           </div>
//         </Card>
//
//         {/* Current Exercise */}
//         <Card className="p-6">
//           <div className="mb-6">
//             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
//               {currentExercise.name}
//             </h3>
//             <div className="flex items-center gap-4 mb-4">
//               <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
//                 {currentExercise.muscle_group}
//               </span>
//               <span className="text-gray-600 dark:text-gray-400">
//                 {currentExercise.sets} sets × {currentExercise.reps} reps
//               </span>
//             </div>
//             <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
//               {currentExercise.instructions}
//             </p>
//           </div>
//
//           {/* Sets */}
//           <div className="space-y-3">
//             <h4 className="font-semibold text-gray-900 dark:text-white">Track Your Sets</h4>
//             {currentSets.map((set, index) => (
//               <div
//                 key={index}
//                 className={`p-4 rounded-xl border-2 transition-all ${
//                   set.completed
//                     ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
//                     : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
//                 }`}
//               >
//                 <div className="flex items-center gap-4">
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
//                     set.completed
//                       ? 'bg-green-500 text-white'
//                       : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
//                   }`}>
//                     {set.completed ? <CheckCircle size={16} /> : index + 1}
//                   </div>
//
//                   <div className="flex-1 grid grid-cols-2 gap-3">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg)</label>
//                       <input
//                         type="number"
//                         placeholder="0"
//                         className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                         value={set.weight}
//                         onChange={(e) => updateSet(currentExercise.name, index, 'weight', e.target.value)}
//                         disabled={set.completed}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-500 mb-1">Reps</label>
//                       <input
//                         type="number"
//                         placeholder="0"
//                         className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                         value={set.reps}
//                         onChange={(e) => updateSet(currentExercise.name, index, 'reps', e.target.value)}
//                         disabled={set.completed}
//                       />
//                     </div>
//                   </div>
//
//                   {!set.completed && (
//                     <Button
//                       size="sm"
//                       onClick={() => completeSet(currentExercise.name, index)}
//                       disabled={!set.weight || !set.reps}
//                     >
//                       Complete
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </Card>
//
//         {/* Navigation */}
//         <div className="flex items-center justify-between gap-4">
//           <Button
//             variant="outline"
//             onClick={prevExercise}
//             disabled={workoutSession.currentExercise === 0}
//           >
//             Previous
//           </Button>
//
//           <div className="flex gap-2">
//             {workoutSession.exercises.map((_, index) => (
//               <div
//                 key={index}
//                 className={`w-3 h-3 rounded-full ${
//                   index === workoutSession.currentExercise
//                     ? 'bg-red-500'
//                     : index < workoutSession.currentExercise
//                       ? 'bg-green-500'
//                       : 'bg-gray-300 dark:bg-gray-600'
//                 }`}
//               />
//             ))}
//           </div>
//
//           {workoutSession.currentExercise === workoutSession.exercises.length - 1 ? (
//             <Button onClick={completeWorkout}>
//               Finish Workout
//             </Button>
//           ) : (
//             <Button onClick={nextExercise}>
//               Next Exercise
//             </Button>
//           )}
//         </div>
//       </div>
//     );
//   }
//
//   // Workout Selection Screen
//   return (
//     <div className="animate-fade-in space-y-6">
//       <ViewHeader title="Start Your Workout" setView={setView} />
//
//       {/* Today's Status */}
//       {hasWorkoutToday && (
//         <Card variant="gradient" className="p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
//           <div className="flex items-center">
//             <CheckCircle className="text-green-500 mr-4" size={24} />
//             <div>
//               <h3 className="font-semibold text-green-800 dark:text-green-200">
//                 Workout Already Completed Today! 💪
//               </h3>
//               <p className="text-green-700 dark:text-green-300">
//                 Great job! You can still do another session if you want to push harder.
//               </p>
//             </div>
//           </div>
//         </Card>
//       )}
//
//       {/* Hero Section */}
//       <Card variant="gradient" className="text-center p-8">
//         <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
//           <Dumbbell className="text-white" size={24} />
//         </div>
//         <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
//           Ready to Train?
//         </h2>
//         <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
//           Choose your workout focus and let AI create a personalized training session just for you.
//         </p>
//       </Card>
//
//       {/* Workout Types */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {WORKOUT_TYPES.map((workoutType) => {
//           const IconComponent = workoutType.icon;
//           const colorClasses = {
//             red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
//             blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
//             purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
//             green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
//           };
//
//           return (
//             <Card key={workoutType.id} className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
//               <div className="flex items-start gap-4">
//                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${colorClasses[workoutType.color as keyof typeof colorClasses]} group-hover:scale-110 transition-transform duration-300`}>
//                   <IconComponent className="text-white" size={20} />
//                 </div>
//
//                 <div className="flex-1">
//                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
//                     {workoutType.name}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-300 mb-4">
//                     {workoutType.description}
//                   </p>
//
//                   <div className="flex flex-wrap gap-2 mb-4">
//                     {workoutType.muscles.map((muscle) => (
//                       <span
//                         key={muscle}
//                         className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs"
//                       >
//                         {muscle}
//                       </span>
//                     ))}
//                   </div>
//
//                   <Button
//                     onClick={() => generateWorkout(workoutType)}
//                     disabled={isGenerating}
//                     className="w-full"
//                   >
//                     {isGenerating ? (
//                       <>
//                         <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
//                         Generating...
//                       </>
//                     ) : (
//                       <>
//                         <Sparkles className="mr-2" size={16} />
//                         Generate AI Workout
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </Card>
//           );
//         })}
//       </div>
//
//       {/* Tips */}
//       <Card className="p-6">
//         <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
//           <TrendingUp className="mr-2 text-blue-500" size={20} />
//           Workout Tips
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
//           <div className="flex items-start gap-2">
//             <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
//             <p>Warm up for 5-10 minutes before starting</p>
//           </div>
//           <div className="flex items-start gap-2">
//             <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
//             <p>Focus on proper form over heavy weights</p>
//           </div>
//           <div className="flex items-start gap-2">
//             <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
//             <p>Rest 60-90 seconds between sets</p>
//           </div>
//           <div className="flex items-start gap-2">
//             <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
//             <p>Stay hydrated throughout your session</p>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// };

import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase'; // Assuming these are correctly configured
import { useAuth } from '../hooks/useAuth'; // Assuming custom hook exists
import { useTheme } from '../contexts/ThemeContext'; // Assuming custom context exists
import { callGemini } from '../services/gemini'; // Assuming Gemini service exists
import { ViewHeader } from './ViewHeader'; // Assuming UI component exists
import { Card } from './Card'; // Assuming UI component exists
import { Button } from './Button'; // Assuming UI component exists
import {
  Dumbbell,
  Play,
  CheckCircle,
  Plus,
  Minus,
  Timer,
  Target,
  Zap,
  Award,
  Sparkles,
  RotateCcw,
  TrendingUp
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Exercise {
  name: string;
  sets: number;
  reps: string;
  muscle_group: string;
  instructions: string;
}

interface SetData {
  weight: string;
  reps: string;
  completed: boolean;
}

interface WorkoutSession {
  exercises: Exercise[];
  currentExercise: number;
  startTime: Date;
  workoutLog: Record<string, SetData[]>;
  isActive: boolean;
}

interface WorkoutStats {
  duration: number;
  totalVolume: number;
  completedSets: number;
}

// --- CONSTANTS (Moved outside component for performance) ---
const WORKOUT_TYPES = [
  {
    id: 'upper_body',
    name: 'Upper Body Power',
    description: 'Build chest, shoulders, arms and back',
    icon: Dumbbell,
    color: 'red',
    muscles: ['chest', 'shoulders', 'arms', 'back']
  },
  {
    id: 'lower_body',
    name: 'Lower Body Strength',
    description: 'Target glutes, quads, hamstrings',
    icon: Target,
    color: 'blue',
    muscles: ['glutes', 'quadriceps', 'hamstrings', 'calves']
  },
  {
    id: 'full_body',
    name: 'Full Body Blast',
    description: 'Complete workout for all muscles',
    icon: Zap,
    color: 'purple',
    muscles: ['full body', 'compound movements']
  },
  {
    id: 'core_abs',
    name: 'Core & Abs',
    description: 'Strengthen your core foundation',
    icon: RotateCcw,
    color: 'green',
    muscles: ['abs', 'core', 'obliques', 'lower back']
  }
];
type WorkoutType = typeof WORKOUT_TYPES[0];


// --- SUB-COMPONENTS FOR EACH VIEW ---

// 1. Workout Selection Screen
interface WorkoutSelectionScreenProps {
  hasWorkoutToday: boolean;
  generatingId: string | null;
  onGenerateWorkout: (workoutType: WorkoutType) => void;
  setView: (view: string) => void;
}

const WorkoutSelectionScreen: React.FC<WorkoutSelectionScreenProps> = ({ hasWorkoutToday, generatingId, onGenerateWorkout, setView }) => (
    <div className="animate-fade-in space-y-6">
      <ViewHeader title="Start Your Workout" setView={setView} />

      {hasWorkoutToday && (
          <Card variant="gradient" className="p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-4" size={24} />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">Workout Already Completed Today! 💪</h3>
                <p className="text-green-700 dark:text-green-300">Great job! You can still do another session if you want to push harder.</p>
              </div>
            </div>
          </Card>
      )}

      <Card variant="gradient" className="text-center p-8">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Dumbbell className="text-white" size={24} />
        </div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">Ready to Train?</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Choose your workout focus and let AI create a personalized training session just for you.</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {WORKOUT_TYPES.map((workoutType) => {
          const IconComponent = workoutType.icon;
          const colorClasses = {
            red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
            blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
            purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
            green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          };

          return (
              <Card key={workoutType.id} className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${colorClasses[workoutType.color as keyof typeof colorClasses]} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{workoutType.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{workoutType.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {workoutType.muscles.map((muscle) => (
                          <span key={muscle} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs">{muscle}</span>
                      ))}
                    </div>
                    <Button onClick={() => onGenerateWorkout(workoutType)} disabled={generatingId !== null} className="w-full">
                      {generatingId === workoutType.id ? (
                          <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />Generating...</>
                      ) : (
                          <><Sparkles className="mr-2" size={16} />Generate AI Workout</>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp className="mr-2 text-blue-500" size={20} />
          Workout Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
          <p className="flex items-start gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />Warm up for 5-10 minutes before starting.</p>
          <p className="flex items-start gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />Focus on proper form over heavy weights.</p>
          <p className="flex items-start gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />Rest 60-90 seconds between sets.</p>
          <p className="flex items-start gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />Stay hydrated throughout your session.</p>
        </div>
      </Card>
    </div>
);

// 2. Active Workout Screen
interface ActiveWorkoutScreenProps {
  session: WorkoutSession;
  onUpdateSet: (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => void;
  onCompleteSet: (exerciseName: string, setIndex: number) => void;
  onNextExercise: () => void;
  onPrevExercise: () => void;
  onCompleteWorkout: () => void;
  setView: (view: string) => void;
}

const ActiveWorkoutScreen: React.FC<ActiveWorkoutScreenProps> = ({ session, onUpdateSet, onCompleteSet, onNextExercise, onPrevExercise, onCompleteWorkout, setView }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.round((new Date().getTime() - session.startTime.getTime()) / 60000));
    }, 1000);
    return () => clearInterval(timer);
  }, [session.startTime]);

  const getWorkoutProgress = useCallback(() => {
    const totalSets = Object.values(session.workoutLog).flat().length;
    const completedSets = Object.values(session.workoutLog).flat().filter(set => set.completed).length;
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  }, [session.workoutLog]);

  const currentExercise = session.exercises[session.currentExercise];
  const currentSets = session.workoutLog[currentExercise.name];
  const progress = getWorkoutProgress();

  return (
      <div className="animate-fade-in space-y-6">
        <ViewHeader title="Active Workout" setView={setView} />

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Exercise {session.currentExercise + 1} of {session.exercises.length}</h2>
              <p className="text-gray-600 dark:text-gray-400">{Math.round(progress)}% Complete</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-500">{elapsedTime}</div>
              <div className="text-sm text-gray-500">Minutes</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{currentExercise.name}</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">{currentExercise.muscle_group}</span>
              <span className="text-gray-600 dark:text-gray-400">{currentExercise.sets} sets × {currentExercise.reps} reps</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{currentExercise.instructions}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Track Your Sets</h4>
            {currentSets.map((set, index) => (
                <div key={index} className={`p-4 rounded-xl border-2 transition-all ${set.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${set.completed ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                      {set.completed ? <CheckCircle size={16} /> : index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg)</label>
                        <input type="number" placeholder="0" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={set.weight} onChange={(e) => onUpdateSet(currentExercise.name, index, 'weight', e.target.value)} disabled={set.completed} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Reps</label>
                        <input type="number" placeholder="0" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={set.reps} onChange={(e) => onUpdateSet(currentExercise.name, index, 'reps', e.target.value)} disabled={set.completed} />
                      </div>
                    </div>
                    {!set.completed && <Button size="sm" onClick={() => onCompleteSet(currentExercise.name, index)} disabled={!set.weight || !set.reps}>Complete</Button>}
                  </div>
                </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={onPrevExercise} disabled={session.currentExercise === 0}>Previous</Button>
          <div className="flex gap-2">
            {session.exercises.map((_, index) => (
                <div key={index} className={`w-3 h-3 rounded-full ${index === session.currentExercise ? 'bg-red-500' : index < session.currentExercise ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            ))}
          </div>
          {session.currentExercise === session.exercises.length - 1 ? (
              <Button onClick={onCompleteWorkout}>Finish Workout</Button>
          ) : (
              <Button onClick={onNextExercise}>Next Exercise</Button>
          )}
        </div>
      </div>
  );
};

// 3. Workout Completion Screen
interface WorkoutCompleteScreenProps {
  stats: WorkoutStats;
  onReset: () => void;
  setView: (view: string) => void;
}

const WorkoutCompleteScreen: React.FC<WorkoutCompleteScreenProps> = ({ stats, onReset, setView }) => (
    <div className="animate-fade-in space-y-6">
      <ViewHeader title="Workout Complete!" setView={setView} />
      <Card variant="gradient" className="text-center p-8">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-green-600 dark:text-green-400">Amazing Work! 🎉</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">You've successfully completed your training session. Every rep counts towards your goals!</p>
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.duration}</div>
            <div className="text-sm text-gray-500">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalVolume}</div>
            <div className="text-sm text-gray-500">Total Volume (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.completedSets}</div>
            <div className="text-sm text-gray-500">Sets Completed</div>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => setView('dashboard')} variant="outline">Back to Dashboard</Button>
          <Button onClick={onReset}>Start New Workout</Button>
        </div>
      </Card>
    </div>
);


// --- MAIN WORKOUT TRACKER COMPONENT (Container) ---
interface WorkoutTrackerProps {
  setView: (view: string) => void;
  onSuccess: (message: string) => void;
}

export const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({ setView, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<'select' | 'workout' | 'complete'>('select');
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [hasWorkoutToday, setHasWorkoutToday] = useState(false);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({ duration: 0, totalVolume: 0, completedSets: 0 });

  const { getUserId } = useAuth();
  const userId = getUserId();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!userId) return;
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/workoutLogs`, `${userId}_${today}`);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      setHasWorkoutToday(docSnap.exists());
    });
    return () => unsubscribe();
  }, [userId, today]);

  // const generateWorkout = async (workoutType: WorkoutType) => {
  //   setGeneratingId(workoutType.id);
  //   const prompt = `Create a ${workoutType.name.toLowerCase()} workout for a 55kg male beginner-intermediate level. Focus on: ${workoutType.muscles.join(', ')}. Return exactly 5-6 exercises in this JSON format: {"exercises": [{"name": "Exercise Name", "sets": 3, "reps": "8-12", "muscle_group": "Primary Muscle", "instructions": "Clear, concise instructions for proper form and execution"}]}. Make exercises suitable for home/gym with basic equipment. Focus on compound movements and proper progression.`;
  //
  //   try {
  //     const result = await callGemini(prompt);
  //     // Basic validation to prevent crash on invalid JSON
  //     if (!result.startsWith('{') || !result.endsWith('}')) {
  //       throw new Error('Invalid response format from AI.');
  //     }
  //     const workoutData = JSON.parse(result);
  //
  //     if (workoutData.exercises && workoutData.exercises.length > 0) {
  //       startWorkout(workoutData.exercises);
  //       onSuccess(`🔥 ${workoutType.name} workout generated! ${workoutData.exercises.length} exercises ready.`);
  //     } else {
  //       throw new Error('Invalid workout data received');
  //     }
  //   } catch (error) {
  //     console.error('Workout generation error:', error);
  //     onSuccess('❌ Failed to generate workout. Please try again.');
  //   } finally {
  //     setGeneratingId(null);
  //   }
  // };
  const generateWorkout = async (workoutType: WorkoutType) => {
    setGeneratingId(workoutType.id);

    const prompt = `Create a ${workoutType.name.toLowerCase()} workout for a 55kg male beginner-intermediate level. Focus on: ${workoutType.muscles.join(', ')}. Return exactly 5-6 exercises in this JSON format: {"exercises": [{"name": "Exercise Name", "sets": 3, "reps": "8-12", "muscle_group": "Primary Muscle", "instructions": "Clear, concise instructions for proper form and execution"}]}. Make exercises suitable for home/gym with basic equipment. Focus on compound movements and proper progression. Respond with only valid JSON.`

    try {
      const result = await callGemini(prompt);

      // Extract JSON safely from the result
      const match = result.match(/{[\s\S]*}/); // greedy match to get full JSON block
      if (!match) throw new Error("No JSON found in AI response.");

      const workoutData = JSON.parse(match[0]);

      if (workoutData.exercises && Array.isArray(workoutData.exercises) && workoutData.exercises.length > 0) {
        startWorkout(workoutData.exercises);
        onSuccess(`🔥 ${workoutType.name} workout generated! ${workoutData.exercises.length} exercises ready.`);
      } else {
        throw new Error('Invalid workout data structure.');
      }

    } catch (error) {
      console.error('Workout generation error:', error);
      onSuccess('❌ Failed to generate workout. Please try again.');
    } finally {
      setGeneratingId(null);
    }
  };

  const startWorkout = (exercises: Exercise[]) => {
    const initialLog: Record<string, SetData[]> = {};
    exercises.forEach(exercise => {
      initialLog[exercise.name] = Array(exercise.sets).fill(null).map(() => ({ weight: '', reps: '', completed: false }));
    });

    setWorkoutSession({
      exercises,
      currentExercise: 0,
      startTime: new Date(),
      workoutLog: initialLog,
      isActive: true
    });
    setCurrentStep('workout');
  };

  const updateSet = (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    if (!workoutSession) return;
    setWorkoutSession(prev => {
      if (!prev) return null;
      const newLog = { ...prev.workoutLog };
      const sets = [...newLog[exerciseName]];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      newLog[exerciseName] = sets;
      return { ...prev, workoutLog: newLog };
    });
  };

  const completeSet = (exerciseName: string, setIndex: number) => {
    if (!workoutSession) return;
    const sets = workoutSession.workoutLog[exerciseName];
    if (!sets[setIndex].weight || !sets[setIndex].reps) {
      onSuccess('⚠️ Please enter weight and reps before completing the set.');
      return;
    }
    setWorkoutSession(prev => {
      if (!prev) return null;
      const newLog = { ...prev.workoutLog };
      newLog[exerciseName][setIndex].completed = true;
      return { ...prev, workoutLog: newLog };
    });
    onSuccess(`✅ Set ${setIndex + 1} completed!`);
  };

  const nextExercise = () => {
    if (!workoutSession || workoutSession.currentExercise >= workoutSession.exercises.length - 1) return;
    setWorkoutSession({ ...workoutSession, currentExercise: workoutSession.currentExercise + 1 });
  };

  const prevExercise = () => {
    if (!workoutSession || workoutSession.currentExercise <= 0) return;
    setWorkoutSession({ ...workoutSession, currentExercise: workoutSession.currentExercise - 1 });
  };

  const completeWorkout = async () => {
    if (!workoutSession) return;
    const completedSets = Object.values(workoutSession.workoutLog).flat().filter(set => set.completed).length;
    if (completedSets === 0) {
      onSuccess('⚠️ Please complete at least one set before finishing.');
      return;
    }

    const duration = Math.round((new Date().getTime() - workoutSession.startTime.getTime()) / 60000);
    const totalVolume = Object.values(workoutSession.workoutLog).flat().filter(set => set.completed)
        .reduce((total, set) => total + (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0), 0);

    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/workoutLogs`, `${userId}_${today}`);
      await setDoc(docRef, {
        userId,
        date: today,
        exercises: workoutSession.workoutLog,
        workoutPlan: workoutSession.exercises,
        totalExercises: workoutSession.exercises.length,
        completedSets,
        duration,
        totalVolume: Math.round(totalVolume),
        createdAt: serverTimestamp(),
        completedAt: new Date().toISOString()
      }, { merge: true }); // Use merge to be safe if a doc somehow exists

      setWorkoutStats({ duration, totalVolume: Math.round(totalVolume), completedSets });
      setCurrentStep('complete');
      onSuccess(`🎉 Workout completed! ${duration} minutes, ${Math.round(totalVolume)}kg total volume.`);
    } catch (error) {
      console.error('Error saving workout:', error);
      onSuccess('❌ Failed to save workout. Please try again.');
    }
  };

  const resetWorkout = () => {
    setCurrentStep('select');
    setWorkoutSession(null);
    setWorkoutStats({ duration: 0, totalVolume: 0, completedSets: 0 });
  };

  // Render the correct screen based on the current step
  const renderContent = () => {
    switch (currentStep) {
      case 'workout':
        return workoutSession && (
            <ActiveWorkoutScreen
                session={workoutSession}
                onUpdateSet={updateSet}
                onCompleteSet={completeSet}
                onNextExercise={nextExercise}
                onPrevExercise={prevExercise}
                onCompleteWorkout={completeWorkout}
                setView={setView}
            />
        );
      case 'complete':
        return (
            <WorkoutCompleteScreen
                stats={workoutStats}
                onReset={resetWorkout}
                setView={setView}
            />
        );
      case 'select':
      default:
        return (
            <WorkoutSelectionScreen
                hasWorkoutToday={hasWorkoutToday}
                generatingId={generatingId}
                onGenerateWorkout={generateWorkout}
                setView={setView}
            />
        );
    }
  };

  return <div>{renderContent()}</div>;
};
