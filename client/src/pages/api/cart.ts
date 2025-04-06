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
    switch (req.method) {
      case 'GET':
        // カートアイテムの取得
        const response = await axios.get(`${baseURL}/cart`, {
          headers: {
            'X-User-ID': session.user.id
          }
        });
        return res.status(200).json(response.data);

      case 'POST':
        // カートに商品を追加
        const { productId, quantity } = req.body;
        const postResponse = await axios.post(
          `${baseURL}/cart`,
          { productId, quantity },
          {
            headers: {
              'X-User-ID': session.user.id
            }
          }
        );
        return res.status(201).json(postResponse.data);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Cart API error:', error);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'サーバーエラーが発生しました'
    });
  }
} 