import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Formidableのファイル型を定義
interface FormidableFile {
  filepath: string;
  originalFilename?: string;
  mimetype?: string;
  size: number;
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // セッションチェック
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }

  // 管理者権限のチェック
  if (!session.user?.isAdmin) {
    return res.status(403).json({ error: 'このAPIには管理者権限が必要です' });
  }

  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://api:3001';

  try {
    // Formidableでファイルをパース
    const parseForm = (): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
      return new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve({ fields, files });
        });
      });
    };

    const { files } = await parseForm();
    const file = files.file as unknown as FormidableFile;

    if (!file) {
      return res.status(400).json({ error: 'アップロードするファイルが見つかりません' });
    }

    // ファイルデータの準備
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.filepath), {
      filename: file.originalFilename || 'uploaded-file',
      contentType: file.mimetype || 'application/octet-stream'
    });

    // APIサーバーにファイルをアップロード
    const uploadResponse = await axios.post(`${baseURL}/admin/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-User-ID': session.user.id
      }
    });

    // 一時ファイルの削除
    fs.unlinkSync(file.filepath);

    return res.status(200).json(uploadResponse.data);
  } catch (error: any) {
    console.error('Upload API error:', error);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'サーバーエラーが発生しました'
    });
  }
} 