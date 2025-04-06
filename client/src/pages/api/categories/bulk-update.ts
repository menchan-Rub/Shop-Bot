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
      console.log(`カテゴリー一括更新アクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
      return res.status(403).json({ 
        success: false,
        message: '管理者権限がありません' 
      });
    }

    // リクエストボディからカテゴリーIDリストと更新データを取得
    const { categoryIds, update } = req.body;
    
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'カテゴリーIDのリストが必要です'
      });
    }
    
    if (!update || typeof update !== 'object') {
      return res.status(400).json({
        success: false,
        message: '更新データが必要です'
      });
    }
    
    // 許可された更新フィールド
    const allowedFields = ['isVisible', 'emoji', 'displayOrder', 'parentId'];
    
    // 更新データから許可されていないフィールドを削除
    const sanitizedUpdate = Object.keys(update).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = update[key];
      }
      return acc;
    }, {} as any);
    
    if (Object.keys(sanitizedUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: '有効な更新フィールドがありません'
      });
    }
    
    // データベースに接続
    const { db } = await connectToDatabase();
    
    // カテゴリーコレクション
    const categoriesCollection = db.collection('categories');
    
    // ObjectIdに変換（有効なObjectIdのみ）
    const validObjectIds = categoryIds
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));
    
    if (validObjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '有効なカテゴリーIDがありません'
      });
    }
    
    // 更新日時を追加
    sanitizedUpdate.updatedAt = new Date();
    
    // 一括更新実行
    const result = await categoriesCollection.updateMany(
      { _id: { $in: validObjectIds } },
      { $set: sanitizedUpdate }
    );
    
    // 更新内容をログに記録
    const updateSummary = Object.entries(sanitizedUpdate)
      .filter(([key]) => key !== 'updatedAt')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    console.log(`管理者 ${decoded.discordUsername} (${decoded.discordId}) が ${validObjectIds.length} 件のカテゴリーを一括更新しました - ${updateSummary}`);
    
    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount}件のカテゴリーを更新しました`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('カテゴリー一括更新エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 