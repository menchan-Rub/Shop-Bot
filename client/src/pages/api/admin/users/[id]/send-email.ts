import { NextApiRequest, NextApiResponse } from 'next';

// 共有ユーザーデータ
// この実装ではユーザーデータは参照のみ
import { demoUsers } from '../../users/[id]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 認証チェック
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '認証されていません' });
  }
  
  const token = authHeader.split(' ')[1];
  // 本番環境では正確なJWT検証が必要
  if (!token || token.length < 10) {
    return res.status(401).json({ message: '有効なトークンではありません' });
  }
  
  try {
    const { id } = req.query;
    const { subject, body, type = 'info' } = req.body;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'ユーザーIDが必要です' });
    }
    
    // 必須データのチェック
    if (!subject || !body) {
      return res.status(400).json({ message: 'メールの件名と本文は必須です' });
    }
    
    // ユーザー検索
    const user = demoUsers.find(user => user._id === id || user.id === id);
    
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    
    // メールタイプの検証
    const validTypes = ['info', 'warning', 'support'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: '無効なメールタイプです' });
    }
    
    // 実際のプロダクション環境では：
    // 1. メールの送信内容をテンプレートに挿入
    // 2. メール送信サービス（例：SendGrid, Amazon SES）を使用して送信
    // 3. 送信履歴をDBに記録
    
    console.log(`メール送信シミュレーション: ${type} - ${subject} - to ${user.email}`);
    
    // デモ用: 成功レスポンスを返す
    return res.status(200).json({ 
      message: 'メールを送信しました',
      email: user.email,
      subject,
      type
    });
    
  } catch (error) {
    console.error('メール送信エラー:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
} 