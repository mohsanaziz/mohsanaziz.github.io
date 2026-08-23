import { countMissionsByEmployer, getCareerDurationInYears, mapMissionsToEmployers } from '@/data/career';
import { cv } from '@/data/cv';
import { deriveLanguageShares } from '@/data/languages';
import { deriveMissionReleases } from '@/data/missions';

const buildDate = new Date();
const employersByMission = mapMissionsToEmployers(cv.professionalExperience.entries, cv.clientProjects.entries);

export const derivedCv = {
  buildDate,
  careerDurationInYears: getCareerDurationInYears(cv.professionalExperience.entries, buildDate),
  languages: deriveLanguageShares(cv.clientProjects.entries),
  missionCountsByEmployer: countMissionsByEmployer(cv.professionalExperience.entries, employersByMission),
  missionReleases: deriveMissionReleases(cv.clientProjects.entries, employersByMission, buildDate),
} as const;
