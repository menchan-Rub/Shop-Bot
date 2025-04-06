import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }

  const { id } = req.query;
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://api:3001';

  try {
    switch (req.method) {
      case 'PUT':
        // カート内のアイテムを更新
        const putData = req.body;
        const putResponse = await axios.put(`${baseURL}/cart/${id}`, putData, {
          headers: {
            'X-User-ID': session.user.id
          }
        });
        return res.status(200).json(putResponse.data);

      case 'DELETE':
        // カートから商品を削除
        const deleteResponse = await axios.delete(`${baseURL}/cart/${id}`, {
          headers: {
            'X-User-ID': session.user.id
          }
        });
        return res.status(200).json(deleteResponse.data);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Cart item API error:', error);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'サーバーエラーが発生しました'
    });
  }
} 