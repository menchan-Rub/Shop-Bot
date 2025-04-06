import { NextApiRequest, NextApiResponse } from 'next';

// NextAuthログ処理API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // ログデータを受け取り、必要に応じて処理
  // 本番環境では適切なログ処理を実装
  console.log('[NextAuth]', req.body);
  
  return res.status(200).json({ ok: true });
} 