
export type Mood = 'happy' | 'excited' | 'gossiping' | 'angry' | 'neutral';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Blob {
  data: string;
  mimeType: string;
}
