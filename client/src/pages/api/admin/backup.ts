import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import path from 'path';

// JWT シークレットキー
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ダミーデータ（実際の実装ではデータベースから取得する）
const getDummyBackupData = () => {
  return {
    users: [
      { id: 'USR-001', username: '田中太郎', email: 'tanaka@example.com', points: 500, createdAt: new Date().toISOString() },
      { id: 'USR-002', username: '佐藤花子', email: 'sato@example.com', points: 800, createdAt: new Date().toISOString() },
    ],
    orders: [
      { id: 'ORD-001', userId: 'USR-001', totalAmount: 12500, status: 'completed', items: [{ productId: 'PROD-001', quantity: 2 }], createdAt: new Date().toISOString() },
      { id: 'ORD-002', userId: 'USR-002', totalAmount: 8700, status: 'processing', items: [{ productId: 'PROD-002', quantity: 1 }], createdAt: new Date().toISOString() },
    ],
    products: [
      { id: 'PROD-001', name: 'プレミアムロール', price: 6250, stock: 15, createdAt: new Date().toISOString() },
      { id: 'PROD-002', name: 'スペシャルバッジ', price: 8700, stock: 8, createdAt: new Date().toISOString() },
    ],
    settings: {
      siteName: 'Discord Shop',
      pointRate: 1,
      maintenance: false,
      lastUpdated: new Date().toISOString()
    }
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
      console.log(`バックアップアクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
      return res.status(403).json({ 
        success: false,
        message: '管理者権限がありません' 
      });
    }

    // リクエストメソッドに応じた処理
    if (req.method === 'GET') {
      // バックアップデータを生成（実際の実装ではデータベースから取得）
      const backupData = getDummyBackupData();
      
      // タイムスタンプを追加
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupWithMeta = {
        data: backupData,
        meta: {
          timestamp,
          version: '1.0',
          generatedBy: decoded.discordUsername || 'admin',
          discordId: decoded.discordId
        }
      };

      // 成功レスポンスを返す
      return res.status(200).json({
        success: true,
        message: 'バックアップデータ生成成功',
        backup: backupWithMeta
      });
    } 
    else if (req.method === 'POST') {
      // リクエストボディからバックアップデータを取得
      const { backup } = req.body;
      
      if (!backup || !backup.data) {
        return res.status(400).json({
          success: false,
          message: 'バックアップデータが不正です'
        });
      }
      
      // バックアップデータを検証（実際の実装ではさらに詳細な検証を行う）
      if (!backup.data.users || !backup.data.orders || !backup.data.products) {
        return res.status(400).json({
          success: false,
          message: 'バックアップデータが不完全です'
        });
      }
      
      // バックアップデータを保存（実際の実装ではデータベースに適用する）
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupDir = path.join(process.cwd(), 'backups');
      
      try {
        // バックアップディレクトリが存在しない場合は作成
        await fs.mkdir(backupDir, { recursive: true });
        
        // バックアップファイル名を生成
        const filename = `backup-${timestamp}.json`;
        const filePath = path.join(backupDir, filename);
        
        // バックアップデータを保存
        await fs.writeFile(filePath, JSON.stringify(backup, null, 2));
        
        return res.status(200).json({
          success: true,
          message: 'バックアップデータを保存しました',
          filename
        });
      } catch (error) {
        console.error('バックアップファイル保存エラー:', error);
        return res.status(500).json({
          success: false,
          message: 'バックアップファイルの保存に失敗しました'
        });
      }
    } 
    else {
      return res.status(405).json({ 
        success: false,
        message: 'Method Not Allowed' 
      });
    }
  } catch (error) {
    console.error('バックアップ処理エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 