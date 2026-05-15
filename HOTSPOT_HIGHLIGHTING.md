# Visual Hotspot Highlighting System

## Overview

The Visual Hotspot Highlighting system provides visual feedback to help players discover interaction options in the game world. When a player selects an interaction mode (WALK, EXAMINE, TALK, or TAKE), glowing hotspots appear on the scene to indicate where interactions are available.

## Features

- **Mode-Specific Colors**: Each interaction mode has its own distinctive color scheme
  - 🚶 **WALK**: Cyan/Teal (`rgba(0,255,210,...)`)
  - 🔍 **EXAMINE**: Orange/Yellow (`rgba(255,200,90,...)`)
  - 💬 **TALK**: Blue (`rgba(150,200,255,...)`)
  - ✋ **TAKE**: Pink (`rgba(255,150,200,...)`)

- **Animated Effects**: Hotspots feature pulsing glow animations to draw attention
- **Hover Feedback**: Hovering over a hotspot shows the action label
- **Responsive Scaling**: Hotspots automatically scale with the scene viewport
- **Conditional Display**: Hotspots only appear when their associated mode is active

## Architecture

### Components

#### 1. HotspotHighlight Component
**Location**: [`app/components/HotspotHighlight.tsx`](app/components/HotspotHighlight.tsx)

The core component that renders individual hotspot indicators.

**Props**:
```typescript
{
  x: number;              // Position in image pixels (x-coordinate)
  y: number;              // Position in image pixels (y-coordinate)
  width?: number;         // Hotspot width (default: 80)
  height?: number;        // Hotspot height (default: 80)
  mode: InteractionMode;  // Which mode this hotspot belongs to
  label?: string;         // Label shown on hover
  containerRef: RefObject; // Reference to scene container for scaling
  bgNative: { w, h };     // Native background dimensions
}
```

**Visual Structure**:
- Outer pulsing glow (radial gradient with blur)
- Border ring with mode-specific color
- Inner dot that scales on hover
- Label tooltip on hover

#### 2. Extended PlayerOption Type
**Location**: [`app/components/OptionsContext.tsx`](app/components/OptionsContext.tsx)

The `PlayerOption` type now includes an optional `hotspot` field:

```typescript
export type PlayerOption = {
  id: string;
  label: string;
  onSelect: () => void;
  kind?: OptionKind;
  dir?: "n" | "e" | "s" | "w" | "up" | "down";
  modes?: Exclude<InteractionMode, null>[];
  
  // NEW: Visual hotspot position
  hotspot?: {
    x: number;        // X position in image pixels
    y: number;        // Y position in image pixels
    width?: number;   // Optional width override
    height?: number;  // Optional height override
  };
};
```

#### 3. BaseScene Integration
**Location**: [`app/components/scenes/BaseScene.tsx`](app/components/scenes/BaseScene.tsx)

BaseScene automatically renders hotspots for all options that:
1. Have a `hotspot` field defined
2. Match the currently active interaction mode (or have no mode restriction)

The component filters visible hotspots and renders them as overlays on the scene.

## Implementation Guide

### Adding Hotspots to a Scene

**Step 1**: Define hotspot coordinates for your options

```typescript
const options: PlayerOption[] = [
  {
    id: "examine-desk",
    kind: "action",
    label: "Examine the desk.",
    onSelect: examineDesk,
    modes: ["examine"],
    hotspot: { x: 180, y: 380, width: 100, height: 80 },
  },
  {
    id: "take-key",
    kind: "action",
    label: "Take the key.",
    onSelect: takeKey,
    modes: ["take"],
    hotspot: { x: 200, y: 400, width: 60, height: 40 },
  },
];
```

**Step 2**: Determine hotspot positions

Hotspot coordinates are in **image pixels** relative to the background image's native dimensions (specified in `bgNative`).

**Methods for finding coordinates**:

1. **Image Editor**: Open the background image in an image editor and note pixel coordinates
2. **Browser DevTools**: Use browser inspector to measure positions
3. **Trial and Error**: Start with estimated positions and adjust based on visual feedback

**Tips**:
- Place hotspots at the center of the interactive object
- Use larger hotspots for bigger objects (buildings, furniture)
- Use smaller hotspots for small items (keys, notes)
- Consider visual prominence when sizing hotspots

### Coordinate System

```
(0,0) ─────────────────────► X
  │
  │    Background Image
  │    (bgNative.w × bgNative.h)
  │
  │         ⊙ Hotspot at (x, y)
  │
  ▼
  Y
```

- **Origin**: Top-left corner of the background image
- **Units**: Pixels in the native image resolution
- **Scaling**: Automatically handled by HotspotHighlight component

### Example: AptBedroom Scene

```typescript
// Background: 632×632 pixels
const options: PlayerOption[] = [
  {
    id: "bedroom-examine-window",
    kind: "action",
    label: "Examine the window.",
    onSelect: examineWindow,
    modes: ["examine"],
    hotspot: { x: 120, y: 180, width: 100, height: 80 },
  },
  {
    id: "bedroom-examine-bed",
    kind: "action",
    label: "Examine the bed.",
    onSelect: examineBed,
    modes: ["examine"],
    hotspot: { x: 480, y: 420, width: 120, height: 80 },
  },
  {
    id: "bedroom-take-notebook",
    kind: "action",
    label: "Take the notebook from the desk.",
    onSelect: takeNotebook,
    modes: ["take"],
    hotspot: { x: 180, y: 380, width: 60, height: 40 },
  },
];
```

### Example: StreetFront Scene

```typescript
// Background: 1920×1080 pixels
const options: PlayerOption[] = [
  {
    id: "street-examine-building",
    kind: "action",
    label: "Examine your apartment building.",
    onSelect: examineBuilding,
    modes: ["examine"],
    hotspot: { x: 400, y: 300, width: 200, height: 300 },
  },
  {
    id: "street-take-credits",
    kind: "action",
    label: "Pick up the credit chips near the gutter.",
    onSelect: takeCredits,
    modes: ["take"],
    hotspot: { x: 1100, y: 900, width: 60, height: 40 },
  },
];
```

## Best Practices

### 1. Hotspot Placement
- **Center on object**: Place the hotspot center at the visual center of the interactive object
- **Avoid overlap**: Space hotspots to prevent visual clutter when multiple modes are active
- **Match visual importance**: Larger objects get larger hotspots

### 2. Hotspot Sizing
- **Small items** (keys, notes, coins): 40-60px
- **Medium objects** (furniture, doors): 80-120px
- **Large areas** (buildings, rooms): 150-300px
- **Movement targets**: 60-120px (vertical orientation for doorways)

### 3. Conditional Hotspots
For items that can be picked up only once:

```typescript
if (!hasItem("notebook")) {
  options.push({
    id: "take-notebook",
    kind: "action",
    label: "Take the notebook.",
    onSelect: takeNotebook,
    modes: ["take"],
    hotspot: { x: 180, y: 380, width: 60, height: 40 },
  });
}
```

### 4. Shared Hotspots
Multiple modes can share the same hotspot position:

```typescript
// Cat can be examined or talked to at the same location
const catHotspot = { x: 380, y: 280, width: 80, height: 60 };

options.push(
  {
    id: "examine-cat",
    modes: ["examine"],
    hotspot: catHotspot,
    // ...
  },
  {
    id: "talk-cat",
    modes: ["talk"],
    hotspot: catHotspot,
    // ...
  }
);
```

## Visual Design

### Color Palette

```typescript
const MODE_COLORS = {
  walk: {
    color: "rgba(0,255,210,0.95)",
    glow: "rgba(0,255,210,0.5)",
    border: "rgba(0,255,210,0.8)",
  },
  examine: {
    color: "rgba(255,200,90,0.95)",
    glow: "rgba(255,200,90,0.5)",
    border: "rgba(255,200,90,0.8)",
  },
  talk: {
    color: "rgba(150,200,255,0.95)",
    glow: "rgba(150,200,255,0.5)",
    border: "rgba(150,200,255,0.8)",
  },
  take: {
    color: "rgba(255,150,200,0.95)",
    glow: "rgba(255,150,200,0.5)",
    border: "rgba(255,150,200,0.8)",
  },
};
```

### Animation

Hotspots use a CSS pulse animation:
- **Duration**: 2 seconds
- **Easing**: ease-in-out
- **Loop**: Infinite
- **Effect**: Scale 1.0 → 1.1 → 1.0, Opacity 0.4 → 0.6 → 0.4

### Hover State

When hovering over a hotspot:
- Inner dot scales from 20% to 30% of hotspot size
- Opacity increases
- Label tooltip appears below the hotspot
- Smooth transitions (0.3s ease-out)

## Accessibility

### Visual Clarity
- High contrast colors against typical game backgrounds
- Glowing effects make hotspots visible in both light and dark scenes
- Pulsing animation draws attention without being distracting

### User Feedback
- Hover labels provide clear action descriptions
- Color coding helps players learn mode associations
- Hotspots only appear when relevant (mode-specific)

## Performance Considerations

### Optimization
- Hotspots are only rendered when a mode is active
- Position calculations use `useMemo` to prevent unnecessary recalculations
- Resize listener is properly cleaned up on unmount
- CSS animations are GPU-accelerated (transform, opacity)

### Scaling
- Hotspots automatically scale with viewport size
- Maintains aspect ratio with background image
- Handles letterboxing correctly

## Troubleshooting

### Hotspots Not Appearing

**Problem**: Hotspots don't show when mode is selected

**Solutions**:
1. Verify `hotspot` field is defined on the option
2. Check that `modes` array includes the active mode
3. Ensure BaseScene is receiving the options correctly
4. Confirm InteractionModeContext is providing the mode

### Hotspots in Wrong Position

**Problem**: Hotspots appear in incorrect locations

**Solutions**:
1. Verify coordinates are in image pixels, not screen pixels
2. Check `bgNative` dimensions match the actual background image
3. Ensure coordinates are relative to top-left corner (0,0)
4. Test with different viewport sizes to confirm scaling

### Hotspots Not Scaling

**Problem**: Hotspots don't resize with viewport

**Solutions**:
1. Verify `containerRef` is correctly passed to HotspotHighlight
2. Check that resize event listener is attached
3. Ensure container has proper dimensions

## Future Enhancements

### Potential Additions

1. **Keyboard Toggle**
   - Press H to toggle hotspot visibility
   - Show all hotspots regardless of mode

2. **Accessibility Mode**
   - High contrast hotspot option
   - Larger hotspot sizes
   - Screen reader announcements

3. **Tutorial Integration**
   - Highlight first hotspot in each mode
   - Animated arrows pointing to hotspots
   - First-time player guidance

4. **Advanced Animations**
   - Directional indicators for movement hotspots
   - Icon overlays (eye, hand, mouth icons)
   - Particle effects on interaction

5. **Smart Positioning**
   - Auto-adjust hotspot positions to avoid overlap
   - Cluster nearby hotspots
   - Priority-based visibility

## Testing Checklist

- [ ] Hotspots appear when mode is selected
- [ ] Hotspots disappear when mode is cleared
- [ ] Correct colors for each mode
- [ ] Hotspots scale with viewport resize
- [ ] Hover labels display correctly
- [ ] Animations run smoothly
- [ ] No performance issues with multiple hotspots
- [ ] Conditional hotspots appear/disappear correctly
- [ ] Hotspots positioned accurately on objects
- [ ] Works across different scene sizes

## Summary

The Visual Hotspot Highlighting system significantly improves player discovery of interaction options by providing clear, mode-specific visual feedback. By adding simple `hotspot` coordinates to your `PlayerOption` definitions, you enable an intuitive, visually appealing way for players to explore the game world and understand what actions are available in each interaction mode.
