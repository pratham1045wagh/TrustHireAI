/**
 * CredRAG Query Construction Module (Component 3 & 8)
 * Formulates skill-verification-oriented semantic queries and controlled deterministic lexical aliases.
 */

export interface ISkillVerificationQuery {
  originalSkill: string;
  normalizedSkill: string;
  verificationQuery: string;
  lexicalTerms: string[];
}

/**
 * Controlled, domain-specific alias dictionary.
 * Deterministic and bounded — does NOT invent unrelated terms.
 */
const CONTROLLED_SKILL_ALIASES: Record<string, string[]> = {
  // Frontend
  react: ['react', 'react.js', 'reactjs', 'jsx', 'tsx', 'react hooks', 'components'],
  'react.js': ['react', 'react.js', 'reactjs', 'jsx', 'tsx', 'react hooks'],
  reactjs: ['react', 'react.js', 'reactjs', 'jsx', 'tsx'],
  angular: ['angular', 'angular.js', 'angularjs', 'typescript', 'rxjs', 'components'],
  vue: ['vue', 'vue.js', 'vuejs', 'vuex', 'pinia'],
  'vue.js': ['vue', 'vue.js', 'vuejs', 'vuex'],
  nextjs: ['next.js', 'nextjs', 'ssr', 'react'],
  'next.js': ['next.js', 'nextjs', 'ssr', 'react'],
  redux: ['redux', 'redux toolkit', 'rtk', 'state management'],
  tailwind: ['tailwind', 'tailwindcss', 'tailwind css'],
  'tailwind css': ['tailwind', 'tailwindcss', 'tailwind css'],
  html: ['html', 'html5', 'markup', 'semantic html'],
  css: ['css', 'css3', 'flexbox', 'grid', 'responsive design'],
  javascript: ['javascript', 'js', 'es6', 'es2015', 'ecmascript'],
  typescript: ['typescript', 'ts'],

  // Backend
  'node.js': ['node.js', 'nodejs', 'node', 'express', 'npm'],
  nodejs: ['node.js', 'nodejs', 'node', 'express'],
  express: ['express', 'express.js', 'expressjs', 'rest api', 'middleware'],
  'express.js': ['express', 'express.js', 'expressjs', 'rest api'],
  python: ['python', 'python3', 'py', 'django', 'flask', 'fastapi'],
  django: ['django', 'django rest framework', 'drf', 'python'],
  flask: ['flask', 'python', 'rest api'],
  fastapi: ['fastapi', 'asyncio', 'pydantic', 'python'],
  java: ['java', 'jdk', 'jvm', 'spring', 'spring boot'],
  'spring boot': ['spring boot', 'spring', 'java', 'microservices'],
  'c++': ['c++', 'cpp', 'stl'],
  'c#': ['c#', 'csharp', '.net', 'asp.net'],
  go: ['go', 'golang', 'goroutines'],
  golang: ['go', 'golang', 'goroutines'],
  rust: ['rust', 'cargo', 'tokio'],
  php: ['php', 'laravel', 'symfony'],
  ruby: ['ruby', 'ruby on rails', 'rails'],

  // Databases
  mongodb: ['mongodb', 'mongo', 'mongoose', 'nosql', 'document database'],
  postgresql: ['postgresql', 'postgres', 'psql', 'relational database', 'sql'],
  postgres: ['postgresql', 'postgres', 'psql', 'sql'],
  mysql: ['mysql', 'mariadb', 'relational database', 'sql'],
  redis: ['redis', 'caching', 'in-memory database', 'pub/sub'],
  sqlite: ['sqlite', 'embedded database', 'sql'],
  sql: ['sql', 'rdbms', 'queries', 'joins', 'schema design'],
  elasticsearch: ['elasticsearch', 'elastic', 'lucene', 'search engine'],

  // Cloud & DevOps
  aws: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
  docker: ['docker', 'containerization', 'containers', 'dockerfile', 'docker-compose'],
  kubernetes: ['kubernetes', 'k8s', 'kubectl', 'helm', 'pods'],
  git: ['git', 'github', 'gitlab', 'version control', 'commits', 'branching'],
  github: ['git', 'github', 'pull requests', 'ci/cd', 'github actions'],
  'ci/cd': ['ci/cd', 'pipeline', 'jenkins', 'github actions', 'continuous integration'],
  linux: ['linux', 'bash', 'shell', 'unix', 'cli'],
  azure: ['azure', 'microsoft azure', 'cloud'],
  gcp: ['gcp', 'google cloud', 'google cloud platform'],
  'google cloud': ['gcp', 'google cloud', 'google cloud platform'],

  // Architecture & Testing
  graphql: ['graphql', 'apollo', 'queries', 'mutations', 'schema'],
  'rest api': ['rest', 'rest api', 'restful', 'endpoints', 'http'],
  rest: ['rest', 'rest api', 'restful', 'endpoints'],
  microservices: ['microservices', 'service architecture', 'distributed systems'],
  jest: ['jest', 'unit testing', 'test suite', 'mocking'],
  testing: ['testing', 'unit tests', 'integration tests', 'test coverage'],
};

export class QueryBuilder {
  /**
   * Constructs an evidence-seeking query for a given skill
   */
  public static buildQuery(skill: string): ISkillVerificationQuery {
    const rawSkill = (skill || '').trim();
    const normalized = rawSkill.toLowerCase();

    // 1. Structured Skill Verification Query (Requirement 8)
    const verificationQuery = `Evidence demonstrating practical use, implementation, projects, experience or professional application of ${rawSkill}.`;

    // 2. Controlled Lexical Terms
    const aliasSet = new Set<string>();
    aliasSet.add(rawSkill);
    aliasSet.add(normalized);

    // Look up controlled alias dictionary
    const dictionaryMatch = CONTROLLED_SKILL_ALIASES[normalized];
    if (dictionaryMatch) {
      dictionaryMatch.forEach((term) => aliasSet.add(term));
    } else {
      // Deterministic fallback for unlisted skills:
      // generate dot-free, hyphen-free, and space-normalized variations
      const noDots = normalized.replace(/\./g, '');
      const noHyphens = normalized.replace(/-/g, ' ');
      const compact = normalized.replace(/[\s\-_.]/g, '');

      if (noDots !== normalized) aliasSet.add(noDots);
      if (noHyphens !== normalized) aliasSet.add(noHyphens);
      if (compact !== normalized && compact.length >= 3) aliasSet.add(compact);
    }

    return {
      originalSkill: rawSkill,
      normalizedSkill: normalized,
      verificationQuery,
      lexicalTerms: Array.from(aliasSet).filter((t) => t.length > 0),
    };
  }
}
