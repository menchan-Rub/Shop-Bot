import { NextApiRequest, NextApiResponse } from 'next';

// デモ用のカテゴリーデータ
const demoCategories = {
  categories: [
    {
      _id: 'cat1',
      name: 'ゲーミングデバイス',
      slug: 'gaming-devices',
      description: 'ゲーミングマウス、キーボード、ヘッドセットなどの周辺機器',
      displayOrder: 1,
      isVisible: true,
      emoji: '🎮'
    },
    {
      _id: 'cat2',
      name: 'デジタルコンテンツ',
      slug: 'digital-content',
      description: 'Discord Nitro、ゲーム内アイテム、デジタルサービス',
      displayOrder: 2,
      isVisible: true,
      emoji: '💻'
    },
    {
      _id: 'cat3',
      name: 'ゲーミング家具',
      slug: 'gaming-furniture',
      description: 'ゲーミングチェア、デスク、モニタースタンドなど',
      displayOrder: 3,
      isVisible: true,
      emoji: '🪑'
    },
    {
      _id: 'cat4',
      name: 'シーズンイベント',
      slug: 'seasonal',
      description: '期間限定の特別商品',
      displayOrder: 4,
      isVisible: false,
      emoji: '🎁'
    }
  ],
  totalCount: 4
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
    return res.status(200).json(demoCategories);
  }
}

// GET: カテゴリー一覧取得
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // クエリパラメータを取得
    const { 
      visibleOnly = 'true',
    } = req.query;
    
    // 実際の環境では、ここでデータベースからデータを取得する処理を実装
    // このデモではモックデータを返す
    
    // 表示状態でフィルタリング
    let filteredCategories = [...demoCategories.categories];
    if (visibleOnly === 'true') {
      filteredCategories = filteredCategories.filter(c => c.isVisible);
    }
    
    // 表示順でソート
    filteredCategories.sort((a, b) => a.displayOrder - b.displayOrder);
    
    const result = {
      categories: filteredCategories,
      totalCount: filteredCategories.length
    };
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('カテゴリー一覧取得エラー:', error);
    // エラー時もデモデータを返す
    return res.status(200).json(demoCategories);
  }
}; 