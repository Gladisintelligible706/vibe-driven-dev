/**
 * Repository Profiler — inspects the codebase and detects its shape.
 *
 * Responsibilities:
 * - Detect languages, frameworks, project type
 * - Check for tests, auth, AI features, events, tracking
 * - Count files and lines of code
 * - Detect CI/CD, design system, monorepo patterns
 */

import fs from "fs-extra";
import path from "node:path";
import type { RepositoryProfile, ProjectType } from "./types.js";

const IGNORE_DIRS = [
  "node_modules",
  "dist",
  "build",
  ".git",
  ".vdd",
  "Bin",
  "coverage",
  ".next",
  ".nuxt",
  "__pycache__",
  ".venv",
  "venv",
];

const SOURCE_EXTENSIONS: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".rb": "ruby",
  ".java": "java",
  ".css": "css",
  ".scss": "css",
  ".less": "css",
  ".html": "html",
  ".vue": "vue",
  ".svelte": "svelte",
};

/**
 * Recursively walk a directory and collect file info.
 */
async function walkDir(
  dirPath: string,
  maxDepth: number = 6,
  currentDepth: number = 0
): Promise<{ files: string[]; dirs: string[] }> {
  const files: string[] = [];
  const dirs: string[] = [];

  if (currentDepth >= maxDepth) return { files, dirs };

  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return { files, dirs };
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.includes(entry.name)) continue;
      if (entry.name.startsWith(".") && entry.name !== ".vdd") continue;
      dirs.push(fullPath);
      const sub = await walkDir(fullPath, maxDepth, currentDepth + 1);
      files.push(...sub.files);
      dirs.push(...sub.dirs);
    } else {
      files.push(fullPath);
    }
  }

  return { files, dirs };
}

/**
 * Count files by extension/language.
 */
function countByLanguage(files: string[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const lang = SOURCE_EXTENSIONS[ext];
    if (lang) {
      counts[lang] = (counts[lang] ?? 0) + 1;
    }
  }

  return counts;
}

/**
 * Check if a file or directory exists.
 */
async function exists(repoPath: string, ...segments: string[]): Promise<boolean> {
  return fs.pathExists(path.join(repoPath, ...segments));
}

/**
 * Detect test framework from dependencies.
 */
function detectTestFramework(allDeps: Record<string, string>): string | null {
  if (allDeps["vitest"]) return "vitest";
  if (allDeps["jest"]) return "jest";
  if (allDeps["mocha"]) return "mocha";
  if (allDeps["ava"]) return "ava";
  if (allDeps["@playwright/test"]) return "playwright";
  if (allDeps["cypress"]) return "cypress";
  return null;
}

/**
 * Detect CI configuration.
 */
async function detectCI(repoPath: string): Promise<string | null> {
  if (await exists(repoPath, ".github", "workflows")) return "github-actions";
  if (await exists(repoPath, ".gitlab-ci.yml")) return "gitlab-ci";
  if (await exists(repoPath, "Jenkinsfile")) return "jenkins";
  if (await exists(repoPath, ".circleci")) return "circleci";
  if (await exists(repoPath, "azure-pipelines.yml")) return "azure-pipelines";
  return null;
}

/**
 * Detect package manager.
 */
async function detectPackageManager(repoPath: string): Promise<string> {
  if (await exists(repoPath, "pnpm-lock.yaml")) return "pnpm";
  if (await exists(repoPath, "yarn.lock")) return "yarn";
  if (await exists(repoPath, "bun.lockb")) return "bun";
  if (await exists(repoPath, "package-lock.json")) return "npm";
  if (await exists(repoPath, "Pipfile")) return "pipenv";
  if (await exists(repoPath, "poetry.lock")) return "poetry";
  if (await exists(repoPath, "go.sum")) return "go";
  if (await exists(repoPath, "Cargo.lock")) return "cargo";
  return "unknown";
}

/**
 * Scan source files for specific patterns.
 */
async function scanForPatterns(
  files: string[],
  patterns: RegExp[],
  sampleSize: number = 200
): Promise<boolean> {
  const sourceFiles = files.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".ts", ".tsx", ".js", ".jsx", ".py", ".go"].includes(ext);
  });

  const sample = sourceFiles.slice(0, sampleSize);

  for (const file of sample) {
    try {
      const content = await fs.readFile(file, "utf-8");
      for (const pattern of patterns) {
        if (pattern.test(content)) return true;
      }
    } catch {
      // skip unreadable files
    }
  }

  return false;
}

/**
 * Build a full repository profile.
 */
export async function profileRepository(repoPath: string): Promise<RepositoryProfile> {
  // Load package.json
  let packageJson: Record<string, unknown> = {};
  const pkgPath = path.join(repoPath, "package.json");
  if (await fs.pathExists(pkgPath)) {
    try {
      packageJson = await fs.readJSON(pkgPath);
    } catch {
      // ignore
    }
  }

  // Merge dependencies
  const allDeps: Record<string, string> = {
    ...((packageJson.dependencies as Record<string, string>) ?? {}),
    ...((packageJson.devDependencies as Record<string, string>) ?? {}),
  };

  // Walk directory
  const { files } = await walkDir(repoPath);

  // Language detection
  const languages = countByLanguage(files);
  const hasTypescript =
    (languages["typescript"] ?? 0) > 0 || !!(allDeps["typescript"]);

  // Framework detection
  const frameworks: string[] = [];
  if (allDeps["react"] || allDeps["react-dom"]) frameworks.push("React");
  if (allDeps["next"]) frameworks.push("Next.js");
  if (allDeps["vue"]) frameworks.push("Vue");
  if (allDeps["@angular/core"]) frameworks.push("Angular");
  if (allDeps["svelte"]) frameworks.push("Svelte");
  if (allDeps["express"]) frameworks.push("Express");
  if (allDeps["fastify"]) frameworks.push("Fastify");
  if (allDeps["@nestjs/core"]) frameworks.push("NestJS");
  if (allDeps["hono"]) frameworks.push("Hono");

  // Feature detection
  const isFrontend =
    !!(allDeps["react"] || allDeps["vue"] || allDeps["svelte"] || allDeps["@angular/core"]);
  const isBackend =
    !!(allDeps["express"] || allDeps["fastify"] || allDeps["@nestjs/core"] || allDeps["hono"]);

  const hasTests = !!detectTestFramework(allDeps) || files.some((f) =>
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f)
  );

  const hasAuth = !!(
    allDeps["@auth0/auth0-react"] ||
    allDeps["next-auth"] ||
    allDeps["passport"] ||
    allDeps["@clerk/nextjs"] ||
    allDeps["better-auth"]
  );

  const hasAI = !!(
    allDeps["openai"] ||
    allDeps["@google/generative-ai"] ||
    allDeps["langchain"] ||
    allDeps["@ai-sdk/openai"] ||
    allDeps["@anthropic-ai/sdk"]
  );

  // Pattern-based detection
  const hasEvents = await scanForPatterns(files, [
    /EventEmitter/,
    /event[_-]?bus/i,
    /addEventListener/,
    /emit\(/,
    /createEvent/,
    /useEvent/,
  ]);

  const hasTracking = await scanForPatterns(files, [
    /analytics/i,
    /track(Event|Page|Click)/i,
    /gtag\(/,
    /dataLayer/,
    /mixpanel/,
    /posthog/,
    /segment/i,
  ]);

  const hasDesignSystem =
    (await exists(repoPath, "src", "components", "ui")) ||
    (await exists(repoPath, "components", "ui")) ||
    (await exists(repoPath, "src", "design-system")) ||
    !!(allDeps["@shadcn/ui"] || allDeps["shadcn-ui"]);

  // Check for monorepo
  const isMonorepo =
    !!(packageJson as Record<string, unknown>).workspaces ||
    (await exists(repoPath, "lerna.json")) ||
    (await exists(repoPath, "pnpm-workspace.yaml")) ||
    (await exists(repoPath, "turbo.json"));

  // CI and package manager
  const ciConfig = await detectCI(repoPath);
  const packageManager = await detectPackageManager(repoPath);

  // Project type
  let type: ProjectType;
  if (isMonorepo) {
    type = "monorepo";
  } else if (isFrontend && isBackend) {
    type = "fullstack";
  } else if (isFrontend) {
    type = "frontend";
  } else if (isBackend) {
    type = "backend";
  } else if (hasAI) {
    type = "ai-native";
  } else {
    type = "fullstack"; // default
  }

  // Dependency count
  const dependencyCount =
    Object.keys((packageJson.dependencies as Record<string, string>) ?? {}).length +
    Object.keys((packageJson.devDependencies as Record<string, string>) ?? {}).length;

  return {
    type,
    languages,
    frameworks,
    hasTests,
    hasAuth,
    hasAI,
    hasEvents,
    hasTracking,
    isMonorepo,
    totalFiles: files.length,
    totalLOC: files.length * 40, // rough estimate
    packageManager,
    testFramework: detectTestFramework(allDeps),
    ciConfig,
    hasDesignSystem,
    hasTypescript,
    dependencyCount,
  };
}
