const { 
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const logger = require('../utils/logger');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('商品を購入します')
    .addStringOption(option => 
      option.setName('category')
        .setDescription('商品カテゴリを選択')
        .setRequired(false)
        .setAutocomplete(true))
    .addStringOption(option => 
      option.setName('product_id')
        .setDescription('商品IDを直接指定（カテゴリを指定しない場合）')
        .setRequired(false)
        .setAutocomplete(true)),
  
  async autocomplete(interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      
      if (focusedOption.name === 'category') {
        // カテゴリの自動補完
        const categories = await Category.find({ active: true }).sort('name');
        
        // 入力値でフィルタリング
        const filtered = categories.filter(category => 
          category.name.toLowerCase().includes(focusedOption.value.toLowerCase()));
        
        await interaction.respond(
          filtered.map(category => ({
            name: `${category.emoji || '📂'} ${category.name}`,
            value: category._id.toString()
          }))
        );
      } else if (focusedOption.name === 'product_id') {
        // 商品の自動補完
        const products = await Product.find({ active: true }).sort('name').populate('category', 'name');
        
        // 入力値でフィルタリング
        const filtered = products.filter(product => 
          product.name.toLowerCase().includes(focusedOption.value.toLowerCase()) || 
          (product.category && product.category.name.toLowerCase().includes(focusedOption.value.toLowerCase())));
        
        await interaction.respond(
          filtered.map(product => ({
            name: `${product.emoji || '📦'} ${product.name} (${product.price.toLocaleString()}円)`,
            value: product._id.toString()
          }))
        );
      }
    } catch (error) {
      logger.error(`オートコンプリートエラー: ${error}`);
    }
  },
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      const categoryId = interaction.options.getString('category');
      const productId = interaction.options.getString('product_id');
      
      if (productId) {
        // 商品IDが指定された場合、商品詳細を表示
        return await this.showProductDetails(interaction, productId);
      } else if (categoryId) {
        // カテゴリが指定された場合、カテゴリ内の商品一覧を表示
        return await this.showCategoryProducts(interaction, categoryId);
      } else {
        // どちらも指定されていない場合、カテゴリ一覧を表示
        return await this.showCategories(interaction);
      }
    } catch (error) {
      logger.error(`購入コマンドエラー: ${error}`);
      await interaction.editReply({
        content: `エラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  },
  
  // カテゴリ一覧を表示
  async showCategories(interaction) {
    const categories = await Category.find({ active: true }).sort('name');
    
    if (categories.length === 0) {
      return await interaction.editReply('現在販売中の商品カテゴリはありません。');
    }
    
    const embed = new EmbedBuilder()
      .setTitle('商品カテゴリ一覧')
      .setDescription('購入する商品のカテゴリを選択してください。')
      .setColor('#0099ff')
      .setTimestamp();
    
    // カテゴリの選択メニュー
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('category_select')
      .setPlaceholder('カテゴリを選択')
      .addOptions(
        categories.map(category => new StringSelectMenuOptionBuilder()
          .setLabel(category.name)
          .setDescription(category.description || 'カテゴリの説明なし')
          .setValue(category._id.toString())
          .setEmoji(category.emoji || '📂')
        )
      );
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    // カテゴリの説明を追加
    let categoryList = '';
    for (const category of categories) {
      categoryList += `${category.emoji || '📂'} **${category.name}**\n`;
      if (category.description) {
        categoryList += `　${category.description}\n`;
      }
      categoryList += '\n';
    }
    
    embed.setDescription(categoryList || '商品カテゴリがありません。');
    
    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  },
  
  // カテゴリ内の商品一覧を表示
  async showCategoryProducts(interaction, categoryId) {
    const category = await Category.findById(categoryId);
    
    if (!category || !category.active) {
      return await interaction.editReply('指定されたカテゴリは存在しないか、現在利用できません。');
    }
    
    const products = await Product.find({ 
      category: categoryId,
      active: true,
      stock: { $gt: 0 }  // 在庫があるもののみ
    }).sort('name');
    
    if (products.length === 0) {
      return await interaction.editReply(`カテゴリ「${category.name}」には現在販売中の商品がありません。`);
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`${category.emoji || '📂'} ${category.name}`)
      .setDescription(category.description || 'カテゴリの説明なし')
      .setColor('#0099ff')
      .setTimestamp();
    
    // 商品の選択メニュー
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('product_select')
      .setPlaceholder('商品を選択')
      .addOptions(
        products.map(product => new StringSelectMenuOptionBuilder()
          .setLabel(product.name)
          .setDescription(`${product.price.toLocaleString()}円 | 在庫: ${product.stock}`)
          .setValue(product._id.toString())
          .setEmoji(product.emoji || '📦')
        )
      );
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    // 商品一覧を追加
    let productList = '';
    for (const product of products) {
      productList += `${product.emoji || '📦'} **${product.name}**\n`;
      productList += `　💰 ${product.price.toLocaleString()}円 | 📦 在庫: ${product.stock}\n`;
      if (product.description) {
        productList += `　${product.description}\n`;
      }
      productList += '\n';
    }
    
    embed.setDescription(productList || '商品がありません。');
    
    // 戻るボタン
    const backButton = new ButtonBuilder()
      .setCustomId('back_to_categories')
      .setLabel('カテゴリ一覧に戻る')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️');
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.editReply({
      embeds: [embed],
      components: [row, buttonRow]
    });
  },
  
  // 商品詳細を表示
  async showProductDetails(interaction, productId) {
    const product = await Product.findById(productId).populate('category', 'name emoji');
    
    if (!product || !product.active) {
      return await interaction.editReply('指定された商品は存在しないか、現在販売されていません。');
    }
    
    if (product.stock <= 0) {
      return await interaction.editReply(`「${product.name}」は現在在庫切れです。`);
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`${product.emoji || '📦'} ${product.name}`)
      .setDescription(product.description || '商品の説明なし')
      .setColor('#0099ff')
      .setTimestamp();
    
    if (product.image) {
      embed.setImage(product.image);
    }
    
    embed.addFields(
      { name: '価格', value: `💰 ${product.price.toLocaleString()}円`, inline: true },
      { name: '在庫', value: `📦 ${product.stock}`, inline: true },
      { name: 'カテゴリ', value: product.category ? `${product.category.emoji || '📂'} ${product.category.name}` : '不明', inline: true }
    );
    
    // 数量選択ボタン
    const quantityRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`buy_quantity_1_${product._id}`)
          .setLabel('1個購入')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('1️⃣'),
        new ButtonBuilder()
          .setCustomId(`buy_quantity_2_${product._id}`)
          .setLabel('2個購入')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('2️⃣'),
        new ButtonBuilder()
          .setCustomId(`buy_quantity_3_${product._id}`)
          .setLabel('3個購入')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('3️⃣'),
        new ButtonBuilder()
          .setCustomId(`buy_quantity_custom_${product._id}`)
          .setLabel('数量指定')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔢')
      );
    
    // 戻るボタン
    let backButton;
    if (product.category) {
      backButton = new ButtonBuilder()
        .setCustomId(`back_to_category_${product.category._id}`)
        .setLabel(`${product.category.name}に戻る`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️');
    } else {
      backButton = new ButtonBuilder()
        .setCustomId('back_to_categories')
        .setLabel('カテゴリ一覧に戻る')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️');
    }
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.editReply({
      embeds: [embed],
      components: [quantityRow, buttonRow]
    });
  },
  
  // ヘルパー関数: 購入プロセスを開始（コンポーネント用）
  async startPurchaseProcess(interaction, productId, quantity) {
    // このメソッドはボタンクリックハンドラーから呼び出されることを想定
    
    const product = await Product.findById(productId).populate('category', 'name emoji');
    
    if (!product || !product.active) {
      return await interaction.reply({
        content: '指定された商品は存在しないか、現在販売されていません。',
        ephemeral: true
      });
    }
    
    if (product.stock < quantity) {
      return await interaction.reply({
        content: `「${product.name}」の在庫が不足しています。在庫: ${product.stock}`,
        ephemeral: true
      });
    }
    
    // 購入確認画面
    const totalPrice = product.price * quantity;
    
    const embed = new EmbedBuilder()
      .setTitle('購入確認')
      .setDescription(`以下の商品を購入しますか？`)
      .setColor('#0099ff')
      .setTimestamp();
    
    embed.addFields(
      { name: '商品', value: `${product.emoji || '📦'} ${product.name}`, inline: true },
      { name: '数量', value: `${quantity}個`, inline: true },
      { name: '合計金額', value: `💰 ${totalPrice.toLocaleString()}円`, inline: true },
      { name: 'カテゴリ', value: product.category ? `${product.category.emoji || '📂'} ${product.category.name}` : '不明', inline: true }
    );
    
    if (product.image) {
      embed.setThumbnail(product.image);
    }
    
    // 確認ボタン
    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_purchase_${product._id}_${quantity}`)
          .setLabel('購入を確定')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`cancel_purchase`)
          .setLabel('キャンセル')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );
    
    await interaction.reply({
      embeds: [embed],
      components: [confirmRow],
      ephemeral: true
    });
  },
  
  // ヘルパー関数: 購入を完了（コンポーネント用）
  async completePurchase(interaction, productId, quantity) {
    // 購入処理
    const product = await Product.findById(productId).populate('category', 'name emoji');
    
    if (!product || !product.active) {
      return await interaction.update({
        content: '指定された商品は存在しないか、現在販売されていません。',
        components: [],
        embeds: [],
        ephemeral: true
      });
    }
    
    if (product.stock < quantity) {
      return await interaction.update({
        content: `「${product.name}」の在庫が不足しています。在庫: ${product.stock}`,
        components: [],
        embeds: [],
        ephemeral: true
      });
    }
    
    // ユーザー情報を取得または作成
    let user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
      user = new User({
        discordId: interaction.user.id,
        username: interaction.user.username,
        avatar: interaction.user.displayAvatarURL(),
        transactions: []
      });
      await user.save();
    }
    
    // 注文を作成
    const totalPrice = product.price * quantity;
    const order = new Order({
      userId: user._id,
      items: [{
        productId: product._id,
        quantity: quantity,
        priceAtPurchase: product.price
      }],
      totalPrice: totalPrice,
      status: 'pending',
      notes: `Discord経由での購入 (${interaction.guild?.name || 'DM'})`,
      createdAt: new Date()
    });
    
    await order.save();
    
    // 在庫を減らす
    product.stock -= quantity;
    await product.save();
    
    // 購入完了メッセージ
    const embed = new EmbedBuilder()
      .setTitle('購入完了')
      .setDescription(`以下の商品の購入が完了しました！`)
      .setColor('#00FF00')
      .setTimestamp();
    
    embed.addFields(
      { name: '商品', value: `${product.emoji || '📦'} ${product.name}`, inline: true },
      { name: '数量', value: `${quantity}個`, inline: true },
      { name: '合計金額', value: `💰 ${totalPrice.toLocaleString()}円`, inline: true },
      { name: '注文ID', value: `#${order._id.toString().substring(0, 8)}`, inline: true },
      { name: 'ステータス', value: `⏳ 未処理`, inline: true }
    );
    
    if (product.image) {
      embed.setThumbnail(product.image);
    }
    
    // 確認ボタン
    const buttonRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('ダッシュボードで確認')
          .setURL(`${process.env.DASHBOARD_URL}/orders/${order._id}`)
          .setStyle(ButtonStyle.Link)
          .setEmoji('🌐')
      );
    
    // 管理者に通知
    try {
      const notificationChannelId = process.env.ORDER_NOTIFICATION_CHANNEL;
      if (notificationChannelId) {
        const channel = await interaction.client.channels.fetch(notificationChannelId);
        if (channel) {
          const notifyEmbed = new EmbedBuilder()
            .setTitle('新規注文')
            .setDescription(`${interaction.user.tag} が注文を行いました。`)
            .setColor('#FF9900')
            .setTimestamp()
            .addFields(
              { name: '商品', value: `${product.emoji || '📦'} ${product.name}`, inline: true },
              { name: '数量', value: `${quantity}個`, inline: true },
              { name: '合計金額', value: `💰 ${totalPrice.toLocaleString()}円`, inline: true },
              { name: '注文ID', value: `#${order._id.toString().substring(0, 8)}`, inline: true },
              { name: 'ユーザー', value: `<@${interaction.user.id}>`, inline: true }
            );
          
          const adminButtonRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('注文詳細を見る')
                .setCustomId(`view_order_${order._id}`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔍'),
              new ButtonBuilder()
                .setLabel('ダッシュボードで管理')
                .setURL(`${process.env.DASHBOARD_URL}/orders/${order._id}`)
                .setStyle(ButtonStyle.Link)
                .setEmoji('🌐')
            );
          
          await channel.send({
            embeds: [notifyEmbed],
            components: [adminButtonRow]
          });
        }
      }
    } catch (error) {
      logger.warn(`注文通知エラー: ${error.message}`);
    }
    
    logger.info(`注文作成: ユーザー ${interaction.user.tag} が ${product.name} を ${quantity}個購入。注文ID: ${order._id}`);
    
    await interaction.update({
      embeds: [embed],
      components: [buttonRow],
      ephemeral: true
    });
  }
}; 