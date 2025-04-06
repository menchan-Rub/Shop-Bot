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
      console.log(`商品一括削除アクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
      return res.status(403).json({ 
        success: false,
        message: '管理者権限がありません' 
      });
    }

    // リクエストボディから商品IDリストを取得
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '商品IDのリストが必要です'
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
    
    // 操作の詳細情報をログに記録
    console.log(`管理者 ${decoded.discordUsername} (${decoded.discordId}) が ${validObjectIds.length} 件の商品を一括削除しました`);
    
    // 一括削除実行
    const result = await productsCollection.deleteMany(
      { _id: { $in: validObjectIds } }
    );
    
    // 削除した商品に関連する注文データの更新などが必要な場合はここで実行
    
    return res.status(200).json({
      success: true,
      message: `${result.deletedCount}件の商品を削除しました`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('商品一括削除エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 