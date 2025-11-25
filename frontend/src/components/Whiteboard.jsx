import React, { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Play,
    Pause,
    RotateCcw,
    Trash2,
    Download,
    Maximize2,
    Minimize2,
    FastForward,
    PenTool
} from 'lucide-react';
import { WhiteboardAnimator } from '../utils/WhiteboardAnimator';
import './Whiteboard.css';

const Whiteboard = ({
    commands = [],
    isVisible = true,
    autoPlay = true,
    onComplete = null,
    className = ''
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const animatorRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [canvasReady, setCanvasReady] = useState(false);
    const [totalCommands, setTotalCommands] = useState(0);
    const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
    const [showControls, setShowControls] = useState(false);

    // Initialize animator
    useEffect(() => {
        if (canvasRef.current && !animatorRef.current) {
            // Set canvas size to match container
            const resizeCanvas = () => {
                const canvas = canvasRef.current;
                const container = containerRef.current;
                if (canvas && container) {
                    const rect = container.getBoundingClientRect();
                    // Use device pixel ratio for sharp rendering
                    const dpr = window.devicePixelRatio || 1;

                    // Set display size
                    canvas.style.width = '100%';
                    canvas.style.height = '100%';

                    // Set actual size in memory (scaled to account for high DPI screens)
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;

                    // Normalize coordinate system
                    const ctx = canvas.getContext('2d');
                    ctx.scale(dpr, dpr);

                    // Re-render if needed
                    if (animatorRef.current && commands.length > 0) {
                        animatorRef.current.replay();
                    }
                }
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            animatorRef.current = new WhiteboardAnimator(canvasRef.current, {
                speed,
                onCommandComplete: (index, total) => {
                    setCurrentCommandIndex(index + 1);
                    setProgress(((index + 1) / total) * 100);
                },
                onComplete: () => {
                    setIsPlaying(false);
                    setProgress(100);
                    if (onComplete) onComplete();
                }
            });

            setCanvasReady(true);

            return () => {
                window.removeEventListener('resize', resizeCanvas);
                if (animatorRef.current) {
                    animatorRef.current.stop();
                }
            };
        }
    }, []);

    // Handle commands update
    useEffect(() => {
        if (animatorRef.current && commands.length > 0) {
            // Only add new commands
            const newCommands = commands.slice(totalCommands);
            if (newCommands.length > 0) {
                animatorRef.current.addCommands(newCommands);
                setTotalCommands(commands.length);

                if (autoPlay && !isPlaying) {
                    handlePlay();
                }
            }
        }
    }, [commands, autoPlay]);

    // Handle speed change
    useEffect(() => {
        if (animatorRef.current) {
            animatorRef.current.setSpeed(speed);
        }
    }, [speed]);

    const handlePlay = () => {
        if (animatorRef.current) {
            animatorRef.current.play();
            setIsPlaying(true);
        }
    };

    const handlePause = () => {
        if (animatorRef.current) {
            animatorRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleReplay = () => {
        if (animatorRef.current) {
            setProgress(0);
            setCurrentCommandIndex(0);
            animatorRef.current.replay();
            setIsPlaying(true);
        }
    };

    const handleDownload = () => {
        if (animatorRef.current) {
            animatorRef.current.downloadImage(`whiteboard-snapshot-${Date.now()}.png`);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Listen for fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (!isVisible) return null;

    return (
        <div
            ref={containerRef}
            className={`relative bg-white overflow-hidden group ${className} ${isFullscreen ? 'w-full h-screen' : 'w-full h-[500px] lg:h-[600px]'}`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Canvas Area */}
            <div className="w-full h-full bg-white relative">
                {/* Grid Background Pattern - Subtle & Crisp */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                <canvas
                    ref={canvasRef}
                    className="w-full h-full block cursor-crosshair relative z-10"
                    aria-label="Whiteboard canvas"
                />
            </div>

            {/* Floating Controls Overlay - Solid Toolbar */}
            <div className={`
                absolute bottom-6 left-1/2 transform -translate-x-1/2 
                flex items-center gap-1 p-1.5 rounded-xl 
                bg-white shadow-lg border border-slate-200 
                transition-all duration-200 z-20
                ${showControls || !isPlaying ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>
                <button
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-all active:scale-95"
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
                </button>

                <button
                    onClick={handleReplay}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
                    title="Replay"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1"></div>

                <button
                    onClick={() => setSpeed(s => s === 1 ? 2 : s === 2 ? 0.5 : 1)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all text-xs font-bold min-w-[3.5rem] flex items-center justify-center"
                    title="Playback Speed"
                >
                    {speed}x
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1"></div>

                <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
                    title="Download Snapshot"
                >
                    <Download className="w-5 h-5" />
                </button>

                <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Progress Bar - Crisp */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 z-20 border-t border-slate-100">
                <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Enhanced Empty State Overlay */}
            {totalCommands === 0 && canvasReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white pointer-events-none z-10">
                    <div className="max-w-md text-center space-y-4 px-6">
                        {/* Animated Icon */}
                        <div className="relative mx-auto w-20 h-20 mb-2">
                            <div className="absolute inset-0 animate-pulse">
                                <div className="w-full h-full rounded-3xl bg-blue-100 opacity-40" />
                            </div>
                            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center">
                                <PenTool className="w-10 h-10 text-white animate-bounce" style={{animationDuration: '2s'}} />
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <h3 className="text-slate-900 font-bold text-xl">Visual Whiteboard Ready</h3>
                            <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
                                The AI Tutor will draw diagrams and animations here when explaining visual concepts
                            </p>
                        </div>

                        {/* Hints */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ask the AI to:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                                    "Show me visually"
                                </span>
                                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                                    "Draw a diagram"
                                </span>
                                <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-100">
                                    "Animate this"
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

Whiteboard.propTypes = {
    commands: PropTypes.array,
    isVisible: PropTypes.bool,
    autoPlay: PropTypes.bool,
    onComplete: PropTypes.func,
    className: PropTypes.string
};

export default Whiteboard;
