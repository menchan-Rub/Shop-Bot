import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// JWT シークレットキー
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
      console.log(`カテゴリー順序変更アクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
      return res.status(403).json({ 
        success: false,
        message: '管理者権限がありません' 
      });
    }

    // リクエストボディからカテゴリーリストを取得
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'カテゴリーのリストが必要です'
      });
    }
    
    // カテゴリーのIDと順序を検証
    for (const category of categories) {
      if (!category.id || typeof category.displayOrder !== 'number') {
        return res.status(400).json({
          success: false,
          message: '各カテゴリーにはidとdisplayOrderが必要です'
        });
      }
    }
    
    // データベースに接続
    const { db } = await connectToDatabase();
    
    // カテゴリーコレクション
    const categoriesCollection = db.collection('categories');
    
    // 順序を更新
    const bulkOps = categories.map(category => ({
      updateOne: {
        filter: { _id: new ObjectId(category.id) },
        update: { 
          $set: { 
            displayOrder: category.displayOrder,
            updatedAt: new Date()
          } 
        }
      }
    }));
    
    // バルク操作を実行
    const result = await categoriesCollection.bulkWrite(bulkOps);
    
    // 操作の詳細情報をログに記録
    console.log(`管理者 ${decoded.discordUsername} (${decoded.discordId}) がカテゴリーの順序を変更しました - ${result.modifiedCount}件更新`);
    
    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount}件のカテゴリー順序を更新しました`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('カテゴリー順序変更エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 