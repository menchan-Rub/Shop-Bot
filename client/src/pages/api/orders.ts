import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }

  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://api:3001';

  try {
    if (req.method === 'GET') {
      // 注文一覧の取得
      const response = await axios.get(`${baseURL}/orders`, {
        headers: {
          'X-User-ID': session.user.id
        }
      });
      return res.status(200).json(response.data);
    } else if (req.method === 'POST') {
      // 注文の作成
      const orderData = req.body;
      const response = await axios.post(`${baseURL}/orders`, orderData, {
        headers: {
          'X-User-ID': session.user.id
        }
      });
      return res.status(201).json(response.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Orders API error:', error);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'サーバーエラーが発生しました'
    });
  }
} 