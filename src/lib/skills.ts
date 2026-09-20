// A pragmatic skill/keyword dictionary used by the local Demo engine to extract and match.
// Each canonical skill maps to a set of aliases we look for in free text.

export const SKILL_ALIASES: Record<string, string[]> = {
  Python: ['python', 'py', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
  JavaScript: ['javascript', 'js', 'es6', 'node', 'nodejs', 'node.js'],
  TypeScript: ['typescript', 'ts'],
  React: ['react', 'react.js', 'reactjs', 'next.js', 'nextjs'],
  Java: ['java', 'spring', 'spring boot'],
  Go: ['golang', 'go'],
  'C++': ['c++', 'cpp'],
  SQL: ['sql', 'postgres', 'postgresql', 'mysql', 'sqlite'],
  NoSQL: ['mongodb', 'dynamodb', 'cassandra', 'redis', 'nosql'],
  AWS: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
  GCP: ['gcp', 'google cloud', 'bigquery'],
  Azure: ['azure'],
  Docker: ['docker', 'container'],
  Kubernetes: ['kubernetes', 'k8s'],
  'CI/CD': ['ci/cd', 'jenkins', 'github actions', 'gitlab ci', 'circleci'],
  Terraform: ['terraform', 'infrastructure as code', 'iac'],
  'Machine Learning': ['machine learning', 'ml', 'scikit', 'sklearn', 'xgboost'],
  'Deep Learning': ['deep learning', 'pytorch', 'tensorflow', 'keras', 'neural network'],
  NLP: ['nlp', 'natural language', 'llm', 'transformers', 'hugging face'],
  'Data Engineering': ['etl', 'airflow', 'spark', 'kafka', 'data pipeline', 'data engineering'],
  'REST APIs': ['rest', 'restful', 'api', 'apis', 'graphql', 'grpc'],
  Microservices: ['microservice', 'microservices', 'distributed systems'],
  Testing: ['unit test', 'pytest', 'jest', 'testing', 'tdd', 'cypress'],
  'System Design': ['system design', 'architecture', 'scalab', 'high availability'],
  Leadership: ['led', 'lead', 'mentored', 'managed', 'team lead', 'tech lead', 'manager'],
  Agile: ['agile', 'scrum', 'kanban', 'sprint'],
  Security: ['security', 'oauth', 'encryption', 'penetration', 'owasp'],
  'Product Sense': ['product', 'stakeholder', 'roadmap', 'user research'],
  Communication: ['communication', 'presentation', 'documentation', 'cross-functional'],
}

export const DOMAIN_ALIASES: Record<string, string[]> = {
  Fintech: ['fintech', 'payments', 'banking', 'trading', 'financial'],
  Healthcare: ['healthcare', 'health', 'medical', 'clinical', 'hospital'],
  Ecommerce: ['ecommerce', 'e-commerce', 'retail', 'marketplace', 'checkout'],
  'AI/ML': ['ai', 'machine learning', 'ml platform', 'recommendation'],
  SaaS: ['saas', 'b2b', 'enterprise software'],
  Gaming: ['gaming', 'game', 'unity', 'unreal'],
  Logistics: ['logistics', 'supply chain', 'delivery', 'fleet'],
  EdTech: ['edtech', 'education', 'learning platform'],
}

export const ALL_SKILLS = Object.keys(SKILL_ALIASES)
export const ALL_DOMAINS = Object.keys(DOMAIN_ALIASES)

// Cache compiled boundary regexes so we match aliases as whole tokens
// (so "ts" does NOT match "events", "product" does NOT match "production").
const _reCache = new Map<string, RegExp>()
function aliasRe(alias: string): RegExp {
  const key = alias.trim()
  let re = _reCache.get(key)
  if (!re) {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match as a whole token: boundaries are non-alphanumeric, so "aws" matches
    // "AWS." and "AWS)" but not "awsome"; "node.js" still matches (its dot is
    // inside the alias, not a boundary).
    re = new RegExp(`(?<![a-z0-9])${esc}(?![a-z0-9])`, 'i')
    _reCache.set(key, re)
  }
  return re
}

/** True if `alias` appears as a whole token in `text`. */
export function textHasAlias(text: string, alias: string): boolean {
  return aliasRe(alias).test(text)
}

/** Find canonical skills present in a block of text. */
export function detectSkills(text: string): string[] {
  const found: string[] = []
  for (const [skill, aliases] of Object.entries(SKILL_ALIASES)) {
    if (aliases.some((a) => textHasAlias(text, a))) found.push(skill)
  }
  return found
}

export function detectDomains(text: string): string[] {
  const found: string[] = []
  for (const [domain, aliases] of Object.entries(DOMAIN_ALIASES)) {
    if (aliases.some((a) => textHasAlias(text, a))) found.push(domain)
  }
  return found
}
