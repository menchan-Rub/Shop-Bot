import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // GETメソッド以外は許可しない
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  // 認証チェック
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証エラー: トークンがありません' });
  }

  const { id } = req.query;
  const orderId = Array.isArray(id) ? id[0] : id;

  try {
    // ここでは単純なJSONレスポンスを返すだけにします
    // 実際の実装では、PDFや別のフォーマットのファイルを生成してダウンロードさせるでしょう
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderId}.json"`);

    // デモデータ
    const invoiceData = {
      invoiceId: `INV-${orderId}-${Date.now().toString().substring(0, 8)}`,
      orderId: orderId,
      date: new Date().toISOString(),
      customerName: 'デモユーザー',
      customerEmail: 'demo@example.com',
      items: [
        {
          name: 'サンプル商品',
          price: 1500,
          quantity: 2,
          subtotal: 3000
        },
        {
          name: 'プレミアム商品',
          price: 5000,
          quantity: 1,
          subtotal: 5000
        }
      ],
      total: 8000,
      taxAmount: 800,
      grandTotal: 8800,
      notes: 'これはデモ請求書です。実際の請求ではありません。'
    };

    res.status(200).json(invoiceData);
  } catch (error) {
    console.error('請求書生成エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
} 