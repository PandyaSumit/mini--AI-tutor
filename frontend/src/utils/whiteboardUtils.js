/**
 * whiteboardUtils.js
 * Utility functions for whiteboard operations
 */

/**
 * Virtual canvas dimensions (what AI uses)
 */
export const VIRTUAL_CANVAS = {
  WIDTH: 1000,
  HEIGHT: 800
};

/**
 * Convert virtual coordinates to actual canvas coordinates
 */
export const toCanvasCoords = (virtualX, virtualY, canvasWidth, canvasHeight) => {
  const scaleX = canvasWidth / VIRTUAL_CANVAS.WIDTH;
  const scaleY = canvasHeight / VIRTUAL_CANVAS.HEIGHT;

  return {
    x: virtualX * scaleX,
    y: virtualY * scaleY,
    scaleX,
    scaleY
  };
};

/**
 * Convert actual canvas coordinates to virtual coordinates
 */
export const toVirtualCoords = (canvasX, canvasY, canvasWidth, canvasHeight) => {
  const scaleX = VIRTUAL_CANVAS.WIDTH / canvasWidth;
  const scaleY = VIRTUAL_CANVAS.HEIGHT / canvasHeight;

  return {
    x: canvasX * scaleX,
    y: canvasY * scaleY
  };
};

/**
 * Clamp value between min and max
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Get responsive canvas dimensions based on container
 */
export const getResponsiveCanvasDimensions = (containerWidth, containerHeight, isMobile = false) => {
  const aspectRatio = VIRTUAL_CANVAS.WIDTH / VIRTUAL_CANVAS.HEIGHT;

  if (isMobile) {
    // On mobile, make canvas smaller but maintain aspect ratio
    const width = Math.min(containerWidth, 600);
    const height = width / aspectRatio;
    return { width, height };
  }

  // On desktop, use full container width with max height of 600px
  const maxHeight = 600;
  const width = containerWidth;
  const height = Math.min(width / aspectRatio, maxHeight);

  return { width, height };
};

/**
 * Parse color string and return valid CSS color
 */
export const parseColor = (color) => {
  if (!color) return '#000000';

  // Check if it's already a valid hex color
  if (/^#[0-9A-F]{6}$/i.test(color)) {
    return color;
  }

  // Map common color names
  const colorMap = {
    black: '#000000',
    white: '#FFFFFF',
    red: '#FF0000',
    green: '#00FF00',
    blue: '#0000FF',
    yellow: '#FFFF00',
    orange: '#FFA500',
    purple: '#800080',
    pink: '#FFC0CB',
    brown: '#A52A2A',
    gray: '#808080',
    grey: '#808080',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    lime: '#00FF00',
    navy: '#000080',
    teal: '#008080',
    olive: '#808000',
    maroon: '#800000'
  };

  return colorMap[color.toLowerCase()] || color;
};

/**
 * Calculate distance between two points
 */
export const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Linear interpolation between two values
 */
export const lerp = (start, end, t) => {
  return start + (end - start) * t;
};

/**
 * Easing function for smooth animations
 */
export const easeInOutCubic = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Format timestamp for canvas export filename
 */
export const getExportFilename = (prefix = 'whiteboard') => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.png`;
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

/**
 * Debounce function for window resize
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Get canvas context with high DPI support
 */
export const getHighDPIContext = (canvas) => {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Store the actual display size
  const rect = canvas.getBoundingClientRect();

  // Scale the canvas for retina displays
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Scale the context to counter the scaling
  ctx.scale(dpr, dpr);

  // Set CSS size to maintain proper display
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  return ctx;
};

/**
 * Validate whiteboard command
 */
export const isValidCommand = (command) => {
  if (!command || !command.type) return false;

  const validTypes = [
    'RECT', 'CIRCLE', 'LINE', 'ARROW', 'TEXT',
    'CURVE', 'HIGHLIGHT', 'PAUSE', 'CLEAR'
  ];

  return validTypes.includes(command.type.toUpperCase());
};

/**
 * Calculate optimal font size based on canvas scale
 */
export const getScaledFontSize = (baseFontSize, scaleY) => {
  return Math.max(10, Math.min(baseFontSize * scaleY, 72));
};

/**
 * Parse animation speed from user input
 */
export const parseSpeed = (speedValue) => {
  const speed = parseFloat(speedValue);
  return clamp(speed, 0.1, 5);
};

/**
 * Format duration for display
 */
export const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
};

/**
 * Get text metrics for proper positioning
 */
export const getTextMetrics = (ctx, text, fontSize, fontFamily = 'Arial') => {
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);

  return {
    width: metrics.width,
    height: fontSize * 1.2, // Approximate height
    actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || fontSize,
    actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || 0
  };
};

/**
 * Create a safe canvas copy for history/undo
 */
export const cloneCanvas = (originalCanvas) => {
  const clone = document.createElement('canvas');
  clone.width = originalCanvas.width;
  clone.height = originalCanvas.height;
  const ctx = clone.getContext('2d');
  ctx.drawImage(originalCanvas, 0, 0);
  return clone;
};

/**
 * Check if canvas is empty
 */
export const isCanvasEmpty = (canvas) => {
  const ctx = canvas.getContext('2d');
  const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  // Check if all pixels are transparent
  for (let i = 3; i < pixelData.length; i += 4) {
    if (pixelData[i] !== 0) {
      return false;
    }
  }

  return true;
};

export default {
  VIRTUAL_CANVAS,
  toCanvasCoords,
  toVirtualCoords,
  clamp,
  getResponsiveCanvasDimensions,
  parseColor,
  distance,
  lerp,
  easeInOutCubic,
  getExportFilename,
  isMobileDevice,
  debounce,
  getHighDPIContext,
  isValidCommand,
  getScaledFontSize,
  parseSpeed,
  formatDuration,
  getTextMetrics,
  cloneCanvas,
  isCanvasEmpty
};
