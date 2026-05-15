# Testing the Interaction Mode System

## Prerequisites

Make sure you have Node.js installed (version 20 or higher recommended).

## Step 1: Install Dependencies

```bash
cd /Users/jamescovert/metronapolis
npm install
```

## Step 2: Start the Development Server

```bash
npm run dev
```

This will start the Next.js development server, typically at `http://localhost:3000`

## Step 3: Open in Browser

Open your web browser and navigate to:
```
http://localhost:3000
```

## Step 4: Test the Interaction Modes

### Initial State
When the game loads, you'll start in the **Apartment Bedroom** scene.

You should see:
- **Top-left**: Minimap, location info, time display, loop counter
- **Bottom-right**: Options panel with:
  - Mode selector buttons (Boot, Eye, Mouth, Hand icons)
  - ACTIONS section (should say "Select an interaction mode above")
  - MOVE section (D-pad for navigation)

### Testing WALK Mode 🚶

1. **Click the Boot icon** (first button in mode selector)
2. The button should glow with a cyan/teal color
3. Your cursor should change to a **crosshair**
4. In the MOVE section, you should see:
   - **E** button enabled (to go to living room)
5. Click the **E** button to move to the living room
6. You should transition to the next scene

### Testing EXAMINE Mode 🔍

1. Go back to the bedroom (or stay in any scene)
2. **Click the Eye icon** (second button in mode selector)
3. The button should glow with an orange/yellow color
4. Your cursor should change to a **zoom-in** cursor
5. In the ACTIONS section, you should now see:
   - "Examine the window."
   - "Examine the bed."
   - "Examine the desk."
   - "Examine the cat." (if the cat is present)
6. Click any examine option
7. A detailed examination window should appear with description
8. Close the window to continue

### Testing TALK Mode 💬

1. **Click the Mouth icon** (third button in mode selector)
2. The button should glow with a blue color
3. Your cursor should change to a **cell** cursor
4. In the ACTIONS section, you should see:
   - "Try to talk to the cat." (if the cat is present)
   - Otherwise, no actions available
5. Click the talk option
6. You should see a message appear at the top of the screen

### Testing TAKE Mode ✋

1. **Click the Hand icon** (fourth button in mode selector)
2. The button should glow with a pink/magenta color
3. Your cursor should change to a **grab** cursor
4. In the ACTIONS section, you should see:
   - "Take the notebook from the desk." (if you haven't taken it yet)
5. Click the take option
6. You should see a message: "You take the notebook..."
7. Check your inventory (click INVENTORY button in top-left panel)
8. The notebook should appear in your inventory
9. If you select TAKE mode again, the notebook option should be gone

### Testing Mode Clearing

1. Select any mode (the button glows)
2. **Click the CLEAR button** (to the right of mode buttons)
3. The mode should deselect
4. Your cursor should return to normal
5. The ACTIONS section should say "Select an interaction mode above"

### Testing in Street Scene

1. Navigate to the street (from bedroom → living room → exit to street)
2. You should be in the **Street Front** scene
3. Test all four modes again:
   - **WALK**: Navigate to alley or sidewalk
   - **EXAMINE**: Building, street, neon signs, parked car
   - **TALK**: Try to talk to passerby
   - **TAKE**: Pick up credit chips (if not already taken)

## Expected Behavior Checklist

- [ ] Mode buttons are visible in bottom-right panel
- [ ] Clicking a mode button makes it glow
- [ ] Cursor changes for each mode
- [ ] Actions filter based on selected mode
- [ ] "Select an interaction mode above" shows when no mode is active
- [ ] WALK mode shows movement options
- [ ] EXAMINE mode opens detailed windows
- [ ] TALK mode shows dialogue/messages
- [ ] TAKE mode adds items to inventory
- [ ] Items disappear after being taken
- [ ] CLEAR button deselects mode
- [ ] Time advances with each action
- [ ] Mode selector always visible (doesn't disappear)

## Troubleshooting

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### Port 3000 already in use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
# Then run npm run dev again
```

### Changes not appearing
- Hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check the terminal for any error messages
- Make sure the dev server is running

### Mode buttons not working
- Check browser console (F12) for JavaScript errors
- Verify InteractionModeContext is properly wrapped in app/page.tsx
- Ensure all imports are correct

### Options not filtering
- Check that options have the `modes` field defined
- Verify OptionsPanel is using the updated filtering logic
- Look for console errors

## Debug Mode

To see additional debug information:

1. Open browser developer tools (F12)
2. Go to Console tab
3. You should see any errors or warnings
4. Check the React DevTools extension to inspect component state

## Testing Different Scenarios

### Test Conditional Options

1. **Cat presence**: The cat moves between scenes based on time
   - Wait for time to advance (or manually advance time)
   - Cat-related options should appear/disappear

2. **Item collection**: 
   - Take the notebook in bedroom
   - Option should disappear
   - Check inventory to confirm

3. **Time-based changes**:
   - In Street Front, descriptions change based on time of day
   - Wait for time to advance or trigger time changes

### Test Edge Cases

1. **No mode selected**: Should show helpful message
2. **Mode selected but no actions**: Should show "(no actions available)"
3. **Multiple modes**: Switching between modes should work smoothly
4. **After action**: Mode should stay active (or clear, depending on implementation)

## Performance Testing

- Mode switching should be instant
- No lag when filtering options
- Cursor changes should be immediate
- UI should remain responsive

## Visual Testing

- Mode buttons should have clear active states
- Colors should be distinct for each mode
- Text should be readable
- Layout should not break at different screen sizes

## Success Criteria

The interaction mode system is working correctly if:

1. ✅ All four modes can be selected
2. ✅ Cursor changes appropriately
3. ✅ Options filter correctly per mode
4. ✅ Actions execute and provide feedback
5. ✅ Items are added to inventory
6. ✅ Examine windows open with descriptions
7. ✅ Movement works between scenes
8. ✅ Time advances with actions
9. ✅ UI is always visible and responsive
10. ✅ No console errors appear

## Next Steps After Testing

If everything works:
1. Add mode-based interactions to more scenes
2. Create more examine targets
3. Implement dialogue trees for TALK mode
4. Add more collectible items

If issues are found:
1. Note the specific issue
2. Check browser console for errors
3. Verify the implementation in the relevant files
4. Refer to INTERACTION_MODES.md for guidance
