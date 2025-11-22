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
            className={`relative bg-white overflow-hidden group ${className} ${isFullscreen ? 'w-full h-screen' : 'w-full h-[500px] lg:h-[600px] rounded-xl'}`}
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

            {/* Empty State Overlay - Clean */}
            {totalCommands === 0 && canvasReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-[1px] pointer-events-none z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4 animate-bounce-subtle">
                        <PenTool className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-lg mb-1">Ready to Draw</h3>
                    <p className="text-slate-500 font-medium mb-6">Waiting for AI explanation...</p>
                    <button 
                        className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-500 hover:text-blue-600 pointer-events-auto transition-all active:scale-95 flex items-center gap-2"
                        onClick={() => window.testWhiteboard && window.testWhiteboard()}
                    >
                        <Play className="w-4 h-4" fill="currentColor" />
                        Run Demo
                    </button>
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
