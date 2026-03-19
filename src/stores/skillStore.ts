import { create } from 'zustand'

export type SkillCategory = 'research' | 'coding' | 'communication' | 'data' | 'utility' | 'custom'

export interface Skill {
  id: string
  name: string
  slug: string
  description: string
  longDescription: string
  version: string
  author: string
  category: SkillCategory
  isBuiltIn: boolean
  installed: boolean
  downloads: number
  rating: number
  tags: string[]
}

interface SkillState {
  skills: Skill[]
  installSkill: (id: string) => void
  uninstallSkill: (id: string) => void
}

const seedSkills: Skill[] = [
  {
    id: 'skill_1', name: 'Web Search', slug: 'web-search',
    description: 'Search the web and return structured results from multiple search engines.',
    longDescription: 'Enables agents to perform web searches using Google, Bing, and DuckDuckGo APIs. Returns structured results with titles, snippets, and URLs. Supports advanced query operators and site-specific searches.',
    version: '2.1.0', author: 'Mission Control', category: 'research',
    isBuiltIn: true, installed: true, downloads: 15420, rating: 4.8, tags: ['search', 'web', 'research'],
  },
  {
    id: 'skill_2', name: 'Code Analysis', slug: 'code-analysis',
    description: 'Static code analysis with security scanning, complexity metrics, and style checks.',
    longDescription: 'Comprehensive code analysis tool that performs static analysis, identifies security vulnerabilities (OWASP Top 10), calculates cyclomatic complexity, and enforces style guidelines. Supports JavaScript, TypeScript, Python, Go, and Rust.',
    version: '3.0.1', author: 'Mission Control', category: 'coding',
    isBuiltIn: true, installed: true, downloads: 12300, rating: 4.9, tags: ['code', 'security', 'analysis'],
  },
  {
    id: 'skill_3', name: 'Slack Integration', slug: 'slack-integration',
    description: 'Send messages, react to threads, and manage Slack channels.',
    longDescription: 'Full Slack API integration allowing agents to send formatted messages, reply to threads, add reactions, create channels, and manage permissions. Supports Block Kit for rich message formatting.',
    version: '1.5.2', author: 'Mission Control', category: 'communication',
    isBuiltIn: true, installed: true, downloads: 8900, rating: 4.6, tags: ['slack', 'messaging', 'notifications'],
  },
  {
    id: 'skill_4', name: 'CSV/JSON Parser', slug: 'csv-json-parser',
    description: 'Parse, transform, and analyze CSV and JSON data files.',
    longDescription: 'High-performance data parser for CSV and JSON formats. Supports streaming for large files, schema inference, data validation, and transformations. Can convert between formats and generate summary statistics.',
    version: '1.2.0', author: 'Mission Control', category: 'data',
    isBuiltIn: true, installed: false, downloads: 6700, rating: 4.5, tags: ['csv', 'json', 'data', 'parsing'],
  },
  {
    id: 'skill_5', name: 'Git Operations', slug: 'git-operations',
    description: 'Perform Git operations: branch, commit, merge, and PR management.',
    longDescription: 'Enables agents to interact with Git repositories. Create branches, stage and commit changes, merge branches, manage pull requests, and resolve simple merge conflicts. Integrates with GitHub, GitLab, and Bitbucket APIs.',
    version: '2.3.0', author: 'Mission Control', category: 'coding',
    isBuiltIn: false, installed: true, downloads: 11200, rating: 4.7, tags: ['git', 'github', 'version-control'],
  },
  {
    id: 'skill_6', name: 'Email Sender', slug: 'email-sender',
    description: 'Compose and send emails with templates, attachments, and scheduling.',
    longDescription: 'Full email integration supporting SMTP, SendGrid, and AWS SES. Features include HTML templates, file attachments, CC/BCC, scheduled sending, and delivery tracking. Includes spam score checking before send.',
    version: '1.1.0', author: 'Community', category: 'communication',
    isBuiltIn: false, installed: false, downloads: 4500, rating: 4.3, tags: ['email', 'notifications', 'templates'],
  },
  {
    id: 'skill_7', name: 'Database Query', slug: 'database-query',
    description: 'Execute SQL queries with safety checks and result formatting.',
    longDescription: 'Safe database interaction skill with read-only mode, query validation, injection prevention, result pagination, and export to CSV/JSON. Supports PostgreSQL, MySQL, and SQLite.',
    version: '1.8.0', author: 'Community', category: 'data',
    isBuiltIn: false, installed: false, downloads: 7800, rating: 4.4, tags: ['database', 'sql', 'query'],
  },
  {
    id: 'skill_8', name: 'Test Runner', slug: 'test-runner',
    description: 'Run test suites, collect coverage reports, and format results.',
    longDescription: 'Universal test runner that detects and executes test frameworks (Jest, Vitest, Pytest, Go test). Collects coverage data, identifies flaky tests, and generates human-readable reports with failure analysis.',
    version: '2.0.0', author: 'Mission Control', category: 'coding',
    isBuiltIn: false, installed: true, downloads: 9100, rating: 4.6, tags: ['testing', 'coverage', 'ci'],
  },
  {
    id: 'skill_9', name: 'Document Generator', slug: 'doc-generator',
    description: 'Generate documentation from code: README, API docs, changelogs.',
    longDescription: 'Automatically generates documentation by analyzing code structure. Creates README files, API reference docs (OpenAPI/Swagger), changelogs from git history, and inline documentation suggestions.',
    version: '1.4.0', author: 'Community', category: 'utility',
    isBuiltIn: false, installed: false, downloads: 5200, rating: 4.2, tags: ['documentation', 'readme', 'api-docs'],
  },
  {
    id: 'skill_10', name: 'Image Analysis', slug: 'image-analysis',
    description: 'Analyze images: OCR, object detection, screenshot interpretation.',
    longDescription: 'Multi-modal image analysis skill. Performs OCR text extraction, object/element detection in UI screenshots, diagram interpretation, and image comparison. Useful for visual regression testing and UI review.',
    version: '1.0.0', author: 'Community', category: 'research',
    isBuiltIn: false, installed: false, downloads: 3400, rating: 4.1, tags: ['image', 'ocr', 'vision', 'screenshots'],
  },
  {
    id: 'skill_11', name: 'Cron Scheduler', slug: 'cron-scheduler',
    description: 'Parse, validate, and explain cron expressions with timezone support.',
    longDescription: 'Utility skill for working with cron expressions. Validates syntax, explains schedules in human-readable format, calculates next N run times, and supports timezone conversions. Essential for the Scheduled Jobs feature.',
    version: '1.0.2', author: 'Mission Control', category: 'utility',
    isBuiltIn: true, installed: true, downloads: 4100, rating: 4.5, tags: ['cron', 'scheduling', 'time'],
  },
  {
    id: 'skill_12', name: 'API Client', slug: 'api-client',
    description: 'Make HTTP requests with auth, retries, and response parsing.',
    longDescription: 'General-purpose HTTP client skill for calling REST and GraphQL APIs. Supports OAuth2, API keys, retry with backoff, response schema validation, and automatic pagination. Rate limit aware.',
    version: '2.2.0', author: 'Mission Control', category: 'utility',
    isBuiltIn: false, installed: false, downloads: 8200, rating: 4.7, tags: ['http', 'api', 'rest', 'graphql'],
  },
]

export const useSkillStore = create<SkillState>((set) => ({
  skills: seedSkills,

  installSkill: (id) =>
    set((state) => ({
      skills: state.skills.map((s) =>
        s.id === id ? { ...s, installed: true, downloads: s.downloads + 1 } : s
      ),
    })),

  uninstallSkill: (id) =>
    set((state) => ({
      skills: state.skills.map((s) =>
        s.id === id ? { ...s, installed: false } : s
      ),
    })),
}))
