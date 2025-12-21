export type DecisionKind = "dialog" | "pickup" | "examine" | "navigate" | "custom";

export type DecisionOutcomeSpec = {
  id: string;              // outcome id within this decision (unique per decision)
  title: string;           // label shown in HUD brevity
  defaultTimeCost: number; // fallback if player hasn't fully explored this outcome yet
};

export type DecisionSpec = {
  id: string;              // globally unique decision id: "dlg_rhea_intro", "nav_hall_to_kitchen"
  title: string;
  kind: DecisionKind;

  outcomes: DecisionOutcomeSpec[]; // 2–5 outcomes
};

export type DecisionEvent = {
  eventId: string;      // unique instance id
  loop: number;         // loopCount at time of decision
  atMinute: number;     // timeMinutes right before applying time cost
  decisionId: string;
  outcomeId: string;

  // the actual time you advanced for this decision (in full or brevity)
  appliedTimeCost: number;

  // optional: helps you draw branching connections
  parentEventId?: string;

  // optional extensibility
  meta?: Record<string, any>;
};

export type DecisionKnowledge = {
  [decisionId: string]: {
    seenOutcomeIds: Record<string, true>;      // set-like
    learnedOutcomeTimeCost: Record<string, number>; // outcomeId -> actual total mins observed for that outcome
  };
};

