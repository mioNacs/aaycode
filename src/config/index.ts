const getRequiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value || value.length === 0) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const getOptionalEnv = (key: string): string | undefined => {
  const value = process.env[key];
  if (!value || value.length === 0) {
    return undefined;
  }
  return value;
};

const getOptionalNumberEnv = (key: string, defaultValue: number): number => {
  const rawValue = process.env[key];

  if (!rawValue || rawValue.length === 0) {
    return defaultValue;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer.`);
  }

  return parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongodb: {
    uri: getRequiredEnv("MONGODB_URI"),
  },
  nextAuth: {
    secret: getRequiredEnv("NEXTAUTH_SECRET"),
    url: getOptionalEnv("NEXTAUTH_URL"),
  },
  oauth: {
    google: {
      clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    },
    github: {
      clientId: getRequiredEnv("GITHUB_CLIENT_ID"),
      clientSecret: getRequiredEnv("GITHUB_CLIENT_SECRET"),
    },
  },
  email: {
    from: getRequiredEnv("EMAIL_FROM"),
    server: {
      host: getRequiredEnv("EMAIL_SERVER_HOST"),
      port: getOptionalNumberEnv("EMAIL_SERVER_PORT", 587),
      user: getRequiredEnv("EMAIL_SERVER_USER"),
      password: getRequiredEnv("EMAIL_SERVER_PASSWORD"),
    },
  },
};

export const getEnv = getRequiredEnv;
export const getEnvNumber = getOptionalNumberEnv;
export const getOptionalEnvValue = getOptionalEnv;
