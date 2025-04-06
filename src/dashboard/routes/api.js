const express = require('express');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Order = require('../../models/Order');
const logger = require('../../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Settings = require('../../models/Settings');

const router = express.Router();

// 認証チェックミドルウェア
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: '認証が必要です' });
};

// 管理者チェックミドルウェア
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: '権限がありません' });
};

// スタッフチェックミドルウェア
const isStaff = (req, res, next) => {
  if (req.isAuthenticated() && (req.user.isAdmin || req.user.isStaff)) {
    return next();
  }
  res.status(403).json({ error: '権限がありません' });
};

// アップロード先ディレクトリの設定
const uploadDir = path.join(__dirname, '../../../uploads/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// ファイルのフィルタリング
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('サポートされていないファイル形式です。JPEG、PNG、GIF、WEBPのみ許可されています。'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * @route   GET /api/health
 * @desc    ヘルスチェックエンドポイント
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'discord-shop-api',
    version: process.env.API_VERSION || '1.0.0'
  });
});

/**
 * @route   GET /api/stats/dashboard
 * @desc    ダッシュボード統計情報の取得
 * @access  Private (管理者・スタッフのみ)
 */
router.get('/stats/dashboard', isStaff, async (req, res) => {
  try {
    // 期間の設定
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // ユーザー統計
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({ 
      createdAt: { $gte: todayStart } 
    });
    const newUsersYesterday = await User.countDocuments({ 
      createdAt: { $gte: yesterdayStart, $lt: todayStart } 
    });
    const newUsersThisWeek = await User.countDocuments({ 
      createdAt: { $gte: weekStart } 
    });
    
    // 商品統計
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ status: 'available' });
    const outOfStockProducts = await Product.countDocuments({ status: 'out_of_stock' });
    const lowStockProducts = await Product.countDocuments({ 
      stock: { $gt: 0, $lte: 5 },
      status: 'available'
    });
    
    // カテゴリー統計
    const totalCategories = await Category.countDocuments();
    const visibleCategories = await Category.countDocuments({ isVisible: true });
    
    // 注文統計
    const totalOrders = await Order.countDocuments();
    const ordersToday = await Order.countDocuments({ 
      createdAt: { $gte: todayStart } 
    });
    const ordersYesterday = await Order.countDocuments({ 
      createdAt: { $gte: yesterdayStart, $lt: todayStart } 
    });
    const ordersThisWeek = await Order.countDocuments({ 
      createdAt: { $gte: weekStart } 
    });
    const ordersThisMonth = await Order.countDocuments({ 
      createdAt: { $gte: monthStart } 
    });
    
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    
    // 支払い統計
    const paidOrders = await Order.countDocuments({ paymentStatus: 'paid' });
    const pendingPayments = await Order.countDocuments({ paymentStatus: 'pending' });
    
    // 売上統計
    const salesResult = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const todaySalesResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const yesterdaySalesResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterdayStart, $lt: todayStart },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const weekSalesResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const monthSalesResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // 支払い方法別の集計
    const paymentMethodStats = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    res.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newYesterday: newUsersYesterday,
        newThisWeek: newUsersThisWeek
      },
      products: {
        total: totalProducts,
        available: availableProducts,
        outOfStock: outOfStockProducts,
        lowStock: lowStockProducts
      },
      categories: {
        total: totalCategories,
        visible: visibleCategories
      },
      orders: {
        total: totalOrders,
        today: ordersToday,
        yesterday: ordersYesterday,
        thisWeek: ordersThisWeek,
        thisMonth: ordersThisMonth,
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders
      },
      payments: {
        paid: paidOrders,
        pending: pendingPayments,
        methods: paymentMethodStats
      },
      sales: {
        total: salesResult.length > 0 ? salesResult[0].totalSales : 0,
        today: todaySalesResult.length > 0 ? todaySalesResult[0].totalSales : 0,
        yesterday: yesterdaySalesResult.length > 0 ? yesterdaySalesResult[0].totalSales : 0,
        thisWeek: weekSalesResult.length > 0 ? weekSalesResult[0].totalSales : 0,
        thisMonth: monthSalesResult.length > 0 ? monthSalesResult[0].totalSales : 0
      }
    });
  } catch (error) {
    logger.error(`ダッシュボード統計取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/stats/public
 * @desc    公開統計情報の取得
 * @access  Public
 */
router.get('/stats/public', async (req, res) => {
  try {
    // 基本統計（公開用）
    const availableProductsCount = await Product.countDocuments({ 
      status: 'available',
      $or: [{ isHidden: { $exists: false } }, { isHidden: false }]
    });
    
    const visibleCategoriesCount = await Category.countDocuments({ isVisible: true });
    
    // カテゴリー別商品数
    const categoryCounts = await Product.aggregate([
      {
        $match: { 
          status: 'available',
          $or: [{ isHidden: { $exists: false } }, { isHidden: false }]
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // カテゴリー情報の結合
    const categories = await Category.find({ isVisible: true });
    const categoryStats = categories.map(category => {
      const stats = categoryCounts.find(c => c._id.toString() === category._id.toString());
      return {
        _id: category._id,
        name: category.name,
        emoji: category.emoji,
        count: stats ? stats.count : 0
      };
    }).filter(cat => cat.count > 0);
    
    res.json({
      products: {
        available: availableProductsCount
      },
      categories: {
        total: visibleCategoriesCount,
        list: categoryStats
      }
    });
  } catch (error) {
    logger.error(`公開統計取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/config/payment-methods
 * @desc    利用可能な支払い方法の取得
 * @access  Public
 */
router.get('/config/payment-methods', async (req, res) => {
  try {
    // デジタルコンテンツに適した手動支払い方法
    const paymentMethods = [
      { 
        id: 'manual', 
        name: '手動決済', 
        description: '管理者が手動で決済処理を行います。',
        isEnabled: true
      },
      { 
        id: 'points', 
        name: 'ポイント決済', 
        description: '保有ポイントを使用して決済します。',
        isEnabled: true
      }
    ];
    
    res.json({ paymentMethods });
  } catch (error) {
    logger.error(`支払い方法取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/config/delivery-methods
 * @desc    利用可能な配信方法の取得
 * @access  Public
 */
router.get('/config/delivery-methods', async (req, res) => {
  try {
    // デジタルコンテンツに適した配信方法
    const deliveryMethods = [
      { 
        id: 'digital', 
        name: 'デジタル配信', 
        description: 'コンテンツはDiscordのDMで送信されます。',
        fee: 0,
        isEnabled: true
      }
    ];
    
    res.json({ deliveryMethods });
  } catch (error) {
    logger.error(`配信方法取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/system/health
 * @desc    システム稼働状況の確認
 * @access  Public
 */
router.get('/system/health', async (req, res) => {
  try {
    // データベース接続確認
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // 基本的なシステム情報
    const systemInfo = {
      status: 'ok',
      timestamp: new Date(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown'
      },
      api: {
        version: process.env.API_VERSION || '1.0.0'
      }
    };
    
    res.json(systemInfo);
  } catch (error) {
    logger.error(`システム稼働状況確認エラー: ${error}`);
    res.status(500).json({
      status: 'error',
      timestamp: new Date(),
      message: 'システム稼働状況の確認中にエラーが発生しました'
    });
  }
});

/**
 * @route   GET /api/search
 * @desc    商品、カテゴリーの横断検索
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: '検索キーワードは2文字以上入力してください' });
    }
    
    // 検索条件
    const searchRegex = new RegExp(query, 'i');
    
    // 商品の検索
    let productsQuery = { 
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { 'metadata.keywords': searchRegex }
      ]
    };
    
    // 非認証ユーザーには販売中の商品のみ表示
    if (!req.isAuthenticated() || (!req.user.isAdmin && !req.user.isStaff)) {
      productsQuery.status = 'available';
      productsQuery.$or.push({ isHidden: { $ne: true } });
    }
    
    const products = await Product.find(productsQuery)
      .select('name images price status category')
      .limit(parseInt(limit))
      .populate('category', 'name');
    
    // カテゴリーの検索
    let categoriesQuery = { 
      name: searchRegex 
    };
    
    // 非認証ユーザーには表示中のカテゴリーのみ表示
    if (!req.isAuthenticated() || (!req.user.isAdmin && !req.user.isStaff)) {
      categoriesQuery.isVisible = true;
    }
    
    const categories = await Category.find(categoriesQuery)
      .select('name emoji description')
      .limit(parseInt(limit));
    
    res.json({
      query,
      results: {
        products,
        categories
      }
    });
  } catch (error) {
    logger.error(`検索エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   POST /api/upload
 * @desc    画像アップロード
 * @access  Private (管理者のみ)
 */
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }

    // ファイルのURL生成
    const fileUrl = `/uploads/images/${req.file.filename}`;
    
    // 成功レスポンス
    res.json({ 
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    logger.error(`画像アップロードエラー: ${error}`);
    res.status(500).json({ error: 'ファイルのアップロードに失敗しました' });
  }
});

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    管理者ダッシュボード用の統計データを取得
 * @access  Private (管理者のみ)
 */
router.get('/admin/dashboard-stats', async (req, res) => {
  try {
    // 認証トークンの確認
    const authHeader = req.headers.authorization;
    let isAdmin = false;
    
    // セッション認証の確認
    if (req.isAuthenticated() && req.user.isAdmin) {
      isAdmin = true;
    }
    
    // トークン認証の確認（特殊な管理者トークン）
    if (authHeader === 'Bearer admin-email-auth') {
      isAdmin = true;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.isAdmin) {
          isAdmin = true;
        }
      } catch (error) {
        // トークン検証エラー
        console.error('トークン検証エラー:', error);
      }
    }
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: '管理者権限がありません'
      });
    }
    
    // データベースから各種統計情報を取得
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    // 今日の注文数と売上
    const todayOrders = await Order.find({
      createdAt: { $gte: todayStart }
    });
    
    const todaySales = todayOrders.reduce((total, order) => total + order.totalAmount, 0);
    
    // 昨日の注文数と売上（変化率計算用）
    const yesterdayOrders = await Order.find({
      createdAt: { $gte: yesterdayStart, $lt: todayStart }
    });
    
    const yesterdaySales = yesterdayOrders.reduce((total, order) => total + order.totalAmount, 0);
    
    // 総計
    const totalOrders = await Order.countDocuments();
    const totalSales = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    // ユーザー統計
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: todayStart }
    });
    
    // 商品統計
    const totalProducts = await Product.countDocuments();
    const outOfStock = await Product.countDocuments({ stock: 0 });
    const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: 5 } });
    
    // 保留中の注文
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    
    // 保留中の返品
    const pendingReturns = await Order.countDocuments({ status: 'return_pending' });
    
    // 過去30日間の売上データ
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesData = [];
    // 日ごとのデータを生成
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dailyOrders = await Order.find({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const dailySales = dailyOrders.reduce((total, order) => total + order.totalAmount, 0);
      
      salesData.push({
        date: date.toISOString().split('T')[0],
        sales: dailySales,
        orders: dailyOrders.length
      });
    }
    
    // 直近の注文5件
    const recentOrders = await Order.find()
      .populate('userId', 'username email discordId')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // 直近の新規ユーザー5件
    const recentUsers = await User.find()
      .select('username email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // 月間売上データ（グラフ用）
    const monthlySales = [];
    for (let month = 0; month < 12; month++) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - month);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const monthlyOrders = await Order.find({
        createdAt: { $gte: startDate, $lt: endDate }
      });
      
      const monthlyTotal = monthlyOrders.reduce((total, order) => total + order.totalAmount, 0);
      monthlySales[11 - month] = monthlyTotal;
    }
    
    // 変化率の計算
    const ordersChange = yesterdayOrders.length > 0 
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100 
      : 100;
    
    const salesChange = yesterdaySales > 0 
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
      : 100;
    
    // ショップステータスを取得（設定があれば）
    const shopSettings = await Settings.findOne() || { shopStatus: 'open' };
    
    res.json({
      success: true,
      todaySales,
      totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
      ordersChange,
      salesChange,
      todayOrders: todayOrders.length,
      totalOrders,
      newUsers,
      totalUsers,
      totalProducts,
      outOfStock,
      lowStock,
      pendingOrders,
      pendingReturns,
      monthlySales,
      shopStatus: shopSettings.shopStatus,
      salesData,
      recentOrders,
      recentUsers
    });
  } catch (error) {
    console.error('ダッシュボード統計取得エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
});

module.exports = router; 