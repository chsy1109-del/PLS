export interface Place {
  id: string;
  name: string;
  day: number;
  visited: boolean;
  transport: string;
  cost: string;
  description: string;
  category?: string;
  photos?: string[];
  musicLink?: string;
}

export interface TripMetadata {
  destination: string;
  duration: number;
  dayTitles?: Record<number, string>;
}