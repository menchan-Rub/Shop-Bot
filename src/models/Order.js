const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  discordId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'points'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  notes: {
    type: String,
    default: ''
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
orderSchema.index({ user: 1 });
orderSchema.index({ discordId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// 注文のステータステキストを取得するメソッド
orderSchema.methods.getStatusText = function() {
  const statusMap = {
    'pending': '処理待ち',
    'processing': '処理中',
    'completed': '完了',
    'cancelled': 'キャンセル',
    'refunded': '返金済み'
  };
  return statusMap[this.status] || this.status;
};

// 支払い状況のテキストを取得するメソッド
orderSchema.methods.getPaymentStatusText = function() {
  const statusMap = {
    'pending': '支払い待ち',
    'paid': '支払い済み',
    'failed': '失敗',
    'refunded': '返金済み'
  };
  return statusMap[this.paymentStatus] || this.paymentStatus;
};

// 支払い方法のテキストを取得するメソッド
orderSchema.methods.getPaymentMethodText = function() {
  const methodMap = {
    'stripe': 'クレジットカード',
    'paypal': 'PayPal',
    'bank_transfer': '銀行振込',
    'points': 'ポイント'
  };
  return methodMap[this.paymentMethod] || this.paymentMethod;
};

// 合計金額のフォーマットメソッド
orderSchema.methods.formattedTotalAmount = function() {
  return `¥${this.totalAmount.toLocaleString()}`;
};

// 注文の概要を取得するメソッド（Discord埋め込みメッセージ用）
orderSchema.methods.generateOrderSummary = function() {
  return {
    title: `注文 #${this._id.toString().substring(0, 8)}`,
    description: '以下の注文内容をご確認ください。',
    fields: [
      {
        name: '注文状況',
        value: this.getStatusText(),
        inline: true
      },
      {
        name: '支払い状況',
        value: this.getPaymentStatusText(),
        inline: true
      },
      {
        name: '支払い方法',
        value: this.getPaymentMethodText(),
        inline: true
      },
      {
        name: '合計金額',
        value: this.formattedTotalAmount(),
        inline: true
      },
      {
        name: '注文日',
        value: new Date(this.createdAt).toLocaleString('ja-JP'),
        inline: true
      },
      {
        name: '注文商品',
        value: this.items.map(item => `${item.name} x${item.quantity} (¥${item.price.toLocaleString()})`).join('\n')
      }
    ],
    timestamp: new Date(),
    footer: {
      text: '注文に関するお問い合わせは管理者までご連絡ください。'
    }
  };
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 