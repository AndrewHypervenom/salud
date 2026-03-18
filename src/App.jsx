import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/Auth/LoginPage'
import PinEntryPage from './pages/Auth/PinEntryPage'
import RecoveryPage from './pages/Auth/RecoveryPage'
import OnboardingPage from './pages/Onboarding/OnboardingPage'
import Dashboard from './pages/Dashboard'
import ProfileList from './pages/Profiles/ProfileList'
import ProfileForm from './pages/Profiles/ProfileForm'
import CaloriesPage from './pages/Calories/CaloriesPage'
import DietPage from './pages/Diet/DietPage'
import ExercisePage from './pages/Exercise/ExercisePage'
import BPPage from './pages/BloodPressure/BPPage'
import DoctorQuestionsPage from './pages/DoctorQuestions/DoctorQuestionsPage'
import HabitsPage from './pages/Habits/HabitsPage'
import FoodPage from './pages/Food/FoodPage'
import ProgressPage from './pages/Progress/ProgressPage'
import WaterPage from './pages/Water/WaterPage'
import WeightPage from './pages/Weight/WeightPage'
import FastingPage from './pages/Fasting/FastingPage'
import RecipesPage from './pages/Recipes/RecipesPage'
import RecipeFormPage from './pages/Recipes/RecipeFormPage'
import RecipeDetailPage from './pages/Recipes/RecipeDetailPage'
import FoodSearchPage from './pages/FoodSearch/FoodSearchPage'
import BadgesPage from './pages/Badges/BadgesPage'
import FitnessOnboardingStandalone from './pages/Fitness/FitnessOnboardingStandalone'
import FitnessProfilePage from './pages/Fitness/FitnessProfilePage'

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <ProfileProvider>
        <Routes>
          {/* Fullscreen routes — no TopBar/nav chrome */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login/pin" element={<PinEntryPage />} />
          <Route path="/profiles/:id/recover" element={<RecoveryPage />} />
          <Route path="/onboarding/new" element={<OnboardingPage />} />
          <Route path="/onboarding/fitness" element={<FitnessOnboardingStandalone />} />

          {/* App routes with TopBar + Sidebar + BottomNav */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profiles" element={<ProfileList />} />
            <Route path="/profiles/:id/edit" element={<ProfileForm />} />
            <Route path="/calories" element={<CaloriesPage />} />
            <Route path="/diet" element={<DietPage />} />
            <Route path="/exercise" element={<ExercisePage />} />
            <Route path="/blood-pressure" element={<BPPage />} />
            <Route path="/doctor-questions" element={<DoctorQuestionsPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/food" element={<FoodPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/water" element={<WaterPage />} />
            <Route path="/weight" element={<WeightPage />} />
            <Route path="/fasting" element={<FastingPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<RecipeFormPage />} />
            <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/food-search" element={<FoodSearchPage />} />
            <Route path="/badges" element={<BadgesPage />} />
            <Route path="/fitness-profile" element={<FitnessProfilePage />} />
          </Route>
        </Routes>
      </ProfileProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}
