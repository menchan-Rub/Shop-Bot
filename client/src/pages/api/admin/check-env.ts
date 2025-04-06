import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// JWT シークレットキー
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 必須環境変数リスト
const REQUIRED_ENV_VARS = [
  'ADMIN_DISCORD_IDS',
  'JWT_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET'
];

// 環境変数のマスキング（セキュリティ上の理由で一部のみ表示）
const maskEnvValue = (key: string, value: string) => {
  if (!value) return null;
  
  // シークレットキーやトークンは部分的にマスク
  if (key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')) {
    const visibleChars = 4;
    if (value.length <= visibleChars * 2) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, visibleChars) + '*'.repeat(value.length - visibleChars * 2) + value.substring(value.length - visibleChars);
  }
  
  // Discord IDはそのまま表示（これは管理者のみが見られるため）
  if (key === 'ADMIN_DISCORD_IDS') {
    return value;
  }
  
  // URLはドメイン部分のみ表示
  if (key.includes('URL')) {
    try {
      const url = new URL(value);
      return `${url.protocol}//${url.host}/*****`;
    } catch {
      return value.substring(0, 10) + '...';
    }
  }
  
  // デフォルトは値をそのまま返す
  return value;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GETリクエストのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // リクエストヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: '認証トークンがありません' 
      });
    }

    const token = authHeader.split(' ')[1];

    // トークンを検証
    try {
      // トークンを検証
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // トークンに管理者権限があるか確認
      if (!decoded.isAdmin) {
        console.log(`環境変数確認アクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
        return res.status(403).json({ 
          message: '管理者権限がありません' 
        });
      }
      
      // 環境変数のチェック
      const envStatus = {
        required: REQUIRED_ENV_VARS.map(key => ({
          key,
          set: !!process.env[key],
          value: maskEnvValue(key, process.env[key] || '')
        })),
        discordAdminCount: process.env.ADMIN_DISCORD_IDS 
          ? process.env.ADMIN_DISCORD_IDS.split(',').length 
          : 0,
        jwtSecret: process.env.JWT_SECRET 
          ? process.env.JWT_SECRET !== 'your-secret-key' 
          : false,
        allRequiredSet: true
      };

      // すべての必須環境変数が設定されているか確認
      envStatus.allRequiredSet = envStatus.required.every(item => item.set);
      
      // 追加のチェック
      const warnings = [];
      if (envStatus.jwtSecret === false) {
        warnings.push('JWT_SECRETがデフォルト値です。本番環境では変更してください。');
      }
      if (envStatus.discordAdminCount === 0) {
        warnings.push('ADMIN_DISCORD_IDSが設定されていません。管理者がログインできません。');
      }
      
      // 成功レスポンスを返す
      return res.status(200).json({
        status: envStatus.allRequiredSet ? 'ok' : 'missing',
        env: envStatus,
        warnings
      });
    } catch (error) {
      // JWT検証エラー
      console.error('トークン検証エラー:', error);
      return res.status(401).json({ 
        message: 'トークンが無効または期限切れです' 
      });
    }
  } catch (error) {
    console.error('環境変数確認エラー:', error);
    return res.status(500).json({ 
      message: '内部サーバーエラー' 
    });
  }
} 