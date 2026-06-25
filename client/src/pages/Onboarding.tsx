import {
  ArrowLeft,
  ArrowRight,
  PersonStanding,
  ScaleIcon,
  TargetIcon,
  User,
} from "lucide-react";

import { Toaster, toast } from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { useState } from "react";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Slider from "../components/ui/Slider";
import { api } from "../services/api";
import { ageRanges, goalOptions } from "../assets/assets";

const Onboarding = () => {
  const [step, setStep] = useState(1);

  const { user, setOnboardingCompleted, setUser } = useAppContext();

  const [formData, setFormData] = useState({
    age: 0,
    gender: "",
    weight: 0,
    height: 0,
    activityLevel: "",
    goal: "maintain",
    dailyCalorieTarget: 2000,
  });

  const totalSteps = 3;

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 🔥 CALCUL CALORIES (ton système gardé)
  const calculateCalories = () => {
    const age = Number(formData.age);

    const range =
      ageRanges.find((r) => age <= r.max) ||
      ageRanges[ageRanges.length - 1];

    let intake = range.maintain;

    if (formData.goal === "lose") intake -= 400;
    if (formData.goal === "gain") intake += 500;

    return intake;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.age || formData.age < 13 || formData.age > 120) {
        return toast.error("Valid age required");
      }
      if (!formData.gender) {
        return toast.error("Gender required");
      }
    }

    if (step === 2) {
      if (!formData.weight) {
        return toast.error("Weight required");
      }
      if (!formData.activityLevel) {
        return toast.error("Activity level required");
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }

    try {
      const { data } = await api.put("/users/me", {
        age: formData.age,
        gender: formData.gender,
        weight: formData.weight,
        height: formData.height || null,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        dailyCalorieTarget: calculateCalories(),
      });

      const updatedUser = data.data.user;

      setUser({
        ...updatedUser,
        token: user?.token,
      });

      setOnboardingCompleted(true);

      toast.success("Profile setup complete!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Update failed");
    }
  };

  return (
    <>
      <Toaster />

      <div className="onboarding-container">

        {/* HEADER (TON STYLE + ICONS) */}
        <div className="p-6 pt-12 onboarding-wrapper">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <PersonStanding className="w-6 h-6 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              HealthAI
            </h1>
          </div>

          <p className="text-slate-500 dark:text-slate-400 mt-4">
            Let's personalize your experience
          </p>
        </div>

        {/* PROGRESS */}
        <div className="px-6 mb-8 onboarding-wrapper">
          <div className="flex gap-2 max-w-2xl">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  s <= step
                    ? "bg-emerald-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>

          <p className="text-sm text-slate-400 mt-3">
            Step {step} of {totalSteps}
          </p>
        </div>

             {/* Form Content */}
        <div className="flex-1 px-6 onboarding-wrapper">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
                  <User className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                   Tell us a little bit about yourself
                  </h2>

                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    This helps us to personalize your plan
                  </p>
                </div>
              </div>

            <Input
              label="Age"
              type="number"
              value={formData.age}
              onChange={(v) => updateField("age", v)}
            />

            <Select
              label="Gender"
              value={formData.gender}
              onChange={(v) => updateField("gender", v)}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
        <div className="space-y-6 onboarding-wrapper">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
                  <ScaleIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Let's get your stats
                  </h2>

                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    We'll use these to personalize your calorie targets
                  </p>
                </div>
              </div>
     <div className="flex flex-col gap-4 max-w-2xl">

            <Input
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              onChange={(v) => updateField("weight", v)}
            />

            <Input
              label="Height (cm)"
              type="number"
              value={formData.height}
              onChange={(v) => updateField("height", v)}
            />

            <Select
              label="Activity level"
              value={formData.activityLevel}
              onChange={(v) => updateField("activityLevel", v)}
              options={[
                { value: "sedentary", label: "Sedentary" },
                { value: "light", label: "Light" },
                { value: "moderate", label: "Moderate" },
                { value: "active", label: "Active" },
                { value: "very_active", label: "Very active" },
              ]}
            />
          </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
        <div className="space-y-6 onboarding-wrapper">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
                  <TargetIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                    What's your goal?
                  </h2>

                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    We'll tailor your experience
                  </p>
                </div>
              </div>

          <div className="space-y-4 max-w-lg">
              {goalOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => updateField("goal", option.value)}
                  className={`onboarding-option-btn ${
                    formData.goal === option.value
                      ? "ring-2 ring-emerald-500"
                      : ""
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {/* DAILY TARGETS (RESTORED) */}
            <div className="border-t border-slate-200 dark:border-slate-700 my-6" />

            <h3 className="text-md font-medium">Daily targets</h3>

            <Slider
              label="Daily Calorie Target"
              min={1200}
              max={4000}
              step={50}
              value={formData.dailyCalorieTarget}
              onChange={(v) => updateField("dailyCalorieTarget", v)}
              unit="kcal"
            />
          </div>
        )}
</div>
        {/* NAVIGATION */}
        <div className="p-6 pb-10 onboarding-wrapper">
          <div className="flex gap-3 lg:justify-end">

            {step > 1 && (
              <Button
                variant="secondary"
                onClick={() => setStep(step - 1)}
                className="max-lg:flex-1 lg:px-10"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </span>
              </Button>
            )}

            <Button
              onClick={handleNext}
              className="max-lg:flex-1 lg:px-10"
            >
              <span className="flex items-center gap-2">
                {step === totalSteps ? "Get Started" : "Continue"}
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Onboarding;