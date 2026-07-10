declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        avatarUrl: string | null;
      };
      io?: any;
    }
  }
}

export {};
