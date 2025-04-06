const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const logger = require('../../utils/logger');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// メール送信の設定
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * @route   GET /auth/login
 * @desc    Discordの認証ページにリダイレクト
 * @access  Public
 */
router.get('/login', passport.authenticate('discord'));

/**
 * @route   GET /auth/discord/callback
 * @desc    Discord認証コールバック
 * @access  Public
 */
router.get('/discord/callback', 
  passport.authenticate('discord', { 
    failureRedirect: '/auth/login-failed' 
  }), 
  (req, res) => {
    // 管理者かスタッフの場合はダッシュボードへ、それ以外はメインページへ
    if (req.user.isAdmin || req.user.isStaff) {
      res.redirect('/dashboard');
    } else {
      res.redirect('/');
    }
  }
);

/**
 * @route   GET /auth/login-failed
 * @desc    認証失敗時のリダイレクト先
 * @access  Public
 */
router.get('/login-failed', (req, res) => {
  res.status(401).json({ error: 'ログインに失敗しました。もう一度お試しください。' });
});

/**
 * @route   GET /auth/logout
 * @desc    ログアウト処理
 * @access  Public
 */
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      logger.error(`ログアウトエラー: ${err}`);
      return res.status(500).json({ error: 'ログアウト中にエラーが発生しました' });
    }
    res.redirect('/');
  });
});

/**
 * @route   GET /auth/status
 * @desc    現在のログイン状態を確認
 * @access  Public
 */
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      isLoggedIn: true,
      user: {
        id: req.user.id,
        discordId: req.user.discordId,
        username: req.user.username,
        avatar: req.user.avatar,
        isAdmin: req.user.isAdmin,
        isStaff: req.user.isStaff
      }
    });
  }
  
  res.json({ isLoggedIn: false });
});

/**
 * @route   POST /auth/token
 * @desc    APIアクセス用JWTトークンの発行
 * @access  Private (ログイン済みユーザーのみ)
 */
router.post('/token', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  
  const user = req.user;
  
  // JWTトークンの作成
  const token = jwt.sign(
    { 
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      isAdmin: user.isAdmin,
      isStaff: user.isStaff
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({ token });
});

/**
 * @route   POST /auth/register
 * @desc    メールとパスワードでのユーザー登録
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // バリデーション
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'すべての項目を入力してください' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'パスワードは8文字以上にしてください' });
    }

    // メールアドレスの形式を確認
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '有効なメールアドレスを入力してください' });
    }

    // メールアドレスの重複チェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'このメールアドレスは既に使用されています' });
    }

    // ユーザー作成（discordIdはランダム生成）
    const randomDiscordId = `email_${crypto.randomBytes(8).toString('hex')}`;
    
    // 管理者メールアドレスかどうかをチェック
    const isAdmin = email === process.env.ADMIN_EMAIL;
    
    const user = new User({
      discordId: randomDiscordId,
      username,
      email,
      password,
      isAdmin: isAdmin, // 管理者メールアドレスの場合は管理者権限を付与
      loginProvider: 'email'
    });

    // メール認証用のトークンを生成
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24時間有効

    await user.save();

    // 確認メールの送信
    const verificationUrl = `${process.env.DASHBOARD_URL}/auth/verify-email/${verificationToken}`;
    
    await transporter.sendMail({
      from: `"${process.env.SHOP_NAME}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `【${process.env.SHOP_NAME}】メールアドレスの確認`,
      html: `
        <h1>メールアドレスの確認</h1>
        <p>${username}様</p>
        <p>${process.env.SHOP_NAME}へのご登録ありがとうございます。</p>
        <p>下記のリンクをクリックして、メールアドレスの確認を完了してください。</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>このリンクは24時間有効です。</p>
        <p>このメールに心当たりがない場合は、お手数ですが削除してください。</p>
      `
    });

    res.status(201).json({ 
      success: true, 
      message: '登録が完了しました。メールアドレスの確認をお願いします。' 
    });
  } catch (error) {
    logger.error(`ユーザー登録エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   GET /auth/verify-email/:token
 * @desc    メールアドレスの確認
 * @access  Public
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect('/auth/email-verification-failed');
    }

    // メール確認をマーク
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // 自動ログイン
    req.login(user, (err) => {
      if (err) {
        logger.error(`メール確認後の自動ログインエラー: ${err}`);
        return res.redirect('/auth/signin?verified=true');
      }
      res.redirect('/auth/email-verification-success');
    });
  } catch (error) {
    logger.error(`メール確認エラー: ${error}`);
    res.redirect('/auth/email-verification-failed');
  }
});

/**
 * @route   POST /auth/login
 * @desc    メールとパスワードでのログイン
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
    }
    
    // 管理者アカウントのチェック
    const isAdminCredentials = (
      email === process.env.ADMIN_EMAIL && 
      password === process.env.ADMIN_PASSWORD
    );
    
    // ユーザー検索
    let user = await User.findOne({ email });
    
    // 管理者認証情報が入力され、ユーザーが存在しない場合は管理者アカウントを作成
    if (isAdminCredentials && !user) {
      const randomDiscordId = `admin_${crypto.randomBytes(8).toString('hex')}`;
      user = new User({
        discordId: randomDiscordId,
        username: 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        isAdmin: true,
        isStaff: true,
        emailVerified: true,
        loginProvider: 'email'
      });
      await user.save();
      logger.info(`管理者アカウントを自動作成しました: ${email}`);
    } else if (!user) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // 管理者認証以外の場合は通常の認証チェック
    if (!isAdminCredentials) {
      // メール確認済みかチェック
      if (!user.emailVerified) {
        return res.status(401).json({ error: 'メールアドレスの確認が完了していません。確認メールをご確認ください' });
      }

      // パスワード検証
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
      }
    }

    // ログイン処理
    req.login(user, (err) => {
      if (err) {
        logger.error(`ログインエラー: ${err}`);
        return res.status(500).json({ error: 'ログイン処理中にエラーが発生しました' });
      }

      // ログイン日時の更新
      user.lastLogin = Date.now();
      user.save().catch(err => {
        logger.error(`ログイン日時更新エラー: ${err}`);
      });

      // ユーザー情報を返す
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          isStaff: user.isStaff
        }
      });
    });
  } catch (error) {
    logger.error(`ログインエラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   POST /auth/forgot-password
 * @desc    パスワードリセットのリクエスト
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'メールアドレスを入力してください' });
    }

    // ユーザー検索
    const user = await User.findOne({ email });
    
    // ユーザーが見つからない場合も成功レスポンスを返す（セキュリティ上の理由）
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'パスワードリセットの手順をメールで送信しました（登録されているメールの場合）' 
      });
    }

    // パスワードリセットトークンの生成
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1時間有効
    await user.save();

    // パスワードリセットメールの送信
    const resetUrl = `${process.env.DASHBOARD_URL}/auth/reset-password/${resetToken}`;
    
    await transporter.sendMail({
      from: `"${process.env.SHOP_NAME}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `【${process.env.SHOP_NAME}】パスワードリセットのご案内`,
      html: `
        <h1>パスワードリセットのご案内</h1>
        <p>${user.username}様</p>
        <p>パスワードリセットのリクエストを受け付けました。</p>
        <p>下記のリンクをクリックして、新しいパスワードを設定してください。</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>このリンクは1時間有効です。</p>
        <p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
      `
    });

    res.json({ 
      success: true, 
      message: 'パスワードリセットの手順をメールで送信しました' 
    });
  } catch (error) {
    logger.error(`パスワードリセットリクエストエラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   POST /auth/reset-password/:token
 * @desc    パスワードのリセット
 * @access  Public
 */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: '新しいパスワードを入力してください' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'パスワードは8文字以上にしてください' });
    }

    // トークンでユーザーを検索
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'パスワードリセットトークンが無効または期限切れです' 
      });
    }

    // パスワードの更新
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // 確認メールの送信
    await transporter.sendMail({
      from: `"${process.env.SHOP_NAME}" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: `【${process.env.SHOP_NAME}】パスワードが変更されました`,
      html: `
        <h1>パスワード変更のお知らせ</h1>
        <p>${user.username}様</p>
        <p>パスワードが正常に変更されました。</p>
        <p>このパスワード変更に心当たりがない場合は、すぐにサポートにご連絡ください。</p>
      `
    });

    res.json({ 
      success: true, 
      message: 'パスワードが正常にリセットされました。新しいパスワードでログインしてください。' 
    });
  } catch (error) {
    logger.error(`パスワードリセットエラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /auth/change-password
 * @desc    パスワード変更（ログイン中）
 * @access  Private
 */
router.put('/change-password', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '現在のパスワードと新しいパスワードを入力してください' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: '新しいパスワードは8文字以上にしてください' });
    }

    const user = await User.findById(req.user.id);
    
    // 現在のパスワードを確認
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: '現在のパスワードが正しくありません' });
    }

    // パスワードの更新
    user.password = newPassword;
    await user.save();

    // 確認メールの送信
    await transporter.sendMail({
      from: `"${process.env.SHOP_NAME}" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: `【${process.env.SHOP_NAME}】パスワードが変更されました`,
      html: `
        <h1>パスワード変更のお知らせ</h1>
        <p>${user.username}様</p>
        <p>パスワードが正常に変更されました。</p>
        <p>このパスワード変更に心当たりがない場合は、すぐにサポートにご連絡ください。</p>
      `
    });

    res.json({ 
      success: true, 
      message: 'パスワードが正常に変更されました' 
    });
  } catch (error) {
    logger.error(`パスワード変更エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   PUT /auth/admin/:userId
 * @desc    ユーザーに管理者権限を付与/剥奪
 * @access  Private (管理者のみ)
 */
router.put('/admin/:userId', async (req, res) => {
  try {
    // 認証と権限チェック
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ error: '権限がありません' });
    }
    
    const { userId } = req.params;
    const { isAdmin } = req.body;
    
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'isAdminパラメータが必要です' });
    }
    
    // ユーザーの検索と更新
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    
    // 自分自身の権限は変更できないようにする
    if (user.id === req.user.id) {
      return res.status(400).json({ error: '自分自身の管理者権限は変更できません' });
    }
    
    user.isAdmin = isAdmin;
    await user.save();
    
    logger.info(`ユーザー ${user.username} (${user.id}) の管理者権限を ${isAdmin ? '付与' : '剥奪'} しました`);
    
    res.json({ success: true, user });
  } catch (error) {
    logger.error(`管理者権限更新エラー: ${error}`);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * @route   POST /auth/admin-login
 * @desc    管理者ログイン
 * @access  Public
 */
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です'
      });
    }

    // ユーザー検索
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn(`管理者ログイン失敗: ユーザーが見つかりません - ${email}`);
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // 管理者権限チェック
    if (!user.isAdmin) {
      logger.warn(`管理者ログイン失敗: 管理者権限がありません - ${email}`);
      return res.status(403).json({
        success: false,
        message: '管理者権限がありません'
      });
    }

    // パスワード検証
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`管理者ログイン失敗: パスワードが正しくありません - ${email}`);
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // JWTトークン生成
    const token = jwt.sign(
      { 
        id: user._id, 
        isAdmin: user.isAdmin,
        isStaff: user.isStaff,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 最終ログイン日時更新
    user.lastLoginAt = new Date();
    await user.save();

    logger.info(`管理者ログイン成功: ${user.email} (${user._id})`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isStaff: user.isStaff,
        avatar: user.avatar
      }
    });
  } catch (error) {
    logger.error(`管理者ログインエラー: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    });
  }
});

module.exports = router; 