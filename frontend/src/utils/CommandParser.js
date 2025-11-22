/**
 * CommandParser.js
 * Parses AI responses containing whiteboard commands in [WB]...[/WB] format
 */

export class CommandParser {
  /**
   * Extracts whiteboard commands from AI response text
   * @param {string} text - The full AI response text
   * @returns {Object} - { textContent: string, whiteboardCommands: Array }
   */
  static parseResponse(text) {
    if (!text) {
      return { textContent: '', whiteboardCommands: [] };
    }

    const wbRegex = /\[WB\]([\s\S]*?)\[\/WB\]/g;
    let whiteboardContent = '';
    let textContent = text;

    // Extract all whiteboard blocks
    const matches = [...text.matchAll(wbRegex)];

    if (matches.length > 0) {
      matches.forEach(match => {
        whiteboardContent += match[1] + '\n';
        // Remove whiteboard blocks from text content
        textContent = textContent.replace(match[0], '');
      });
    }

    const commands = whiteboardContent.trim()
      ? this.parseCommands(whiteboardContent.trim())
      : [];

    return {
      textContent: textContent.trim(),
      whiteboardCommands: commands,
      hasWhiteboard: commands.length > 0
    };
  }

  /**
   * Parse individual whiteboard commands from the extracted content
   * @param {string} content - Whiteboard command content
   * @returns {Array} - Array of parsed command objects
   */
  static parseCommands(content) {
    const commands = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    for (const line of lines) {
      const command = this.parseCommandLine(line);
      if (command) {
        commands.push(command);
      }
    }

    return commands;
  }

  /**
   * Parse a single command line
   * @param {string} line - Single command line
   * @returns {Object|null} - Parsed command object or null if invalid
   */
  static parseCommandLine(line) {
    try {
      // Match command pattern: COMMAND(args)
      const match = line.match(/^(\w+)\((.*)\)$/);

      if (!match) {
        console.warn('Invalid command format:', line);
        return null;
      }

      const [, commandType, argsString] = match;
      const args = this.parseArguments(argsString);

      switch (commandType.toUpperCase()) {
        case 'RECT':
          return this.parseRect(args);
        case 'CIRCLE':
          return this.parseCircle(args);
        case 'LINE':
          return this.parseLine(args);
        case 'ARROW':
          return this.parseArrow(args);
        case 'TEXT':
          return this.parseText(args);
        case 'CURVE':
          return this.parseCurve(args);
        case 'HIGHLIGHT':
          return this.parseHighlight(args);
        case 'PAUSE':
          return this.parsePause(args);
        case 'CLEAR':
          return { type: 'CLEAR' };
        default:
          console.warn('Unknown command type:', commandType);
          return null;
      }
    } catch (error) {
      console.error('Error parsing command:', line, error);
      return null;
    }
  }

  /**
   * Parse arguments from command string
   * Handles quoted strings and comma-separated values
   */
  static parseArguments(argsString) {
    const args = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if ((char === '"' || char === "'") && (i === 0 || argsString[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = null;
        } else {
          current += char;
        }
      } else if (char === ',' && !inQuotes) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args;
  }

  /**
   * Parse RECT command: RECT(x, y, width, height, color, "label")
   */
  static parseRect(args) {
    if (args.length < 4) return null;

    return {
      type: 'RECT',
      x: parseFloat(args[0]),
      y: parseFloat(args[1]),
      width: parseFloat(args[2]),
      height: parseFloat(args[3]),
      color: args[4] || 'black',
      label: args[5] || '',
      fillColor: args[6] || null
    };
  }

  /**
   * Parse CIRCLE command: CIRCLE(x, y, radius, color, "label")
   */
  static parseCircle(args) {
    if (args.length < 3) return null;

    return {
      type: 'CIRCLE',
      x: parseFloat(args[0]),
      y: parseFloat(args[1]),
      radius: parseFloat(args[2]),
      color: args[3] || 'black',
      label: args[4] || '',
      fillColor: args[5] || null
    };
  }

  /**
   * Parse LINE command: LINE(x1, y1, x2, y2, color, width)
   */
  static parseLine(args) {
    if (args.length < 4) return null;

    return {
      type: 'LINE',
      x1: parseFloat(args[0]),
      y1: parseFloat(args[1]),
      x2: parseFloat(args[2]),
      y2: parseFloat(args[3]),
      color: args[4] || 'black',
      width: parseFloat(args[5]) || 2
    };
  }

  /**
   * Parse ARROW command: ARROW(x1, y1, x2, y2, color, width)
   */
  static parseArrow(args) {
    if (args.length < 4) return null;

    return {
      type: 'ARROW',
      x1: parseFloat(args[0]),
      y1: parseFloat(args[1]),
      x2: parseFloat(args[2]),
      y2: parseFloat(args[3]),
      color: args[4] || 'black',
      width: parseFloat(args[5]) || 2
    };
  }

  /**
   * Parse TEXT command: TEXT(x, y, "content", color, size)
   */
  static parseText(args) {
    if (args.length < 3) return null;

    return {
      type: 'TEXT',
      x: parseFloat(args[0]),
      y: parseFloat(args[1]),
      content: args[2] || '',
      color: args[3] || 'black',
      size: parseFloat(args[4]) || 16,
      font: args[5] || 'Arial'
    };
  }

  /**
   * Parse CURVE command: CURVE(x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, color, width)
   */
  static parseCurve(args) {
    if (args.length < 8) return null;

    return {
      type: 'CURVE',
      x1: parseFloat(args[0]),
      y1: parseFloat(args[1]),
      cp1x: parseFloat(args[2]),
      cp1y: parseFloat(args[3]),
      cp2x: parseFloat(args[4]),
      cp2y: parseFloat(args[5]),
      x2: parseFloat(args[6]),
      y2: parseFloat(args[7]),
      color: args[8] || 'black',
      width: parseFloat(args[9]) || 2
    };
  }

  /**
   * Parse HIGHLIGHT command: HIGHLIGHT(x, y, width, height, color, opacity)
   */
  static parseHighlight(args) {
    if (args.length < 4) return null;

    return {
      type: 'HIGHLIGHT',
      x: parseFloat(args[0]),
      y: parseFloat(args[1]),
      width: parseFloat(args[2]),
      height: parseFloat(args[3]),
      color: args[4] || 'yellow',
      opacity: parseFloat(args[5]) || 0.3
    };
  }

  /**
   * Parse PAUSE command: PAUSE(duration)
   */
  static parsePause(args) {
    return {
      type: 'PAUSE',
      duration: parseFloat(args[0]) || 500
    };
  }

  /**
   * Validate command coordinates are within virtual canvas bounds
   */
  static validateCommand(command, virtualWidth = 1000, virtualHeight = 800) {
    if (!command) return false;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    switch (command.type) {
      case 'RECT':
      case 'HIGHLIGHT':
        command.x = clamp(command.x, 0, virtualWidth);
        command.y = clamp(command.y, 0, virtualHeight);
        command.width = Math.min(command.width, virtualWidth - command.x);
        command.height = Math.min(command.height, virtualHeight - command.y);
        break;

      case 'CIRCLE':
        command.x = clamp(command.x, 0, virtualWidth);
        command.y = clamp(command.y, 0, virtualHeight);
        command.radius = Math.min(command.radius, Math.min(command.x, command.y, virtualWidth - command.x, virtualHeight - command.y));
        break;

      case 'LINE':
      case 'ARROW':
        command.x1 = clamp(command.x1, 0, virtualWidth);
        command.y1 = clamp(command.y1, 0, virtualHeight);
        command.x2 = clamp(command.x2, 0, virtualWidth);
        command.y2 = clamp(command.y2, 0, virtualHeight);
        break;

      case 'TEXT':
        command.x = clamp(command.x, 0, virtualWidth);
        command.y = clamp(command.y, 0, virtualHeight);
        break;

      case 'CURVE':
        command.x1 = clamp(command.x1, 0, virtualWidth);
        command.y1 = clamp(command.y1, 0, virtualHeight);
        command.x2 = clamp(command.x2, 0, virtualWidth);
        command.y2 = clamp(command.y2, 0, virtualHeight);
        command.cp1x = clamp(command.cp1x, 0, virtualWidth);
        command.cp1y = clamp(command.cp1y, 0, virtualHeight);
        command.cp2x = clamp(command.cp2x, 0, virtualWidth);
        command.cp2y = clamp(command.cp2y, 0, virtualHeight);
        break;

      case 'PAUSE':
      case 'CLEAR':
        // No validation needed
        break;

      default:
        return false;
    }

    return true;
  }
}

export default CommandParser;
