export type ServiceType = 'ambulance' | 'fire' | 'police';

export interface Scenario {
  id: number;
  service: ServiceType;
  situation: string;
  hook: string;
  description: string;
  practicePoints: string[];
}

export const scenarios: Scenario[] = [
  {
    id: 1,
    service: 'ambulance',
    situation: 'Mum collapsed in the kitchen',
    hook: 'Would your child know what to tell the ambulance?',
    description:
      'Your child comes home to find you unresponsive on the floor. Bobby will guide them through checking if you\'re breathing, giving the address, and staying calm until help arrives.',
    practicePoints: [
      'Giving their address clearly',
      'Checking for breathing',
      'Staying on the line until help arrives',
    ],
  },
  {
    id: 2,
    service: 'fire',
    situation: 'You wake up and smell smoke',
    hook: 'Get out first? Call first? Do they know?',
    description:
      'It\'s the middle of the night and smoke fills the hallway. Bobby teaches them the right order of actions and how to escape safely.',
    practicePoints: [
      'Getting low and checking doors',
      'Finding the safest exit route',
      'Calling 999 once outside',
    ],
  },
  {
    id: 3,
    service: 'police',
    situation: 'There\'s a stranger in the house',
    hook: 'Could they stay hidden and whisper for help?',
    description:
      'Someone has broken in while the family is home. Bobby helps them understand how to hide, stay quiet, and communicate with emergency services.',
    practicePoints: [
      'Finding a safe hiding spot',
      'Whispering clearly to the operator',
      'Staying hidden until police arrive',
    ],
  },
  {
    id: 4,
    service: 'ambulance',
    situation: 'Grandad fell and won\'t get up',
    hook: 'Can they describe what happened clearly?',
    description:
      'Grandad has had a fall and can\'t move. Bobby guides them through describing the situation, checking for injuries, and keeping Grandad comfortable.',
    practicePoints: [
      'Describing the fall and symptoms',
      'Checking if Grandad is conscious',
      'Keeping him still and warm',
    ],
  },
  {
    id: 5,
    service: 'fire',
    situation: 'The neighbour\'s house is on fire',
    hook: 'Do they know what THEY should do?',
    description:
      'Flames are visible next door. Bobby teaches them to alert their own family, call for help, and stay away from danger.',
    practicePoints: [
      'Alerting adults in their home',
      'Calling 999 with the correct address',
      'Keeping a safe distance',
    ],
  },
  {
    id: 6,
    service: 'ambulance',
    situation: 'Your little brother is choking',
    hook: 'Every second counts. Would they freeze?',
    description:
      'A sibling is choking on food and can\'t breathe. Bobby walks them through recognising the signs and getting help immediately.',
    practicePoints: [
      'Recognising choking signs',
      'Calling 999 immediately',
      'Following operator instructions',
    ],
  },
  {
    id: 7,
    service: 'fire',
    situation: 'Smoke is blocking the way out',
    hook: 'Do they know how to stay safe until help comes?',
    description:
      'The normal exit is blocked by smoke. Bobby teaches them what to do when they can\'t escape and how to signal for help.',
    practicePoints: [
      'Closing doors to block smoke',
      'Signalling from a window',
      'Staying low where air is cleaner',
    ],
  },
  {
    id: 8,
    service: 'police',
    situation: 'You don\'t feel safe at home',
    hook: 'They need to know it\'s okay to ask for help',
    description:
      'Sometimes home doesn\'t feel safe. Bobby gently explains that it\'s okay to reach out and how to talk to someone who can help.',
    practicePoints: [
      'Understanding it\'s not their fault',
      'Knowing who to call for help',
      'Speaking to a trusted adult',
    ],
  },
];
