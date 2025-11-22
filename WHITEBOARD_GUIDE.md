# 🎨 Whiteboard Feature Guide

## Overview

The AI Tutor now includes an interactive whiteboard that creates animated visual explanations for programming concepts, data structures, algorithms, and more!

## ✨ Features

- **Real-time Animation**: Drawings appear progressively with smooth animations
- **Playback Controls**: Play, Pause, Replay animations
- **Speed Control**: Adjust animation speed (0.5x, 1x, 2x)
- **Download**: Export whiteboard as PNG image
- **Responsive**: Works on mobile and desktop
- **Auto-trigger**: Automatically appears when AI uses whiteboard commands

## 🚀 How to Use

### For Users

1. **Start a session**: Navigate to `/session/:id`
2. **Ask a visual question** like:
   - "Explain Python loops"
   - "Show me how arrays work"
   - "Visualize a linked list"
   - "How does binary search work?"
3. **Watch the magic**: The whiteboard will automatically appear and animate!

### Testing the Whiteboard

Click the **"🎨 Test"** button in the header to see a demo animation without asking the AI.

## 🎯 Topics That Trigger Whiteboard

The AI will automatically use whiteboard for:

- **Loops** (for, while) - Shows iteration flow
- **Data Structures** (arrays, lists, trees, graphs, stacks, queues)
- **Algorithms** (sorting, searching) - Step-by-step visualization
- **Functions** - Call stack or flow diagrams
- **Conditionals** - If/else flow
- **Memory** - Variable allocation and pointers
- **Recursion** - Call tree visualization

## 🎨 Whiteboard Commands

The AI generates commands in `[WB]...[/WB]` blocks:

### Available Commands

1. **RECT(x, y, width, height, color, "label", fillColor)**
   - Draws a rectangle with optional label
   - Example: `RECT(100, 100, 200, 80, blue, "Array", lightblue)`

2. **CIRCLE(x, y, radius, color, "label", fillColor)**
   - Draws a circle with optional label
   - Example: `CIRCLE(500, 400, 60, green, "Node", lightgreen)`

3. **LINE(x1, y1, x2, y2, color, width)**
   - Draws a line between two points
   - Example: `LINE(100, 200, 400, 200, black, 2)`

4. **ARROW(x1, y1, x2, y2, color, width)**
   - Draws an arrow with arrowhead
   - Example: `ARROW(300, 200, 500, 200, red, 3)`

5. **TEXT(x, y, "content", color, size, font)**
   - Draws text at position
   - Example: `TEXT(500, 100, "Start Here", black, 20, Arial)`

6. **CURVE(x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, color, width)**
   - Draws bezier curve
   - Example: `CURVE(100, 400, 200, 200, 400, 200, 500, 400, purple, 2)`

7. **HIGHLIGHT(x, y, width, height, color, opacity)**
   - Draws semi-transparent highlight box
   - Example: `HIGHLIGHT(95, 95, 210, 90, yellow, 0.3)`

8. **PAUSE(duration)**
   - Pauses animation for milliseconds
   - Example: `PAUSE(1000)`

9. **CLEAR()**
   - Clears the entire canvas

### Color Names

`black`, `white`, `red`, `green`, `blue`, `yellow`, `orange`, `purple`, `pink`, `brown`, `gray`, `cyan`, `magenta`, `lightblue`, `lightgreen`, `lightyellow`

## 📝 Example AI Response

When you ask "Explain Python for loops", the AI might respond:

```
Let me show you how Python for loops work!

A for loop iterates over a sequence, executing code for each item.

[WB]
TEXT(400, 50, "Python For Loop Flow", blue, 24)
PAUSE(500)
RECT(100, 150, 200, 80, green, "for i in range(4)", lightgreen)
PAUSE(500)
ARROW(300, 190, 450, 190, red, 3)
TEXT(360, 165, "iterate", red, 14)
PAUSE(300)
RECT(500, 150, 150, 70, blue, "i = 0", lightblue)
PAUSE(300)
RECT(500, 240, 150, 70, blue, "i = 1", lightblue)
PAUSE(300)
RECT(500, 330, 150, 70, blue, "i = 2", lightblue)
PAUSE(300)
RECT(500, 420, 150, 70, blue, "i = 3", lightblue)
PAUSE(500)
TEXT(400, 550, "Loop executes 4 times!", purple, 20)
[/WB]

Now, can you tell me what range(4) does?
```

## 🔧 Technical Details

### Virtual Canvas

- Coordinates: 1000 x 800 (virtual)
- Automatically scales to actual screen size
- Origin: (0, 0) = top-left
- Max: (1000, 800) = bottom-right

### Animation Engine

- Uses `requestAnimationFrame` for smooth 60fps
- Progressive drawing (lines draw from start to end)
- Text appears character-by-character
- Shapes animate with stroke progression

### File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Whiteboard.jsx          # Main component
│   │   └── Whiteboard.css          # Styling
│   ├── utils/
│   │   ├── CommandParser.js        # Parses [WB] blocks
│   │   ├── WhiteboardAnimator.js   # Animation engine
│   │   └── whiteboardUtils.js      # Utility functions
│   └── pages/
│       └── SessionDetails.jsx      # Integration
backend/
└── ai/prompts/
    └── tutorPrompts.js              # AI instructions
```

## 🐛 Debugging

Open browser console to see debug logs:

- `🎨 Parsing AI response for whiteboard commands` - Shows parsing
- `📊 Parsed result` - Shows command count
- `✅ Adding whiteboard commands` - Shows commands being added
- `⚠️ No whiteboard commands found` - AI didn't use whiteboard

## 💡 Tips for Best Results

1. **Be specific**: Ask "Explain Python for loops visually" to emphasize visualization
2. **Use visual topics**: Ask about data structures, algorithms, flow
3. **Test first**: Click "🎨 Test" button to verify whiteboard works
4. **Check console**: Look for debug messages if it's not working
5. **Try examples**: "Show me a binary tree", "Visualize bubble sort"

## 🎯 Quick Test Questions

Try asking these to see the whiteboard in action:

- "Explain how Python for loops work"
- "Show me an array with 5 elements"
- "Visualize a linked list with 3 nodes"
- "How does a while loop work?"
- "Draw a binary tree"
- "Show me how bubble sort works"

## 📱 Mobile Support

The whiteboard is fully responsive:
- Canvas scales down on mobile
- Touch-friendly controls
- Swipe-friendly interface
- Large buttons for easy tapping

## 🎨 Controls

- **▶️ Play**: Start/resume animation
- **⏸️ Pause**: Pause current animation
- **🔄 Replay**: Replay from beginning
- **🗑️ Clear**: Clear whiteboard
- **⬇️ Download**: Download as PNG
- **0.5x/1x/2x**: Speed control

## ❓ FAQ

**Q: Why isn't the whiteboard showing?**
A: The AI must generate `[WB]...[/WB]` commands. Try asking more explicitly: "Explain loops with a diagram"

**Q: Can I manually create whiteboard diagrams?**
A: Click the "🎨 Test" button to see a demo. Custom manual diagrams coming soon!

**Q: What topics work best?**
A: Visual concepts like data structures, algorithms, loops, arrays, trees

**Q: Can I download the whiteboard?**
A: Yes! Click the "Download" button to save as PNG

**Q: Does it work on mobile?**
A: Absolutely! Fully responsive and touch-friendly

## 🚀 Next Steps

1. **Test it**: Click "🎨 Test" button
2. **Ask a question**: "Explain Python loops"
3. **Watch the animation**: See it draw in real-time!
4. **Control playback**: Use play/pause/speed controls
5. **Download it**: Save diagrams for later

Enjoy your visual learning experience! 🎉
