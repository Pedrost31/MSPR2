import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
export interface TokenPayload extends JwtPayload {
    userId: string;
    email: string;
}
export interface AuthRequest extends Request {
    user?: TokenPayload;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}
