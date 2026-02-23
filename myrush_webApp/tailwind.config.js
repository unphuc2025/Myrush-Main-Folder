/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        fontFamily: {
            satoshi: ['Satoshi', 'sans-serif'],
            inter: ['Inter', 'sans-serif'],
            montserrat: ['Montserrat', 'sans-serif'], // Added for headings
        },
        extend: {
            colors: {
                current: 'currentColor',
                transparent: 'transparent',
                white: '#FFFFFF',
                // Original black and black-2 are overwritten by the new definitions below
                // 'black': '#111827', // Darker navy-black for strong contrast
                // 'black-2': '#1F2937',

                // Brand Colors
                primary: '#00D26A', // Rush Neon Green
                'primary-hover': '#00B55B',
                secondary: '#1A1D1F', // Onyx
                accent: '#3C50E0', // Electric Blue

                // Dark Surface
                black: '#0A0A0B', // Deepest Black
                'black-2': '#121214',

                // Neutral / Surface Colors
                body: '#64748B',
                bodydark: '#94A3B8',
                bodydark1: '#DEE4EE',
                bodydark2: '#8A99AF',

                stroke: '#E2E8F0',
                // Original gray, gray-2, gray-3 are overwritten by the new definitions below
                // gray: '#F3F4F6', // Light gray background
                // 'gray-2': '#F9FAFB',
                // 'gray-3': '#FAFAFA',

                // Neutral
                gray: '#F8F8F9', // Airy light background
                'gray-2': '#EFEFF1',
                'gray-3': '#D1D5DB',

                whiten: '#F1F5F9',
                whiter: '#F5F7FD',

                boxdark: '#24303F',
                boxdark2: '#1A222C',

                success: '#00D26A',
                danger: '#EF4444',
                warning: '#F59E0B',
            },
            fontSize: {
                // FLUID TYPOGRAPHY (10/10 SCALE) - Reduced for better balance
                'display': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '0.85', fontWeight: '800', letterSpacing: '-0.05em' }],
                'h1': ['clamp(2.25rem, 6vw, 4rem)', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.04em' }],
                'h2': ['clamp(1.75rem, 5vw, 3rem)', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.03em' }],
                'h3': ['clamp(1.5rem, 4vw, 2.5rem)', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
                'h4': ['1.75rem', { lineHeight: '1.3', fontWeight: '700' }],
                'h5': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
                'h6': ['1.125rem', { lineHeight: '1.5', fontWeight: '600' }],
                'body-lg': ['clamp(1.125rem, 2vw, 1.5rem)', { lineHeight: '1.6', fontWeight: '400' }],
                'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
                'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '600', letterSpacing: '0.1em' }],
            },
            spacing: {
                // Strict 8px increment system
                '18': '4.5rem',
                '22': '5.5rem',
                '32': '8rem',
                '40': '10rem',
                '48': '12rem',
                '60': '15rem',
                '72': '18rem',
            },
            maxWidth: {
                230: '230px',
                270: '270px',
                150: '150px',
                180: '180px',
            },
            zIndex: {
                999999: '999999',
                99999: '99999',
                9999: '9999',
                999: '999',
                99: '99',
                9: '9',
                1: '1',
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2.5rem', // Extra rounded for premium feel
                'full': '9999px',
            },
            boxShadow: {
                'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
                'premium-hover': '0 30px 60px -12px rgba(0, 0, 0, 0.15)',
                'glow': '0 0 20px rgba(0, 210, 106, 0.3)',
                'glow-strong': '0 0 40px rgba(0, 210, 106, 0.5)',
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                'dark-gradient': 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
            }
        },
    },
    plugins: [],
}
