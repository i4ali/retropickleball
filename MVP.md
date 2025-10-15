# Retro Pickleball MVP - Instant Play Implementation Plan

## Goal
Get a playable 16-bit style pickleball game running in the browser with zero friction - user opens page and plays immediately.

## Technology Stack (Simplified)
- **HTML5 Canvas** for rendering (no framework initially - keep it simple)
- **Vanilla JavaScript/TypeScript** for game logic
- **Vite** for fast dev server and hot reload
- **No backend** - purely client-side for MVP

## Visual Style Target (16-bit SNES Era)
- Green textured court with white court lines
- Pixel art player characters with paddles
- Simple ball sprite with animation
- Score display at top: "PLAYER: 5 - AI: 3"
- Foliage/trees around court perimeter
- Retro pixel font for text

## MVP Implementation Phases

### Phase 1: Project Setup (30 mins)
1. Initialize Vite project with TypeScript
2. Create basic HTML with fullscreen canvas
3. Set up hot reload dev environment
4. Create folder structure: src/, assets/

### Phase 2: Game Loop & Rendering (2 hours)
1. Implement main game loop with requestAnimationFrame
2. Create canvas context and basic rendering functions
3. Build coordinate system (scale canvas to maintain aspect ratio)
4. Add FPS counter for debugging

### Phase 3: Court & Visual Assets (3 hours)
1. Draw pickleball court:
   - Green textured background (use canvas patterns or solid colors)
   - White court lines (service boxes, kitchen line, center line)
   - Net in the middle
   - Simple foliage/trees around perimeter (rectangles/circles for MVP)
2. Create score display at top with retro font style
3. Add basic color palette (16-bit inspired greens, blues, whites)

### Phase 4: Player & Ball Entities (3 hours)
1. **Player class**:
   - Position (x, y)
   - Render as simple rectangular paddle with character sprite (can start with rectangles)
   - Keyboard controls (Arrow keys or A/D for left/right movement)
2. **Ball class**:
   - Position (x, y)
   - Velocity (vx, vy)
   - Render as circle (can add sprite later)
3. Draw both players and ball on court

### Phase 5: Basic Physics (3 hours)
1. Ball movement with velocity
2. Ball bounce off walls (top, bottom, left, right)
3. Ball-paddle collision detection (rectangular collision)
4. Ball speed increases slightly on each paddle hit
5. Simple ball trajectory (no spin for MVP)

### Phase 6: AI Opponent (3 hours)
1. AI paddle tracks ball position
2. Add reaction delay (don't perfectly follow ball)
3. Add miss probability based on ball speed
4. AI moves toward ball's Y position with max speed limit
5. Make AI "good enough" to be challenging but beatable

### Phase 7: Game Rules & Scoring (2 hours)
1. Implement serving mechanic (ball starts from server)
2. Point scoring when ball goes out of bounds
3. Rally scoring to 11 points
4. Win by 2 rules
5. Alternate serves after each point
6. Display score in real-time

### Phase 8: Game States (2 hours)
1. **Start state**: Show "PRESS START" or click to begin
2. **Serving state**: Brief pause before ball is served
3. **Playing state**: Active gameplay
4. **Point won state**: Brief pause, show point animation
5. **Game over state**: Show final score, "PLAY AGAIN" button

### Phase 9: Basic Audio (2 hours)
1. Add simple beep sounds for:
   - Paddle hit
   - Wall bounce
   - Point scored
2. Use Web Audio API or simple HTML5 audio
3. Optional: Add background chiptune music (can use free 8-bit music)
4. Add mute button

### Phase 10: Polish & Playability (2 hours)
1. Adjust ball speed for fun gameplay
2. Fine-tune AI difficulty
3. Add simple particle effects (optional)
4. Test and fix any bugs
5. Make sure it's fun to play!

## File Structure
```
retropickleball/
├── index.html
├── src/
│   ├── main.ts              # Entry point, game loop
│   ├── game.ts              # Game state manager
│   ├── court.ts             # Court rendering
│   ├── player.ts            # Player class
│   ├── ball.ts              # Ball class
│   ├── ai.ts                # AI logic
│   ├── physics.ts           # Collision detection
│   ├── audio.ts             # Sound effects
│   └── types.ts             # TypeScript interfaces
├── assets/
│   └── audio/               # Sound files
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Estimated Timeline
**Total: ~20 hours (2-3 days of focused work)**

## MVP Success Criteria
✅ User opens browser and sees game immediately
✅ Can control paddle with keyboard
✅ AI opponent provides reasonable challenge
✅ Ball physics feel realistic
✅ Score is tracked and displayed
✅ Game ends at 11 points (win by 2)
✅ Can play again after game ends
✅ 16-bit retro visual style
✅ Basic sound effects

## What's NOT in MVP
❌ User accounts/authentication
❌ Score persistence
❌ Multiplayer
❌ Multiple difficulty levels
❌ Advanced graphics/animations
❌ Mobile support
❌ Leaderboards
