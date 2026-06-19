export declare const env: {
    readonly NODE_ENV: string;
    readonly PORT: number;
    readonly DATABASE_URL: string;
    readonly MONGODB_URI: string;
    readonly JWT_SECRET: string;
    readonly JWT_EXPIRES_IN: string;
    readonly JWT_REFRESH_SECRET: string;
    readonly JWT_REFRESH_EXPIRES_IN: string;
    readonly OPENAI_API_KEY: string | undefined;
    readonly OPENAI_MODEL: string;
    readonly CORS_ORIGIN: string;
    readonly RATE_LIMIT_WINDOW_MS: number;
    readonly RATE_LIMIT_MAX: number;
};
