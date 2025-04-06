const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    type: String,
    required: false
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'hidden', 'out_of_stock', 'pre_order'],
    default: 'available'
  },
  channelId: {
    type: String,
    required: false
  },
  embedMessageId: {
    type: String,
    required: false
  },
  emoji: {
    type: String,
    required: false
  },
  tags: {
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
productSchema.index({ name: 'text', description: 'text' });

// 在庫チェックメソッド
productSchema.methods.isInStock = function() {
  return this.stock > 0;
};

// 価格フォーマットメソッド
productSchema.methods.formattedPrice = function() {
  return `¥${this.price.toLocaleString()}`;
};

// 埋め込みメッセージの内容を生成するメソッド
productSchema.methods.generateEmbedContent = function() {
  return {
    title: this.name,
    description: this.description,
    fields: [
      {
        name: '価格',
        value: this.formattedPrice(),
        inline: true
      },
      {
        name: '在庫状況',
        value: this.isInStock() ? `残り ${this.stock} 個` : '在庫切れ',
        inline: true
      },
      {
        name: 'ステータス',
        value: this.getStatusText(),
        inline: true
      }
    ],
    image: this.images && this.images.length > 0 ? { url: this.images[0] } : null,
    timestamp: new Date(),
    footer: {
      text: '購入するにはボタンをクリックしてください。'
    }
  };
};

// ステータスのテキスト表現を取得するメソッド
productSchema.methods.getStatusText = function() {
  const statusMap = {
    'available': '販売中',
    'hidden': '非表示',
    'out_of_stock': '在庫切れ',
    'pre_order': '予約受付中'
  };
  return statusMap[this.status] || this.status;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 