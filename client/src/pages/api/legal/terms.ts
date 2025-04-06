import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // プロジェクトルートからの相対パス
    const filePath = path.join(process.cwd(), '../../legal/terms.md');
    
    // ファイルが存在するか確認
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'ファイルが見つかりません' });
    }
    
    // ファイルを読み込む
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // マークダウンとしてレスポンスを返す
    res.setHeader('Content-Type', 'text/markdown');
    return res.status(200).send(fileContent);
  } catch (error) {
    console.error('ファイル読み込みエラー:', error);
    return res.status(500).json({ message: '内部サーバーエラー' });
  }
} 