const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const logger = require('../../utils/logger');
const { PermissionFlagsBits } = require('discord.js');

const router = express.Router();

// 画像アップロード用の設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/products');
    // ディレクトリがなければ作成
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB制限
  fileFilter: (req, file, cb) => {
    // 画像ファイルのみ許可
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('画像ファイル（JPEG、PNG、GIF、WEBP）のみアップロードできます'));
    }
  }
});

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
 * @route   GET /api/products
 * @desc    全商品の取得
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, status, sort = 'createdAt', order = 'desc', limit = 20, page = 1 } = req.query;
    
    // クエリ条件の構築
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
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
      .populate('category')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    // 総件数の取得
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`商品一覧取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    商品の詳細取得
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    // 非表示の商品は管理者・スタッフのみ閲覧可能
    if (product.status === 'hidden' && (!req.isAuthenticated() || (!req.user.isAdmin && !req.user.isStaff))) {
      return res.status(403).json({ error: 'この商品は現在表示されていません' });
    }
    
    res.json(product);
  } catch (error) {
    logger.error(`商品詳細取得エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   POST /api/products
 * @desc    新商品の追加
 * @access  Private (管理者のみ)
 */
router.post('/', isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, price, description, category, stock, emoji, status } = req.body;
    
    // 入力バリデーション
    if (!name || !price || !description || !category) {
      return res.status(400).json({ error: '必須項目が入力されていません' });
    }
    
    // カテゴリーの存在確認
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: '指定されたカテゴリーが存在しません' });
    }
    
    // アップロードされた画像のパスを取得
    const images = req.files ? req.files.map(file => {
      // 相対パスに変換してDBに保存
      return `/uploads/products/${path.basename(file.path)}`;
    }) : [];
    
    // 商品の作成
    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      category,
      stock: parseInt(stock) || 0,
      emoji: emoji || '📦',
      status: status || 'available',
      images
    });
    
    await product.save();
    logger.info(`新商品を追加しました: ${name} (ID: ${product._id})`);
    
    // Discord経由でチャンネルを作成（オプション）
    if (req.body.createChannel === 'true') {
      // クライアントへのメッセージ送信（サーバーサイドからは実行できないため）
      res.json({
        success: true,
        product,
        message: 'チャンネル作成はBotにより処理されます'
      });
      
      // 実際のチャンネル作成はDiscordボットが行う
    } else {
      res.json({ success: true, product });
    }
  } catch (error) {
    logger.error(`商品追加エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    商品の更新
 * @access  Private (管理者のみ)
 */
router.put('/:id', isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, price, description, category, stock, emoji, status } = req.body;
    
    // 商品の存在確認
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    // カテゴリーの存在確認（カテゴリーが変更される場合）
    if (category && category !== product.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ error: '指定されたカテゴリーが存在しません' });
      }
    }
    
    // 商品情報の更新
    if (name) product.name = name;
    if (price) product.price = parseFloat(price);
    if (description) product.description = description;
    if (category) product.category = category;
    if (stock !== undefined) product.stock = parseInt(stock);
    if (emoji) product.emoji = emoji;
    if (status) product.status = status;
    
    // 新しい画像がアップロードされた場合
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => {
        return `/uploads/products/${path.basename(file.path)}`;
      });
      
      // 既存の画像を保持するか上書きするか
      if (req.body.keepExistingImages === 'true') {
        product.images = [...product.images, ...newImages];
      } else {
        product.images = newImages;
      }
    }
    
    await product.save();
    logger.info(`商品を更新しました: ${product.name} (ID: ${product._id})`);
    
    // Discord経由でチャンネルを更新（オプション）
    if (req.body.updateChannel === 'true') {
      // クライアントへのメッセージ送信
      res.json({
        success: true,
        product,
        message: 'チャンネル更新はBotにより処理されます'
      });
      
      // 実際のチャンネル更新はDiscordボットが行う
    } else {
      res.json({ success: true, product });
    }
  } catch (error) {
    logger.error(`商品更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    商品の削除
 * @access  Private (管理者のみ)
 */
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    // 商品の存在確認
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    // 関連する画像ファイルの削除
    for (const imagePath of product.images) {
      const fullPath = path.join(__dirname, '../../../', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    
    // 商品の削除
    await Product.deleteOne({ _id: req.params.id });
    logger.info(`商品を削除しました: ${product.name} (ID: ${product._id})`);
    
    // Discord経由でチャンネルを削除（オプション）
    if (req.query.deleteChannel === 'true') {
      // クライアントへのメッセージ送信
      res.json({
        success: true,
        message: 'チャンネル削除はBotにより処理されます'
      });
      
      // 実際のチャンネル削除はDiscordボットが行う
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    logger.error(`商品削除エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   POST /api/products/:id/images
 * @desc    商品画像の追加
 * @access  Private (管理者のみ)
 */
router.post('/:id/images', isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    // 商品の存在確認
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    // アップロードされた画像のパスを取得
    const newImages = req.files.map(file => {
      return `/uploads/products/${path.basename(file.path)}`;
    });
    
    // 画像の追加
    product.images = [...product.images, ...newImages];
    await product.save();
    
    res.json({ success: true, images: product.images });
  } catch (error) {
    logger.error(`商品画像追加エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   DELETE /api/products/:id/images/:imageIndex
 * @desc    商品画像の削除
 * @access  Private (管理者のみ)
 */
router.delete('/:id/images/:imageIndex', isAdmin, async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const index = parseInt(imageIndex);
    
    // 商品の存在確認
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    // インデックスの範囲チェック
    if (index < 0 || index >= product.images.length) {
      return res.status(400).json({ error: '無効な画像インデックスです' });
    }
    
    // 画像ファイルを削除
    const imagePath = product.images[index];
    const fullPath = path.join(__dirname, '../../../', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    // 画像の参照を削除
    product.images.splice(index, 1);
    await product.save();
    
    res.json({ success: true, images: product.images });
  } catch (error) {
    logger.error(`商品画像削除エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /api/products/:id/stock
 * @desc    商品在庫の更新
 * @access  Private (管理者のみ)
 */
router.put('/:id/stock', isAdmin, async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (stock === undefined) {
      return res.status(400).json({ error: '在庫数を指定してください' });
    }
    
    // 商品の存在確認
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    // 在庫の更新
    product.stock = parseInt(stock);
    
    // 在庫状態に応じてステータスを自動更新
    if (product.stock <= 0 && product.status === 'available') {
      product.status = 'out_of_stock';
    } else if (product.stock > 0 && product.status === 'out_of_stock') {
      product.status = 'available';
    }
    
    await product.save();
    logger.info(`商品在庫を更新しました: ${product.name} (ID: ${product._id}) - 在庫: ${product.stock}`);
    
    res.json({ success: true, product });
  } catch (error) {
    logger.error(`商品在庫更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /api/products/tags
 * @desc    商品のタグ一覧を取得
 * @access  Private (管理者のみ)
 */
router.get('/tags', async (req, res) => {
  try {
    // 認証トークンのチェック
    const authHeader = req.headers.authorization;
    
    // 特殊な管理者トークンのチェック（クライアントのローカルストレージからの認証）
    if (authHeader === 'Bearer admin-email-auth') {
      console.log('特殊管理者トークンでアクセス許可: タグ一覧');
      
      // 商品コレクションから一意のタグを取得
      const productsWithTags = await Product.find({ tags: { $exists: true, $ne: [] } });
      
      // すべての商品からタグを収集して重複を除去する
      const allTags = productsWithTags.reduce((tags, product) => {
        if (product.tags && Array.isArray(product.tags)) {
          return [...tags, ...product.tags];
        }
        return tags;
      }, []);
      
      // 重複を除去するためにSetを使用
      const uniqueTags = [...new Set(allTags)];
      
      return res.status(200).json({
        success: true,
        tags: uniqueTags
      });
    }
    
    // セッションベースの認証チェック（isAdmin や isAuthenticated ミドルウェアを使わない）
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '管理者権限がありません'
      });
    }
    
    // 商品コレクションから一意のタグを取得
    const productsWithTags = await Product.find({ tags: { $exists: true, $ne: [] } });
    
    // すべての商品からタグを収集して重複を除去する
    const allTags = productsWithTags.reduce((tags, product) => {
      if (product.tags && Array.isArray(product.tags)) {
        return [...tags, ...product.tags];
      }
      return tags;
    }, []);
    
    // 重複を除去するためにSetを使用
    const uniqueTags = [...new Set(allTags)];
    
    res.status(200).json({
      success: true,
      tags: uniqueTags
    });
  } catch (error) {
    logger.error(`タグ一覧取得エラー: ${error}`);
    res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
});

module.exports = router; 