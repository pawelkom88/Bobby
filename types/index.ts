/**
 * Type definitions for Bobby app
 */

export type AgeTier = 1 | 2 | 3;

export type Service = 'fire' | 'ambulance' | 'police';

export interface AgeTierConfig {
  id: AgeTier;
  label: string;
  minAge: number;
  maxAge: number;
  description: string;
}

export interface Situation {
  id: Service;
  label: string;
  icon: string;
}

export interface Conversation {
  timestamp: string;
  service: Service;
  ageTier: AgeTier;
  xpEarned: number;
}

export interface Badge {
  id: string;
  name: string;
  levelEarned: number;
  timestamp?: string;
}

export interface UserSettings {
  subtitles: boolean;
  slowedSpeech: boolean;
  reducedSensory: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  colorMode: 'default' | 'high-contrast';
  dyslexiaFont: boolean;
}

export interface UserData {
  userName: string;
  totalXP: number;
  level: number;
  conversations: Conversation[];
  badges: Badge[];
  settings: UserSettings;
}

export interface PerformanceMetrics {
  completed?: boolean;
  clearCommunication?: boolean;
  stayedCalm?: boolean;
}

export interface SpeechRecognitionResult {
  final: string;
  interim: string;
}

export interface LevelUpResult {
  newLevel: number;
  leveledUp: boolean;
  badgeAwarded: Badge | null;
  totalXP: number;
}

export interface AgentConnection {
  agentId: string;
  client: any;
  connected: boolean;
}

export interface AgentResponse {
  audio: Blob | string | null;
  text: string;
  timestamp: string;
}

