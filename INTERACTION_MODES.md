# Interaction Mode System

## Overview

The interaction mode system provides a classic point-and-click adventure game interface with four distinct modes: **WALK**, **EXAMINE**, **TALK**, and **TAKE**. Players must select a mode before interacting with objects, NPCs, or locations in the game world.

## Architecture

### Core Components

1. **InteractionModeContext** ([`app/components/InteractionModeContext.tsx`](app/components/InteractionModeContext.tsx))
   - Manages the current interaction mode state
   - Provides mode switching and clearing functions
   - Handles cursor feedback based on active mode
   - Exports `useInteractionMode()` hook

2. **InteractionModeSelector** ([`app/components/InteractionModeSelector.tsx`](app/components/InteractionModeSelector.tsx))
   - Standalone UI component for mode selection (not currently used in HUD)
   - Displays all four modes with visual feedback
   - Shows active mode indicator

3. **OptionsPanel** ([`app/components/OptionsPanel.tsx`](app/components/OptionsPanel.tsx))
   - Integrated mode selector buttons (WALK, EXAMINE, TALK, TAKE icons)
   - Filters available actions based on active mode
   - Displays movement D-pad and action buttons

4. **OptionsContext** ([`app/components/OptionsContext.tsx`](app/components/OptionsContext.tsx))
   - Extended `PlayerOption` type with `modes?: InteractionMode[]` field
   - Options without `modes` field are always available
   - Options with `modes` field only appear when matching mode is active

## The Four Modes

### 🚶 WALK Mode
**Purpose**: Navigate between locations and scenes

**Cursor**: Crosshair

**Usage**:
```typescript
{
  id: "bedroom-to-living",
  kind: "move",
  dir: "e",
  label: "Step into the living room.",
  onSelect: () => goToScene("apt-living"),
  modes: ["walk"],
}
```

**Best Practices**:
- Use for scene transitions
- Always specify `kind: "move"` and `dir` for movement options
- Keep labels action-oriented ("Walk to...", "Step into...", "Go to...")

---

### 🔍 EXAMINE Mode
**Purpose**: Inspect objects, environments, and gather information

**Cursor**: Zoom-in

**Usage**:
```typescript
{
  id: "bedroom-examine-window",
  kind: "action",
  label: "Examine the window.",
  onSelect: () => {
    advanceTime(TIME.DEFAULT_ACTION);
    openExamine({
      id: "bedroom-window",
      title: "The Window",
      body: "Detailed description of what you see...",
    });
  },
  modes: ["examine"],
}
```

**Best Practices**:
- Use for environmental storytelling
- Provide rich, atmospheric descriptions
- Can reveal clues or hidden information
- Should always advance time
- Use `openExamine()` from `ExamineContext`

---

### 💬 TALK Mode
**Purpose**: Initiate dialogue with NPCs

**Cursor**: Cell (speech bubble style)

**Usage**:
```typescript
{
  id: "bedroom-talk-cat",
  kind: "action",
  label: "Try to talk to the cat.",
  onSelect: () => {
    advanceTime(TIME.DEFAULT_ACTION);
    pushMessage("The cat stares silently...");
    // Or open dialogue tree
  },
  modes: ["talk"],
}
```

**Best Practices**:
- Only show for NPCs or interactive characters
- Can trigger dialogue trees or simple messages
- Should advance time
- Consider NPC availability and state

---

### ✋ TAKE Mode
**Purpose**: Collect items into inventory

**Cursor**: Grab

**Usage**:
```typescript
{
  id: "bedroom-take-notebook",
  kind: "action",
  label: "Take the notebook from the desk.",
  onSelect: () => {
    advanceTime(TIME.DEFAULT_ACTION);
    addItem({
      id: "notebook",
      name: "Detective's Notebook",
      description: "A worn notebook for tracking clues.",
      icon: "📓",
    });
    pushMessage("You take the notebook.");
  },
  modes: ["take"],
}
```

**Best Practices**:
- Check if item already collected: `if (!hasItem("notebook"))`
- Remove option after item is taken
- Always advance time
- Provide feedback via `pushMessage()`
- Use `addItem()` from `LoopStateContext`

## Implementation Guide

### Step 1: Import Required Hooks

```typescript
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import type { PlayerOption } from "../OptionsContext";
```

### Step 2: Set Up Scene State

```typescript
export default function YourScene() {
  const { 
    advanceTime, 
    goToScene, 
    timeMinutes, 
    flags, 
    setFlags,
    addItem,
    hasItem,
    pushMessage 
  } = useLoopState();
  
  const { openExamine } = useExamine();
  
  // Scene-specific state
  const hasNotebook = hasItem("notebook");
  const npcPresent = checkNpcLocation(timeMinutes) === "your-scene";
```

### Step 3: Create Mode-Specific Actions

```typescript
// WALK actions
const goToNextRoom = () => {
  advanceTime(TIME.DEFAULT_ACTION);
  goToScene("next-room");
};

// EXAMINE actions
const examineObject = () => {
  advanceTime(TIME.DEFAULT_ACTION);
  openExamine({
    id: "object-id",
    title: "Object Name",
    body: "Detailed description...",
  });
};

// TALK actions
const talkToNpc = () => {
  advanceTime(TIME.DEFAULT_ACTION);
  // Open dialogue or show message
};

// TAKE actions
const takeItem = () => {
  advanceTime(TIME.DEFAULT_ACTION);
  addItem({ id: "item-id", name: "Item", description: "...", icon: "🔑" });
  pushMessage("You take the item.");
};
```

### Step 4: Build Options Array

```typescript
const options: PlayerOption[] = [
  // WALK mode options
  {
    id: "scene-move-north",
    kind: "move",
    dir: "n",
    label: "Walk north.",
    onSelect: goToNextRoom,
    modes: ["walk"],
  },

  // EXAMINE mode options
  {
    id: "scene-examine-desk",
    kind: "action",
    label: "Examine the desk.",
    onSelect: examineObject,
    modes: ["examine"],
  },

  // TALK mode options (conditional)
  ...(npcPresent ? [{
    id: "scene-talk-npc",
    kind: "action",
    label: "Talk to the NPC.",
    onSelect: talkToNpc,
    modes: ["talk"],
  }] : []),

  // TAKE mode options (conditional)
  ...(!hasNotebook ? [{
    id: "scene-take-notebook",
    kind: "action",
    label: "Take the notebook.",
    onSelect: takeItem,
    modes: ["take"],
  }] : []),
];
```

### Step 5: Pass to BaseScene

```typescript
return (
  <BaseScene
    id="your-scene"
    title="Scene Title"
    background="/rooms/your-scene.jpg"
    description={description}
    options={options}
    bgNative={{ w: 1920, h: 1080 }}
    spriteScale={1.0}
  />
);
```

## Example Scenes

### Complete Examples

1. **AptBedroom** ([`app/components/scenes/AptBedroom.tsx`](app/components/scenes/AptBedroom.tsx))
   - All 4 modes implemented
   - Conditional cat interactions
   - Item pickup (notebook)
   - Multiple examine targets

2. **StreetFront** ([`app/components/scenes/StreetFront.tsx`](app/components/scenes/StreetFront.tsx))
   - Exterior location example
   - Time-based descriptions (day/night)
   - Environmental examination
   - Credit pickup

## UI Integration

### Mode Selector Location

The mode selector is integrated into the **OptionsPanel** at the bottom-right of the screen:

- **Icon buttons** for each mode (Boot, Eye, Mouth, Hand)
- **Active state** with colored border and glow
- **Clear button** to deselect mode
- **Visual feedback** via cursor changes

### Action Filtering

When a mode is active:
- Only options with matching `modes` array are shown
- Options without `modes` field are always visible
- Movement options (D-pad) are always available regardless of mode

## Design Principles

### 1. **Explicit Interaction**
Players must consciously choose how to interact with the world. This creates intentionality and reduces accidental actions.

### 2. **Mode-Appropriate Actions**
Each mode should feel distinct:
- WALK = spatial navigation
- EXAMINE = information gathering
- TALK = social interaction
- TAKE = resource collection

### 3. **Consistent Time Cost**
Every interaction should advance time using `advanceTime(TIME.DEFAULT_ACTION)` to maintain the time-loop pressure.

### 4. **Contextual Availability**
Options should appear/disappear based on:
- Game state (flags, inventory)
- Time of day
- NPC presence
- Previous actions

### 5. **Clear Feedback**
Always provide feedback for actions:
- Examine opens detailed window
- Take shows message and adds to inventory
- Talk triggers dialogue or message
- Walk transitions to new scene

## Future Enhancements

### Potential Additions

1. **Keyboard Shortcuts**
   - W = Walk mode
   - E = Examine mode
   - T = Talk mode
   - R = Take mode (or G for "Grab")

2. **Mode-Specific Cursor Icons**
   - Custom cursor sprites for each mode
   - Animated cursors for feedback

3. **✅ Hotspot Highlighting** (IMPLEMENTED)
   - Visual indicators show interactive areas when mode is active
   - Different colors per mode (cyan, orange, blue, pink)
   - See [`HOTSPOT_HIGHLIGHTING.md`](HOTSPOT_HIGHLIGHTING.md) for details

4. **Mode Memory**
   - Remember last used mode per scene
   - Smart mode suggestions based on context

5. **Tutorial System**
   - First-time mode introduction
   - Contextual hints for new players

## Troubleshooting

### Options Not Appearing

**Problem**: Options don't show when mode is selected

**Solution**: Check that:
1. Option has correct `modes` array
2. Mode is properly set in InteractionModeContext
3. OptionsPanel is filtering correctly

### Mode Not Clearing

**Problem**: Mode stays active after action

**Solution**: Use `attempt()` helper with `autoClear: true` (default) or manually call `clear()` after action

### Cursor Not Changing

**Problem**: Cursor doesn't reflect active mode

**Solution**: Check that InteractionModeContext's useEffect is running and body.style.cursor is being set

## Testing Checklist

- [ ] All four modes can be selected
- [ ] Mode buttons show active state
- [ ] Cursor changes for each mode
- [ ] Options filter correctly per mode
- [ ] Actions execute and advance time
- [ ] Mode clears after action (if desired)
- [ ] Conditional options appear/disappear correctly
- [ ] Movement works in WALK mode
- [ ] Examine opens detail window
- [ ] Items are added to inventory in TAKE mode
- [ ] Messages display for TALK mode

## Summary

The interaction mode system provides a structured, intentional way for players to interact with the game world. By requiring explicit mode selection, it creates a more deliberate gameplay experience that fits the detective/investigation theme while maintaining the classic point-and-click adventure feel.
