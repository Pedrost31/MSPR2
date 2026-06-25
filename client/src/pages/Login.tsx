import {useState,useEffect} from 'react'; 
import {AtSignIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon} from "lucide-react";
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { Toaster } from 'react-hot-toast';
 
 const Login = () => { 
    const [state,setState] = useState('login');
    const [username,setUsername] = useState('');
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [showPassword,setShowPassword] = useState(false);
    const [isSubmitting,setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const {login,signup,user}=useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    if (state === "login") {
      await login({ email, password });
    } else {
      await signup({ username, email, password });
    }
  } catch (e) {
    // erreur déjà gérée par toast dans context
  } finally {
    setIsSubmitting(false);
  }
};

    useEffect(()=>{
        if(user) {
            navigate('/')
        }
    },[user,navigate]);

    return (
        <>

        <Toaster />
<main className="login-page-container">
<form onSubmit={handleSubmit} className="login-form">
    <h2 className="text-3xl font-medium text-gray-900 dark:text-white"> {state === 'login' ? "Connexion" : "Inscription"}</h2>
    <p className="mt-2 text-sm text-gray-500/90 dark:text-gray-400">
        {state === 'login' ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}
    </p>
   
    {/* Username */}
    {state !== 'login' && (
        <div className="mt-4">
            <label className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Nom d'utilisateur
            </label>
            <div className="relative mt-2">
                <AtSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4.5" />
                <input onChange={(e)=>setUsername(e.target.value)} value={username}
                type="text" placeholder="choisissez un nom d'utilisateur" className="login-input" required
                />         
            </div>
                 
        </div>
    )}
 {/* Email */}
     <div className="mt-4">
            <label className="font-medium text-sm text-gray-700 dark:text-gray-300">
                E-mail
            </label>
            <div className="relative mt-2">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4.5" />
                <input onChange={(e)=>setEmail(e.target.value)} value={email}
                type="email" placeholder="saisissez votre e-mail" className="login-input" required
                />         
            </div>
                 
        </div>

         {/* Password */}
     <div className="mt-4">
            <label className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Mot de passe
            </label>
            <div className="relative mt-2">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4.5" />
               <input
  onChange={(e)=>setPassword(e.target.value)}
  value={password}
  placeholder="saisissez votre mot de passe"
  className="login-input pr-10 appearance-none"
  required
  autoComplete="new-password"
  type={showPassword ? "text" : "password"}
/>
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"  onClick={()=> setShowPassword((p)=> !p)}>
            
           
            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>

                      
            </div>
                 
        </div>


    <button type="submit" disabled={isSubmitting} className="login-button">
       {isSubmitting ? "Connexion en cours..." : state === 'login' ? "Se connecter" : "S'inscrire"}
    </button>



        {state === 'login' ?
        (
            <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Pas encore de compte ? <button className="ml-1 cursor-pointer text-green-600 hover:underline" type="button" onClick={()=>setState('sign-up')}>S'inscrire</button></p> 
        )
    :
    (
        <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Vous avez déjà un compte ? <button className="ml-1 cursor-pointer text-green-600 hover:underline" type="button" onClick={()=>setState('login')}>Se connecter</button></p>
    )}
    
    </form>

</main>
        </>

    );
}
export default Login;