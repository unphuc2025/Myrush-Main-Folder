import React from 'react';

interface PhoneInputProps {
    countryCode: string;
    phoneNumber: string;
    onCodeChange: (code: string) => void;
    onNumberChange: (number: string) => void;
    error?: string;
    label?: string;
    className?: string;
}

const countryCodes = [
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+1', name: 'USA', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+65', name: 'Singapore', flag: '🇸🇬' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+1', name: 'Canada', flag: '🇨🇦' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
    countryCode,
    phoneNumber,
    onCodeChange,
    onNumberChange,
    error,
    label,
    className = '',
    labelClassName = '',
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className={labelClassName || "block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2 ml-1"}>
                    {label}
                </label>
            )}
            <div className="flex gap-3">
                <div className="relative w-32 shrink-0">
                    <select
                        value={countryCode}
                        onChange={(e) => onCodeChange(e.target.value)}
                        className="w-full h-14 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white px-3 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold cursor-pointer text-sm"
                    >
                        {countryCodes.map((c) => (
                            <option key={`${c.code}-${c.name}`} value={c.code} className="bg-black text-white">
                                {c.flag} {c.code}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary text-[10px]">
                        ▼
                    </div>
                </div>
                <div className="relative flex-1">
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 15) { // Support longer international numbers
                                onNumberChange(val);
                            }
                        }}
                        placeholder="Mobile Number"
                        className={`w-full h-14 bg-white/5 backdrop-blur-sm border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl text-white px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg placeholder:text-gray-500`}
                    />
                </div>
            </div>
            {error && (
                <p className="mt-2 ml-1 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                    {error}
                </p>
            )}
        </div>
    );
};
