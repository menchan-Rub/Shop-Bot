import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// デモ注文データ
const demoOrders = [
  {
    _id: 'order123',
    user: {
      _id: 'user1',
      name: 'サンプルユーザー',
      email: 'sample@example.com'
    },
    items: [
      {
        product: {
          _id: 'prod1',
          name: 'サンプル商品',
          price: 1500
        },
        quantity: 2
      }
    ],
    total: 3000,
    status: 'pending',
    discordId: 'sample#1234',
    note: 'これはサンプル注文です',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'order456',
    user: {
      _id: 'user2',
      name: '山田太郎',
      email: 'yamada@example.com'
    },
    items: [
      {
        product: {
          _id: 'prod2',
          name: 'プレミアム商品',
          price: 5000
        },
        quantity: 1
      }
    ],
    total: 5000,
    status: 'completed',
    discordId: 'yamada#5678',
    note: '',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: 'order789',
    user: {
      _id: 'user3',
      name: '佐藤花子',
      email: 'sato@example.com'
    },
    items: [
      {
        product: {
          _id: 'prod3',
          name: 'ベーシック商品',
          price: 2000
        },
        quantity: 3
      }
    ],
    total: 6000,
    status: 'paid',
    discordId: 'sato#9012',
    note: '早めの発送をお願いします',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    _id: 'order101',
    user: {
      _id: 'user4',
      name: '鈴木一郎',
      email: 'suzuki@example.com'
    },
    items: [
      {
        product: {
          _id: 'prod4',
          name: 'スペシャル商品',
          price: 8000
        },
        quantity: 1
      }
    ],
    total: 8000,
    status: 'cancelled',
    discordId: 'suzuki#3456',
    note: 'キャンセルします',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 認証チェック
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証エラー: トークンがありません' });
  }

  try {
    // クエリパラメータの取得
    const { sort = 'createdAt', order = 'desc', status } = req.query;

    // ステータスでフィルター
    let filteredOrders = status 
      ? demoOrders.filter(o => o.status === status)
      : demoOrders;

    // ソート
    filteredOrders = filteredOrders.sort((a, b) => {
      const field = sort as string;
      
      if (field === 'total') {
        return order === 'asc' 
          ? a.total - b.total 
          : b.total - a.total;
      }
      
      // デフォルトは日付でソート
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });

    res.status(200).json(filteredOrders);
  } catch (error) {
    console.error('注文データAPI エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
} 