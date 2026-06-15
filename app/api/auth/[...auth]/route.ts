import { auth } from '@/lib/auth';
import { toWebHandler } from 'better-auth/next-js';

const handler = toWebHandler(auth);

export const { GET, POST } = handler;
