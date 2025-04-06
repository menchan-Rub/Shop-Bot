const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  discriminator: {
    type: String,
    required: false
  },
  avatar: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isStaff: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0
  },
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  password: {
    type: String,
    required: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    }
  },
  notes: {
    type: String,
    default: ''
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  loginProvider: {
    type: String,
    enum: ['discord', 'email'],
    default: 'discord'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  profileData: {
    fullName: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    address: {
      type: String
    },
    bio: {
      type: String
    }
  },
  lastPasswordChanged: {
    type: Date
  },
  acceptTerms: {
    type: Boolean,
    default: false
  },
  acceptPrivacyPolicy: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// インデックスの作成
userSchema.index({ discordId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isAdmin: 1 });
userSchema.index({ isStaff: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

// パスワードハッシュ化
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    try {
      // パスワード変更日時を更新
      this.lastPasswordChanged = Date.now();
      
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// パスワード検証メソッド
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// アカウントがロックされているかチェックするメソッド
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// ログイン試行回数をインクリメントし、必要に応じてロックするメソッド
userSchema.methods.incrementLoginAttempts = async function() {
  // アカウントのロックが解除されている場合、試行回数をリセット
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    return this.save();
  }
  
  // 試行回数を増やす
  this.loginAttempts += 1;
  
  // 最大試行回数（5回）を超えた場合、アカウントを1時間ロック
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 60 * 60 * 1000;
  }
  
  return this.save();
};

// ログイン成功時に試行回数をリセットするメソッド
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

// ユーザーの表示名を取得するメソッド
userSchema.methods.getDisplayName = function() {
  return this.username;
};

// カートに商品を追加するメソッド
userSchema.methods.addToCart = async function(productId, quantity = 1) {
  const existingProduct = this.cart.find(item => item.product.toString() === productId.toString());
  
  if (existingProduct) {
    existingProduct.quantity += quantity;
  } else {
    this.cart.push({
      product: productId,
      quantity
    });
  }
  
  return this.save();
};

// カート内の商品数量を更新するメソッド
userSchema.methods.updateCartItemQuantity = async function(productId, quantity) {
  const existingProduct = this.cart.find(item => item.product.toString() === productId.toString());
  
  if (!existingProduct) {
    return false;
  }
  
  existingProduct.quantity = quantity;
  await this.save();
  return true;
};

// カートから商品を削除するメソッド
userSchema.methods.removeFromCart = async function(productId) {
  this.cart = this.cart.filter(item => item.product.toString() !== productId.toString());
  return this.save();
};

// カートを空にするメソッド
userSchema.methods.clearCart = async function() {
  this.cart = [];
  return this.save();
};

// ポイントを追加するメソッド
userSchema.methods.addPoints = async function(points) {
  this.points += points;
  return this.save();
};

// ポイントを使用するメソッド
userSchema.methods.usePoints = async function(points) {
  if (this.points < points) {
    throw new Error('ポイントが不足しています');
  }
  
  this.points -= points;
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 