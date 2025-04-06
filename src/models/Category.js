const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  emoji: {
    type: String,
    default: '📦'
  },
  description: {
    type: String,
    default: ''
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  channelId: {
    type: String,
    required: false
  },
  permissions: {
    type: [String],
    default: []
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
categorySchema.index({ name: 1 });
categorySchema.index({ displayOrder: 1 });

// カテゴリーのフルネーム（絵文字付き）を取得するメソッド
categorySchema.methods.getFullName = function() {
  return `${this.emoji} ${this.name}`;
};

// チャンネル名に使用できる形式の名前を取得するメソッド
categorySchema.methods.getChannelName = function() {
  // スペースをハイフンに置換し、小文字化
  return this.name.replace(/\s+/g, '-').toLowerCase();
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 