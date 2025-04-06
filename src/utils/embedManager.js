const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder
} = require('discord.js');
const logger = require('./logger');

/**
 * 商品の埋め込みメッセージを作成する
 * @param {Object} product - 商品データ
 * @param {Object} options - 追加オプション
 * @returns {Object} - 埋め込みメッセージとアクションロウ
 */
function createProductEmbed(product, options = {}) {
  try {
    // 埋め込みメッセージの作成
    const embed = new EmbedBuilder()
      .setTitle(product.name)
      .setDescription(product.description)
      .addFields(
        { name: '価格', value: product.formattedPrice(), inline: true },
        { 
          name: '在庫状況', 
          value: product.isInStock() ? `残り ${product.stock} 個` : '在庫切れ', 
          inline: true 
        },
        { name: 'ステータス', value: product.getStatusText(), inline: true }
      )
      .setColor(getStatusColor(product.status))
      .setTimestamp()
      .setFooter({ text: '購入するにはボタンをクリックしてください。' });
    
    // 画像がある場合は追加
    if (product.images && product.images.length > 0) {
      embed.setImage(product.images[0]);
    }
    
    // ボタンの作成
    const row = new ActionRowBuilder();
    
    // 購入ボタン
    const buyButton = new ButtonBuilder()
      .setCustomId(`buy_${product._id}`)
      .setLabel('購入する')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🛒');
    
    // 在庫がない場合はボタンを無効化
    if (!product.isInStock() || product.status !== 'available') {
      buyButton.setDisabled(true);
    }
    
    row.addComponents(buyButton);
    
    // カートに追加ボタン
    if (options.showCartButton) {
      const cartButton = new ButtonBuilder()
        .setCustomId(`cart_add_${product._id}`)
        .setLabel('カートに追加')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🛍️');
        
      if (!product.isInStock() || product.status !== 'available') {
        cartButton.setDisabled(true);
      }
      
      row.addComponents(cartButton);
    }
    
    // 詳細ボタン
    const detailsButton = new ButtonBuilder()
      .setCustomId(`details_${product._id}`)
      .setLabel('詳細を見る')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('ℹ️');
      
    row.addComponents(detailsButton);
    
    // 通知ボタン
    if (!product.isInStock() && product.status !== 'hidden') {
      const notifyButton = new ButtonBuilder()
        .setCustomId(`notify_${product._id}`)
        .setLabel('入荷通知')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔔');
        
      row.addComponents(notifyButton);
    }
    
    return { embed, row };
  } catch (error) {
    logger.error(`Error creating product embed: ${error}`);
    throw error;
  }
}

/**
 * カテゴリーの埋め込みメッセージを作成する
 * @param {Object} category - カテゴリーデータ
 * @param {Array} products - カテゴリーに属する商品リスト
 * @returns {Object} - 埋め込みメッセージとアクションロウ
 */
function createCategoryEmbed(category, products) {
  try {
    // 埋め込みメッセージの作成
    const embed = new EmbedBuilder()
      .setTitle(`${category.emoji} ${category.name}`)
      .setDescription(category.description || 'このカテゴリーの商品一覧です。')
      .setColor('#0099ff')
      .setTimestamp()
      .setFooter({ text: '商品を選択して詳細を表示します。' });
    
    // 商品の概要を追加
    if (products && products.length > 0) {
      const availableProducts = products.filter(p => p.status === 'available');
      const unavailableProducts = products.filter(p => p.status !== 'available');
      
      if (availableProducts.length > 0) {
        embed.addFields({
          name: '販売中の商品',
          value: availableProducts.map(p => 
            `${p.emoji || '📦'} ${p.name} - ${p.formattedPrice()}${p.isInStock() ? '' : ' (在庫切れ)'}`
          ).join('\n'),
          inline: false
        });
      }
      
      if (unavailableProducts.length > 0) {
        embed.addFields({
          name: 'その他の商品',
          value: unavailableProducts.map(p => 
            `${p.emoji || '📦'} ${p.name} - ${p.getStatusText()}`
          ).join('\n'),
          inline: false
        });
      }
    } else {
      embed.addFields({
        name: '商品がありません',
        value: 'このカテゴリーにはまだ商品が登録されていません。',
        inline: false
      });
    }
    
    // セレクトメニューの作成
    if (products && products.length > 0) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select_product_${category._id}`)
        .setPlaceholder('商品を選択')
        .addOptions(
          products.map(product => ({
            label: product.name,
            value: product._id.toString(),
            description: `${product.formattedPrice()} - ${product.isInStock() ? '在庫あり' : '在庫なし'}`,
            emoji: product.emoji || '📦'
          }))
        );
        
      const row = new ActionRowBuilder().addComponents(selectMenu);
      return { embed, row };
    }
    
    return { embed };
  } catch (error) {
    logger.error(`Error creating category embed: ${error}`);
    throw error;
  }
}

/**
 * カートの埋め込みメッセージを作成する
 * @param {Object} user - ユーザーデータ
 * @param {Array} cartItems - カート内の商品（Populate済み）
 * @returns {Object} - 埋め込みメッセージとアクションロウ
 */
function createCartEmbed(user, cartItems) {
  try {
    // 合計金額の計算
    const totalAmount = cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
    
    // 埋め込みメッセージの作成
    const embed = new EmbedBuilder()
      .setTitle('🛒 ショッピングカート')
      .setDescription(`${user.username} さんのカート内容`)
      .setColor('#00cc99')
      .setTimestamp()
      .setFooter({ text: 'カートの商品を注文または削除できます。' });
    
    // カート内の商品を追加
    if (cartItems.length > 0) {
      embed.addFields(
        {
          name: 'カート内の商品',
          value: cartItems.map((item, index) => 
            `${index + 1}. ${item.product.emoji || '📦'} ${item.product.name} - ${item.quantity}個 (${item.product.formattedPrice()} × ${item.quantity} = ¥${(item.product.price * item.quantity).toLocaleString()})`
          ).join('\n'),
          inline: false
        },
        {
          name: '合計金額',
          value: `¥${totalAmount.toLocaleString()}`,
          inline: true
        },
        {
          name: '所持ポイント',
          value: `${user.points.toLocaleString()} ポイント`,
          inline: true
        }
      );
    } else {
      embed.addFields({
        name: 'カートは空です',
        value: '商品をカートに追加してください。',
        inline: false
      });
    }
    
    // ボタンの作成
    const row1 = new ActionRowBuilder();
    
    // 注文ボタン
    if (cartItems.length > 0) {
      const checkoutButton = new ButtonBuilder()
        .setCustomId('cart_checkout')
        .setLabel('注文する')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💳');
        
      row1.addComponents(checkoutButton);
      
      // カートを空にするボタン
      const clearButton = new ButtonBuilder()
        .setCustomId('cart_clear')
        .setLabel('カートを空にする')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️');
        
      row1.addComponents(clearButton);
    }
    
    // ショッピングを続けるボタン
    const continueButton = new ButtonBuilder()
      .setCustomId('cart_continue')
      .setLabel('ショッピングを続ける')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏪');
      
    row1.addComponents(continueButton);
    
    // 商品の削除ボタンを作成（商品がある場合のみ）
    if (cartItems.length > 0) {
      const row2 = new ActionRowBuilder();
      
      // 各商品の削除ボタン（最大5つまで）
      cartItems.slice(0, 5).forEach((item, index) => {
        const removeButton = new ButtonBuilder()
          .setCustomId(`cart_remove_${item.product._id}`)
          .setLabel(`${index + 1}を削除`)
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌');
          
        row2.addComponents(removeButton);
      });
      
      return { embed, components: [row1, row2] };
    }
    
    return { embed, components: [row1] };
  } catch (error) {
    logger.error(`Error creating cart embed: ${error}`);
    throw error;
  }
}

/**
 * 注文の埋め込みメッセージを作成する
 * @param {Object} order - 注文データ
 * @returns {Object} - 埋め込みメッセージとアクションロウ
 */
function createOrderEmbed(order) {
  try {
    // 埋め込みメッセージの作成
    const embed = new EmbedBuilder()
      .setTitle(`注文 #${order._id.toString().substring(0, 8)}`)
      .setDescription('以下の注文内容をご確認ください。')
      .setColor(getOrderStatusColor(order.status))
      .addFields(
        { name: '注文状況', value: order.getStatusText(), inline: true },
        { name: '支払い状況', value: order.getPaymentStatusText(), inline: true },
        { name: '支払い方法', value: order.getPaymentMethodText(), inline: true },
        { name: '合計金額', value: order.formattedTotalAmount(), inline: true },
        { name: '注文日', value: new Date(order.createdAt).toLocaleString('ja-JP'), inline: true },
        {
          name: '注文商品',
          value: order.items.map(item => 
            `${item.name} × ${item.quantity} (¥${item.price.toLocaleString()})`
          ).join('\n'),
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: '注文に関するお問い合わせは管理者までご連絡ください。' });
    
    // ボタンの作成
    const row = new ActionRowBuilder();
    
    // キャンセルボタン（保留中または処理中の注文の場合のみ）
    if (['pending', 'processing'].includes(order.status)) {
      const cancelButton = new ButtonBuilder()
        .setCustomId(`order_cancel_${order._id}`)
        .setLabel('キャンセルリクエスト')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌');
        
      row.addComponents(cancelButton);
    }
    
    // 詳細ボタン
    const detailsButton = new ButtonBuilder()
      .setCustomId(`order_details_${order._id}`)
      .setLabel('詳細を見る')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('ℹ️');
      
    row.addComponents(detailsButton);
    
    // 管理者に問い合わせるボタン
    const contactButton = new ButtonBuilder()
      .setCustomId(`order_contact_${order._id}`)
      .setLabel('問い合わせ')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📞');
      
    row.addComponents(contactButton);
    
    return { embed, row };
  } catch (error) {
    logger.error(`Error creating order embed: ${error}`);
    throw error;
  }
}

/**
 * ステータスに応じた色を取得
 * @param {String} status - 商品ステータス
 * @returns {Number} - 色コード
 */
function getStatusColor(status) {
  const colors = {
    'available': 0x00ff00, // 緑
    'hidden': 0x888888,    // グレー
    'out_of_stock': 0xff0000, // 赤
    'pre_order': 0xffaa00  // オレンジ
  };
  
  return colors[status] || 0x0099ff; // デフォルトは青
}

/**
 * 注文ステータスに応じた色を取得
 * @param {String} status - 注文ステータス
 * @returns {Number} - 色コード
 */
function getOrderStatusColor(status) {
  const colors = {
    'pending': 0xffaa00,   // オレンジ
    'processing': 0x0099ff, // 青
    'completed': 0x00ff00,  // 緑
    'cancelled': 0xff0000,  // 赤
    'refunded': 0x888888    // グレー
  };
  
  return colors[status] || 0x0099ff; // デフォルトは青
}

module.exports = {
  createProductEmbed,
  createCategoryEmbed,
  createCartEmbed,
  createOrderEmbed,
  getStatusColor,
  getOrderStatusColor
}; 