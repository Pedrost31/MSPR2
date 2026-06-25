import React, { useEffect, useRef, useState} from 'react'; 
import {useAppContext} from '../context/AppContext';
import type { FoodEntry,FormData } from '../types';
import Card from '../components/ui/Card';
import { mealColors, mealIcons, mealLabels, mealTypeOptions, quickActivitiesFoodLog } from '../assets/assets';
import Button from '../components/ui/Button';
import { Loader2Icon, PlusIcon, SparkleIcon, Trash2Icon, UtensilsCrossedIcon } from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { foodService } from '../services/foodService';
import { aiService, fileToCompressedBase64 } from '../services/aiService';
import toast from 'react-hot-toast';




const FoodLog = () => { 
    const {allFoodLogs,setAllFoodLogs} = useAppContext();   
    const [entries, setEntries] = useState<FoodEntry[]>([]);
const [showForm, setShowForm] = useState(false);
const[formData, setFormData] = useState<FormData>({
    name: '',
    calories: 0,
    mealType: '',
});
const [loading,setLoading] = useState(false); 
const inputRef= useRef<HTMLInputElement>(null)


// Group entries by meal type
const groupedEntries : Record<'breakfast' | 'lunch' | 'dinner' | 'snack', FoodEntry[]> = entries.reduce((acc,entry)=>{
    if(!acc[entry.mealType]) acc[entry.mealType] = [];
    acc[entry.mealType].push(entry);
    return acc;

}, {} as Record <'breakfast' | 'lunch' | 'dinner' | 'snack', FoodEntry[]>
)




const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    try {
      const entry = await foodService.create(formData);
      setAllFoodLogs(prev => [...prev, entry]);
      setFormData({name:'', calories:0 , mealType: ''});
      setShowForm(false);
      toast.success('Repas ajouté');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de l'ajout du repas");
    }
}


const today = new Date().toISOString().split('T')[0];
const loadTodayEntries = () => {
const todayEntries = allFoodLogs.filter((e: FoodEntry)=> e.createdAt?.split('T')[0]=== today)
setEntries(todayEntries)
}




const totalCalories =entries.reduce((sum, e)=> sum + e.calories, 0);
const handleQuickAdd = (activityName: string) =>{
    setFormData({...formData, mealType: activityName});
    setShowForm(true);
}
const handleImageChange = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // On réinitialise l'input pour permettre de re-sélectionner la même image
    e.target.value = '';
    if(!file) return;

    setLoading(true);
    const toastId = toast.loading("Analyse de l'image en cours… (jusqu'à 1-2 min)");
    try {
        const imageBase64 = await fileToCompressedBase64(file);
        const analysis = await aiService.analyzeFoodImage(imageBase64);

        const detectedName = analysis.food_name?.trim();
        const rawCalories = Number(analysis.nutrition?.calories);
        const detectedCalories = Number.isFinite(rawCalories) ? Math.round(rawCalories) : 0;

        if (!detectedName) {
            toast.error("Aucun aliment reconnu. Essayez une autre photo.", { id: toastId });
            return;
        }

        setFormData((prev) => ({
            ...prev,
            name: detectedName,
            calories: detectedCalories,
        }));
        setShowForm(true);
        if (detectedCalories > 0) {
            toast.success(`Détecté : ${detectedName} (~${detectedCalories} kcal)`, { id: toastId });
        } else {
            toast(`Détecté : ${detectedName}. Calories non estimées, saisissez-les manuellement.`, { id: toastId });
        }
    } catch (error: any) {
        toast.error(
            error?.response?.data?.message || "Échec de l'analyse de l'image",
            { id: toastId }
        );
    } finally {
        setLoading(false);
    }
}






const handleDelete = async (documentId: string) => {
   try {
    const confirm = window.confirm('Voulez-vous vraiment supprimer cette entrée ?');
    if(!confirm) return;
    await foodService.delete(documentId);
    setAllFoodLogs(prev => prev.filter((e: FoodEntry) => e.documentId !== documentId));
    toast.success('Entrée supprimée');
    } catch (error: any) {
        console.error(error)
        toast.error('Échec de la suppression. Veuillez réessayer.')
}
}

useEffect(() => {
    (()=> {
        loadTodayEntries();
    })();
}, [allFoodLogs]);

    return (
        <div className="page-container">
{/* Header */}
<div className='page-header'>
<div className="flex items-center justify-between">
<div>
    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Journal alimentaire</h1>
    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
        Suivez vos apports quotidiens
    </p>
</div>
<div className="text-right">
    <p className="text-sm text-slate-500 dark:text-slate-400">
        Total du jour
    </p>
    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
      {totalCalories}  kcal
    </p>

</div>
</div>
</div>

<div className="page-content-grid">
    {/* Quick Add Section */}
    {!showForm && (
        <div className="space-y-4">
            <Card>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
Ajout rapide
                </h3>
                <div className="flex flex-wrap gap-2">
{quickActivitiesFoodLog.map((activity) => (
    <button onClick={()=>handleQuickAdd(activity.name)}
    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors
    "
    key={activity.name}>
    {activity.emoji} {activity.label}
    </button>
))}
                </div>
            </Card>
<Button className='w-full' onClick={()=>setShowForm(true)}>
    <PlusIcon className='size-5'/>
</Button>

<Button className='w-full' onClick={()=>inputRef.current?.click()}>
    <SparkleIcon className='size-5' />
    Photo repas IA
</Button>
<input type="file" onChange={handleImageChange} accept="image/*" hidden ref={inputRef} />
{loading && (
    <div className="fixed inset-0 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur flex items-center justify-center z-100">
<Loader2Icon className="size-8 text-emerald-600 dark:text-emerald-400 animate-spin"/>

    </div>
)}
        </div>

    )}
{/*Add form */}
{showForm && (
    <Card className="border-2 border-emerald-200 dark:border-emerald-800">

<h3 className="font-semibold text-slate-800 dark:text-white mb-4">
Nouveau repas
</h3>
<form className="space-y-4" onSubmit={handleSubmit}>
    <Input label="Nom de l'aliment"  value={formData.name} onChange={(v)=>setFormData({...formData, name: v.toString()})} placeholder="ex. : Salade de poulet grillé" required/>

      <Input label="Calories" type="number"  value={formData.calories} onChange={(v)=>setFormData({...formData, calories: Number(v)})} placeholder="ex. : 350" required min={1}/>

<Select label ="Type de repas" value={formData.mealType}
onChange={(v)=>setFormData({...formData, mealType : v.toString()})}
options={mealTypeOptions} placeholder="Choisir un type de repas"
required />




<div className="flex gap-3 pt-2">
    <Button className='flex-1' type="button" variant="secondary" onClick={()=>{setShowForm(false);setFormData({
        name:'',
        calories:0,
        mealType:''
    })}}>
Annuler
    </Button> 
<Button type="submit" className='flex-1'>
Ajouter
</Button>

</div>

</form>


        </Card>
)}
{/* Entries List */}
{entries.length === 0 ? (
<Card className="text-center py-12">
<div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
<UtensilsCrossedIcon className='size-8 text-slate-400 dark:text-slate-500'/>
</div>
<h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
    Aucun repas enregistré aujourd'hui
</h3>
<p className="text-slate-500 dark:text-slate-400 text-sm">Commencez à suivre vos repas pour rester sur la bonne voie

</p>

</Card>
) : (
    <div className="space-y-4">
{['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
    const mealTypeKey = mealType as keyof typeof groupedEntries;
    if(!groupedEntries[mealTypeKey]) return null;

const MealIcon = mealIcons[mealTypeKey];
const mealCalories = groupedEntries[mealTypeKey].reduce((sum, e) => sum + e.calories, 0);

return (
<Card key={mealType}>
<div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mealColors[mealTypeKey]}`}>
<MealIcon className='size-5'/>
        </div>
<div>
    <h3 className="font-semibold text-slate-800 dark:text-white">
        {mealLabels[mealTypeKey]}
    </h3>
    <p>{groupedEntries[mealTypeKey].length} élément(s)</p>
</div>
    </div>
    <p className="font-semibold text-slate-700 dark:text-slate-200">
        {mealCalories} kcal
    </p>
    </div>
    <div className="space-y-2">
{groupedEntries[mealTypeKey].map((entry) => (
        <div key={entry.id} className="food-entry-item">
            <div className="flex-1">
                <p className="font-medium text-slate-700 dark:text-slate-200">                
                    {entry.name}
</p>
            </div>
<div className="flex items-center gap-3">
<span className="text-sm font-medium text-slate-600 dark:text-slate-300">
    {entry.calories} kcal</span>
    <button onClick={()=> handleDelete(entry?.documentId || '')} className='p-2 text-red-400 hover:text-red-600
    hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'>
<Trash2Icon className='w-4 h-4'/>


    </button>

</div>
        </div>
))}
    </div>
</Card>

)

})}


    </div>
)}
</div>
        </div>

    );
}
export default FoodLog;