require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const fs = require('fs');

// モデルの読み込み
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');

// ルーターの読み込み
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const apiRoutes = require('./routes/api');

// Expressアプリの初期化
const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;

// Mongooseの接続
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected successfully'))
  .catch(err => logger.error(`MongoDB connection error: ${err}`));

// ミドルウェアの設定
// CORSの設定 - すべてのオリジンからのリクエストを許可
app.use(cors({
  origin: function(origin, callback) {
    // 本番環境では特定のオリジンのみ許可するようにするべきですが、
    // 開発段階ではすべてのオリジンを許可します
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// よく要求される静的ファイルの特別処理
app.get('/favicon.ico', (req, res) => {
  // デフォルトのfaviconを提供（存在しない場合は204を返す）
  const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    res.status(204).end(); // No Content
  }
});

// セッションの設定
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24時間
  }
}));

// Passportの設定
app.use(passport.initialize());
app.use(passport.session());

// Discord認証ストラテジーの設定 - CLIENT_IDが設定されている場合のみ初期化
if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
  passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: `${process.env.DASHBOARD_URL}/auth/discord/callback`,
    scope: ['identify', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // ユーザーの検索または作成
      let user = await User.findOne({ discordId: profile.id });
      
      if (user) {
        // 既存ユーザーの情報を更新
        user.username = profile.username;
        user.discriminator = profile.discriminator;
        user.avatar = profile.avatar;
        user.email = profile.email;
        user.lastLogin = new Date();
        await user.save();
      } else {
        // 新規ユーザーの作成
        user = new User({
          discordId: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          avatar: profile.avatar,
          email: profile.email
        });
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      logger.error(`Passport認証エラー: ${error}`);
      return done(error);
    }
  }));
} else {
  console.log('Discord認証の設定情報が不足しています。Discord認証は無効になります。');
  console.log('ENV CLIENT_ID:', process.env.CLIENT_ID);
  console.log('ENV CLIENT_SECRET is set:', !!process.env.CLIENT_SECRET);
}

// セッション情報のシリアライズ・デシリアライズ
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// 認証チェックミドルウェア
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};

// 管理者チェックミドルウェア
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: '権限がありません' });
};

// 静的ファイルのルート
const publicDir = path.join(__dirname, '../../public');
const uploadsDir = path.join(__dirname, '../../uploads');
const clientBuildPath = path.join(__dirname, '../../client/.next');

// 静的ファイルの提供
app.use('/public', express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

// 公開静的ファイルを提供
app.use('/public', express.static(publicDir));

// ルートの設定
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// 特定のエンドポイントを優先的に処理する
// GET /api/products/tags エンドポイントを直接定義
app.get('/api/products/tags', async (req, res) => {
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
    
    // セッションベースの認証チェック
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
    console.error(`タグ一覧取得エラー: ${error}`);
    res.status(500).json({ 
      success: false,
      message: '内部サーバーエラー' 
    });
  }
});

// 他のAPIルート
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api', apiRoutes);

// クライアントビルドが存在する場合は静的ファイルを提供
if (fs.existsSync(clientBuildPath)) {
  logger.info('クライアントビルドを提供します: ' + clientBuildPath);
  app.use(express.static(clientBuildPath));
  
  // SPA対応：その他のリクエストはReactアプリにリダイレクト
  app.get('*', (req, res, next) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next(); // index.htmlが見つからない場合は次のハンドラへ
    }
  });
} else {
  // クライアントビルドがない場合はAPI専用モードで動作
  logger.info('クライアントビルドが見つかりません。API専用モードで動作します');
}

// ルートパスへのアクセスはAPIドキュメントを表示
app.get('/', (req, res) => {
  try {
    res.send(`
      <html>
        <head>
          <title>Discord Shop API</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #5865F2; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
            .endpoint { margin-bottom: 20px; }
            .method { font-weight: bold; margin-right: 10px; }
            .get { color: #2E8B57; }
            .post { color: #0066CC; }
            .put { color: #FF8C00; }
            .delete { color: #CC0000; }
          </style>
        </head>
        <body>
          <h1>Discord Shop API</h1>
          <p>APIは正常に動作しています。</p>
          <p>以下のAPIエンドポイントが利用可能です：</p>
          
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/products</code> - 商品一覧の取得
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/categories</code> - カテゴリー一覧の取得
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/system/health</code> - システム稼働状況の確認
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/stats/public</code> - 公開統計情報の取得
          </div>
          
          <p>APIの完全なドキュメントはAPIルーターファイルをご確認ください。</p>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error(`ルートページ表示エラー: ${error}`);
    res.status(500).send('サーバーエラーが発生しました');
  }
});

// 404エラーハンドラ（他のルートでマッチしなかった場合）
app.use((req, res, next) => {
  res.status(404).json({
    error: 'リソースが見つかりません',
    path: req.path
  });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  logger.error(`サーバーエラー: ${err.stack}`);
  res.status(500).json({
    error: 'サーバーエラーが発生しました',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// サーバーの起動
app.listen(PORT, () => {
  logger.info(`Dashboard server running on port ${PORT}`);
}); 