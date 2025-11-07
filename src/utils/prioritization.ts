import { Station } from '../types';

// Mock data for different pages
const mockStationData: Record<string, number> = {
  'SMT Line 1': 98,
  'SMT Line 2': 95,
  'AOI Station 1': 92,
  'AOI Station 2': 88,
  'X-Ray Inspection': 85,
  'Testing Unit A': 82,
  'Testing Unit B': 78,
  'Mechanical Assembly 1': 75,
  'Mechanical Assembly 2': 72,
  'Final Testing 1': 68,
  'Final Testing 2': 65,
  'Quality Control 1': 62,
  'Quality Control 2': 58,
  'Packaging Line 1': 55,
  'Packaging Line 2': 52,
};

export const prioritizeStations = (stations: Station[]): Promise<Station[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const prioritizedStations = stations.map(station => {
        // Generate a consistent score based on station name or a random score
        const baseScore = mockStationData[station.name] || 50 + Math.random() * 40;
        
        // Add some randomness to make it more realistic
        const variance = Math.random() * 5 - 2.5; // ±2.5 points
        const finalScore = Math.min(100, Math.max(0, baseScore + variance));
        
        return {
          ...station,
          score: Number(finalScore.toFixed(2))
        };
      });
      
      // Sort by score (highest first)
      prioritizedStations.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Update ranks after sorting
      prioritizedStations.forEach((station, index) => {
        station.rank = index + 1;
      });
      
      resolve(prioritizedStations);
    }, 1500);
  });
};