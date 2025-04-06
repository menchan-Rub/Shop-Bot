import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// JWT シークレットキー
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // PATCHリクエストのみ許可
  if (req.method !== 'PATCH') {
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
      console.log(`タグ更新アクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
      return res.status(403).json({ 
        success: false,
        message: '管理者権限がありません' 
      });
    }

    // URLから商品IDを取得
    const { id } = req.query;
    
    if (!id || !ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: '有効な商品IDが必要です'
      });
    }
    
    // リクエストボディからタグ配列を取得
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'タグの配列が必要です'
      });
    }
    
    // タグをサニタイズ（空白を削除し、重複を排除）
    const sanitizedTags = [...new Set(
      tags.map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    )];
    
    // データベースに接続
    const { db } = await connectToDatabase();
    
    // 商品コレクション
    const productsCollection = db.collection('products');
    
    // 商品が存在するか確認
    const productExists = await productsCollection.findOne({ 
      _id: new ObjectId(id as string) 
    });
    
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: '商品が見つかりません'
      });
    }
    
    // タグを更新
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { 
        $set: { 
          tags: sanitizedTags,
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'タグの更新に失敗しました'
      });
    }
    
    // 操作の詳細情報をログに記録
    console.log(`管理者 ${decoded.discordUsername} (${decoded.discordId}) が商品ID:${id}のタグを更新しました: ${sanitizedTags.join(', ')}`);
    
    return res.status(200).json({
      success: true,
      message: 'タグが更新されました',
      tags: sanitizedTags
    });
  } catch (error) {
    console.error('タグ更新エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 