export type MissionStatus = 'En cours' | 'Livrée';

export interface MissionSummaryData {
  client: string;
  period: string;
  duration: string;
  status: MissionStatus;
  employer: string;
  version: string;
  technologies: readonly string[];
}
