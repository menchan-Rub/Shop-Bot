import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import path from 'path';

// JWT シークレットキー
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GETリクエストのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method Not Allowed' 
    });
  }

  // リクエストヘッダーからトークンを取得
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: '認証トークンがありません' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // トークンを検証
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // トークンに管理者権限があるか確認
    if (!decoded.isAdmin) {
      console.log(`バックアップ履歴アクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
      return res.status(403).json({ 
        success: false,
        message: '管理者権限がありません' 
      });
    }

    // バックアップディレクトリのパス
    const backupDir = path.join(process.cwd(), 'backups');
    
    try {
      // バックアップディレクトリが存在しない場合は作成
      await fs.mkdir(backupDir, { recursive: true });
      
      // バックアップファイルの一覧を取得
      const files = await fs.readdir(backupDir);
      
      // バックアップファイルの詳細情報を取得
      const backups = await Promise.all(files
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(async file => {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          
          // ファイルの内容を読み込み、メタデータを抽出
          let meta = {
            timestamp: '',
            version: '',
            generatedBy: 'Unknown',
            discordId: ''
          };
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const backup = JSON.parse(content);
            if (backup.meta) {
              meta = backup.meta;
            }
          } catch (error) {
            console.warn(`バックアップファイル読み込みエラー: ${file}`, error);
          }
          
          return {
            filename: file,
            createdAt: stats.birthtime,
            size: stats.size,
            meta
          };
        }));
      
      // 日付の降順でソート
      backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return res.status(200).json({
        success: true,
        backups
      });
    } catch (error) {
      console.error('バックアップ履歴取得エラー:', error);
      // ディレクトリが存在しないなどのエラーの場合は空の配列を返す
      return res.status(200).json({
        success: true,
        backups: []
      });
    }
  } catch (error) {
    console.error('バックアップ履歴API処理エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 