import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

interface Option {
    id: string;
    name: string;
}

interface MultiSelectDropdownProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    containerClassName?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
    options, 
    selected, 
    onChange, 
    placeholder = 'Select options', 
    containerClassName = '' 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionName: string) => {
        if (selected.includes(optionName)) {
            onChange(selected.filter(s => s !== optionName));
        } else {
            onChange([...selected, optionName]);
        }
    };

    return (
        <div className={`w-full ${containerClassName}`} ref={dropdownRef}>
            <div className="relative">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="w-full h-12 px-3 bg-white md:bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black md:focus:border-primary text-sm font-bold flex items-center justify-between text-left shadow-sm transition-all"
                >
                    <span className={`truncate ${selected.length === 0 ? 'text-gray-400 font-bold' : 'text-gray-900'}`}>
                        {selected.length > 0 ? selected.join(', ') : placeholder}
                    </span>
                    <FaChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={12} />
                </button>

                {isOpen && (
                    <div className="w-full bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl max-h-56 overflow-y-auto custom-scrollbar absolute z-[60] shadow-2xl top-full">
                        <div className="p-1 space-y-1">
                            {options.map(option => {
                                const isSelected = selected.includes(option.name);
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleOption(option.name);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                            isSelected ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span>{option.name}</span>
                                        {isSelected && <FaCheck size={12} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
