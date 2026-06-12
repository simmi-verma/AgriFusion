import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2 } from 'lucide-react';

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlightStyle, setSpotlightStyle] = useState({});

  useEffect(() => {
    const tourCompleted = localStorage.getItem('agrifusion_tour_completed');
    if (!tourCompleted) {
      setIsOpen(true);
    }
  }, []);

  const steps = [
    {
      targetId: '', // Centered Welcome Modal
      title: 'Welcome to AgriFusion! 🌾',
      content: 'AgriFusion connects local growers directly with buyers, ensuring fair pricing, fresh harvests, and zero middleman fees. Let’s take a quick 3-step walkthrough!'
    },
    {
      targetId: 'nav-products',
      title: 'Explore Fresh Produce 🍎',
      content: 'Browse the crop catalog. Farmers can easily create, manage, and categorize listings directly from their profile.'
    },
    {
      targetId: 'nav-nearby',
      title: 'Locate Local Farmers 📍',
      content: 'View nearby farms on the interactive map to prioritize regional trade and cut down transport costs.'
    }
  ];

  const updateSpotlight = (targetId) => {
    if (!targetId) {
      setSpotlightStyle({});
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setSpotlightStyle({
        top: `${rect.top + window.scrollY - 8}px`,
        left: `${rect.left + window.scrollX - 8}px`,
        width: `${rect.width + 16}px`,
        height: `${rect.height + 16}px`,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
        borderRadius: '12px'
      });
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setSpotlightStyle({});
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateSpotlight(steps[step].targetId);
      
      // Update coordinates on resize
      const handleResize = () => updateSpotlight(steps[step].targetId);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [step, isOpen]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('agrifusion_tour_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const currentStep = steps[step];

  return (
    <>
      {/* Background Mask Overlay */}
      <div 
        className="fixed inset-0 z-50 transition-all duration-300 pointer-events-none"
        style={currentStep.targetId ? spotlightStyle : { backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      />

      {/* Floating Card */}
      <div 
        className={`fixed z-50 max-w-sm w-full p-6 bg-white rounded-3xl border border-green-100 shadow-2xl transition-all duration-300 pointer-events-auto ${
          currentStep.targetId 
            ? 'top-[45%] left-1/2 -translate-x-1/2 md:-translate-x-0 md:left-auto md:right-8'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        }`}
      >
        <button 
          onClick={handleFinish}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-2.5 items-center mb-3">
          <div className="bg-green-100 text-green-700 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-green-700 tracking-widest uppercase">
            Tour Step {step + 1} of {steps.length}
          </span>
        </div>

        <h3 className="text-xl font-black text-green-955 mb-2">{currentStep.title}</h3>
        <p className="text-gray-600 text-xs leading-relaxed mb-6">{currentStep.content}</p>

        <div className="flex justify-between items-center gap-3">
          <button
            onClick={handleFinish}
            className="text-xs text-gray-400 hover:text-gray-600 transition font-semibold"
          >
            Skip
          </button>
          
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              {step === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Finish
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
