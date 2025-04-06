import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

// セッション情報を返すAPIエンドポイント
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // トークンが存在するか検証
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });
    
    if (token && token.id) {
      // 有効なトークンが存在する場合はセッション情報を返す
      return res.status(200).json({
        user: {
          name: token.name || null,
          id: token.id,
          isAdmin: token.isAdmin || false,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } else {
      // 未ログインの場合は空のセッションを返す
      return res.status(200).json({ user: null, expires: null });
    }
  } catch (error) {
    console.error('セッション検証エラー:', error);
    return res.status(200).json({ user: null, expires: null });
  }
} 