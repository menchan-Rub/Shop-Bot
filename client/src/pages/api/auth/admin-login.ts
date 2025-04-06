import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// 管理者認証情報（実際の運用では環境変数から取得するべき）
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'menchan@shard-rub.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'iromochi218';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method Not Allowed' 
    });
  }

  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です'
      });
    }

    // 管理者メールアドレス確認
    if (email !== ADMIN_EMAIL) {
      console.log(`管理者ログイン失敗: ユーザーが見つかりません - ${email}`);
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // 開発環境では単純な文字列比較で認証
    if (password !== ADMIN_PASSWORD) {
      console.log(`管理者ログイン失敗: パスワードが正しくありません - ${email}`);
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // 管理者情報
    const adminUser = {
      id: '1',
      email: ADMIN_EMAIL,
      username: 'Admin',
      isAdmin: true,
      isStaff: true,
      avatar: null
    };

    // JWTトークン生成
    const token = jwt.sign(
      { 
        id: adminUser.id,
        isAdmin: adminUser.isAdmin,
        isStaff: adminUser.isStaff,
        username: adminUser.username,
        email: adminUser.email
      },
      process.env.NEXTAUTH_SECRET || 'admin-login-secret',
      { expiresIn: '24h' }
    );

    console.log(`管理者ログイン成功: ${adminUser.email}`);

    return res.status(200).json({
      success: true,
      token,
      user: adminUser
    });
  } catch (error: any) {
    console.error('Admin login error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
} 