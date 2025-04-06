import { NextApiRequest, NextApiResponse } from 'next';

// デモ注文データ
const demoOrders = {
  'order123': {
    _id: 'order123',
    user: {
      _id: 'user1',
      name: 'サンプルユーザー',
      email: 'sample@example.com'
    },
    items: [
      {
        _id: 'item1',
        product: {
          _id: 'prod1',
          name: 'サンプル商品',
          price: 1500,
          images: ['/placeholder-image.jpg']
        },
        quantity: 2
      },
      {
        _id: 'item2',
        product: {
          _id: 'prod2',
          name: 'プレミアム商品A',
          price: 3000,
          images: ['/placeholder-image.jpg']
        },
        quantity: 1
      }
    ],
    total: 6000,
    status: 'pending',
    discordId: 'sample#1234',
    note: 'これはサンプル注文です',
    adminNote: '管理者メモサンプル',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'order456': {
    _id: 'order456',
    user: {
      _id: 'user2',
      name: '山田太郎',
      email: 'yamada@example.com'
    },
    items: [
      {
        _id: 'item3',
        product: {
          _id: 'prod3',
          name: 'プレミアム商品B',
          price: 5000,
          images: ['/placeholder-image.jpg']
        },
        quantity: 1
      }
    ],
    total: 5000,
    status: 'completed',
    discordId: 'yamada#5678',
    note: '',
    adminNote: '3/15に発送済み',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET, PUT以外のメソッドは許可しない
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  // 認証チェック
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証エラー: トークンがありません' });
  }

  const { id } = req.query;
  const orderId = Array.isArray(id) ? id[0] : id;

  // GETリクエスト（注文情報取得）
  if (req.method === 'GET') {
    // 指定されたIDの注文データを取得するか、なければ汎用デモデータを返す
    const order = demoOrders[orderId] || {
      _id: orderId || 'unknown',
      user: {
        _id: 'user_unknown',
        name: 'デモユーザー',
        email: 'demo@example.com'
      },
      items: [
        {
          _id: 'item_demo',
          product: {
            _id: 'prod_demo',
            name: 'デモ商品',
            price: 2500,
            images: ['/placeholder-image.jpg']
          },
          quantity: 2
        }
      ],
      total: 5000,
      status: 'pending',
      discordId: 'demo#0000',
      note: 'デモ注文です',
      adminNote: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json(order);
  }

  // PUTリクエスト（注文ステータス更新）
  if (req.method === 'PUT') {
    try {
      const { status, adminNote } = req.body;
      
      // 実際のシステムではここでデータベース更新を行う
      // ここではデモデータだけを返す
      
      return res.status(200).json({
        message: '注文が更新されました',
        order: {
          _id: orderId,
          status,
          adminNote
        }
      });
    } catch (error) {
      console.error('注文更新エラー:', error);
      return res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  }
} 