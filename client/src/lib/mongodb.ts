import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'shop';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * MongoDBデータベースへの接続を提供します
 * 接続はキャッシュされ、同じインスタンスが再利用されます
 */
export async function connectToDatabase() {
  // すでに接続がある場合はそれを再利用
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // 環境変数が設定されていない場合はエラー
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!MONGODB_DB) {
    throw new Error('Please define the MONGODB_DB environment variable');
  }

  // 新しい接続を確立
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  // 接続をキャッシュ
  cachedClient = client;
  cachedDb = db;

  return { client, db };
} 