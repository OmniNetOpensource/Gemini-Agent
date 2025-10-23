import type { GroundingChunk } from '@google/genai';

export interface SubTask {
  description: string;
  status: 'pending' | 'reflecting' | 'executing' | 'completed' | 'error';
  reflection: string;
  result: string;
  sources: GroundingChunk[];
}
