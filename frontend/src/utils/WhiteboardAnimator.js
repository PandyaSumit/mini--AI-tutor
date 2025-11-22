/**
 * WhiteboardAnimator.js
 * Animation engine for whiteboard commands with progressive drawing
 */

export class WhiteboardAnimator {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.commands = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.speed = options.speed || 1; // 1x speed
    this.baseAnimationDuration = options.baseAnimationDuration || 500; // ms per element
    this.virtualWidth = options.virtualWidth || 1000;
    this.virtualHeight = options.virtualHeight || 800;
    this.onComplete = options.onComplete || null;
    this.onCommandComplete = options.onCommandComplete || null;
    this.animationFrameId = null;
  }

  /**
   * Add commands to the queue
   */
  addCommands(commands) {
    this.commands.push(...commands);
  }

  /**
   * Clear all commands and reset
   */
  clearCommands() {
    this.commands = [];
    this.currentIndex = 0;
    this.stop();
  }

  /**
   * Start/resume animation
   */
  async play() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.isPaused = false;

    while (this.currentIndex < this.commands.length && this.isPlaying) {
      const command = this.commands[this.currentIndex];
      await this.animateCommand(command);

      if (this.onCommandComplete) {
        this.onCommandComplete(this.currentIndex, this.commands.length);
      }

      this.currentIndex++;
    }

    if (this.currentIndex >= this.commands.length) {
      this.isPlaying = false;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  /**
   * Pause animation
   */
  pause() {
    this.isPlaying = false;
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Stop and reset animation
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Replay from start
   */
  replay() {
    this.stop();
    this.clearCanvas();
    this.play();
  }

  /**
   * Set playback speed
   */
  setSpeed(speed) {
    this.speed = Math.max(0.1, Math.min(5, speed));
  }

  /**
   * Clear the canvas
   */
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Convert virtual coordinates to actual canvas coordinates
   */
  toCanvasCoords(virtualX, virtualY) {
    const scaleX = this.canvas.width / this.virtualWidth;
    const scaleY = this.canvas.height / this.virtualHeight;
    return {
      x: virtualX * scaleX,
      y: virtualY * scaleY,
      scaleX,
      scaleY
    };
  }

  /**
   * Animate a single command
   */
  async animateCommand(command) {
    if (!command || !this.isPlaying) return;

    switch (command.type) {
      case 'RECT':
        await this.animateRect(command);
        break;
      case 'CIRCLE':
        await this.animateCircle(command);
        break;
      case 'LINE':
        await this.animateLine(command);
        break;
      case 'ARROW':
        await this.animateArrow(command);
        break;
      case 'TEXT':
        await this.animateText(command);
        break;
      case 'CURVE':
        await this.animateCurve(command);
        break;
      case 'HIGHLIGHT':
        await this.animateHighlight(command);
        break;
      case 'PAUSE':
        await this.animatePause(command);
        break;
      case 'CLEAR':
        this.clearCanvas();
        break;
      default:
        console.warn('Unknown command type:', command.type);
    }
  }

  /**
   * Animate drawing a rectangle
   */
  async animateRect(command) {
    const { x, y, scaleX, scaleY } = this.toCanvasCoords(command.x, command.y);
    const width = command.width * scaleX;
    const height = command.height * scaleY;

    this.ctx.strokeStyle = command.color;
    this.ctx.lineWidth = 2;

    // Animate rectangle drawing (4 lines)
    const duration = this.baseAnimationDuration / this.speed;
    const startTime = performance.now();

    await new Promise(resolve => {
      const animate = (currentTime) => {
        if (!this.isPlaying) {
          resolve();
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Draw progressively
        this.ctx.beginPath();

        // Top line
        if (progress > 0) {
          const topProgress = Math.min(progress * 4, 1);
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x + width * topProgress, y);
        }

        // Right line
        if (progress > 0.25) {
          const rightProgress = Math.min((progress - 0.25) * 4, 1);
          this.ctx.moveTo(x + width, y);
          this.ctx.lineTo(x + width, y + height * rightProgress);
        }

        // Bottom line
        if (progress > 0.5) {
          const bottomProgress = Math.min((progress - 0.5) * 4, 1);
          this.ctx.moveTo(x + width, y + height);
          this.ctx.lineTo(x + width - width * bottomProgress, y + height);
        }

        // Left line
        if (progress > 0.75) {
          const leftProgress = Math.min((progress - 0.75) * 4, 1);
          this.ctx.moveTo(x, y + height);
          this.ctx.lineTo(x, y + height - height * leftProgress);
        }

        this.ctx.stroke();

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Fill if specified
          if (command.fillColor) {
            this.ctx.fillStyle = command.fillColor;
            this.ctx.fillRect(x, y, width, height);
          }

          // Draw complete rectangle
          this.ctx.strokeRect(x, y, width, height);

          // Draw label
          if (command.label) {
            this.ctx.fillStyle = command.color;
            this.ctx.font = `${14 * scaleY}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(command.label, x + width / 2, y + height / 2);
          }

          resolve();
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * Animate drawing a circle
   */
  async animateCircle(command) {
    const { x, y, scaleX } = this.toCanvasCoords(command.x, command.y);
    const radius = command.radius * scaleX;

    this.ctx.strokeStyle = command.color;
    this.ctx.lineWidth = 2;

    const duration = this.baseAnimationDuration / this.speed;
    const startTime = performance.now();

    await new Promise(resolve => {
      const animate = (currentTime) => {
        if (!this.isPlaying) {
          resolve();
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2 * progress);
        this.ctx.stroke();

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Draw complete circle
          this.ctx.beginPath();
          this.ctx.arc(x, y, radius, 0, Math.PI * 2);

          if (command.fillColor) {
            this.ctx.fillStyle = command.fillColor;
            this.ctx.fill();
          }

          this.ctx.stroke();

          // Draw label
          if (command.label) {
            this.ctx.fillStyle = command.color;
            this.ctx.font = `${14 * scaleX}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(command.label, x, y);
          }

          resolve();
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * Animate drawing a line
   */
  async animateLine(command) {
    const start = this.toCanvasCoords(command.x1, command.y1);
    const end = this.toCanvasCoords(command.x2, command.y2);

    this.ctx.strokeStyle = command.color;
    this.ctx.lineWidth = command.width;

    const duration = this.baseAnimationDuration / this.speed;
    const startTime = performance.now();

    await new Promise(resolve => {
      const animate = (currentTime) => {
        if (!this.isPlaying) {
          resolve();
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentX = start.x + (end.x - start.x) * progress;
        const currentY = start.y + (end.y - start.y) * progress;

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * Animate drawing an arrow
   */
  async animateArrow(command) {
    // First draw the line
    await this.animateLine(command);

    // Then draw arrowhead
    const start = this.toCanvasCoords(command.x1, command.y1);
    const end = this.toCanvasCoords(command.x2, command.y2);

    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 15;

    this.ctx.beginPath();
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.strokeStyle = command.color;
    this.ctx.lineWidth = command.width;
    this.ctx.stroke();
  }

  /**
   * Animate text appearing character by character
   */
  async animateText(command) {
    const { x, y, scaleY } = this.toCanvasCoords(command.x, command.y);
    const fontSize = command.size * scaleY;

    this.ctx.fillStyle = command.color;
    this.ctx.font = `${fontSize}px ${command.font}`;
    this.ctx.textBaseline = 'top';

    const text = command.content;
    const charDuration = (this.baseAnimationDuration / this.speed) / Math.max(text.length, 1);

    for (let i = 0; i <= text.length; i++) {
      if (!this.isPlaying) break;

      const partialText = text.substring(0, i);

      // Clear previous text (rough approximation)
      const textWidth = this.ctx.measureText(text).width;
      this.ctx.clearRect(x - 2, y - 2, textWidth + 4, fontSize + 4);

      this.ctx.fillText(partialText, x, y);

      if (i < text.length) {
        await new Promise(resolve => setTimeout(resolve, charDuration));
      }
    }
  }

  /**
   * Animate bezier curve
   */
  async animateCurve(command) {
    const start = this.toCanvasCoords(command.x1, command.y1);
    const cp1 = this.toCanvasCoords(command.cp1x, command.cp1y);
    const cp2 = this.toCanvasCoords(command.cp2x, command.cp2y);
    const end = this.toCanvasCoords(command.x2, command.y2);

    this.ctx.strokeStyle = command.color;
    this.ctx.lineWidth = command.width;

    const duration = this.baseAnimationDuration / this.speed;
    const startTime = performance.now();

    await new Promise(resolve => {
      const animate = (currentTime) => {
        if (!this.isPlaying) {
          resolve();
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);

        // Draw partial curve
        const t = progress;
        const currentEndX = start.x + (cp1.x - start.x) * t * 3 +
                           (cp2.x - 2 * cp1.x + start.x) * t * t * 3 +
                           (end.x - 3 * cp2.x + 3 * cp1.x - start.x) * t * t * t;
        const currentEndY = start.y + (cp1.y - start.y) * t * 3 +
                           (cp2.y - 2 * cp1.y + start.y) * t * t * 3 +
                           (end.y - 3 * cp2.y + 3 * cp1.y - start.y) * t * t * t;

        this.ctx.bezierCurveTo(
          start.x + (cp1.x - start.x) * t,
          start.y + (cp1.y - start.y) * t,
          cp1.x + (cp2.x - cp1.x) * t,
          cp1.y + (cp2.y - cp1.y) * t,
          currentEndX,
          currentEndY
        );
        this.ctx.stroke();

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Draw complete curve
          this.ctx.beginPath();
          this.ctx.moveTo(start.x, start.y);
          this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
          this.ctx.stroke();
          resolve();
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * Animate highlight box
   */
  async animateHighlight(command) {
    const { x, y, scaleX, scaleY } = this.toCanvasCoords(command.x, command.y);
    const width = command.width * scaleX;
    const height = command.height * scaleY;

    this.ctx.fillStyle = command.color;
    this.ctx.globalAlpha = command.opacity;

    const duration = (this.baseAnimationDuration / 2) / this.speed; // Faster for highlights
    const startTime = performance.now();

    await new Promise(resolve => {
      const animate = (currentTime) => {
        if (!this.isPlaying) {
          resolve();
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentWidth = width * progress;
        const currentHeight = height * progress;

        this.ctx.fillRect(x, y, currentWidth, currentHeight);

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          this.ctx.globalAlpha = 1;
          resolve();
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });

    this.ctx.globalAlpha = 1;
  }

  /**
   * Pause for specified duration
   */
  async animatePause(command) {
    const duration = command.duration / this.speed;
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Export canvas as PNG
   */
  exportAsPNG() {
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Download canvas as image
   */
  downloadImage(filename = 'whiteboard.png') {
    const dataURL = this.exportAsPNG();
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
  }
}

export default WhiteboardAnimator;
