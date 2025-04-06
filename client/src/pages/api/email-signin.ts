import type { NextApiRequest, NextApiResponse } from 'next';

// 環境変数で設定された管理者アカウント
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
    }

    // 管理者アカウントの認証
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('管理者としての認証に成功しました');
      return res.status(200).json({
        success: true,
        user: {
          id: 'admin-user',
          username: 'Admin',
          email: ADMIN_EMAIL,
          isAdmin: true,
          isStaff: true
        }
      });
    }

    // 通常のアカウント認証はバックエンドAPIに接続する処理となるが、
    // 現状はAPIが接続できない状態のため、一時的にエラーを返す
    return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
  } catch (error) {
    console.error('認証エラー:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
} 