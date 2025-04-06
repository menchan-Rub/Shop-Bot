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
      console.log(`商品一括更新アクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
      return res.status(403).json({ 
        success: false,
        message: '管理者権限がありません' 
      });
    }

    // リクエストボディから商品IDリストと更新データを取得
    const { productIds, update } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '商品IDのリストが必要です'
      });
    }
    
    if (!update || typeof update !== 'object') {
      return res.status(400).json({
        success: false,
        message: '更新データが必要です'
      });
    }
    
    // 許可された更新フィールド
    const allowedFields = ['status', 'price', 'stock', 'category', 'isVisible', 'featured'];
    
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
    
    // 商品コレクション
    const productsCollection = db.collection('products');
    
    // ObjectIdに変換（有効なObjectIdのみ）
    const validObjectIds = productIds
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));
    
    if (validObjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '有効な商品IDがありません'
      });
    }
    
    // 更新日時を追加
    sanitizedUpdate.updatedAt = new Date();
    
    // 一括更新実行
    const result = await productsCollection.updateMany(
      { _id: { $in: validObjectIds } },
      { $set: sanitizedUpdate }
    );
    
    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount}件の商品を更新しました`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('商品一括更新エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 