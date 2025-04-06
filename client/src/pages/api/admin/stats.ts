import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// モックデータ用の統計情報
const MOCK_STATS = {
  totalOrders: 156,
  totalUsers: 42,
  totalProducts: 28,
  totalRevenue: 286400,
  recentOrders: [
    {
      _id: '65f8a72c3a4d94d8c0b14b2e',
      createdAt: new Date().toISOString(),
      total: 12800,
      status: 'completed'
    },
    {
      _id: '65f8a78d3a4d94d8c0b14b2f',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      total: 8500,
      status: 'paid'
    },
    {
      _id: '65f8a7b13a4d94d8c0b14b30',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      total: 3200,
      status: 'pending'
    }
  ]
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // セッションと管理者権限の確認
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }

  if (!session.user.isAdmin) {
    return res.status(403).json({ error: '管理者権限が必要です' });
  }

  // ここでDBからデータを取得する代わりに、モックデータを返します
  // 実際の実装では、このセクションをMongoDBからのデータ取得に置き換えます
  try {
    // 遅延をシミュレート（実際のDB操作を想定）
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return res.status(200).json(MOCK_STATS);
  } catch (error) {
    console.error('統計データ取得エラー:', error);
    return res.status(500).json({ error: '統計データの取得に失敗しました' });
  }
} 