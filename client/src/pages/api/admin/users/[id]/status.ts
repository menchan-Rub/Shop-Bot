import { NextApiRequest, NextApiResponse } from 'next';

// ユーザーのデモデータ（実際はDBから取得）
const demoUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    createdAt: '2023-04-01T09:00:00.000Z',
    lastLogin: '2023-04-05T12:30:45.000Z',
    isAdmin: true,
    isStaff: true,
    emailVerified: true,
    status: 'active',
    points: 1000
  },
  {
    id: '2',
    username: 'staff_user',
    email: 'staff@example.com',
    createdAt: '2023-04-02T10:15:00.000Z',
    lastLogin: '2023-04-04T08:20:10.000Z',
    isAdmin: false,
    isStaff: true,
    emailVerified: true,
    status: 'active',
    points: 500
  },
  {
    id: '3',
    username: 'regular_user',
    email: 'user@example.com',
    createdAt: '2023-04-03T14:30:00.000Z',
    lastLogin: '2023-04-03T18:45:20.000Z',
    isAdmin: false,
    isStaff: false,
    emailVerified: true,
    status: 'active',
    points: 250
  },
  {
    id: '4',
    username: 'suspended_user',
    email: 'suspended@example.com',
    createdAt: '2023-03-15T11:20:00.000Z',
    lastLogin: '2023-03-28T09:10:30.000Z',
    isAdmin: false,
    isStaff: false,
    emailVerified: true,
    status: 'suspended',
    points: 100
  },
  {
    id: '5',
    username: 'banned_user',
    email: 'banned@example.com',
    createdAt: '2023-02-10T15:45:00.000Z',
    lastLogin: '2023-02-28T16:30:40.000Z',
    isAdmin: false,
    isStaff: false,
    emailVerified: false,
    status: 'banned',
    points: 0
  }
];

// メモリ内ストレージ
let users = [...demoUsers];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 認証チェック
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '認証が必要です' });
  }
  
  // 実際にはここでトークンを検証する処理が必要
  
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'ユーザーIDが必要です' });
  }
  
  // ステータス更新は PUT メソッドのみ許可
  if (req.method === 'PUT') {
    return handleUpdateStatus(req, res, id);
  }
  
  res.setHeader('Allow', ['PUT']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}

/**
 * ユーザーのステータスを更新する
 */
const handleUpdateStatus = async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
  try {
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    
    const { status } = req.body;
    
    // ステータス値の検証
    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ 
        message: '無効なステータスです。active, suspended, banned のいずれかを指定してください' 
      });
    }
    
    // 管理者アカウントの保護（管理者ユーザーのステータスは変更不可）
    if (users[userIndex].isAdmin && status !== 'active') {
      return res.status(403).json({ message: '管理者ユーザーのステータスは変更できません' });
    }
    
    // ユーザーステータスの更新
    users[userIndex] = {
      ...users[userIndex],
      status,
      // ステータスに応じた追加処理
      ...(status === 'banned' && { emailVerified: false })
    };
    
    return res.status(200).json({
      message: `ユーザーステータスが ${status} に更新されました`,
      user: users[userIndex]
    });
  } catch (error) {
    console.error('ステータス更新エラー:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
}; 