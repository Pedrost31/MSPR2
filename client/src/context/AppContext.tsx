import {createContext, useContext,useEffect,useState} from 'react';
import { initialState,type Credentials,type ActivityEntry, type FoodEntry, type User } from '../types';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { mapUserFromApi, setBurnGoal, BURN_GOAL_KEY } from '../services/mappers';
import { foodService } from '../services/foodService';
import { activityService } from '../services/activityService';
import { userService } from '../services/userService';
import toast from "react-hot-toast";

const AppContext = createContext(initialState);

export const AppProvider = ({children}: {children: React.ReactNode}) => {
    const navigate = useNavigate()
    const[user,setUser] = useState<User>(null)
    const [isUserFetched,setIsUserFetched] = useState(false);
    const [onboardingCompleted,setOnboardingCompleted] = useState(false);
    const [allFoodLogs,setAllFoodLogs] = useState<FoodEntry[]>([]);
    const [allActivityLogs,setAllActivityLogs] = useState<ActivityEntry[]>([]);


  const signup = async (credentials: Credentials) => {
  try {
    const { data } = await api.post("/auth/register", {
      name: credentials.username,
      email: credentials.email,
      password: credentials.password,
    });

    const authData = data.data;

    setUser(mapUserFromApi(authData.user, authData.accessToken));

    localStorage.setItem("token", authData.accessToken);
    localStorage.setItem("refreshToken", authData.refreshToken);

    const apiUser = authData.user;

    if (apiUser?.age && apiUser?.weight && apiUser?.goal) {
      setOnboardingCompleted(true);
    }

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Échec de l'inscription"
    );
    throw error;
  }
};

const login = async (credentials: Credentials) => {
  try {
    const { data } = await api.post("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });

    const authData = data.data;

    setUser(mapUserFromApi(authData.user, authData.accessToken));

    localStorage.setItem("token", authData.accessToken);
    localStorage.setItem("refreshToken", authData.refreshToken);

    const apiUser = authData.user;

    if (apiUser?.age && apiUser?.weight && apiUser?.goal) {
      setOnboardingCompleted(true);
    }

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Échec de la connexion"
    );
    throw error;
  }
};

const fetchUser = async (token: string) => {
  const fetchedUser = await userService.getMe(token);
  setUser(fetchedUser);

  if (fetchedUser?.age && fetchedUser?.weight && fetchedUser?.goal) {
    setOnboardingCompleted(true);
  }

  setIsUserFetched(true);
};

const fetchFoodLogs = async () => {
  const entries = await foodService.list();
  setAllFoodLogs(entries);
};

const fetchActivityLogs = async () => {
  const entries = await activityService.list();
  setAllActivityLogs(entries);
};

const updateCalorieGoals = async ({ intake, burn }: { intake?: number; burn?: number }) => {
  if (!user) return;
  if (burn != null) {
    setBurnGoal(user.id, Math.round(burn));
  }
  if (intake != null) {
    await userService.updateProfile({ dailyCalorieTarget: Math.round(intake) });
  }
  // Recharge le profil pour propager les nouveaux objectifs (apport en base, brûlé en local)
  await fetchUser(user.token);
};

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  setUser(null);
  setOnboardingCompleted(false);
  setAllFoodLogs([]);
  setAllActivityLogs([]);
  navigate("/");
};

const logout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  try {
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch {
    // On vide la session locale même si la requête échoue
  }
  clearSession();
};

const deleteAccount = async () => {
  await userService.deleteAccount();
  if (user) localStorage.removeItem(BURN_GOAL_KEY(user.id));
  clearSession();
};

useEffect (()=>{
const token = localStorage.getItem('token');
if (token) {
    (async () => {
        try {
          await fetchUser(token);
          await fetchFoodLogs();
          await fetchActivityLogs();
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          setIsUserFetched(true);
        }
    })();
}else{
    setIsUserFetched(true);
}
},[])


    const value = {user,setUser,login,signup,fetchUser,isUserFetched,logout,onboardingCompleted,setOnboardingCompleted,allFoodLogs,setAllFoodLogs,allActivityLogs,setAllActivityLogs,updateCalorieGoals,deleteAccount}
    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>
}
export const useAppContext = () => useContext(AppContext);
