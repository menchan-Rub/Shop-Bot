import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// 許可された管理者のDiscord IDリスト
// 環境変数から取得するか、データベースで管理することも可能
const ALLOWED_ADMIN_DISCORD_IDS = process.env.ADMIN_DISCORD_IDS 
  ? process.env.ADMIN_DISCORD_IDS.split(',') 
  : [];

// JWT シークレットキー
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// JWTトークンの有効期限（24時間）
const TOKEN_EXPIRY = '24h';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { discordId, discordUsername } = req.body;

    // Discord IDが提供されていることを確認
    if (!discordId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Discord IDが提供されていません' 
      });
    }

    // Discord IDが許可リストにあるか確認
    const isAdmin = ALLOWED_ADMIN_DISCORD_IDS.includes(discordId);

    if (!isAdmin) {
      console.log(`管理者アクセス拒否: Discord ID ${discordId}`);
      return res.status(403).json({ 
        success: false, 
        isAdmin: false,
        message: '管理者権限がありません' 
      });
    }

    // 管理者トークンを生成
    const token = jwt.sign(
      { 
        discordId, 
        discordUsername,
        isAdmin: true 
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );

    console.log(`管理者認証成功: Discord ID ${discordId}`);
    
    // 成功レスポンスを返す
    return res.status(200).json({
      success: true,
      isAdmin: true,
      token,
      message: '管理者として認証されました',
    });
  } catch (error) {
    console.error('管理者認証エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 