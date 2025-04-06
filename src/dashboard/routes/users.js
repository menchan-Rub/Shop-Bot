const express = require('express');
const User = require('../../models/User');
const Order = require('../../models/Order');
const logger = require('../../utils/logger');

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

/**
 * @route   GET /api/users
 * @desc    ユーザー一覧の取得
 * @access  Private (管理者・スタッフのみ)
 */
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      search, 
      isAdmin, 
      isStaff, 
      sort = 'createdAt', 
      order = 'desc', 
      limit = 20, 
      page = 1 
    } = req.query;
    
    // クエリ条件の構築
    const query = {};
    
    // 検索条件
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { discordId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 管理者・スタッフフィルター
    if (isAdmin === 'true') query.isAdmin = true;
    if (isStaff === 'true') query.isStaff = true;
    
    // ソート条件
    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;
    
    // ページネーション
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // ユーザーデータの取得
    const users = await User.find(query)
      .select('-cart') // カート情報は除外
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    // 総件数の取得
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`ユーザー一覧取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/users/me
 * @desc    自分のプロフィール情報取得
 * @access  Private
 */
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-cart'); // カート情報は別のエンドポイントで
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    res.json(user);
  } catch (error) {
    logger.error(`自分のプロフィール取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/users/cart
 * @desc    自分のカート情報取得
 * @access  Private
 */
router.get('/cart', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name description price images stock status'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // カート内の有効な商品のみを返す（削除された商品や在庫切れ商品も含める）
    const cart = user.cart.filter(item => item.product !== null);
    
    // 合計金額の計算
    const totalAmount = cart.reduce((sum, item) => {
      if (item.product && item.product.status === 'available') {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);
    
    res.json({
      cart,
      totalAmount,
      itemCount: cart.length
    });
  } catch (error) {
    logger.error(`カート情報取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   POST /api/users/cart
 * @desc    カートに商品を追加
 * @access  Private
 */
router.post('/cart', isAuthenticated, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: '商品IDは必須です' });
    }
    
    // ユーザーの取得
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // カートへの追加処理
    await user.addToCart(productId, quantity);
    
    // 更新後のカート情報を取得
    const updatedUser = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name description price images stock status'
      });
    
    // 有効な商品のみのカートを返す
    const cart = updatedUser.cart.filter(item => item.product !== null);
    
    res.json({
      success: true,
      cart,
      message: 'カートに商品を追加しました'
    });
  } catch (error) {
    logger.error(`カート追加エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/users/cart/:productId
 * @desc    カート内の商品数量を更新
 * @access  Private
 */
router.put('/cart/:productId', isAuthenticated, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: '有効な数量を指定してください' });
    }
    
    // ユーザーの取得
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // カート内の商品数量を更新
    const updated = await user.updateCartItemQuantity(productId, quantity);
    
    if (!updated) {
      return res.status(404).json({ error: 'カートに指定された商品が見つかりません' });
    }
    
    // 更新後のカート情報を取得
    const updatedUser = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name description price images stock status'
      });
    
    // 有効な商品のみのカートを返す
    const cart = updatedUser.cart.filter(item => item.product !== null);
    
    res.json({
      success: true,
      cart,
      message: 'カートの商品数量を更新しました'
    });
  } catch (error) {
    logger.error(`カート数量更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   DELETE /api/users/cart/:productId
 * @desc    カートから商品を削除
 * @access  Private
 */
router.delete('/cart/:productId', isAuthenticated, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // ユーザーの取得
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // カートから商品を削除
    await user.removeFromCart(productId);
    
    // 更新後のカート情報を取得
    const updatedUser = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name description price images stock status'
      });
    
    // 有効な商品のみのカートを返す
    const cart = updatedUser.cart.filter(item => item.product !== null);
    
    res.json({
      success: true,
      cart,
      message: 'カートから商品を削除しました'
    });
  } catch (error) {
    logger.error(`カート削除エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   DELETE /api/users/cart
 * @desc    カートを空にする
 * @access  Private
 */
router.delete('/cart', isAuthenticated, async (req, res) => {
  try {
    // ユーザーの取得
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // カートを空にする
    user.cart = [];
    await user.save();
    
    res.json({
      success: true,
      cart: [],
      message: 'カートを空にしました'
    });
  } catch (error) {
    logger.error(`カート削除エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    特定ユーザーの詳細取得
 * @access  Private (管理者・スタッフのみ)
 */
router.get('/:id', isStaff, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-cart');
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // 注文履歴の取得（任意）
    const recentOrders = await Order.find({ user: user._id })
      .limit(5)
      .sort({ createdAt: -1 });
    
    // 注文統計の取得
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      { $group: { 
        _id: null, 
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } }
      }}
    ]);
    
    const stats = orderStats.length > 0 ? orderStats[0] : { totalOrders: 0, totalSpent: 0 };
    
    res.json({
      user,
      stats: {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent
      },
      recentOrders
    });
  } catch (error) {
    logger.error(`ユーザー詳細取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/users/:id/role
 * @desc    ユーザーの権限を変更 (管理者・スタッフ権限)
 * @access  Private (管理者のみ)
 */
router.put('/:id/role', isAdmin, async (req, res) => {
  try {
    const { isAdmin, isStaff } = req.body;
    
    if (isAdmin === undefined && isStaff === undefined) {
      return res.status(400).json({ error: '変更する権限を指定してください' });
    }
    
    // 自分自身の権限は変更できない
    if (req.params.id === req.user.id) {
      return res.status(403).json({ error: '自分自身の権限は変更できません' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // 権限の更新
    if (isAdmin !== undefined) user.isAdmin = Boolean(isAdmin);
    if (isStaff !== undefined) user.isStaff = Boolean(isStaff);
    
    await user.save();
    
    logger.info(`ユーザー権限を更新しました: ${user.username} (ID: ${user._id}, Admin: ${user.isAdmin}, Staff: ${user.isStaff})`);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error(`ユーザー権限更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/users/:id/points
 * @desc    ユーザーのポイントを手動調整
 * @access  Private (管理者のみ)
 */
router.put('/:id/points', isAdmin, async (req, res) => {
  try {
    const { points, action, reason } = req.body;
    
    if (!points || !action) {
      return res.status(400).json({ error: 'ポイント数と操作種別(add/subtract/set)を指定してください' });
    }
    
    const pointsAmount = parseInt(points);
    
    if (isNaN(pointsAmount) || pointsAmount < 0) {
      return res.status(400).json({ error: '有効なポイント数を指定してください' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // 変更前のポイント
    const previousPoints = user.points;
    
    // ポイントの操作
    switch (action) {
      case 'add':
        await user.addPoints(pointsAmount);
        break;
      case 'subtract':
        if (user.points < pointsAmount) {
          return res.status(400).json({ 
            error: `ポイント残高が不足しています (残高: ${user.points})` 
          });
        }
        await user.usePoints(pointsAmount);
        break;
      case 'set':
        user.points = pointsAmount;
        await user.save();
        break;
      default:
        return res.status(400).json({ error: '無効な操作です (add/subtract/setを指定)' });
    }
    
    // ポイント履歴に記録（ユーザーモデルに実装している場合）
    if (user.addPointHistory && reason) {
      user.addPointHistory({
        amount: action === 'subtract' ? -pointsAmount : 
                action === 'add' ? pointsAmount : 
                pointsAmount - previousPoints,
        type: 'admin',
        description: reason || '管理者による調整',
        previousBalance: previousPoints
      });
      await user.save();
    }
    
    logger.info(`ユーザーポイントを調整しました: ${user.username} (ID: ${user._id}, ${previousPoints} → ${user.points}, 操作: ${action})`);
    
    res.json({
      success: true,
      user,
      pointsChange: {
        previous: previousPoints,
        current: user.points,
        action
      }
    });
  } catch (error) {
    logger.error(`ユーザーポイント調整エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/users/:id/orders
 * @desc    特定ユーザーの注文履歴取得
 * @access  Private (管理者・スタッフのみ)
 */
router.get('/:id/orders', isStaff, async (req, res) => {
  try {
    const { 
      status, 
      sort = 'createdAt', 
      order = 'desc', 
      limit = 10, 
      page = 1 
    } = req.query;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // クエリ条件の構築
    const query = { user: user._id };
    
    if (status) query.status = status;
    
    // ソート条件
    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;
    
    // ページネーション
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 注文データの取得
    const orders = await Order.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    // 総件数の取得
    const total = await Order.countDocuments(query);
    
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        discordId: user.discordId
      },
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`ユーザー注文履歴取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

module.exports = router; 