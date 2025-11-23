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

export interface ConversationMessage {
  type: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface Conversation {
  timestamp: string;
  service: Service;
  ageTier: AgeTier;
  xpEarned: number;
  score?: number;
  feedback?: string[];
}

export interface Badge {
  id: string;
  name: string;
  levelEarned?: number;
  description?: string;
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

export interface JourneyState {
  selectedAgeTier?: AgeTier;
  selectedService?: Service;
}

export interface UserData {
  userName: string;
  totalXP: number;
  level: number;
  conversations: Conversation[];
  badges: Badge[];
  settings: UserSettings;
  journey?: JourneyState;
}

export interface AssessmentFeedback {
  positives: string[];
  improvements: string[];
  warnings: string[];
}

export interface ConversationAssessment {
  score: number;
  passed: boolean;
  positives: string[];
  improvements: string[];
  warnings: string[];
  metrics: {
    userTurns: number;
    durationSeconds: number;
  };
}

export interface PerformanceMetrics {
  completed?: boolean;
  clearCommunication?: boolean;
  stayedCalm?: boolean;
  assessment?: ConversationAssessment;
  feedbackSummary?: string[];
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
