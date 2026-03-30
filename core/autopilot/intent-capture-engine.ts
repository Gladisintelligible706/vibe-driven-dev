/**
 * Intent Capture Engine
 *
 * Parses free-text user answers and extracts structured signals
 * that feed into the popup flow controller and question builder.
 */

import type { OnboardingProjectType, DeliveryPreference } from "../intelligence/onboarding-engine.js";

// ─── Signal Types ──────────────────────────────────────────────

export type ProjectShape = "web-app" | "saas" | "internal-tool" | "ai-wrapper" | "unknown";

export type AiRole = "writes" | "analyzes" | "classifies" | "responds" | "orchestrates" | "none";

export type UserPersona = "individual" | "company" | "internal-team" | "broad-audience" | "unknown";

export interface ExtractedSignals {
  projectSummary: string;
  projectType: OnboardingProjectType | "unknown";
  targetUser: UserPersona;
  coreProblem: string;
  productShape: ProjectShape;
  aiRole: AiRole;
  hasAiFeatures: boolean;
  deliveryPreference: DeliveryPreference | "unknown";
  platform: string;
  constraints: string[];
  confidence: Record<string, boolean>;
}

export interface CaptureInput {
  answer: string;
  questionCategory: string;
  previousSignals: Partial<ExtractedSignals>;
  questionIndex: number;
}

export interface CaptureOutput {
  signals: ExtractedSignals;
  newFindings: string[];
  ambiguities: string[];
  rawAnswer: string;
}

// ─── Pattern Matchers ──────────────────────────────────────────

const PROJECT_TYPE_PATTERNS: Array<{ pattern: RegExp; type: OnboardingProjectType }> = [
  { pattern: /\b(saas|saas product|subscription|recurring revenue|monthly plan|cloud product)\b/i, type: "saas" },
  { pattern: /\b(internal\s*tool|ops\s*tool|admin\s*tool|back\s*office|internal\s*use|team\s*tool)\b/i, type: "internal-tool" },
  { pattern: /\b(content\s*site|blog|marketing\s*site|landing\s*page|documentation|docs\s*site)\b/i, type: "content-site" },
  { pattern: /\b(wrapper|copilot|assistant\s*app|chat\s*app|ai\s*app|gpt\s*wrapper|llm\s*app)\b/i, type: "wrapper-app" },
];

const PRODUCT_SHAPE_PATTERNS: Array<{ pattern: RegExp; shape: ProjectShape }> = [
  { pattern: /\b(saas|subscription|cloud\s*product|hosted)\b/i, shape: "saas" },
  { pattern: /\b(internal\s*tool|ops|admin|back\s*office)\b/i, shape: "internal-tool" },
  { pattern: /\b(ai\s*wrapper|chatbot|copilot|assistant|gpt)\b/i, shape: "ai-wrapper" },
  { pattern: /\b(web\s*app|webapp|web\s*application|dashboard|portal|site)\b/i, shape: "web-app" },
];

const AI_ROLE_PATTERNS: Array<{ pattern: RegExp; role: AiRole }> = [
  { pattern: /\b(writes?\s*(it\s*)?self|generate|create\s*content|compose|draft)\b/i, role: "writes" },
  { pattern: /\b(analy[sz]e|insight|report|metric|dashboard|data)\b/i, role: "analyzes" },
  { pattern: /\b(classif|categor|tag|label|sort|organiz)\b/i, role: "classifies" },
  { pattern: /\b(respond|answer|reply|chat|support|help\s*desk)\b/i, role: "responds" },
  { pattern: /\b(orchestrat|automat|workflow|pipeline|chain|multi.?step)\b/i, role: "orchestrates" },
];

const AI_SIGNAL_PATTERNS = /\b(ai|llm|gpt|claude|gemini|openai|machine\s*learning|ml|neural|model|prompt|generat|artificial\s*intelligence|copilot|assistant|chatbot|natural\s*language|nlp)\b/i;

const USER_PERSONA_PATTERNS: Array<{ pattern: RegExp; persona: UserPersona }> = [
  { pattern: /\b(small\s*business|startup|freelanc|solopreneur|solo|individual|personal|me\b|myself)\b/i, persona: "individual" },
  { pattern: /\b(company|enterprise|corporate|organization|firm|business\s*customer|client\s*company)\b/i, persona: "company" },
  { pattern: /\b(internal\s*team|my\s*team|our\s*team|employees|staff|department|workforce)\b/i, persona: "internal-team" },
  { pattern: /\b(everyone|anyone|users|customers|people|public|audience|mass|consumer)\b/i, persona: "broad-audience" },
];

const PLATFORM_PATTERNS: Array<{ pattern: RegExp; platform: string }> = [
  { pattern: /\b(mobile|ios|android|phone|app\s*store|play\s*store)\b/i, platform: "mobile" },
  { pattern: /\b(web|browser|desktop|dashboard|saas|website)\b/i, platform: "web" },
];

const DELIVERY_PATTERNS: Array<{ pattern: RegExp; preference: DeliveryPreference }> = [
  { pattern: /\b(fast|quick|mvp|prototype|ship\s*fast|minimal|basic|first\s*version|asap|soon)\b/i, preference: "mvp" },
  { pattern: /\b(solid|robust|clean|scalable|production.?ready|foundation|long.?term|quality|proper|strong)\b/i, preference: "foundation" },
];

const CONSTRAINT_PATTERNS = [
  /\b(deadline|by\s*(next|end|january|february|march|april|may|june|july|august|september|october|november|december)|launch\s*date|due\s*date|timeline|urgency|asap)\b/i,
  /\b(compliance|gdpr|hipaa|soc2|regulat|legal|security\s*requirement|privacy)\b/i,
  /\b(budget|cost|limited\s*funding|free|open.?source|cheap|afford)\b/i,
  /\b(integration|connect|api|third.?party|existing\s*system|legacy)\b/i,
];

// ─── Extraction Functions ──────────────────────────────────────

function extractProjectType(text: string): OnboardingProjectType | "unknown" {
  for (const { pattern, type } of PROJECT_TYPE_PATTERNS) {
    if (pattern.test(text)) {
      return type;
    }
  }
  return "unknown";
}

function extractProductShape(text: string): ProjectShape {
  for (const { pattern, shape } of PRODUCT_SHAPE_PATTERNS) {
    if (pattern.test(text)) {
      return shape;
    }
  }
  return "unknown";
}

function extractAiRole(text: string): AiRole {
  for (const { pattern, role } of AI_ROLE_PATTERNS) {
    if (pattern.test(text)) {
      return role;
    }
  }
  return "none";
}

function extractUserPersona(text: string): UserPersona {
  for (const { pattern, persona } of USER_PERSONA_PATTERNS) {
    if (pattern.test(text)) {
      return persona;
    }
  }
  return "unknown";
}

function extractPlatform(text: string): string {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(text)) {
      return platform;
    }
  }
  return "unknown";
}

function extractDeliveryPreference(text: string): DeliveryPreference | "unknown" {
  for (const { pattern, preference } of DELIVERY_PATTERNS) {
    if (pattern.test(text)) {
      return preference;
    }
  }
  return "unknown";
}

function extractConstraints(text: string): string[] {
  const found: string[] = [];
  for (const pattern of CONSTRAINT_PATTERNS) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) {
        found.push(match[0].trim());
      }
    }
  }
  return [...new Set(found)];
}

function extractProblemFromAnswer(text: string): string {
  // Look for problem-indicating phrases
  const problemPatterns = [
    /(?:problem|issue|pain|struggle|hard|difficult|frustrat|annoying|waste\s*of\s*time|challenge)[^.!?]*[.!?]?/i,
    /(?:help[s]?|allow[s]?|enable[s]?|make[s]?\s*(?:it\s*)?easier)[^.!?]*[.!?]?/i,
    /(?:so\s*that|in\s*order\s*to|because|need\s*to|want\s*to)[^.!?]*[.!?]?/i,
  ];

  for (const pattern of problemPatterns) {
    const match = text.match(pattern);
    if (match && match[0].trim().length > 15) {
      return match[0].trim();
    }
  }

  return text.length > 200 ? text.slice(0, 200) + "..." : text;
}

function findAmbiguities(signals: ExtractedSignals): string[] {
  const ambiguities: string[] = [];

  if (signals.projectType === "unknown") {
    ambiguities.push("project-type");
  }
  if (signals.targetUser === "unknown") {
    ambiguities.push("target-user");
  }
  if (signals.coreProblem.trim().length < 30) {
    ambiguities.push("core-problem");
  }
  if (signals.productShape === "unknown") {
    ambiguities.push("product-shape");
  }
  if (signals.hasAiFeatures && signals.aiRole === "none") {
    ambiguities.push("ai-role");
  }
  if (signals.deliveryPreference === "unknown") {
    ambiguities.push("delivery-preference");
  }

  return ambiguities;
}

function findNewFindings(
  previous: Partial<ExtractedSignals>,
  current: ExtractedSignals
): string[] {
  const findings: string[] = [];

  if (previous.projectType === "unknown" && current.projectType !== "unknown") {
    findings.push(`Project type identified: ${current.projectType}`);
  }
  if (previous.targetUser === "unknown" && current.targetUser !== "unknown") {
    findings.push(`Target user identified: ${current.targetUser}`);
  }
  if (previous.productShape === "unknown" && current.productShape !== "unknown") {
    findings.push(`Product shape identified: ${current.productShape}`);
  }
  if (!previous.hasAiFeatures && current.hasAiFeatures) {
    findings.push(`AI involvement detected: ${current.aiRole}`);
  }
  if (previous.deliveryPreference === "unknown" && current.deliveryPreference !== "unknown") {
    findings.push(`Delivery preference detected: ${current.deliveryPreference}`);
  }
  if (current.constraints.length > (previous.constraints?.length ?? 0)) {
    findings.push(`New constraint(s) detected: ${current.constraints.join(", ")}`);
  }

  return findings;
}

// ─── Main Engine ───────────────────────────────────────────────

export class IntentCaptureEngine {
  /**
   * Extract structured signals from a free-text user answer.
   * Merges with previous signals so each answer adds to the picture.
   */
  extract(input: CaptureInput): CaptureOutput {
    const text = input.answer.trim();
    const prev = input.previousSignals;

    // Extract fresh signals from this answer
    const projectType = extractProjectType(text) !== "unknown"
      ? extractProjectType(text)
      : (prev.projectType as OnboardingProjectType | "unknown") ?? "unknown";

    const targetUser = extractUserPersona(text) !== "unknown"
      ? extractUserPersona(text)
      : prev.targetUser ?? "unknown";

    const productShape = extractProductShape(text) !== "unknown"
      ? extractProductShape(text)
      : prev.productShape ?? "unknown";

    const hasAiFeatures = AI_SIGNAL_PATTERNS.test(text) || (prev.hasAiFeatures ?? false);
    const aiRole = hasAiFeatures
      ? (extractAiRole(text) !== "none" ? extractAiRole(text) : prev.aiRole ?? "none")
      : "none";

    const deliveryPreference = extractDeliveryPreference(text) !== "unknown"
      ? extractDeliveryPreference(text)
      : prev.deliveryPreference ?? "unknown";

    const platform = extractPlatform(text) !== "unknown"
      ? extractPlatform(text)
      : prev.platform ?? "unknown";

    const newConstraints = extractConstraints(text);
    const allConstraints = [...new Set([...(prev.constraints ?? []), ...newConstraints])];

    const coreProblem = input.questionCategory === "general-idea"
      ? extractProblemFromAnswer(text)
      : prev.coreProblem ?? "";

    const projectSummary = input.questionCategory === "general-idea"
      ? text.length > 300 ? text.slice(0, 300) + "..." : text
      : prev.projectSummary ?? text;

    const signals: ExtractedSignals = {
      projectSummary,
      projectType,
      targetUser,
      coreProblem,
      productShape,
      aiRole,
      hasAiFeatures,
      deliveryPreference,
      platform,
      constraints: allConstraints,
      confidence: {
        "project-type": projectType !== "unknown",
        "target-user": targetUser !== "unknown",
        "core-problem": coreProblem.trim().length >= 30,
        "product-shape": productShape !== "unknown",
        "ai-clarity": !hasAiFeatures || aiRole !== "none",
        "delivery-preference": deliveryPreference !== "unknown",
        "platform": platform !== "unknown",
      }
    };

    const newFindings = findNewFindings(prev, signals);
    const ambiguities = findAmbiguities(signals);

    return {
      signals,
      newFindings,
      ambiguities,
      rawAnswer: text
    };
  }

  /**
   * Merge two signal sets, preferring the more specific one.
   */
  mergeSignals(
    base: Partial<ExtractedSignals>,
    overlay: Partial<ExtractedSignals>
  ): ExtractedSignals {
    return {
      projectSummary: overlay.projectSummary ?? base.projectSummary ?? "",
      projectType: overlay.projectType !== "unknown"
        ? (overlay.projectType as OnboardingProjectType | "unknown")
        : (base.projectType as OnboardingProjectType | "unknown") ?? "unknown",
      targetUser: overlay.targetUser !== "unknown"
        ? (overlay.targetUser as UserPersona)
        : (base.targetUser as UserPersona) ?? "unknown",
      coreProblem: overlay.coreProblem ?? base.coreProblem ?? "",
      productShape: overlay.productShape !== "unknown"
        ? (overlay.productShape as ProjectShape)
        : (base.productShape as ProjectShape) ?? "unknown",
      aiRole: overlay.aiRole !== "none"
        ? (overlay.aiRole as AiRole)
        : (base.aiRole as AiRole) ?? "none",
      hasAiFeatures: overlay.hasAiFeatures ?? base.hasAiFeatures ?? false,
      deliveryPreference: overlay.deliveryPreference !== "unknown"
        ? (overlay.deliveryPreference as DeliveryPreference | "unknown")
        : (base.deliveryPreference as DeliveryPreference | "unknown") ?? "unknown",
      platform: overlay.platform !== "unknown"
        ? (overlay.platform as string)
        : base.platform ?? "unknown",
      constraints: [...new Set([...(base.constraints ?? []), ...(overlay.constraints ?? [])])],
      confidence: {
        ...base.confidence,
        ...overlay.confidence,
      }
    };
  }
}
