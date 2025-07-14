import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { callGemini } from '../services/vertexai';
import { useTheme } from '../contexts/ThemeContext';
import { ViewHeader } from './ViewHeader';
import { ProgressBar } from './ProgressBar';
import { Card } from './Card';
import { Button } from './Button';
import { Plus, Trash2, Flame, Target, Sparkles, BrainCircuit } from 'lucide-react';

interface DietTrackerProps {
  setView: (view: string) => void;
  onSuccess: (message: string) => void;
}

interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number;
}

export const DietTracker: React.FC<DietTrackerProps> = ({ setView, onSuccess }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [aiMealDescription, setAiMealDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { getUserId } = useAuth();
  const { theme } = useTheme();
  const userId = getUserId();
  const today = new Date().toISOString().split('T')[0];
  const calorieTarget = 2300;
  const proteinTarget = 100;

  // Real-time listener for today's meals
  useEffect(() => {
    if (!userId) return;
    
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/dietLogs`, `${userId}_${today}`);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMeals(data.meals || []);
        console.log('Meals updated from Firebase:', data.meals);
      } else {
        setMeals([]);
        console.log('No meals found for today');
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to meals:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, today]);

  const handleAiAnalyze = async () => {
    if (!aiMealDescription.trim()) return;
    setIsAnalyzing(true);
    setMealName(aiMealDescription);
    
    const prompt = `You are a nutrition expert for Ghanaian food. Analyze the following meal description and provide a reasonable estimate for its calories and protein. The user is a 55kg male trying to build muscle. Meal: "${aiMealDescription}". Respond with only a JSON object with "calories" (number) and "protein" (number) keys.`;

    const nutritionSchema = {
      type: "OBJECT",
      properties: {
        calories: { type: "NUMBER" },
        protein: { type: "NUMBER" }
      },
      required: ["calories", "protein"]
    };

    try {
      const result = await callGemini(prompt, nutritionSchema);
      const parsedResult = JSON.parse(result);
      setCalories(parsedResult.calories.toString());
      setProtein(parsedResult.protein.toString());
      onSuccess('AI analysis complete! Review and confirm the nutrition values.');
    } catch (error) {
      console.error('AI analysis error:', error);
      onSuccess('AI analysis failed. Please enter values manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim() || !calories || !protein) {
      onSuccess('Please fill in all meal details before adding.');
      return;
    }
    
    const newMeal: Meal = { 
      name: mealName.trim(), 
      calories: parseInt(calories), 
      protein: parseInt(protein), 
      id: Date.now() 
    };
    
    const updatedMeals = [...meals, newMeal];
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.protein, 0);

    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/dietLogs`, `${userId}_${today}`);
      await setDoc(docRef, { 
        userId, 
        date: today, 
        meals: updatedMeals, 
        totalCalories, 
        totalProtein, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      // Clear form
      setMealName(''); 
      setCalories(''); 
      setProtein(''); 
      setAiMealDescription('');
      
      // Show success notification
      onSuccess(`✅ "${newMeal.name}" added! ${newMeal.calories} calories and ${newMeal.protein}g protein logged.`);
      
      console.log('Meal added successfully:', newMeal);
    } catch (error) {
      console.error("Error adding meal: ", error);
      onSuccess('Failed to add meal. Please try again.');
    }
  };

  const deleteMeal = async (mealId: number) => {
    const mealToDelete = meals.find(meal => meal.id === mealId);
    if (!mealToDelete) return;
    
    const updatedMeals = meals.filter(meal => meal.id !== mealId);
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.protein, 0);
    
    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/dietLogs`, `${userId}_${today}`);
      await setDoc(docRef, { 
        userId, 
        date: today, 
        meals: updatedMeals, 
        totalCalories, 
        totalProtein, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      onSuccess(`🗑️ "${mealToDelete.name}" removed from your daily log.`);
      console.log('Meal deleted successfully:', mealToDelete);
    } catch (error) {
      console.error("Error deleting meal: ", error);
      onSuccess('Failed to remove meal. Please try again.');
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <ViewHeader title="Log Your Meals" setView={setView} />
        <Card className="p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <span className="text-gray-600 dark:text-gray-300">Loading your meals...</span>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <ViewHeader title="Log Your Meals" setView={setView} />
      
      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 text-center">
          <h3 className="text-lg text-gray-600 dark:text-gray-300 mb-2 flex items-center justify-center">
            <Flame className="mr-2 text-orange-400" size={20} />
            Calories
          </h3>
          <p className="text-3xl font-bold text-red-500 mb-4">{totalCalories} / {calorieTarget}</p>
          <ProgressBar 
            current={totalCalories} 
            target={calorieTarget} 
            color="red"
            size="lg"
          />
        </Card>
        
        <Card className="p-6 text-center">
          <h3 className="text-lg text-gray-600 dark:text-gray-300 mb-2 flex items-center justify-center">
            <Target className="mr-2 text-sky-400" size={20} />
            Protein
          </h3>
          <p className="text-3xl font-bold text-sky-500 mb-4">{totalProtein} / {proteinTarget}</p>
          <ProgressBar 
            current={totalProtein} 
            target={proteinTarget} 
            color="blue"
            size="lg"
          />
        </Card>
      </div>

      {/* AI Meal Analysis */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
          <Sparkles className="text-yellow-400 mr-3" size={24} />
          AI-Powered Meal Entry
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Describe your meal, and let AI estimate the nutrition facts for you.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <input 
            type="text" 
            value={aiMealDescription} 
            onChange={e => setAiMealDescription(e.target.value)} 
            placeholder="e.g., Banku with tilapia and pepper sauce" 
            className="flex-grow p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none transition-all duration-200" 
            onKeyPress={(e) => e.key === 'Enter' && handleAiAnalyze()}
          />
          <Button
            onClick={handleAiAnalyze} 
            disabled={isAnalyzing || !aiMealDescription.trim()} 
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            {isAnalyzing ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            ) : (
              <BrainCircuit size={18} className="mr-2" />
            )}
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
      </Card>

      {/* Add Meal Form */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Add Meal Details</h3>
        <form onSubmit={addMeal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meal/Food</label>
              <input 
                type="text" 
                value={mealName} 
                onChange={e => setMealName(e.target.value)} 
                placeholder="Enter meal name" 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calories (kcal)</label>
              <input 
                type="number" 
                value={calories} 
                onChange={e => setCalories(e.target.value)} 
                placeholder="e.g., 500" 
                min="0"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Protein (g)</label>
              <input 
                type="number" 
                value={protein} 
                onChange={e => setProtein(e.target.value)} 
                placeholder="e.g., 40" 
                min="0"
                step="0.1"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200" 
                required
              />
            </div>
          </div>
          <Button
            type="submit" 
          >
            <Plus className="mr-2" size={20} />
            Add Meal
          </Button>
        </form>
      </Card>

      {/* Today's Meals */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Today's Log</h3>
        {meals.length > 0 ? (
          <div className="space-y-4">
            {meals.map(meal => (
              <div 
                key={meal.id} 
                className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 space-y-3 sm:space-y-0"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">{meal.name}</p>
                  <div className="flex items-center gap-4 sm:gap-6 mt-2">
                    <span className="text-sm text-red-500 flex items-center">
                      <Flame size={16} className="mr-1" />
                      {meal.calories} kcal
                    </span>
                    <span className="text-sm text-sky-500 flex items-center">
                      <Target size={16} className="mr-1" />
                      {meal.protein} g
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteMeal(meal.id)} 
                  className="text-gray-500 hover:text-red-500 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 self-end sm:self-center"
                  title="Delete meal"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            
            {/* Daily Summary */}
            <div className="mt-6 p-6 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{totalCalories}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Calories</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalCalories >= calorieTarget ? '✅ Target reached!' : `${calorieTarget - totalCalories} to go`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-sky-500">{totalProtein}g</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Protein</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalProtein >= proteinTarget ? '✅ Target reached!' : `${proteinTarget - totalProtein}g to go`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flame className="text-gray-400" size={28} />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">No meals logged yet for today.</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Start by describing a meal above or adding details manually.</p>
          </div>
        )}
      </Card>
    </div>
  );
};