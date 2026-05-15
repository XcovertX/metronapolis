# GAME CONCEPT

Create a surreal, narrative-driven exploration game inspired by classic point-and-click adventures, immersive sims, and looping psychological mystery games.

The player exists inside a repeating world where time advances through every action, movement, and conversation. The game focuses heavily on environmental interaction, branching dialogue, world state changes, and gradual reality distortion across loops.

The experience should begin relatively grounded and understandable, but slowly become stranger, more unsettling, and mechanically unpredictable over time.

---

# MAIN STORY

The player is a specialized futuristic detective that uses a looping technology to relive a day over and over to investigate a crime. This will be the main story, however, the player can choose to do other things.

---

# CORE GAMEPLAY LOOP

The player explores interconnected scenes and interacts with the world through explicit interaction modes:

- WALK
- EXAMINE
- TALK
- TAKE

The currently selected interaction mode changes how clicking objects behaves.

Examples:
- WALK → move to another scene or location
- EXAMINE → inspect objects, reveal clues, hidden details, lore, or secrets
- TALK → initiate dialogue with NPCs
- TAKE → collect items into inventory

Interactions should be contextual and state-driven.

---

# WORLD STRUCTURE

The game world consists of:
- Rooms/scenes
- NPCs
- Interactive objects
- Inventory items
- Time progression
- Global flags/state
- Loop progression state

The world should react dynamically based on:
- Player inventory
- Time of day
- Previous dialogue choices
- NPC states
- Environmental conditions
- Hidden progression variables

The world should feel alive and reactive.


---

# TIME SYSTEM

Every meaningful action consumes time.

Examples:
- Walking between rooms
- Dialogue responses
- Examining major objects
- Using items
- Waiting

Time progression should:
- Change NPC availability
- Unlock/lock events
- Alter dialogue
- Trigger environmental changes
- Advance loop states

The player should feel subtle pressure from time progression.

All events have a time window in which they can happen.
Examples:
- Player show up to the shop at 12:13pm. at 12:14 a boy rides up with a bike an leaves it outside while he shops. From 12:14 to 12:32, the player can steal the bike, which changes how the NPC behaves.
- player crosses the road at 14:52, dies by being runover by a car

Use the point and click adventure aspects to limit the choices so this doesn't become and infinite state machine.

---

# DIALOGUE SYSTEM

Dialogue is node-based and condition-driven.

Requirements:
- Branching dialogue trees
- Conditional responses
- NPC memory/state
- Time costs per response
- Flag mutations
- Inventory-aware dialogue
- Loop-aware dialogue

Dialogue responses may:
- Set flags
- Unlock future options
- Consume items
- Advance time
- Trigger scene changes
- Reveal hidden truths

Dialogue options should evolve across loops as player learns what and what not to say.

---

# GAME FEEL

The atmosphere should combine:
- Mystery
- Psychological unease
- Surrealism
- Discovery
- Slow-burn horror
- Dream logic

The game should feel:
- Quiet
- Immersive
- Reactive
- Dense with hidden meaning

Blade Runner like.

---

# INTERACTION DESIGN

The interface should prioritize:
- Contextual actions
- Minimal UI
- Strong atmosphere
- Immersive interaction

Scene interactions should dynamically populate available actions/options.

The player should feel like they are probing and decoding the world.

As a Time looping detective, he has access to a specialized hud. This hud tech allows him to access shortcuts, review summaries of previous loops, view the game map.

---

# TECHNICAL ARCHITECTURE

Design the system around:
- Centralized interaction state management
- Modular dialogue graphs
- Condition-based logic
- Scene-driven interactions
- Dynamic options/actions
- Inventory/state systems
- Loop persistence
- Event-driven updates

Prefer scalable and extensible architecture.

---

# DESIGN GOALS

The player experience should emphasize:
- Curiosity
- Pattern recognition
- Narrative discovery
- Emotional unease
- Emergent storytelling
- Replayability
- Gradual comprehension

The player should slowly realize the world is far stranger than it first appeared.

# LOOP RULES

The game world operates on a repeating time loop. The loop is one of the core mechanics of the game and must deeply influence exploration, dialogue, progression, and player psychology.

---

# CORE LOOP STRUCTURE

- The world resets after a defined trigger.
- Think Scifi Groundhogs day
- The trigger may initially appear to be time-based, but additional hidden triggers may exist.
- At the start of a new loop:
  - All environmental state resets
  - NPC positions and schedules reset
  - Temporary world events reset
  - Standard object interactions reset

This is a point and click adventure game vesion of the movies Edge of Tomorrow or Groundhogs Day

---

# PERSISTENT ELEMENTS

The following may persist across loops:

- Player knowledge
- Certain unlocked shortcuts that are achieved through gameplay
- Meta progression systems

---

# PLAYER AWARENESS

At first:
- NPCs behave as if the loop is normal reality
- Only the player appears aware of repetition

---

# TIME & RESET CONDITIONS

The loop reset may be triggered by:
- Reaching a specific time
- Player death
- Major narrative events
- Environmental collapse
- Certain forbidden actions
- Hidden instability thresholds

Not all reset causes should be obvious to the player.

---

# MEMORY RULES

The player retains:
- Narrative understanding
- Puzzle solutions
- Meta knowledge
- Learned patterns

The game should reward player memory and observation.

---

# DESIGN GOALS FOR THE LOOP

The loop should create:
- Familiarity
- Mastery
- Unease
- Curiosity
- Obsession
- Pattern recognition
- Narrative layering
- Emergent storytelling

The player should slowly transition from:
“Learning the world”
to
“Learning the rules behind the world.”