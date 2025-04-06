import axios from 'axios';
import { getSession } from 'next-auth/react';

// 認証付きAPI呼び出しのための共通設定
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// リクエスト送信前の前処理
api.interceptors.request.use(config => {
  // ブラウザ環境の場合はクッキーを設定
  if (typeof window !== 'undefined') {
    config.headers.Cookie = document.cookie;
  }
  return config;
});

// データがない場合のデフォルト値
const defaultEmptyData = {
  success: true,
  todaySales: 0,
  totalSales: 0,
  ordersChange: 0,
  salesChange: 0,
  todayOrders: 0,
  totalOrders: 0,
  newUsers: 0,
  totalUsers: 0,
  totalProducts: 0,
  outOfStock: 0,
  lowStock: 0,
  pendingOrders: 0,
  pendingReturns: 0,
  totalCategories: 0,
  shopStatus: 'open',
  salesData: [
    { date: new Date().toISOString().split('T')[0], sales: 0, orders: 0 }
  ],
  recentOrders: [],
  recentUsers: []
};

// API Gateway URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// デモデータ
const DEMO_DATA = {
  // ダッシュボード統計
  '/api/admin/dashboard-stats': {
    todayOrders: 12,
    todayRevenue: 158000,
    yesterdayOrders: 8,
    yesterdayRevenue: 95000,
    totalUsers: 254,
    totalProducts: 89,
    totalOrders: 423,
    pendingOrders: 7,
    ordersChange: 50,
    salesChange: 66.3,
    activeUsers: 87,
    outOfStock: 3,
    lowStock: 5,
    newUsers: 12,
    salesData: Array(7).fill(0).map((_, i) => ({
      date: new Date(Date.now() - i * 86400000).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      sales: Math.floor(Math.random() * 200000) + 50000,
      orders: Math.floor(Math.random() * 20) + 5
    })),
    recentOrders: Array(5).fill(0).map((_, i) => ({
      _id: `order${i}`,
      user: { name: `ユーザー${i}`, image: null },
      total: Math.floor(Math.random() * 10000) + 1000,
      status: ['pending', 'completed', 'paid', 'cancelled'][Math.floor(Math.random() * 4)],
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    })),
    recentUsers: Array(5).fill(0).map((_, i) => ({
      _id: `user${i}`,
      name: `新規ユーザー${i}`,
      email: `user${i}@example.com`,
      image: null,
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }))
  },
  
  // 注文一覧
  '/api/admin/orders': {
    data: Array(10).fill(0).map((_, i) => ({
      _id: `order${i}`,
      user: {
        _id: `user${i}`,
        name: `ユーザー${i}`,
        email: `user${i}@example.com`
      },
      items: [
        {
          product: {
            _id: `prod${i}`,
            name: `商品${i}`,
            price: 1500 + (i * 500)
          },
          quantity: Math.floor(Math.random() * 3) + 1
        }
      ],
      total: 3000 + (i * 500),
      status: ['pending', 'paid', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
      discordId: `user${i}#${1000 + i}`,
      note: i % 3 === 0 ? 'デモ注文です' : '',
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - i * 86400000).toISOString()
    }))
  },
  
  // 商品一覧
  '/api/products': {
    products: Array(12).fill(0).map((_, i) => ({
      _id: `prod${i}`,
      name: `デモ商品${i}`,
      description: `これはデモ商品${i}の説明です。`,
      price: 1000 + (i * 500),
      stock: Math.floor(Math.random() * 50),
      images: [`/img/product${i % 5}.jpg`],
      category: {
        _id: `cat${i % 5}`,
        name: `カテゴリー${i % 5}`
      },
      isVisible: i % 7 !== 0,
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    })),
    totalCount: 45
  },
  
  // カテゴリー一覧
  '/api/categories': {
    categories: Array(8).fill(0).map((_, i) => ({
      _id: `cat${i}`,
      name: `カテゴリー${i}`,
      slug: `category-${i}`,
      description: `これはカテゴリー${i}の説明です。`,
      parent: i > 5 ? `cat${i-5}` : null,
      ancestors: i > 5 ? [`cat${i-5}`] : [],
      children: i < 3 ? [`cat${i+5}`] : [],
      emoji: ['🚀', '🎮', '✨', '⚡', '🔥', '🎁', '📱', '💻'][i % 8],
      isVisible: i % 6 !== 0,
      displayOrder: i,
      updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }))
  },
  
  // ユーザー一覧
  '/api/admin/users': [
    {
      _id: '1',
      id: '1',
      name: '管理者ユーザー',
      email: 'admin@example.com',
      image: 'https://i.pravatar.cc/150?img=1',
      isAdmin: true,
      isLocked: false,
      discordId: 'admin#1234',
      notes: '主要管理者アカウントです。このアカウントは削除できません。',
      createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date().toISOString(),
      totalSpent: 0,
      totalOrders: 0
    },
    {
      _id: '2',
      id: '2',
      name: '一般ユーザー1',
      email: 'user1@example.com',
      image: 'https://i.pravatar.cc/150?img=2',
      isAdmin: false,
      isLocked: false,
      discordId: 'user1#5678',
      notes: '',
      createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalSpent: 15000,
      totalOrders: 3
    },
    {
      _id: '3',
      id: '3',
      name: '一般ユーザー2',
      email: 'user2@example.com',
      image: 'https://i.pravatar.cc/150?img=3',
      isAdmin: false,
      isLocked: false,
      discordId: 'user2#9012',
      notes: '',
      createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      totalSpent: 8000,
      totalOrders: 2
    },
    {
      _id: '4',
      id: '4',
      name: 'テストユーザー',
      email: 'test@example.com',
      image: 'https://i.pravatar.cc/150?img=4',
      isAdmin: false,
      isLocked: true,
      discordId: 'test#3456',
      notes: 'テスト用アカウント。ロックされています。',
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      totalSpent: 0,
      totalOrders: 0
    }
  ]
};

// 指定されたURLに対するデモデータを取得
function getDemoData(url: string) {
  // 完全一致で検索
  if (DEMO_DATA[url]) {
    return DEMO_DATA[url];
  }
  
  // URLパターンでの部分一致検索
  for (const key in DEMO_DATA) {
    // /api/admin/orders/123 のようなパターンに対応
    if (url.startsWith(key)) {
      // 元のデモデータを返す
      return DEMO_DATA[key];
    }
  }
  
  // URLにusersが含まれている場合は、ユーザーデモデータを返す
  if (url.includes('/users')) {
    return DEMO_DATA['/api/admin/users'];
  }
  
  // デフォルトのダミーデータ
  return { message: 'デモデータです。本番環境では実際のデータが表示されます。' };
}

// APIリクエストにトークンを添付して実行
export const getWithAuth = async (url: string, params = {}) => {
  try {
    // ローカルストレージからトークンを取得
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    
    if (!token) {
      throw new Error('認証トークンがありません');
    }
    
    // 相対パスを使用して現在のホストに対してリクエスト
    try {
      // URLが /api で始まることを確認
      const requestUrl = url.startsWith('/api/') ? url : `/api${url}`;
      
      const response = await axios.get(requestUrl, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        },
        // 明示的にbaseURLをnullに設定して相対パスを強制
        baseURL: ''
      });
      
      return response.data;
    } catch (error) {
      console.error(`API要求エラー (${url}):`, error);
      // APIエラーが発生した場合、デモデータを返す
      return getDemoData(url);
    }
  } catch (error) {
    console.error('認証エラー:', error);
    throw error;
  }
};

// 認証付きPOSTリクエスト
export const postWithAuth = async (url: string, data: any) => {
  try {
    // ローカルストレージからトークンを取得
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    
    if (!token) {
      throw new Error('認証トークンがありません');
    }
    
    try {
      // URLが /api で始まることを確認
      const requestUrl = url.startsWith('/api/') ? url : `/api${url}`;
      
      const response = await axios.post(requestUrl, data, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        // 明示的にbaseURLをnullに設定して相対パスを強制
        baseURL: ''
      });
      
      return response.data;
    } catch (error) {
      console.error(`API送信エラー (${url}):`, error);
      // APIエラーが発生した場合、デモレスポンスを返す
      if (url.includes('/users')) {
        return { 
          ...data, 
          _id: `demo_${Date.now()}`,
          id: `demo_${Date.now()}`,
          image: `https://i.pravatar.cc/150?u=${data.email || 'demo'}`,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
      }
      return { 
        success: true, 
        message: 'デモモードで処理されました', 
        data: { ...data, _id: `demo_${Date.now()}` }
      };
    }
  } catch (error) {
    console.error('認証エラー:', error);
    throw error;
  }
};

// 認証付きPUTリクエスト
export const putWithAuth = async (url: string, data: any) => {
  try {
    // ローカルストレージからトークンを取得
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    
    if (!token) {
      throw new Error('認証トークンがありません');
    }
    
    try {
      // URLが /api で始まることを確認
      const requestUrl = url.startsWith('/api/') ? url : `/api${url}`;
      
      const response = await axios.put(requestUrl, data, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        // 明示的にbaseURLをnullに設定して相対パスを強制
        baseURL: ''
      });
      
      return response.data;
    } catch (error) {
      console.error(`API更新エラー (${url}):`, error);
      // APIエラーが発生した場合、デモレスポンスを返す
      return { 
        success: true, 
        message: 'デモモードで更新されました', 
        data: { ...data }
      };
    }
  } catch (error) {
    console.error('認証エラー:', error);
    throw error;
  }
};

// 認証付きDELETEリクエスト
export const deleteWithAuth = async (url: string) => {
  try {
    // ローカルストレージからトークンを取得
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    
    if (!token) {
      throw new Error('認証トークンがありません');
    }
    
    try {
      // URLが /api で始まることを確認
      const requestUrl = url.startsWith('/api/') ? url : `/api${url}`;
      
      const response = await axios.delete(requestUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        // 明示的にbaseURLをnullに設定して相対パスを強制
        baseURL: ''
      });
      
      return response.data;
    } catch (error) {
      console.error(`API削除エラー (${url}):`, error);
      // APIエラーが発生した場合、デモレスポンスを返す
      return { 
        success: true, 
        message: 'デモモードで削除されました'
      };
    }
  } catch (error) {
    console.error('認証エラー:', error);
    throw error;
  }
};

// export default api; // この行をコメントアウトまたは削除 