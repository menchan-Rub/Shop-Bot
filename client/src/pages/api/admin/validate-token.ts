import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// 許可された管理者のDiscord IDリスト
const ALLOWED_ADMIN_DISCORD_IDS = process.env.ADMIN_DISCORD_IDS 
  ? process.env.ADMIN_DISCORD_IDS.split(',') 
  : [];

// JWT シークレットキー
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // リクエストヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        valid: false, 
        message: '認証トークンがありません' 
      });
    }

    const token = authHeader.split(' ')[1];
    const { discordId, discordUsername } = req.body;

    // トークンを検証
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // トークンのDiscord IDが現在のDiscord IDと一致することを確認
      if (decoded.discordId !== discordId) {
        console.log(`トークン検証失敗: Discord ID不一致 - トークン内:${decoded.discordId}, 提供:${discordId}`);
        return res.status(403).json({ 
          valid: false, 
          isAdmin: false,
          message: 'トークンとユーザーが一致しません' 
        });
      }
      
      // Discord IDが許可リストにあるか再確認
      const isAdmin = ALLOWED_ADMIN_DISCORD_IDS.includes(discordId);
      
      if (!isAdmin) {
        console.log(`トークン検証失敗: 権限なし - Discord ID ${discordId}`);
        return res.status(403).json({ 
          valid: false, 
          isAdmin: false,
          message: '管理者権限がありません' 
        });
      }
      
      // 検証成功
      return res.status(200).json({ 
        valid: true,
        isAdmin: true,
        message: 'トークンは有効です' 
      });
    } catch (error) {
      // JWT検証エラー
      console.error('トークン検証エラー:', error);
      return res.status(401).json({ 
        valid: false, 
        message: 'トークンが無効または期限切れです' 
      });
    }
  } catch (error) {
    console.error('トークン検証処理エラー:', error);
    return res.status(500).json({ 
      valid: false,
      message: '内部サーバーエラー' 
    });
  }
} 