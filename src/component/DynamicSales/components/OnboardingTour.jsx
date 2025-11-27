// src/components/DynamicSales/components/OnboardingTour.jsx
import React from 'react';
import { motion } from 'framer-motion';

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const steps = [
  { target: '.new-sale-button', content: 'Click to record a new sale.' },
  { target: '.search-input', content: 'Search by product, payment method, or Product ID.' },
  { target: '.view-mode-selector', content: 'Switch to Daily or Weekly Totals for summaries.' },
];

export default function OnboardingTour({ show, step, onNext, onSkip }) {
  if (!show || step >= steps.length) return null;

  const currentStep = steps[step];
  const element = document.querySelector(currentStep.target);
  const position = element
    ? {
        top: `${element.getBoundingClientRect().bottom + window.scrollY + 10}px`,
        left: `${element.getBoundingClientRect().left + window.scrollX}px`,
      }
    : { top: '50px', left: '50px' };

  return (
    <motion.div
      className="fixed z-50 bg-indigo-700 text-white rounded-lg shadow-2xl p-5 max-w-sm border border-indigo-400"
      style={position}
      variants={tooltipVariants}
      initial="hidden"
      animate="visible"
    >
      <p className="text-sm mb-4">{currentStep.content}</p>
      <div className="flex justify-between items-center text-xs">
        <span>{step + 1} of {steps.length}</span>
        <div className="space-x-3">
          <button onClick={onSkip} className="hover:underline">Skip</button>
          <button
            onClick={onNext}
            className="bg-white text-indigo-700 px-4 py-1.5 rounded font-medium hover:bg-gray-100"
          >
            {step === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}