// sales/OnboardingTooltip.jsx
import { motion } from 'framer-motion';

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function OnboardingTooltip({ show, step, steps, nextStep, skip, getPosition }) {
  if (!show || step >= steps.length) return null;

  const position = getPosition(steps[step].target);

  return (
    <motion.div
      className="fixed z-50 bg-indigo-700 dark:bg-indigo-900 border border-indigo-300 dark:border-indigo-600 rounded-lg shadow-lg p-4 max-w-xs"
      style={position}
      variants={tooltipVariants}
      initial="hidden"
      animate="visible"
    >
      <p className="text-sm text-white dark:text-gray-100 mb-3">
        {steps[step].content}
      </p>
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-300">
          Step {step + 1} of {steps.length}
        </span>
        <div className="flex gap-2">
          <button onClick={skip} className="text-gray-200 hover:text-white">
            Skip
          </button>
          <button
            onClick={nextStep}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
          >
            {step + 1 === steps.length ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}