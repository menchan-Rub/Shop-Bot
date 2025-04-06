import 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

declare module 'next-auth' {
  /**
   * セッションの型を拡張し、カスタムプロパティを追加
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordId?: string;
      isAdmin?: boolean;
      role?: string;
    };
    accessToken?: string;
    expires: string;
  }
  
  /**
   * プロファイルの型を拡張し、Discordの追加情報を含める
   */
  interface Profile {
    id: string
    username: string
    discriminator: string
    avatar: string
    email: string
    verified: boolean
    guilds?: any[]
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    discordId?: string;
    isAdmin?: boolean;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  /** JWT内容の型を拡張します */
  interface JWT {
    sub?: string;
    discordId?: string;
    isAdmin?: boolean;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    email?: string | null;
    name?: string | null;
    picture?: string | null;
    exp?: number;
    iat?: number;
    jti?: string;
  }
} 