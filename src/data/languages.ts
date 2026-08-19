interface ProjectWithTechnologies {
  technologies: readonly string[];
}

interface LanguageCategory {
  name: string;
  color: `#${string}`;
  technologies: readonly string[];
}

export interface LanguageShare {
  name: string;
  color: `#${string}`;
  percentage: number;
}

const LANGUAGE_CATEGORIES = [
  {
    name: 'Java',
    color: '#b07219',
    technologies: ['Java', 'Spring Boot', 'Hibernate', 'Spring Batch', 'Spring Data JPA', 'MyBatis', 'Lombok', 'Zuul'],
  },
  {
    name: 'TypeScript',
    color: '#3178c6',
    technologies: ['Angular', 'RxJS', 'Ngrx', 'Angular Material', 'npm'],
  },
  {
    name: 'Dockerfile',
    color: '#384d54',
    technologies: ['Docker', 'Docker Compose', 'Kubernetes', 'Openshift', 'Jenkins', 'Gitlab', 'Nexus', 'Bitbucket', 'git'],
  },
  {
    name: 'PLpgSQL',
    color: '#336790',
    technologies: ['PostgreSQL', 'ElasticSearch'],
  },
  {
    name: 'CSS',
    color: '#563d7c',
    technologies: ['Bootstrap'],
  },
] as const satisfies readonly LanguageCategory[];

export function deriveLanguageShares(projects: readonly ProjectWithTechnologies[]): readonly LanguageShare[] {
  const categoryByTechnology = new Map<string, number>(
    LANGUAGE_CATEGORIES.flatMap((category, categoryIndex) =>
      category.technologies.map((technology) => [technology, categoryIndex] as const),
    ),
  );
  const counts = LANGUAGE_CATEGORIES.map(() => 0);

  for (const project of projects) {
    for (const technology of project.technologies) {
      const categoryIndex = categoryByTechnology.get(technology);

      if (categoryIndex !== undefined) {
        counts[categoryIndex] += 1;
      }
    }
  }

  const activeCategories = LANGUAGE_CATEGORIES.map((category, categoryIndex) => ({
    ...category,
    count: counts[categoryIndex],
  })).filter(({ count }) => count > 0);
  const total = activeCategories.reduce((sum, { count }) => sum + count, 0);

  if (total === 0) {
    return [];
  }

  const shares = activeCategories.map((category, categoryIndex) => {
    const exactPercentage = (category.count / total) * 100;

    return {
      ...category,
      categoryIndex,
      percentage: Math.floor(exactPercentage),
      remainder: exactPercentage % 1,
    };
  });
  const percentagePointsToAllocate = 100 - shares.reduce((sum, { percentage }) => sum + percentage, 0);
  const categoriesByRemainder = [...shares].sort(
    (first, second) => second.remainder - first.remainder || first.categoryIndex - second.categoryIndex,
  );

  for (let index = 0; index < percentagePointsToAllocate; index += 1) {
    categoriesByRemainder[index].percentage += 1;
  }

  return shares.map(({ name, color, percentage }) => ({ name, color, percentage }));
}
