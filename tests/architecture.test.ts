import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ARCH_PATH = path.resolve(__dirname, "../ARCHITECTURE.md");
const content = fs.readFileSync(ARCH_PATH, "utf-8");

describe("ARCHITECTURE.md — Requirement Coverage", () => {
  // ── R1: File exists at project root and is not a placeholder ──

  it("R1: exists at project root and is not a placeholder", () => {
    expect(fs.existsSync(ARCH_PATH)).toBe(true);
    // A placeholder would be just headers with no real content (~few lines)
    // The comprehensive doc should be well over 50 lines
    const lines = content.split("\n");
    expect(lines.length).toBeGreaterThan(50);
    // Should not contain the old placeholder text
    expect(content).not.toContain("TODO:");
    expect(content).not.toContain("This file is a placeholder");
  });

  // ── R2: System Overview section ──

  it("R2: contains System Overview mentioning project name, purpose, runtime, and database", () => {
    expect(content).toContain("System Overview");
    // Project name
    expect(content.toLowerCase()).toContain("euroncontest");
    // Purpose: Eurovision-style contest voting backend
    expect(
      content.toLowerCase().includes("eurovision") ||
        content.toLowerCase().includes("contest")
    ).toBe(true);
    // Runtime: Node.js + Express
    expect(content).toContain("Express");
    // Database: PostgreSQL via Sequelize
    expect(content).toContain("PostgreSQL");
    expect(content).toContain("Sequelize");
  });

  // ── R3: Tech Stack section ──

  it("R3: contains Tech Stack section with dependency categories", () => {
    expect(content).toContain("Tech Stack");
    // Must group by role (at least some of: framework, ORM, auth, validation, etc.)
    const lower = content.toLowerCase();
    const hasFramework = lower.includes("framework");
    const hasORM = lower.includes("orm");
    const hasAuth = lower.includes("auth");
    const hasValidation = lower.includes("validation");
    // At least 3 of the required grouping categories should be present
    const categoriesFound = [hasFramework, hasORM, hasAuth, hasValidation].filter(Boolean).length;
    expect(categoriesFound).toBeGreaterThanOrEqual(3);
  });

  // ── R4: Component Map section ──

  it("R4: contains Component Map listing key modules", () => {
    expect(content).toContain("Component Map");
    const lower = content.toLowerCase();
    // Verify the key modules are mentioned
    expect(lower).toContain("routes");
    expect(lower).toContain("services");
    expect(lower).toContain("middlewares");
    expect(lower).toContain("models");
    expect(lower).toContain("schemas");
    expect(lower).toContain("config");
    expect(lower).toContain("utils");
  });

  // ── R5: Data Flow section ──

  it("R5: contains Data Flow section describing request lifecycle and error handling", () => {
    expect(content).toContain("Data Flow");
    const lower = content.toLowerCase();
    // Request lifecycle
    expect(lower.includes("request") || lower.includes("lifecycle")).toBe(true);
    // Error-handling pipeline — must mention the specific error handlers
    expect(content).toContain("logErrors");
    expect(content).toContain("boomErrorHandler");
    expect(content).toContain("sequelizeError");
    expect(content).toContain("errorHandler");
  });

  // ── R6: API Endpoints section ──

  it("R6: contains API Endpoints section enumerating route groups", () => {
    expect(content).toContain("API Endpoints");
    const lower = content.toLowerCase();
    // Must mention the route groups: users, rooms, countries, archive, getauthtoken, updatable, requests
    expect(lower).toContain("users");
    expect(lower).toContain("rooms");
    expect(lower).toContain("countries");
    // At least some auth level references
    expect(
      content.includes("jwtAuth") || content.includes("headerAuth")
    ).toBe(true);
  });

  // ── R7: Database Schema section ──

  it("R7: contains Database Schema section describing Sequelize models", () => {
    expect(content).toContain("Database Schema");
    const lower = content.toLowerCase();
    // Must mention the Sequelize model tables
    expect(lower).toContain("users");
    expect(lower).toContain("countries");
    expect(lower).toContain("rooms");
    // Should mention associations or relationships
    expect(
      lower.includes("association") || lower.includes("relationship") || lower.includes("foreign key")
    ).toBe(true);
  });

  // ── R8: Environment & Deployment section ──

  it("R8: contains Environment & Deployment section mentioning Docker, Vercel, config", () => {
    expect(content).toContain("Environment & Deployment");
    expect(content).toContain("Docker");
    expect(content).toContain("Vercel");
    expect(
      content.includes("config") || content.includes("Config")
    ).toBe(true);
  });

  // ── R9: Known Issues & Conventions section ──

  it("R9: contains Known Issues & Conventions section with conventions and issues", () => {
    expect(content).toContain("Known Issues");
    expect(content).toContain("Conventions");
    // Should mention Joi validation pattern
    expect(content).toContain("Joi");
    // Should mention Boom error pattern
    expect(content).toContain("Boom");
    // Should mention the middlewares/ directory typo or similar issue
    const lower = content.toLowerCase();
    expect(
      lower.includes("typo") || lower.includes("issue") || lower.includes("middleware")
    ).toBe(true);
  });

  // ── R10: Quick Reference section ──

  it("R10: contains Quick Reference section with navigation guidance", () => {
    expect(content).toContain("Quick Reference");
    // Should provide guidance on where to add things (endpoints, models, etc.)
    const lower = content.toLowerCase();
    expect(
      lower.includes("endpoint") || lower.includes("model") || lower.includes("route")
    ).toBe(true);
    // Should help locate files without reading every source file
    expect(
      lower.includes("route") || lower.includes("service") || lower.includes("schema")
    ).toBe(true);
  });
});