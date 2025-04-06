const express = require('express');
const Category = require('../../models/Category');
const Product = require('../../models/Product');
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

/**
 * @route   GET /api/categories
 * @desc    全カテゴリーの取得
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { sort = 'displayOrder', order = 'asc' } = req.query;
    
    // ソート条件
    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;
    
    // カテゴリーの取得
    let categories = await Category.find().sort(sortOption);
    
    // 非認証ユーザーには表示中のカテゴリーのみ返す
    if (!req.isAuthenticated() || (!req.user.isAdmin && !req.user.isStaff)) {
      categories = categories.filter(category => category.isVisible);
    }
    
    res.json(categories);
  } catch (error) {
    logger.error(`カテゴリー一覧取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    カテゴリーの詳細取得
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'カテゴリーが見つかりません' });
    }
    
    // 非表示カテゴリーは管理者・スタッフのみ閲覧可能
    if (!category.isVisible && (!req.isAuthenticated() || (!req.user.isAdmin && !req.user.isStaff))) {
      return res.status(403).json({ error: 'このカテゴリーは現在表示されていません' });
    }
    
    res.json(category);
  } catch (error) {
    logger.error(`カテゴリー詳細取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/categories/:id/products
 * @desc    カテゴリーに属する商品の取得
 * @access  Public
 */
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sort = 'createdAt', order = 'desc', limit = 20, page = 1 } = req.query;
    
    // カテゴリーの存在確認
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'カテゴリーが見つかりません' });
    }
    
    // 非表示カテゴリーは管理者・スタッフのみ閲覧可能
    if (!category.isVisible && (!req.isAuthenticated() || (!req.user.isAdmin && !req.user.isStaff))) {
      return res.status(403).json({ error: 'このカテゴリーは現在表示されていません' });
    }
    
    // クエリ条件の構築
    const query = { category: id };
    
    if (status) {
      query.status = status;
    } else {
      // 認証されていないユーザーや一般ユーザーには販売中の商品のみ表示
      if (!req.isAuthenticated() || (!req.user.isAdmin && !req.user.isStaff)) {
        query.status = 'available';
      }
    }
    
    // ソート条件
    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;
    
    // ページネーション
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 商品の取得
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    // 総件数の取得
    const total = await Product.countDocuments(query);
    
    res.json({
      category,
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`カテゴリー商品取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   POST /api/categories
 * @desc    新カテゴリーの追加
 * @access  Private (管理者のみ)
 */
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, emoji, description, displayOrder, isVisible } = req.body;
    
    // 入力バリデーション
    if (!name) {
      return res.status(400).json({ error: 'カテゴリー名は必須です' });
    }
    
    // 同名カテゴリーのチェック
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ error: '同名のカテゴリーが既に存在します' });
    }
    
    // カテゴリーの作成
    const category = new Category({
      name,
      emoji: emoji || '📦',
      description: description || '',
      displayOrder: displayOrder || 0,
      isVisible: isVisible !== undefined ? isVisible : true
    });
    
    await category.save();
    logger.info(`新カテゴリーを追加しました: ${name} (ID: ${category._id})`);
    
    // Discord経由でカテゴリーチャンネルを作成（オプション）
    if (req.body.createChannel === 'true') {
      // クライアントへのメッセージ送信
      res.json({
        success: true,
        category,
        message: 'カテゴリーチャンネル作成はBotにより処理されます'
      });
      
      // 実際のチャンネル作成はDiscordボットが行う
    } else {
      res.json({ success: true, category });
    }
  } catch (error) {
    logger.error(`カテゴリー追加エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    カテゴリーの更新
 * @access  Private (管理者のみ)
 */
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { name, emoji, description, displayOrder, isVisible } = req.body;
    
    // カテゴリーの存在確認
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'カテゴリーが見つかりません' });
    }
    
    // 同名カテゴリーのチェック（名前が変更される場合）
    if (name && name !== category.name) {
      const existing = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: category._id }
      });
      
      if (existing) {
        return res.status(400).json({ error: '同名のカテゴリーが既に存在します' });
      }
    }
    
    // カテゴリー情報の更新
    if (name) category.name = name;
    if (emoji) category.emoji = emoji;
    if (description !== undefined) category.description = description;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isVisible !== undefined) category.isVisible = isVisible;
    
    await category.save();
    logger.info(`カテゴリーを更新しました: ${category.name} (ID: ${category._id})`);
    
    // Discord経由でカテゴリーチャンネルを更新（オプション）
    if (req.body.updateChannel === 'true') {
      // クライアントへのメッセージ送信
      res.json({
        success: true,
        category,
        message: 'カテゴリーチャンネル更新はBotにより処理されます'
      });
      
      // 実際のチャンネル更新はDiscordボットが行う
    } else {
      res.json({ success: true, category });
    }
  } catch (error) {
    logger.error(`カテゴリー更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    カテゴリーの削除
 * @access  Private (管理者のみ)
 */
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    // カテゴリーの存在確認
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'カテゴリーが見つかりません' });
    }
    
    // 所属する商品の確認
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({ 
        error: 'このカテゴリーには商品が所属しています', 
        count: productsCount 
      });
    }
    
    // カテゴリーの削除
    await Category.deleteOne({ _id: req.params.id });
    logger.info(`カテゴリーを削除しました: ${category.name} (ID: ${category._id})`);
    
    // 所属する商品のカテゴリーを更新（forceが指定されている場合）
    if (productsCount > 0 && req.query.force === 'true') {
      const { moveToCategory } = req.query;
      
      if (moveToCategory) {
        // 別カテゴリーに移動
        await Product.updateMany(
          { category: req.params.id },
          { $set: { category: moveToCategory } }
        );
        logger.info(`カテゴリー削除: ${productsCount}個の商品を別カテゴリーに移動しました`);
      } else {
        // 商品も削除
        await Product.deleteMany({ category: req.params.id });
        logger.info(`カテゴリー削除: ${productsCount}個の商品も削除しました`);
      }
    }
    
    // Discord経由でカテゴリーチャンネルを削除（オプション）
    if (req.query.deleteChannel === 'true') {
      // クライアントへのメッセージ送信
      res.json({
        success: true,
        message: 'カテゴリーチャンネル削除はBotにより処理されます'
      });
      
      // 実際のチャンネル削除はDiscordボットが行う
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    logger.error(`カテゴリー削除エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/categories/order
 * @desc    カテゴリー表示順の一括更新
 * @access  Private (管理者のみ)
 */
router.put('/order', isAdmin, async (req, res) => {
  try {
    const { orders } = req.body;
    
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: '表示順情報が正しくありません' });
    }
    
    // 各カテゴリーの表示順を更新
    for (const item of orders) {
      const { id, displayOrder } = item;
      if (!id || displayOrder === undefined) continue;
      
      await Category.findByIdAndUpdate(id, { displayOrder });
    }
    
    logger.info(`カテゴリーの表示順を更新しました: ${orders.length}件`);
    
    // 更新後のカテゴリー一覧を取得
    const categories = await Category.find().sort({ displayOrder: 1 });
    
    res.json({ 
      success: true, 
      categories
    });
  } catch (error) {
    logger.error(`カテゴリー表示順更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

module.exports = router; 