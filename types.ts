import { Content } from "@google/genai";

export enum GameState {
  INTRO = 'INTRO',
  WARP_ANIMATION = 'WARP_ANIMATION',
  TALENT_GACHA = 'TALENT_GACHA',
  TALENT_REVEAL = 'TALENT_REVEAL',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  PLAYING = 'PLAYING',
  VICTORY = 'VICTORY'
}

export interface Outfit {
  id: string;
  name: string;
  description: string;
  powerName: string; 
  powerEffect: string; 
  image: string; 
  style: string; 
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  worldSetting: string; 
  introText: string;
  goal: string;
}

export interface MaleLead {
  id: string;
  name: string;
  species: string; 
  archetype: string; 
  appearance: string;
  personality: string; 
  obsessionType: string; 
  image: string;
  favorability: number; 
  pregnancy: number; 
  haremStatus: '陌生人' | '敌对' | '侍君' | '皇夫';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// For LocalStorage
export interface SaveData {
  selectedOutfit: Outfit;
  selectedLeads: MaleLead[];
  messages: ChatMessage[];
  chatHistory: Content[]; // Gemini API format history
  customImages: Record<string, string>; // Map leadId to base64 string
}