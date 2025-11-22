import React, { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { WhiteboardAnimator } from '../utils/WhiteboardAnimator';
import { CommandParser } from '../utils/CommandParser';
import {
  VIRTUAL_CANVAS,
  getResponsiveCanvasDimensions,
  isMobileDevice,
  debounce,
  getExportFilename,
  parseSpeed
} from '../utils/whiteboardUtils';
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
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [totalCommands, setTotalCommands] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);

  /**
   * Initialize canvas and animator
   */
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Set canvas dimensions
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const isMobile = isMobileDevice();
      const dimensions = getResponsiveCanvasDimensions(rect.width, rect.height, isMobile);

      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // Reinitialize animator with new dimensions
      if (animatorRef.current) {
        animatorRef.current.canvas = canvas;
        animatorRef.current.ctx = canvas.getContext('2d');
      }
    };

    updateCanvasSize();

    // Initialize animator
    animatorRef.current = new WhiteboardAnimator(canvas, {
      virtualWidth: VIRTUAL_CANVAS.WIDTH,
      virtualHeight: VIRTUAL_CANVAS.HEIGHT,
      baseAnimationDuration: 500,
      speed: speed,
      onComplete: () => {
        setIsPlaying(false);
        setProgress(100);
        if (onComplete) {
          onComplete();
        }
      },
      onCommandComplete: (currentIndex, total) => {
        setProgress(Math.round(((currentIndex + 1) / total) * 100));
      }
    });

    setCanvasReady(true);

    // Handle window resize
    const handleResize = debounce(() => {
      updateCanvasSize();
      // Redraw if there are commands
      if (animatorRef.current && animatorRef.current.commands.length > 0) {
        handleReplay();
      }
    }, 300);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animatorRef.current) {
        animatorRef.current.stop();
      }
    };
  }, []);

  /**
   * Update speed when changed
   */
  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.setSpeed(speed);
    }
  }, [speed]);

  /**
   * Handle new commands
   */
  useEffect(() => {
    if (!animatorRef.current || !canvasReady || commands.length === 0) return;

    // Validate and add new commands
    const validCommands = commands.filter(cmd => {
      const isValid = CommandParser.validateCommand(cmd);
      if (!isValid) {
        console.warn('Invalid command:', cmd);
      }
      return isValid;
    });

    if (validCommands.length === 0) return;

    // Clear previous commands and add new ones
    animatorRef.current.clearCommands();
    animatorRef.current.addCommands(validCommands);
    setTotalCommands(validCommands.length);
    setProgress(0);

    // Auto-play if enabled
    if (autoPlay && isVisible) {
      handlePlay();
    }
  }, [commands, canvasReady, autoPlay, isVisible]);

  /**
   * Play animation
   */
  const handlePlay = useCallback(async () => {
    if (!animatorRef.current) return;

    setIsPlaying(true);
    setIsPaused(false);
    await animatorRef.current.play();
  }, []);

  /**
   * Pause animation
   */
  const handlePause = useCallback(() => {
    if (!animatorRef.current) return;

    animatorRef.current.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  /**
   * Replay animation from start
   */
  const handleReplay = useCallback(() => {
    if (!animatorRef.current) return;

    setProgress(0);
    animatorRef.current.replay();
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  /**
   * Clear whiteboard
   */
  const handleClear = useCallback(() => {
    if (!animatorRef.current) return;

    animatorRef.current.clearCanvas();
    animatorRef.current.clearCommands();
    setProgress(0);
    setTotalCommands(0);
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  /**
   * Download as PNG
   */
  const handleDownload = useCallback(() => {
    if (!animatorRef.current) return;

    const filename = getExportFilename('whiteboard');
    animatorRef.current.downloadImage(filename);
  }, []);

  /**
   * Handle speed change
   */
  const handleSpeedChange = useCallback((newSpeed) => {
    const parsedSpeed = parseSpeed(newSpeed);
    setSpeed(parsedSpeed);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`whiteboard-container ${className}`}>
      <div className="whiteboard-header">
        <h3 className="whiteboard-title">Visual Explanation</h3>
        <div className="whiteboard-progress">
          {totalCommands > 0 && (
            <span className="progress-text">
              Progress: {progress}%
            </span>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="whiteboard-canvas-wrapper"
      >
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
        />
      </div>

      <div className="whiteboard-controls">
        <div className="control-group playback-controls">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="control-btn play-btn"
              disabled={totalCommands === 0}
              title="Play"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Play</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="control-btn pause-btn"
              title="Pause"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleReplay}
            className="control-btn replay-btn"
            disabled={totalCommands === 0}
            title="Replay"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>Replay</span>
          </button>

          <button
            onClick={handleClear}
            className="control-btn clear-btn"
            disabled={totalCommands === 0}
            title="Clear"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Clear</span>
          </button>
        </div>

        <div className="control-group speed-controls">
          <label className="speed-label">Speed:</label>
          <button
            onClick={() => handleSpeedChange(0.5)}
            className={`speed-btn ${speed === 0.5 ? 'active' : ''}`}
          >
            0.5x
          </button>
          <button
            onClick={() => handleSpeedChange(1)}
            className={`speed-btn ${speed === 1 ? 'active' : ''}`}
          >
            1x
          </button>
          <button
            onClick={() => handleSpeedChange(2)}
            className={`speed-btn ${speed === 2 ? 'active' : ''}`}
          >
            2x
          </button>
        </div>

        <div className="control-group download-controls">
          <button
            onClick={handleDownload}
            className="control-btn download-btn"
            disabled={totalCommands === 0}
            title="Download as PNG"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download</span>
          </button>
        </div>
      </div>

      {totalCommands === 0 && canvasReady && (
        <div className="whiteboard-empty-state">
          <p>Waiting for visual content...</p>
        </div>
      )}
    </div>
  );
};

Whiteboard.propTypes = {
  commands: PropTypes.arrayOf(PropTypes.object),
  isVisible: PropTypes.bool,
  autoPlay: PropTypes.bool,
  onComplete: PropTypes.func,
  className: PropTypes.string
};

export default Whiteboard;
