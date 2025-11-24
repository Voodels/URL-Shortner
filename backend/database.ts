/**
 * Database Configuration and Repository Factory
 *
 * PURPOSE: Centralized database configuration and repository creation
 * PATTERN: Factory pattern with environment-based switching
 *
 * FEATURES:
 * - Switch between in-memory and MySQL via environment variable
 * - Graceful initialization and connection handling
 * - Error handling and logging
 */

import {
    createMySQLRepositories,
    MySQLCategoryRepository,
    MySQLURLRepository,
    MySQLUserRepository,
} from "./mysql-store.ts";
import {
    createPostgreSQLRepositories,
    PostgreSQLCategoryRepository,
    PostgreSQLURLRepository,
    PostgreSQLUserRepository,
} from "./postgres-store.ts";
import type { CategoryRepository, URLRepository, UserRepository } from "./store.ts";
import {
    categoryRepository as inMemoryCategoryRepository,
    urlRepository as inMemoryRepository,
    userRepository as inMemoryUserRepository,
} from "./store.ts";

const denoRuntime = (globalThis as { Deno?: any }).Deno;

/**
 * Database configuration
 */
export interface DBConfig {
  type: "memory" | "mysql" | "postgres";
  mysql?: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    poolSize?: number;
  };
  postgres?: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    tls?: boolean;
  };
}

/**
 * Get database configuration from environment variables
 */
export function getDatabaseConfig(): DBConfig {
  if (!denoRuntime) {
    throw new Error("Deno runtime is required to load database configuration");
  }

  const dbType = (denoRuntime.env.get("DB_TYPE") || "memory") as "memory" | "mysql" | "postgres";

  if (dbType === "mysql") {
    return {
      type: "mysql",
      mysql: {
        hostname: denoRuntime.env.get("DB_HOST") || "localhost",
        port: parseInt(denoRuntime.env.get("DB_PORT") || "3306"),
        username: denoRuntime.env.get("DB_USER") || "root",
        password: denoRuntime.env.get("DB_PASSWORD") || "",
        database: denoRuntime.env.get("DB_NAME") || "url_shortener",
        poolSize: parseInt(denoRuntime.env.get("DB_POOL_SIZE") || "10"),
      },
    };
  }

  if (dbType === "postgres") {
    return {
      type: "postgres",
      postgres: {
        hostname: denoRuntime.env.get("DB_HOST") || "localhost",
        port: parseInt(denoRuntime.env.get("DB_PORT") || "5432"),
        username: denoRuntime.env.get("DB_USER") || "postgres",
        password: denoRuntime.env.get("DB_PASSWORD") || "",
        database: denoRuntime.env.get("DB_NAME") || "url_shortener",
        tls: denoRuntime.env.get("DB_TLS") !== "false",
      },
    };
  }

  return { type: "memory" };
}

/**
 * Global repository instance
 */
let repositoryInstance: URLRepository | null = null;
let userRepositoryInstance: UserRepository | null = null;
let categoryRepositoryInstance: CategoryRepository | null = null;
let mysqlInstance: MySQLURLRepository | null = null;
let mysqlUserInstance: MySQLUserRepository | null = null;
let mysqlCategoryInstance: MySQLCategoryRepository | null = null;
let postgresInstance: PostgreSQLURLRepository | null = null;
let postgresUserInstance: PostgreSQLUserRepository | null = null;
let postgresCategoryInstance: PostgreSQLCategoryRepository | null = null;

/**
 * Initialize and return the URL repository based on configuration
 *
 * USAGE: Call this once at server startup
 * PATTERN: Singleton with lazy initialization
 *
 * @returns Initialized URL repository
 */
export async function initializeRepository(): Promise<URLRepository> {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  const config = getDatabaseConfig();

  console.log(`📦 Initializing ${config.type.toUpperCase()} repository...`);

  if (config.type === "mysql") {
    if (!config.mysql) {
      throw new Error("MySQL configuration is missing");
    }

    // Create and connect to MySQL
    const mysqlConfig = config.mysql;
    const { urlRepository, userRepository, categoryRepository } = await createMySQLRepositories(mysqlConfig);

    mysqlInstance = urlRepository;
    mysqlUserInstance = userRepository;
    mysqlCategoryInstance = categoryRepository;
    repositoryInstance = urlRepository;
    userRepositoryInstance = userRepository;
    categoryRepositoryInstance = categoryRepository;

    const { hostname, port, database } = mysqlConfig;
    console.log(`✅ MySQL repository initialized (host=${hostname}:${port}, db=${database})`);
  } else if (config.type === "postgres") {
    if (!config.postgres) {
      throw new Error("PostgreSQL configuration is missing");
    }

    // Create and connect to PostgreSQL
    const postgresConfig = config.postgres;
    const { urlRepository, userRepository, categoryRepository } = await createPostgreSQLRepositories(postgresConfig);

    postgresInstance = urlRepository;
    postgresUserInstance = userRepository;
    postgresCategoryInstance = categoryRepository;
    repositoryInstance = urlRepository;
    userRepositoryInstance = userRepository;
    categoryRepositoryInstance = categoryRepository;

    const { hostname, port, database } = postgresConfig;
    console.log(`✅ PostgreSQL repository initialized (host=${hostname}:${port}, db=${database})`);
  } else {
    // Use in-memory repository
    repositoryInstance = inMemoryRepository;
    userRepositoryInstance = inMemoryUserRepository;
    categoryRepositoryInstance = inMemoryCategoryRepository;
    console.log("✅ In-memory repository initialized");
  }

  return repositoryInstance;
}

/**
 * Get the current repository instance
 *
 * IMPORTANT: Must call initializeRepository() first
 *
 * @returns Current repository instance
 * @throws Error if repository not initialized
 */
export function getRepository(): URLRepository {
  if (!repositoryInstance) {
    throw new Error("Repository not initialized. Call initializeRepository() first.");
  }
  return repositoryInstance;
}

export function getUserRepository(): UserRepository {
  if (!userRepositoryInstance) {
    throw new Error("User repository not initialized. Call initializeRepository() first.");
  }
  return userRepositoryInstance;
}

export function getCategoryRepository(): CategoryRepository {
  if (!categoryRepositoryInstance) {
    throw new Error("Category repository not initialized. Call initializeRepository() first.");
  }
  return categoryRepositoryInstance;
}

/**
 * Close database connections (for graceful shutdown)
 *
 * USAGE: Call on server shutdown
 */
export async function closeDatabase(): Promise<void> {
  if (mysqlInstance) {
    await mysqlInstance.disconnect();
    mysqlInstance = null;
  }
  if (mysqlUserInstance) {
    mysqlUserInstance = null;
  }
  if (mysqlCategoryInstance) {
    mysqlCategoryInstance = null;
  }
  if (postgresInstance) {
    await postgresInstance.disconnect();
    postgresInstance = null;
  }
  if (postgresUserInstance) {
    postgresUserInstance = null;
  }
  if (postgresCategoryInstance) {
    postgresCategoryInstance = null;
  }
  repositoryInstance = null;
  userRepositoryInstance = null;
  categoryRepositoryInstance = null;
  console.log("✅ Database connections closed");
}
