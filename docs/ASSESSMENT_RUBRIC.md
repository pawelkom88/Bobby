## Transcript Scoring Rubric

Rule-based heuristic for awarding XP/badges from the Bobby emergency training conversation.

### Inputs
- `conversation`: ordered array of `{ type: 'user' | 'agent'; text: string; timestamp: string }`
- `ageTier`: `1` (4–6), `2` (7–10), `3` (11–13)
- `situation`: `fire | ambulance | police`

### Scoring Buckets (0–100)

| Bucket | Weight | Description |
| --- | --- | --- |
| Emergency Type Clarity | 25 | Mentions correct emergency keywords (fire, ambulance, police-specific). |
| Location Details | 20 | Gives any location clue (home, school, street, address pattern). |
| People Involved | 15 | Mentions who needs help (mom, friend, someone, pet). |
| Condition Status | 15 | Mentions condition (hurt, bleeding, not breathing, unconscious, trapped). |
| Cooperation / Calmness | 10 | Conversation length (≥3 user turns) & no abrupt hang-up. |
| Relevance | 15 | Deduct points if off-topic keywords dominate (pizza, order, prank). |

### Age Tier Expectations
- **Tier 1 (4–6)**: Location + People OR emergency type is sufficient for “pass”.
- **Tier 2 (7–10)**: Expect location + people + simple condition.
- **Tier 3 (11–13)**: Expect more complete info (location + people + condition + emergency clarity).

### Duration / Turns
- Minimum user messages: `tier 1 → 2`, `tier 2 → 3`, `tier 3 → 4`
- Conversation duration threshold: at least 10 seconds between first & last timestamp (if available). If no timestamps, fallback to turn count.

### Relevance Penalties
- If more than 40% of user utterances contain obvious non-emergency intents (“order pizza”, “just testing”, “prank”), set score to ≤15.
- Immediate hang-up (≤1 user message) results in score 0.

### XP Mapping
- `score >= 85` → XP 90–100 (full reward)
- `score 60–84` → XP 60–80 (partial reward)
- `score 30–59` → XP 30–50 (needs improvement)
- `score < 30` → XP 0–20 (no badge progress)

### Feedback Messages
- Positives: highlight met criteria (“You told Bobby who needs help!”)
- Improvements: mention missing info (“Next time, remember to say where you are located.”)
- Off-topic warning if irrelevant keywords detected.

### Privacy
- The raw transcript is analyzed in-memory only.
- No transcript text is stored in localStorage or persisted anywhere after scoring completes.

