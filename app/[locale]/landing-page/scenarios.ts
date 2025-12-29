export type ServiceType = 'ambulance' | 'fire' | 'police';

export interface Scenario {
  id: number;
  service: ServiceType;
  situation: string;
  hook: string;
  description: string;
  practicePoints: string[];
}

export interface ScenarioId {
  id: number;
  service: ServiceType;
}

export const scenarioIds: ScenarioId[] = [
  { id: 1, service: 'ambulance' },
  { id: 2, service: 'fire' },
  { id: 3, service: 'police' },
  { id: 4, service: 'ambulance' },
  { id: 5, service: 'fire' },
  { id: 6, service: 'ambulance' },
];
