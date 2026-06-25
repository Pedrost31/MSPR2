
import {Route, Routes} from "react-router-dom";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import FoodLog from "./pages/FoodLog";
import ActivityLog from "./pages/ActivityLog";
import Coach from "./pages/Coach";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import { useAppContext } from "./context/AppContext"; 
import Loading from "./components/Loading";
import { Toaster } from "react-hot-toast";

const App = () => {
  const {user,isUserFetched,onboardingCompleted} = useAppContext();
  
  if(!user){
return isUserFetched ? <Login/> : <Loading/>
  }

  if(!onboardingCompleted) {
    return <Onboarding/>
  }
  return (
 <>
 <Toaster />
   <Routes>
     <Route path="/" element={<Layout />}>
       <Route index element={<Dashboard />} />
       <Route path="food-log" element={<FoodLog />} />
       <Route path="activity-log" element={<ActivityLog />} />
       <Route path="coach" element={<Coach />} />
       <Route path="profile" element={<Profile />} />
       <Route path="onboarding" element={<Onboarding />} />
       <Route path="login" element={<Login />} />
     </Route>
   </Routes>
 </>
  );
}

export default App;