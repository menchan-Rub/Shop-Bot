import { NextApiRequest, NextApiResponse } from 'next';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';

// ユーザー型定義
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  isAdmin: boolean;
  isStaff: boolean;
  emailVerified: boolean;
  status: string;
  points: number;
}

// デモユーザーデータ
const demoUsers: User[] = [
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
let users: User[] = [...demoUsers];

// 簡略化したAPIハンドラ - 常にデモデータを返す
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API呼び出し: /api/admin/users', { method: req.method });
  
  // GETリクエストの場合はユーザー一覧を返す
  if (req.method === 'GET') {
    return res.status(200).json(users);
  }
  
  // POSTリクエストの場合は新しいユーザーを作成
  if (req.method === 'POST') {
    const { username, email, password } = req.body;
    
    // 簡易バリデーション
    if (!username || !email) {
      return res.status(400).json({ message: '名前とメールは必須です' });
    }
    
    // 新しいユーザーを作成
    const newUser: User = {
      id: String(Date.now()),
      username,
      email,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isAdmin: false,
      isStaff: false,
      emailVerified: false,
      status: 'active',
      points: 0
    };
    
    // 追加してリストを更新
    users.push(newUser);
    
    return res.status(201).json(newUser);
  }
  
  // その他のメソッドは405エラー
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
} 