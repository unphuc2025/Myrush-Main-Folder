import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaBolt, FaArrowLeft, FaRedo } from 'react-icons/fa';

export const Arcade: React.FC = () => {
    const [gameState, setGameState] = useState<'menu' | 'reaction' | 'rally'>('menu');

    // --- Reaction Game State ---
    const [reactionState, setReactionState] = useState<'idle' | 'waiting' | 'ready' | 'too-soon' | 'result'>('idle');
    const [startTime, setStartTime] = useState(0);
    const [score, setScore] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Wall Rally Game State & Refs ---
    const [rallyState, setRallyState] = useState<'idle' | 'playing' | 'gameover'>('idle');
    const [rallyScore, setRallyScore] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const playingRef = useRef(false); // To track playing state inside RequestAnimationFrame

    // Game Physics Constants
    const PADDLE_WIDTH = 100;
    const PADDLE_HEIGHT = 15;
    const BALL_RADIUS = 8;
    const INITIAL_SPEED = 5;
    const PADDLE_SPEED = 8;

    // Mutable Game State (for performance loop)
    const game = useRef({
        paddleX: 0,
        ballX: 0,
        ballY: 0,
        dx: 0,
        dy: 0,
        width: 0,
        height: 0,
        score: 0,
        speed: INITIAL_SPEED,
        keys: { left: false, right: false }
    });

    // --- Reaction Game Logic ---
    const startReactionGame = () => {
        setReactionState('waiting');
        const delay = Math.floor(Math.random() * 2000) + 1000;
        timeoutRef.current = setTimeout(() => {
            setReactionState('ready');
            setStartTime(Date.now());
        }, delay);
    };

    const handleReactionClick = () => {
        if (reactionState === 'waiting') {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setReactionState('too-soon');
        } else if (reactionState === 'ready') {
            const time = Date.now() - startTime;
            setScore(time);
            setReactionState('result');
        }
    };

    const resetReaction = () => {
        setReactionState('idle');
        setScore(0);
    };

    // --- Wall Rally Logic ---
    const initRallyGame = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        game.current.width = canvas.width;
        game.current.height = canvas.height;
        game.current.paddleX = canvas.width / 2 - PADDLE_WIDTH / 2;
        game.current.ballX = canvas.width / 2;
        game.current.ballY = canvas.height / 2;
        // Randomize start direction
        game.current.dx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2 + 2);
        game.current.dy = -INITIAL_SPEED;
        game.current.score = 0;
        game.current.speed = INITIAL_SPEED;

        // Ensure keys object exists (safety for HMR)
        if (!game.current.keys) {
            game.current.keys = { left: false, right: false };
        }

        setRallyScore(0);
        setRallyState('playing');
        playingRef.current = true;

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const gameLoop = () => {
        // Use ref to check if we should continue running the loop
        if (!playingRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const g = game.current;

        // Clear Canvas
        ctx.fillStyle = '#18181b'; // Zinc-900 like
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Keyboard Paddle Movement
        if (g.keys) {
            if (g.keys.left) g.paddleX -= PADDLE_SPEED;
            if (g.keys.right) g.paddleX += PADDLE_SPEED;
        }

        // Clamp Paddle
        if (g.paddleX < 0) g.paddleX = 0;
        if (g.paddleX > canvas.width - PADDLE_WIDTH) g.paddleX = canvas.width - PADDLE_WIDTH;

        // Draw Court Lines
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2); // Net line
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Update Physics
        g.ballX += g.dx;
        g.ballY += g.dy;

        // Wall Collisions (Left, Right, Top)
        if (g.ballX + g.dx > canvas.width - BALL_RADIUS || g.ballX + g.dx < BALL_RADIUS) {
            g.dx = -g.dx;
        }
        if (g.ballY + g.dy < BALL_RADIUS) {
            g.dy = -g.dy;
        }

        // Paddle Collision
        const paddleTop = canvas.height - PADDLE_HEIGHT - 10;
        if (g.ballY + BALL_RADIUS > paddleTop && g.ballY - BALL_RADIUS < paddleTop + PADDLE_HEIGHT) {
            // Check if within paddle width
            if (g.ballX > g.paddleX && g.ballX < g.paddleX + PADDLE_WIDTH) {
                g.dy = -g.speed; // Bounce up

                // Add spin/angle based on hit position
                const hitPoint = g.ballX - (g.paddleX + PADDLE_WIDTH / 2);
                g.dx = hitPoint * 0.15;

                // Increase Score and Speed
                g.score += 1;
                setRallyScore(g.score); // Sync React State

                // Speed up every 5 hits
                if (g.score % 5 === 0) g.speed += 1;
            }
        }

        // Game Over Condition (Ball hits bottom)
        if (g.ballY > canvas.height) {
            setRallyState('gameover');
            playingRef.current = false;
            cancelAnimationFrame(requestRef.current!);
            return;
        }

        // Draw Paddle
        ctx.fillStyle = '#fbbf24'; // Amber-400
        ctx.fillRect(g.paddleX, canvas.height - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);

        // Draw Ball
        ctx.beginPath();
        ctx.arc(g.ballX, g.ballY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#bef264'; // Lime-300
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();

        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (rallyState !== 'playing' || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        let newPaddleX = mouseX - PADDLE_WIDTH / 2;
        if (newPaddleX < 0) newPaddleX = 0;
        if (newPaddleX > canvasRef.current.width - PADDLE_WIDTH) newPaddleX = canvasRef.current.width - PADDLE_WIDTH;

        game.current.paddleX = newPaddleX;
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (rallyState !== 'playing' || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;

        let newPaddleX = touchX - PADDLE_WIDTH / 2;
        if (newPaddleX < 0) newPaddleX = 0;
        if (newPaddleX > canvasRef.current.width - PADDLE_WIDTH) newPaddleX = canvasRef.current.width - PADDLE_WIDTH;

        game.current.paddleX = newPaddleX;
    }

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!game.current.keys) return;
            if (e.key === 'ArrowLeft') game.current.keys.left = true;
            if (e.key === 'ArrowRight') game.current.keys.right = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!game.current.keys) return;
            if (e.key === 'ArrowLeft') game.current.keys.left = false;
            if (e.key === 'ArrowRight') game.current.keys.right = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Resize handler
        const handleResize = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
                game.current.width = canvasRef.current.width;
                game.current.height = canvasRef.current.height;
            }
        };
        window.addEventListener('resize', handleResize);
        // Initial size
        setTimeout(handleResize, 100);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', handleResize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Effect to trigger resize when entering rally mode
    useEffect(() => {
        if (gameState === 'rally') {
            const handleResize = () => {
                if (canvasRef.current && canvasRef.current.parentElement) {
                    canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                    canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
                    game.current.width = canvasRef.current.width;
                    game.current.height = canvasRef.current.height;
                }
            };
            setTimeout(handleResize, 50);
        }
    }, [gameState]);


    return (
        <div className="min-h-screen bg-black font-sans text-white overflow-hidden relative">
            {/* Global Atmosphere */}
            <div className="fixed inset-0 z-0 mesh-bg opacity-20 pointer-events-none mix-blend-screen"></div>

            <TopNav homeLabel="Exit Arcade" />

            {/* Arcade Menu */}
            {gameState === 'menu' && (
                <div className="relative pt-24 min-h-screen flex flex-col items-center justify-center p-6 z-10">
                    {/* Background Effects */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 text-center mb-8 md:mb-16"
                    >
                        <h1 className="text-4xl md:text-8xl font-black font-heading uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-purple-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Rush <br /> Arcade
                        </h1>
                        <p className="text-gray-400 text-base md:text-xl tracking-wide uppercase font-bold drop-shadow-md">Train Hard. Play Hard.</p>
                    </motion.div>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                        <motion.button
                            whileHover={{ scale: 1.05, translateY: -10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setGameState('reaction')}
                            className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl md:rounded-xl group hover:border-primary/50 transition-all text-left"
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-primary group-hover:scale-110 transition-transform">
                                <FaBolt />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black uppercase font-heading mb-2">Net Reflexes</h3>
                            <p className="text-gray-500 text-sm md:text-base font-medium">Test your reaction speed. Wait for Green!</p>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, translateY: -10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setGameState('rally'); setRallyState('idle'); }}
                            className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl md:rounded-xl group hover:border-yellow-500/50 transition-all text-left"
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500/10 rounded-xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-yellow-500 group-hover:scale-110 transition-transform">
                                <span className="text-xl md:text-2xl">🏓</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black uppercase font-heading mb-2">Wall Rally</h3>
                            <p className="text-gray-500 text-sm md:text-base font-medium">Wall drills simulation. Keep the ball alive!</p>
                        </motion.button>
                    </div>
                </div>
            )}

            {/* Wall Rally Game */}
            {gameState === 'rally' && (
                <div className="fixed inset-0 pt-20 bg-black flex flex-col">
                    <div className="flex justify-between items-center px-6 py-2 bg-zinc-900 border-b border-zinc-800">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setGameState('menu')}>
                                <FaArrowLeft /> Menu
                            </Button>
                            <h2 className="text-xl font-black uppercase hidden md:block">Wall Rally</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm font-bold uppercase">Rally</span>
                            <span className="text-3xl font-black font-heading text-primary">{rallyScore}</span>
                        </div>
                    </div>

                    <div className="flex-grow relative bg-zinc-950 overflow-hidden cursor-auto">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full block"
                            onMouseMove={handleMouseMove}
                            onTouchMove={handleTouchMove}
                        />

                        {rallyState === 'idle' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 pointer-events-none p-6 text-center">
                                <h1 className="text-3xl md:text-5xl font-black font-heading uppercase translate-y-[-20px] text-yellow-400">Wall Rally</h1>
                                <p className="text-gray-400 mb-8 font-bold text-sm md:text-base">Use Mouse, Touch or Arrow Keys</p>
                                <Button
                                    className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 md:px-12 py-3 md:py-4 rounded-full font-black uppercase shadow-glow pointer-events-auto"
                                    onClick={initRallyGame}
                                >
                                    Start Drill
                                </Button>
                            </div>
                        )}

                        {rallyState === 'gameover' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 pointer-events-none">
                                <h1 className="text-5xl font-black font-heading uppercase text-red-500 mb-2">Drill Over</h1>
                                <p className="text-white text-xl font-bold uppercase mb-8">Score: {rallyScore}</p>
                                <div className="flex gap-4 pointer-events-auto">
                                    <Button
                                        className="bg-white text-black px-8 py-4 rounded-xl font-bold uppercase hover:bg-gray-200"
                                        onClick={initRallyGame}
                                    >
                                        Try Again
                                    </Button>
                                    <Button
                                        className="bg-transparent border border-white/20 text-white px-8 py-4 rounded-xl font-bold uppercase hover:bg-white/10"
                                        onClick={() => setGameState('menu')}
                                    >
                                        Quit
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reaction Game */}
            {gameState === 'reaction' && (
                <div
                    className={`min-h-screen pt-20 flex flex-col items-center justify-center cursor-pointer select-none transition-colors duration-200 ${reactionState === 'waiting' ? 'bg-red-600' :
                        reactionState === 'ready' ? 'bg-green-500' :
                            'bg-zinc-900'
                        }`}
                    onMouseDown={handleReactionClick}
                >
                    <AnimatePresence mode="wait">
                        {reactionState === 'idle' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-center"
                            >
                                <FaBolt className="text-4xl md:text-6xl text-primary mx-auto mb-6 animate-pulse" />
                                <h2 className="text-3xl md:text-4xl font-black font-heading uppercase mb-4">Net Reflexes</h2>
                                <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm md:text-base">When the screen turns <span className="text-red-500 font-bold">RED</span>, wait.<br />When it turns <span className="text-green-500 font-bold">GREEN</span>, click!</p>
                                <Button
                                    className="bg-primary hover:bg-primary-hover text-black font-black text-lg md:text-xl px-10 md:px-12 py-4 md:py-6 rounded-full uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,0,0.3)] transition-all transform hover:scale-105"
                                    onClick={(e) => { e.stopPropagation(); startReactionGame(); }}
                                >
                                    Start
                                </Button>
                                <Button
                                    className="block mt-4 mx-auto bg-transparent text-white/50 hover:text-white"
                                    onClick={(e) => { e.stopPropagation(); setGameState('menu'); }}
                                >
                                    Back to Menu
                                </Button>
                            </motion.div>
                        )}

                        {reactionState === 'waiting' && (
                            <motion.div
                                key="waiting"
                                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                className="text-center"
                            >
                                <h2 className="text-6xl font-black font-heading uppercase text-black/50 tracking-widest">Wait...</h2>
                            </motion.div>
                        )}

                        {reactionState === 'ready' && (
                            <motion.div
                                key="ready"
                                initial={{ scale: 1.5 }} animate={{ scale: 1 }}
                                className="text-center"
                            >
                                <h2 className="text-8xl font-black font-heading uppercase text-white drop-shadow-xl">CLICK!</h2>
                            </motion.div>
                        )}

                        {reactionState === 'result' && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                                className="text-center p-12 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10"
                            >
                                <p className="text-gray-400 font-bold uppercase tracking-widest mb-2">Reaction Time</p>
                                <h2 className="text-8xl font-black font-heading text-primary mb-6">{score} <span className="text-2xl text-gray-500">ms</span></h2>

                                <div className="flex gap-4 justify-center">
                                    <Button
                                        className="bg-white text-black px-8 py-4 rounded-xl font-bold uppercase flex items-center gap-2 hover:bg-gray-200"
                                        onClick={(e) => { e.stopPropagation(); startReactionGame(); }}
                                    >
                                        <FaRedo /> Again
                                    </Button>
                                    <Button
                                        className="bg-transparent border border-white/20 text-white px-8 py-4 rounded-xl font-bold uppercase hover:bg-white/10"
                                        onClick={(e) => { e.stopPropagation(); setGameState('menu'); resetReaction(); }}
                                    >
                                        Menu
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {reactionState === 'too-soon' && (
                            <motion.div
                                key="too-soon"
                                initial={{ x: -20 }} animate={{ x: 0 }}
                                className="text-center"
                            >
                                <h2 className="text-4xl font-black font-heading uppercase text-red-500 mb-4">Too Soon!</h2>
                                <p className="text-gray-400 mb-8">Relax, wait for the green.</p>
                                <Button
                                    className="bg-white/10 text-white px-8 py-3 rounded-full font-bold uppercase hover:bg-white/20"
                                    onClick={(e) => { e.stopPropagation(); resetReaction(); }}
                                >
                                    Try Again
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
