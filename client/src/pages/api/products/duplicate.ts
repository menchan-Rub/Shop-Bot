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
      console.log(`商品複製アクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
      return res.status(403).json({ 
        success: false,
        message: '管理者権限がありません' 
      });
    }

    // リクエストボディから複製する商品IDと複製数を取得
    const { productId, count = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '商品IDが必要です'
      });
    }

    // 複製数のバリデーション
    const duplicateCount = parseInt(count.toString()) || 1;
    if (duplicateCount < 1 || duplicateCount > 10) {
      return res.status(400).json({
        success: false,
        message: '複製数は1〜10の範囲で指定してください'
      });
    }
    
    // データベースに接続
    const { db } = await connectToDatabase();
    
    // 商品コレクション
    const productsCollection = db.collection('products');
    
    // 複製元の商品を取得
    const originalProduct = await productsCollection.findOne({ 
      _id: new ObjectId(productId) 
    });
    
    if (!originalProduct) {
      return res.status(404).json({
        success: false,
        message: '複製元の商品が見つかりません'
      });
    }
    
    // 複製する商品データの作成
    const duplicateProducts = [];
    
    for (let i = 0; i < duplicateCount; i++) {
      // 商品データの複製
      // _idを除外し、新しいオブジェクトを作成
      const newProduct = {
        name: `${originalProduct.name} (複製${i + 1})`,
        description: originalProduct.description,
        price: originalProduct.price,
        stock: originalProduct.stock,
        status: 'hidden', // 複製された商品は非表示状態で作成
        category: originalProduct.category,
        images: originalProduct.images || [],
        tags: originalProduct.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: decoded.discordId,
        isDuplicate: true,
        originalProductId: originalProduct._id.toString()
      };
      
      duplicateProducts.push(newProduct);
    }
    
    // 商品を一括挿入
    const result = await productsCollection.insertMany(duplicateProducts);
    
    // 操作の詳細情報をログに記録
    console.log(`管理者 ${decoded.discordUsername} (${decoded.discordId}) が商品「${originalProduct.name}」を ${duplicateCount}個複製しました`);
    
    return res.status(200).json({
      success: true,
      message: `${duplicateCount}個の商品を複製しました`,
      duplicatedCount: duplicateCount,
      insertedIds: result.insertedIds
    });
  } catch (error) {
    console.error('商品複製エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 