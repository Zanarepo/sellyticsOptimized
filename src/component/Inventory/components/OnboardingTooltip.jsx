import React from 'react';
import { motion } from 'framer-motion';

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function OnboardingTooltip({
  step,
  steps,
  onNext,
  onSkip,
}) {
  if (!steps || steps.length === 0 || step >= steps.length) return null;

  const current = steps[step];

  // Calculate position of target element
  const getTooltipPosition = (target) => {
    const element = document.querySelector(target);
    if (!element) return { top: 0, left: 0 };
    const rect = element.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 10,
      left: rect.left + window.scrollX,
    };
  };

  const position = getTooltipPosition(current.target);

  return (
    <motion.div
      className="fixed z-50 bg-indigo-600 dark:bg-gray-900 border rounded-lg shadow-lg p-4 max-w-xs text-white"
      style={position}
      variants={tooltipVariants}
      initial="hidden"
      animate="visible"
    >
      <p className="text-sm mb-2">{current.content}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-200">
          Step {step + 1} of {steps.length}
        </span>
        <div className="space-x-2">
          <button
            onClick={onSkip}
            className="text-xs text-white hover:text-gray-300"
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded text-xs"
          >
            {step + 1 === steps.length ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
