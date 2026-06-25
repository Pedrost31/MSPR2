 import {useEffect, useState} from "react";
 import {useAppContext} from "../context/AppContext";
 import {useTheme} from "../context/ThemeContext";
import Card from '../components/ui/Card';
import { Calendar, Scale, SunIcon, Target, User,MoonIcon, LogOutIcon, Trash2Icon, SparklesIcon } from "lucide-react";
import Button from "../components/ui/Button";
import { goalLabels,goalOptions } from "../assets/assets";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { userService } from '../services/userService';
import { aiService } from '../services/aiService';
import { setBurnGoal, estimateIntake, estimateBurnGoal, burnGoalFromBmr } from '../services/mappers';
import toast from 'react-hot-toast';
 const Profile = () => {   
 const {user,logout,fetchUser,allFoodLogs,allActivityLogs,deleteAccount} =
 useAppContext();
 const {theme,toggleTheme}= useTheme()
 const [isEditing,setIsEditing]= useState(false)
 const [aiLoading,setAiLoading]= useState(false)
 const [formData,setFormData]= useState({age:0,weight :0 , height: 0,goal:'maintain',dailyCalorieIntake:2000,dailyCalorieBurn:400})

 // Recalcule des objectifs cohérents avec le profil/objectif courant.
 const withEstimates = (next: typeof formData) => ({
   ...next,
   dailyCalorieIntake: estimateIntake(next),
   dailyCalorieBurn: estimateBurnGoal(next),
 })
 

 const handleSave = async ()=>{
try{
    if(user) setBurnGoal(user.id, formData.dailyCalorieBurn)
    const updatedUser = await userService.updateProfile({
        age: formData.age,
        weight: formData.weight,
        height: formData.height,
        goal: formData.goal as 'lose' | 'maintain' | 'gain',
        dailyCalorieTarget: formData.dailyCalorieIntake,
    });
    await fetchUser(updatedUser.token)
    toast.success('Profil mis à jour')
} catch (error:any)
{
    console.log(error);
    toast.error(error?.response?.data?.message || "Échec de la mise à jour du profil");

}
setIsEditing(false)
 }

 // Enregistre le profil puis recalcule des objectifs précis via l'IA
 // (l'endpoint macros utilise le profil complet : sexe, niveau d'activité).
 const handleAiCalc = async () => {
   if (!user) return;
   setAiLoading(true);
   const tid = toast.loading("Calcul des objectifs avec l'IA…");
   try {
     await userService.updateProfile({
       age: formData.age,
       weight: formData.weight,
       height: formData.height,
       goal: formData.goal as 'lose' | 'maintain' | 'gain',
     });
     const m = await aiService.getMacros();
     const intake = Math.round(m.calories ?? estimateIntake(formData));
     const burn = m.bmr ? burnGoalFromBmr(m.bmr, formData.goal) : estimateBurnGoal(formData);
     setBurnGoal(user.id, burn);
     await userService.updateProfile({ dailyCalorieTarget: intake });
     await fetchUser(user.token);
     setFormData((f) => ({ ...f, dailyCalorieIntake: intake, dailyCalorieBurn: burn }));
     toast.success(`Objectifs IA appliqués : ${intake} kcal/j · ${burn} kcal brûlées`, { id: tid });
     setIsEditing(false);
   } catch (error: any) {
     toast.error(error?.response?.data?.message || "Échec du calcul IA", { id: tid });
   } finally {
     setAiLoading(false);
   }
 };

 const fetchUserData = () => {
    if(user){
setFormData({  
age:user?.age ||0,  
weight:user?.weight || 0,
height:user?.height || 0,
goal : user?.goal || 'maintain',
dailyCalorieIntake: user?.dailyCalorieIntake || 2000,
dailyCalorieBurn: user?.dailyCalorieBurn || 400,  


})
 }
 }


 const getStats = ()=>{
    const totalFoodEntries = allFoodLogs?.length || 0;
    const totalActivities = allActivityLogs?.length || 0 ; 
return{totalFoodEntries,totalActivities}
}
const stats = getStats();

const handleDeleteAccount = async () => {
  if (!window.confirm("Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.")) return;
  try {
    await deleteAccount();
    toast.success("Compte supprimé");
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Échec de la suppression du compte");
  }
};


 useEffect(()=>{
    (()=>{
        fetchUserData()
    })();
    },[user])

if(!user || !formData) return null


    return (
        <div className="page-container">
{/*Header */}
<div className="page-header">
<h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profil</h1>
<p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gérez vos paramètres</p>

</div>

<div className="profile-content">
{/*left col */}
<Card>
<div className="flex items-center gap-4 mb-6">
<div className="size-12 rounded-xl bg-linear-to-br from-emerald-400 to emerald-600 flex items-center justify-center">
<User className='size-6 text-white'></User>
</div>

<div>
    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Votre profil</h2>
<p className="text-slate-500 dark:text-slate-400 text-xs">Membre depuis le {new Date (user?.createdAt || '' ).toLocaleDateString('fr-FR')}</p>


</div>
</div>
{isEditing ? (
<div className="space-y-4">
<Input label="Âge" type='number' value={formData.age}
onChange={(v)=>setFormData(withEstimates({...formData,age: Number(v)}))} min={13} max={120}/>


<Input label="Poids (kg)" type='number' value={formData.weight}
onChange={(v)=>setFormData(withEstimates({...formData,weight: Number(v)}))} min={20} max={300}/>

<Input label="Taille (cm)" type='number' value={formData.height}
onChange={(v)=>setFormData(withEstimates({...formData,height: Number(v)}))} min={100} max={250}/>


<Select label="Objectif" value={formData.goal as string} onChange={(v)=> setFormData(withEstimates({...formData,goal : v as 'lose' | 'maintain' | 'gain'}))} options={goalOptions} />

<Input label="Limite calorique / jour (apport)" type='number' value={formData.dailyCalorieIntake}
onChange={(v)=>setFormData({...formData,dailyCalorieIntake: Number(v)})} min={1000} max={5000}/>

<Input label="Objectif calories brûlées / jour" type='number' value={formData.dailyCalorieBurn}
onChange={(v)=>setFormData({...formData,dailyCalorieBurn: Number(v)})} min={0} max={3000}/>

<p className="text-xs text-slate-400">
  Les objectifs s'ajustent automatiquement à votre profil. Pour un calcul précis selon votre objectif, utilisez l'IA.
</p>

<Button variant="secondary" className="w-full" onClick={handleAiCalc} disabled={aiLoading}>
  <SparklesIcon className="size-4" />
  {aiLoading ? "Calcul en cours…" : "Calculer avec l'IA et enregistrer"}
</Button>


<div className="flex gap-3 pt-2">
<Button variant="secondary" className="flex-1" onClick={()=>{
    setIsEditing(false);
    setFormData({
        age:Number (user.age),
        weight: Number(user.weight),
        height:Number (user.height),
        goal: user.goal || '',
    dailyCalorieIntake:user.dailyCalorieIntake || 2000,
    dailyCalorieBurn:user.dailyCalorieBurn || 400
    
    })
}}>
Annuler

</Button>

<Button onClick={handleSave} className="flex-1">
Enregistrer
    
</Button>




</div>


</div>
): (
    <> 
    <div className="space-y-4">
        {/* age */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors duration-200">
<div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
<Calendar className="size-4.5 text-blue-600 dark:text-blue-400"/>
</div>
<div>
    <p className="text-sm text-slate-500 dark:text-slate-400">Âge</p>
<p className="font-semibold text-slate-800 dark:text-white">
    {user.age} ans
</p>

</div>
        </div>
    {/* Wheight */}
         <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors duration-200">
<div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
<Scale className="size-4.5 text-purple-600 dark:text-purple-400"/>
</div>
<div>
    <p className="text-sm text-slate-500 dark:text-slate-400">Poids</p>
<p className="font-semibold text-slate-800 dark:text-white">
    {user.weight} kg
</p>

</div>
        </div>

 {/* Height */}
 {user.height !== 0 && ( 
         <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors duration-200">
<div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
<User className="size-4.5 text-green-600 dark:text-green-400"/>
</div>
<div>
    <p className="text-sm text-slate-500 dark:text-slate-400">Taille</p>
<p className="font-semibold text-slate-800 dark:text-white">
    {user.height} cm
</p>

</div>
        </div>
)}



{/* Goal */}
         <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors duration-200">
<div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
<Target className="size-4.5 text-orange-600 dark:text-orange-400"/>
</div>
<div>
    <p className="text-sm text-slate-500 dark:text-slate-400">Objectif</p>
<p className="font-semibold text-slate-800 dark:text-white">
    {goalLabels[user?.goal || 'gain']} 
</p>

</div>
        </div>
    </div>
    
    <Button variant="secondary" onClick={()=>setIsEditing(true)} className="w-full mt-4">
        Modifier le profil

    </Button>
    </>
)



}
</Card>

{/*right col */}
<div className="space-y-4">
{/*Stats Card */}
<Card>
    <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
Vos statistiques
    </h3>
    <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
<p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalFoodEntries}</p>
<p className="text-sm text-slate-500 dark:text-slate-400">Repas enregistrés</p>

        </div>
         <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalActivities}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Activités</p>
    </div>
    </div>
   
</Card>
{/*toggle theme button for phone */}
<div className='lg:hidden'>
<button onClick={toggleTheme} className="flex items-center gap-3 px-4 py-2.5 w-full
text-slate-500 dark:text-slate-400 hover:bg-slate-50
dark:hover:bg-slate-800 hover:text-slate-700
dark:hover:text-slate-200 rounded-lg transition-colors
duration-200 cursor-pointer">
  {theme === 'light' ? <MoonIcon className='size-5'/> : <SunIcon  className='size-5'/>}
  <span className="text-base">
    {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
    </span>  
</button>

</div>

{/*Logout button */}
<Button variant="danger" onClick={logout} className="w-full ring ring-red-300 hover:ring-2">

    <LogOutIcon className="size-4"/>
       Se déconnecter
   
</Button>

{/*Delete account button */}
<button onClick={handleDeleteAccount} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors duration-200 cursor-pointer">
    <Trash2Icon className="size-4"/>
    Supprimer le compte
</button>
</div>


</div>

        </div>

    );
}
export default Profile;