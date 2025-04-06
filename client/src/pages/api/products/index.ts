import type { NextApiRequest, NextApiResponse } from 'next';

// デモ用の商品データ
const demoProducts = {
  products: [
    {
      _id: '1',
      name: 'ゲーミングヘッドセット Pro 7.1',
      description: '7.1サラウンドサウンド対応の高品質ゲーミングヘッドセット。ノイズキャンセリングマイク付き。',
      price: 12800,
      stock: 25,
      status: 'available',
      category: {
        _id: 'cat1',
        name: 'ゲーミングデバイス'
      },
      images: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
      ],
      tags: ['ゲーミング', 'オーディオ', '新着'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: '2',
      name: 'メカニカルキーボード RGB',
      description: 'カスタマイズ可能なRGBバックライト付きメカニカルキーボード。青軸スイッチ採用。',
      price: 15600,
      stock: 3,
      status: 'available',
      category: {
        _id: 'cat1',
        name: 'ゲーミングデバイス'
      },
      images: [
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
      ],
      tags: ['ゲーミング', 'キーボード', '人気'],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '3',
      name: 'ワイヤレスゲーミングマウス',
      description: '超低遅延の高性能ワイヤレスゲーミングマウス。最大16,000 DPI、充電式バッテリー。',
      price: 8900,
      stock: 0,
      status: 'out_of_stock',
      category: {
        _id: 'cat1',
        name: 'ゲーミングデバイス'
      },
      images: [
        'https://images.unsplash.com/photo-1605773527852-c546a8584ea3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
      ],
      tags: ['ゲーミング', 'マウス', 'ワイヤレス'],
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '4',
      name: 'Discord Nitro 3ヶ月ギフト',
      description: 'Discord Nitroの3ヶ月分サブスクリプションギフトコード。高画質スクリーンシェア、カスタム絵文字などの特典付き。',
      price: 3500,
      stock: 50,
      status: 'available',
      category: {
        _id: 'cat2',
        name: 'デジタルコンテンツ'
      },
      images: [
        'https://i.imgur.com/QpDYzMyl.jpg'
      ],
      tags: ['Discord', 'ギフト', 'デジタル'],
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '5',
      name: 'ゲーム特典パック',
      description: '人気ゲームの限定アイテム、スキン、通貨パック。様々なゲームで使用可能。',
      price: 2500,
      stock: 4,
      status: 'available',
      category: {
        _id: 'cat2',
        name: 'デジタルコンテンツ'
      },
      images: [
        'https://i.imgur.com/uD9f0xZl.jpg'
      ],
      tags: ['ゲーム', '特典', 'デジタル'],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '6',
      name: 'ストリーミングオーバーレイセット',
      description: 'プロ級のストリーミング用アニメーションオーバーレイ、アラート、バナーのセット。カスタマイズ可能。',
      price: 4800,
      stock: 15,
      status: 'available',
      category: {
        _id: 'cat2',
        name: 'デジタルコンテンツ'
      },
      images: [
        'https://i.imgur.com/IYt9A3Kl.jpg'
      ],
      tags: ['ストリーミング', 'オーバーレイ', 'デジタル'],
      createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '7',
      name: 'ゲーミングデスク 140cm',
      description: '人間工学に基づいた設計の広々としたゲーミングデスク。ケーブル管理システム付き。',
      price: 24800,
      stock: 0,
      status: 'out_of_stock',
      category: {
        _id: 'cat3',
        name: 'ゲーミング家具'
      },
      images: [
        'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
      ],
      tags: ['家具', 'デスク'],
      createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '8',
      name: 'ゲーミングチェア プロシリーズ',
      description: '長時間のゲームセッションに最適な高級ゲーミングチェア。腰痛サポート機能付き。',
      price: 32000,
      stock: 8,
      status: 'available',
      category: {
        _id: 'cat3',
        name: 'ゲーミング家具'
      },
      images: [
        'https://images.unsplash.com/photo-1603725951583-004965547d3a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
      ],
      tags: ['家具', 'チェア', 'プレミアム'],
      createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  totalCount: 8,
  page: 1,
  pageSize: 20,
  totalPages: 1
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 認証チェック - 開発環境ではスキップ
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || '';

    if (process.env.NODE_ENV === 'production') {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '認証されていません' });
      }
      
      if (!token || token.length < 10) {
        return res.status(401).json({ message: '有効なトークンではありません' });
      }
    }
    
    // リクエストメソッドによる処理分岐
    switch(req.method) {
      case 'GET':
        return handleGet(req, res);
      default:
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('API処理エラー:', error);
    // エラー時もデモデータを返す
    return res.status(200).json(demoProducts);
  }
}

// GET: 商品一覧取得
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // クエリパラメータを取得
    const { 
      sort = 'createdAt', 
      order = 'desc',
      category = '',
      search = '',
      page = '1',
      pageSize = '20'
    } = req.query;
    
    // 実際の環境では、ここでデータベースからデータを取得する処理を実装
    // このデモではモックデータを返す
    
    // カテゴリーフィルタリング
    let filteredProducts = [...demoProducts.products];
    if (category && typeof category === 'string' && category !== '') {
      filteredProducts = filteredProducts.filter(p => p.category._id === category);
    }
    
    // 検索フィルタリング
    if (search && typeof search === 'string' && search !== '') {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchLower) || 
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    // ソート処理
    if (sort && typeof sort === 'string') {
      filteredProducts.sort((a: any, b: any) => {
        if (a[sort] < b[sort]) return order === 'asc' ? -1 : 1;
        if (a[sort] > b[sort]) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // ページネーション
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    const result = {
      products: paginatedProducts,
      totalCount: filteredProducts.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(filteredProducts.length / pageSizeNum)
    };
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('商品一覧取得エラー:', error);
    // エラー時もデモデータを返す
    return res.status(200).json(demoProducts);
  }
}; 