import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';

// JWT シークレットキー
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // デモデータ: 実際の環境ではデータベースから取得
      const demoTags = [
        'ゲーミング',
        '周辺機器',
        'キーボード',
        'マウス',
        'ヘッドセット',
        'モニター',
        'チェア',
        'デスク',
        'PC',
        'ノートPC',
        'ゲームソフト',
        'アクセサリー',
        'セール',
        '人気',
        'おすすめ',
        '新着',
        '限定',
        'PCパーツ',
        'GPU',
        'CPU',
        'マザーボード',
        'メモリ',
        'SSD',
        'HDD',
        '電源',
        'ケース',
        'ネットワーク',
        'オーディオ',
        'スピーカー',
        'マイク'
      ];

      // レスポンス返却
      res.status(200).json({
        tags: demoTags,
        total: demoTags.length
      });
    } catch (error) {
      console.error('タグ一覧取得エラー:', error);
      res.status(500).json({ error: 'タグ一覧の取得に失敗しました' });
    }
  } else if (req.method === 'POST') {
    try {
      const { productId, tags } = req.body;

      if (!productId || !Array.isArray(tags)) {
        return res.status(400).json({ error: '無効なリクエスト形式です' });
      }

      // 実際の環境ではデータベースの更新処理
      console.log(`商品ID ${productId} のタグを更新: ${tags.join(', ')}`);

      // 成功レスポンス
      res.status(200).json({
        success: true,
        productId,
        tags
      });
    } catch (error) {
      console.error('タグ更新エラー:', error);
      res.status(500).json({ error: 'タグの更新に失敗しました' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 