const express = require('express');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
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
 * @route   GET /api/orders
 * @desc    注文一覧の取得
 * @access  Private (管理者・スタッフのみ)
 */
router.get('/', isStaff, async (req, res) => {
  try {
    const { 
      status, 
      paymentStatus, 
      paymentMethod,
      userId,
      sort = 'createdAt', 
      order = 'desc', 
      limit = 20, 
      page = 1 
    } = req.query;
    
    // クエリ条件の構築
    const query = {};
    
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (userId) query.user = userId;
    
    // ソート条件
    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;
    
    // ページネーション
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 注文データの取得
    const orders = await Order.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username discordId');
    
    // 総件数の取得
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`注文一覧取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/orders/my
 * @desc    自分の注文履歴の取得
 * @access  Private
 */
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const { 
      status, 
      sort = 'createdAt', 
      order = 'desc', 
      limit = 10, 
      page = 1 
    } = req.query;
    
    // クエリ条件の構築
    const query = { discordId: req.user.discordId };
    
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
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`自分の注文履歴取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    注文詳細の取得
 * @access  Private
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'items.product',
        select: 'name images'
      })
      .populate('user', 'username discordId');
    
    if (!order) {
      return res.status(404).json({ error: '注文が見つかりません' });
    }
    
    // 権限チェック（自分の注文か、管理者・スタッフかどうか）
    if (order.discordId !== req.user.discordId && !req.user.isAdmin && !req.user.isStaff) {
      return res.status(403).json({ error: 'この注文の詳細を表示する権限がありません' });
    }
    
    res.json(order);
  } catch (error) {
    logger.error(`注文詳細取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   POST /api/orders
 * @desc    新規注文の作成
 * @access  Private
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '商品が指定されていません' });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({ error: '支払い方法が指定されていません' });
    }
    
    // ユーザーのカートアイテムを確認
    const user = await User.findById(req.user.id).populate('cart.product');
    
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // 注文アイテムの準備
    const orderItems = [];
    let totalAmount = 0;
    
    // 在庫チェックと注文アイテムの作成
    for (const item of items) {
      const { productId, quantity } = item;
      
      // カート内に存在するか確認
      const cartItem = user.cart.find(ci => ci.product._id.toString() === productId);
      if (!cartItem) {
        return res.status(400).json({ error: `商品ID ${productId} はカートに存在しません` });
      }
      
      const product = cartItem.product;
      
      // 在庫確認
      if (product.stock < quantity) {
        return res.status(400).json({ 
          error: `商品「${product.name}」の在庫が不足しています。在庫: ${product.stock}個` 
        });
      }
      
      // 注文アイテムの追加
      orderItems.push({
        product: product._id,
        quantity,
        price: product.price,
        name: product.name
      });
      
      // 合計金額の計算
      totalAmount += product.price * quantity;
    }
    
    // ポイント支払いの場合はポイント残高確認
    if (paymentMethod === 'points' && user.points < totalAmount) {
      return res.status(400).json({ 
        error: `ポイント残高が不足しています。必要ポイント: ${totalAmount}、残高: ${user.points}` 
      });
    }
    
    // 注文の作成
    const order = new Order({
      user: user._id,
      discordId: user.discordId,
      username: user.username,
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'points' ? 'paid' : 'pending'
    });
    
    await order.save();
    logger.info(`新規注文を作成しました: ${order._id} (ユーザー: ${user.username})`);
    
    // 在庫の更新と商品ステータスの確認
    for (const item of items) {
      const product = await Product.findById(item.productId);
      product.stock -= item.quantity;
      
      if (product.stock <= 0) {
        product.status = 'out_of_stock';
      }
      
      await product.save();
    }
    
    // ポイント支払いの場合はポイントを使用
    if (paymentMethod === 'points') {
      await user.usePoints(totalAmount);
      logger.info(`ポイント支払い: ${user.username} が ${totalAmount} ポイントを使用`);
    }
    
    // カートの商品を削除
    for (const item of items) {
      await user.removeFromCart(item.productId);
    }
    
    res.status(201).json({ 
      success: true, 
      order,
      message: paymentMethod === 'points' ? 'ポイント支払いが完了しました' : '注文を受け付けました'
    });
  } catch (error) {
    logger.error(`注文作成エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    注文ステータスの更新
 * @access  Private (管理者・スタッフのみ)
 */
router.put('/:id/status', isStaff, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'ステータスが指定されていません' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: '注文が見つかりません' });
    }
    
    // ステータス変更前の状態を記録
    const previousStatus = order.status;
    
    // ステータスの更新
    order.status = status;
    await order.save();
    
    logger.info(`注文ステータスを更新しました: ${order._id} ${previousStatus} → ${status}`);
    
    res.json({ 
      success: true, 
      order,
      previous: previousStatus
    });
  } catch (error) {
    logger.error(`注文ステータス更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/orders/:id/payment
 * @desc    注文の支払い状況更新
 * @access  Private (管理者・スタッフのみ)
 */
router.put('/:id/payment', isStaff, async (req, res) => {
  try {
    const { paymentStatus, paymentDetails } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({ error: '支払い状況が指定されていません' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: '注文が見つかりません' });
    }
    
    // 支払い状況変更前の状態を記録
    const previousStatus = order.paymentStatus;
    
    // 支払い状況の更新
    order.paymentStatus = paymentStatus;
    
    // 支払い詳細情報があれば更新
    if (paymentDetails) {
      order.paymentDetails = {
        ...order.paymentDetails,
        ...paymentDetails,
        updatedAt: new Date()
      };
    }
    
    await order.save();
    
    logger.info(`注文支払い状況を更新しました: ${order._id} ${previousStatus} → ${paymentStatus}`);
    
    // 支払い完了の場合、ユーザーにポイントを付与（任意）
    if (paymentStatus === 'paid' && previousStatus !== 'paid') {
      try {
        const pointsToAdd = Math.floor(order.totalAmount * 0.05); // 購入額の5%をポイント付与
        
        if (pointsToAdd > 0) {
          const user = await User.findById(order.user);
          await user.addPoints(pointsToAdd);
          logger.info(`購入ポイント付与: ${user.username} に ${pointsToAdd} ポイント追加`);
        }
      } catch (pointsError) {
        logger.error(`ポイント付与エラー: ${pointsError}`);
      }
    }
    
    res.json({ 
      success: true, 
      order,
      previous: previousStatus
    });
  } catch (error) {
    logger.error(`注文支払い状況更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/orders/:id/notes
 * @desc    注文メモの更新
 * @access  Private (管理者・スタッフのみ)
 */
router.put('/:id/notes', isStaff, async (req, res) => {
  try {
    const { notes } = req.body;
    
    if (notes === undefined) {
      return res.status(400).json({ error: 'メモが指定されていません' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: '注文が見つかりません' });
    }
    
    // メモの更新
    order.notes = notes;
    await order.save();
    
    logger.info(`注文メモを更新しました: ${order._id}`);
    
    res.json({ 
      success: true, 
      order
    });
  } catch (error) {
    logger.error(`注文メモ更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/orders/stats
 * @desc    注文統計情報の取得
 * @access  Private (管理者・スタッフのみ)
 */
router.get('/stats', isStaff, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // 期間の計算
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // 統計データの取得
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });
    
    const completedOrders = await Order.countDocuments({
      status: 'completed',
      createdAt: { $gte: startDate }
    });
    
    const pendingOrders = await Order.countDocuments({
      status: 'pending',
      createdAt: { $gte: startDate }
    });
    
    const paidOrders = await Order.countDocuments({
      paymentStatus: 'paid',
      createdAt: { $gte: startDate }
    });
    
    const pendingPayments = await Order.countDocuments({
      paymentStatus: 'pending',
      createdAt: { $gte: startDate }
    });
    
    // 合計売上の集計
    const salesResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
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
    
    const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;
    
    // 支払い方法別の集計
    const paymentMethodStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
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
      period,
      total: {
        orders: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        paid: paidOrders,
        pendingPayments,
        sales: totalSales
      },
      paymentMethods: paymentMethodStats
    });
  } catch (error) {
    logger.error(`注文統計取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

module.exports = router; 