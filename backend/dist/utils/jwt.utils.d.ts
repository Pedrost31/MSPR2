import { TokenPayload } from '../types';
export declare const generateAccessToken: (payload: {
    userId: string;
    email: string;
}) => string;
export declare const generateRefreshToken: (payload: {
    userId: string;
    email: string;
}) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
