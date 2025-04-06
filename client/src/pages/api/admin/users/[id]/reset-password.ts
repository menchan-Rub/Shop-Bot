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
  
  // パスワードリセットは POST メソッドのみ許可
  if (req.method === 'POST') {
    return handlePasswordReset(req, res, id);
  }
  
  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}

/**
 * ユーザーのパスワードリセット
 */
const handlePasswordReset = async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
  try {
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    
    // 無効なユーザーは操作不可
    if (user.status === 'banned') {
      return res.status(403).json({ message: 'アカウント停止中のユーザーはパスワードをリセットできません' });
    }
    
    // 実際の実装では以下の処理が必要:
    // 1. リセットトークンの生成
    // 2. データベースにトークンと有効期限を保存
    // 3. ユーザーにメール送信
    
    // デモ実装ではシミュレーションのみ行う
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 3600000); // 1時間後
    
    console.log(`パスワードリセット - ユーザーID: ${userId}, トークン: ${resetToken}, 有効期限: ${resetExpires}`);
    
    return res.status(200).json({
      message: `${user.email} 宛にパスワードリセットのメールが送信されました`,
      success: true,
      email: user.email
    });
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
}; 