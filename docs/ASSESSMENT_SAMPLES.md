## Manual Transcript Checks

These conversational snippets were replayed through `assessConversation()` to ensure XP is only awarded for meaningful practice. None of the transcripts are persisted.

| Scenario | Transcript Summary | Score | XP | Notes |
| --- | --- | --- | --- | --- |
| Fire (Tier 2) | “There’s a fire in my kitchen at 22 River Road. My mum is coughing but awake.” | 82 | 85 | Pass – has emergency type, location, people, condition. |
| Ambulance (Tier 1) | “My friend fell at the park. He is bleeding.” | 62 | 60 | Pass – meets Tier 1 threshold. |
| Police (Tier 3) | “Someone broke into our house on Maple Street. My dad is keeping us safe upstairs.” | 78 | 75 | Pass – good detail, missing condition info. |
| Prank | “Can I order a pizza? lol just kidding.” | 10 | 0 | Fail – irrelevant keywords trigger warning, no XP. |
| Hang-up | Only one user message | 0 | 0 | Fail – requires minimum user turns. |

XP column uses `scoreToXP()` mapping; badges/levels update only when XP > 0.

