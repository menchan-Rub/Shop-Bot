import NextAuth, { NextAuthOptions, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import DiscordProvider from 'next-auth/providers/discord';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

// RESTful APIのベースURL
const API_URL = process.env.API_URL || 'http://localhost:3000';

// 環境変数から管理者IDを取得
const getAdminUserIds = () => {
  const adminIds = process.env.ADMIN_USER_IDS || '';
  return adminIds.split(',').map(id => id.trim());
};

// ユーザーが管理者かどうかをチェック
const isAdminUser = (discordId: string) => {
  const adminIds = getAdminUserIds();
  return adminIds.includes(discordId);
};

// 開発環境でのみログを出力する
const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// 型定義の拡張
declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string;
    discordId?: string;
    isAdmin?: boolean;
  }
  
  interface Session {
    user: User & {
      id: string;
      role?: string;
      discordId?: string;
      isAdmin?: boolean;
    }
  }
}

// 管理者認証のチェック関数 (環境変数と照合)
const isAdminCredentials = (email: string, password: string): boolean => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  console.log(`管理者認証チェック: メール照合=${email === adminEmail}, パスワード有効=${!!password && !!adminPassword}`);
  
  return email === adminEmail && password === adminPassword;
};

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: { params: { scope: 'identify email' } },
      profile(profile) {
        logDebug('Discord profile:', profile);
        
        // アバター画像URLの生成
        let imageUrl;
        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          imageUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith('a_') ? 'gif' : 'png';
          imageUrl = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }
        
        // ユーザーが管理者かどうかをチェック
        const admin = isAdminUser(profile.id);
        logDebug(`User ${profile.username} (${profile.id}) isAdmin: ${admin}`);
        
        return {
          id: profile.id,
          discordId: profile.id,
          name: profile.username,
          email: profile.email,
          image: imageUrl,
          isAdmin: admin,
        };
      },
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isAdmin: { label: "Is Admin", type: "boolean" }
      },
      // @ts-ignore - 型定義の問題を一時的に無視
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }
        
        // デバッグログ
        console.log(`認証試行: メール=${credentials.email}, 管理者フラグ=${credentials.isAdmin}`);
        
        // 管理者認証のチェック
        if (credentials.isAdmin === 'true') {
          if (isAdminCredentials(credentials.email, credentials.password)) {
            console.log('管理者認証成功');
            
            // 管理者ユーザー情報を返す
            return {
              id: 'admin',
              email: credentials.email,
              name: '管理者',
              role: 'admin',
              image: null,
              isAdmin: true,
              discordId: 'admin'
            };
          } else {
            console.log('管理者認証失敗');
            throw new Error("管理者メールアドレスまたはパスワードが正しくありません");
          }
        }
        
        try {
          // 通常のメール認証API呼び出し
          const apiUrl = process.env.NEXT_PUBLIC_API_URL ? 
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/email-signin` : 
            'http://localhost:3001/api/auth/email-signin';
          
          console.log('API呼び出し:', apiUrl);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          
          const data = await response.json();
          console.log('API応答:', data);
          
          if (!response.ok) {
            throw new Error(data.message || "ログインに失敗しました");
          }
          
          if (data.success && data.user) {
            return {
              id: data.user.id || data.user._id || 'user',
              email: data.user.email,
              name: data.user.username || data.user.name,
              role: data.user.role || 'user',
              image: data.user.image || null,
              isAdmin: data.user.isAdmin || false,
              discordId: data.user.discordId || ''
            };
          }
          
          throw new Error("ユーザー情報が取得できませんでした");
        } catch (error: any) {
          console.error('認証エラー:', error);
          throw new Error(error.message || "認証サービスに接続できませんでした");
        }
      },
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        console.log('JWT生成 - ユーザー情報:', user);
        
        token.discordId = (user as any).discordId;
        token.isAdmin = Boolean((user as any).isAdmin || (user as any).role === 'admin');
        token.role = (user as any).role || 'user';
        token.name = (user as any).name;
        token.email = (user as any).email;
        token.picture = (user as any).image;
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('セッション更新 - トークン情報:', token);
      
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.discordId = token.discordId as string;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.role = token.role as string;
        
        console.log('更新後のセッション:', session);
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // リダイレクトURLを適切に処理
      logDebug("Redirect callback - url:", url);
      logDebug("Redirect callback - baseUrl:", baseUrl);
      
      // URLがない場合やnullの場合はデフォルトのbaseUrlを使用
      if (!url) return baseUrl;
      
      // 相対URLの場合、baseUrlと結合
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      
      // 同じオリジンの場合はそのまま使用
      if (new URL(url).origin === baseUrl) return url;
      
      // それ以外はデフォルトのbaseUrlを返す
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日間
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);