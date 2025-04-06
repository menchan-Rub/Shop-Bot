import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import path from 'path';

// JWT シークレットキー
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ダミーログデータ（実際の実装ではログファイルやデータベースから取得する）
const generateDummyLogs = (count: number, type: string = 'all') => {
  const logTypes = ['info', 'warning', 'error', 'auth'];
  const actions = [
    '新規ユーザー登録',
    'ログイン',
    'ログアウト',
    '管理者ログイン',
    'バックアップ作成',
    'バックアップ復元',
    '注文作成',
    '注文状態更新',
    '商品追加',
    '商品更新',
    'API呼び出しエラー',
    'データベース接続エラー',
    '不正アクセス検出',
  ];
  const users = [
    { id: 'USR-001', name: '田中太郎', email: 'tanaka@example.com' },
    { id: 'USR-002', name: '佐藤花子', email: 'sato@example.com' },
    { id: 'USR-003', name: '鈴木一郎', email: 'suzuki@example.com' },
    { id: 'USR-004', name: '高橋幸子', email: 'takahashi@example.com' },
    { id: 'ADMIN-001', name: '管理者', email: 'admin@example.com' },
  ];
  const ipAddresses = [
    '192.168.1.1',
    '10.0.0.2',
    '172.16.0.3',
    '127.0.0.1',
  ];

  const logs = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - i * 3600000);
    let logType = logTypes[Math.floor(Math.random() * logTypes.length)];
    
    // タイプフィルターが指定されている場合
    if (type !== 'all' && type !== logType) {
      logType = type;
    }
    
    const action = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
    
    let details = '';
    let status = 'success';
    
    if (logType === 'error') {
      status = 'failed';
      details = `エラー: ${['データベース接続失敗', 'API呼び出しタイムアウト', '不正なリクエストパラメータ', '認証失敗'][Math.floor(Math.random() * 4)]}`;
    } else if (logType === 'warning') {
      status = Math.random() > 0.5 ? 'warning' : 'success';
      details = `警告: ${['リソース消費量が高い', '複数回の失敗したログイン試行', 'APIレートリミット接近', 'セッションタイムアウト'][Math.floor(Math.random() * 4)]}`;
    }
    
    logs.push({
      id: `LOG-${10000 - i}`,
      timestamp: timestamp.toISOString(),
      type: logType,
      action,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      ipAddress,
      status,
      details
    });
  }
  
  return logs;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GETリクエストのみ許可
  if (req.method !== 'GET') {
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
      console.log(`システムログアクセス拒否: 管理者権限なし - Discord ID ${decoded.discordId}`);
      return res.status(403).json({ 
        success: false,
        message: '管理者権限がありません' 
      });
    }

    // クエリパラメータを取得
    const { limit = '100', page = '1', type = 'all', search = '' } = req.query;
    
    // パラメータを検証
    const limitNum = Math.min(parseInt(limit as string, 10) || 100, 1000);
    const pageNum = parseInt(page as string, 10) || 1;
    const skip = (pageNum - 1) * limitNum;
    
    // ログデータを取得（実際の実装ではログファイルやデータベースから取得する）
    let logs = generateDummyLogs(500, type as string);
    
    // 検索フィルター
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      logs = logs.filter(log => 
        searchRegex.test(log.action) || 
        searchRegex.test(log.userName) || 
        searchRegex.test(log.userEmail) || 
        searchRegex.test(log.details || '')
      );
    }
    
    // 総件数
    const total = logs.length;
    
    // ページネーション
    const paginatedLogs = logs.slice(skip, skip + limitNum);
    
    // ログタイプごとの集計
    const summary = {
      total,
      info: logs.filter(log => log.type === 'info').length,
      warning: logs.filter(log => log.type === 'warning').length,
      error: logs.filter(log => log.type === 'error').length,
      auth: logs.filter(log => log.type === 'auth').length,
    };
    
    return res.status(200).json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      summary
    });
  } catch (error) {
    console.error('システムログ取得エラー:', error);
    return res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
} 