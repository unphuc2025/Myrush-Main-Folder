import { useState } from 'react';

function ToggleSwitch({ isChecked, onToggle, disabled = false }) {
    const [isToggling, setIsToggling] = useState(false);

    const handleToggle = async () => {
        if (disabled || isToggling) return;

        setIsToggling(true);
        try {
            await onToggle();
        } catch (error) {
            console.error('Toggle failed:', error);
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={disabled || isToggling}
            className={`
        relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ease-in-out shrink-0
        ${isChecked
                    ? 'bg-green-600'
                    : 'bg-red-600'
                }
        ${disabled || isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
        focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
      `}
        >
            <span
                className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out
          ${isChecked ? 'translate-x-8' : 'translate-x-1'}
        `}
            />
        </button>
    );
}

export default ToggleSwitch;
