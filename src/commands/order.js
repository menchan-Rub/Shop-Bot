const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const logger = require('../utils/logger');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('order')
    .setDescription('注文を管理します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('注文一覧を表示します')
        .addNumberOption(option => 
          option.setName('limit')
            .setDescription('表示する注文数（デフォルト: 10）')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(25))
        .addStringOption(option =>
          option.setName('status')
            .setDescription('表示する注文のステータス')
            .setRequired(false)
            .addChoices(
              { name: '未処理', value: 'pending' },
              { name: '処理中', value: 'processing' },
              { name: '完了', value: 'completed' },
              { name: 'キャンセル', value: 'cancelled' },
              { name: 'すべて', value: 'all' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('注文の詳細情報を表示します')
        .addStringOption(option => 
          option.setName('order_id')
            .setDescription('注文ID')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('注文のステータスを更新します')
        .addStringOption(option => 
          option.setName('order_id')
            .setDescription('注文ID')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option =>
          option.setName('status')
            .setDescription('新しいステータス')
            .setRequired(true)
            .addChoices(
              { name: '未処理', value: 'pending' },
              { name: '処理中', value: 'processing' },
              { name: '完了', value: 'completed' },
              { name: 'キャンセル', value: 'cancelled' }
            ))),
  
  async autocomplete(interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      
      if (focusedOption.name === 'order_id') {
        // 最近の注文一覧を取得
        const orders = await Order.find()
          .sort('-createdAt')
          .limit(25)
          .populate('userId', 'username');
        
        // 入力値に基づいてフィルタリング
        const filtered = orders.filter(order => 
          order._id.toString().includes(focusedOption.value) || 
          (order.userId?.username && order.userId.username.toLowerCase().includes(focusedOption.value.toLowerCase())));
        
        // 最大25件まで
        await interaction.respond(
          filtered.slice(0, 25).map(order => ({
            name: `#${order._id.toString().substring(0, 8)} - ${order.userId?.username || '不明なユーザー'} (${order.totalPrice.toLocaleString()}円)`,
            value: order._id.toString()
          }))
        );
      }
    } catch (error) {
      logger.error(`オートコンプリートエラー: ${error}`);
    }
  },
  
  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      const subcommand = interaction.options.getSubcommand();
      
      if (subcommand === 'list') {
        return await this.handleListCommand(interaction);
      } else if (subcommand === 'info') {
        return await this.handleInfoCommand(interaction);
      } else if (subcommand === 'update') {
        return await this.handleUpdateCommand(interaction);
      }
    } catch (error) {
      logger.error(`注文管理コマンドエラー: ${error}`);
      await interaction.editReply({
        content: `エラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  },
  
  // 注文一覧表示
  async handleListCommand(interaction) {
    const limit = interaction.options.getNumber('limit') || 10;
    const statusFilter = interaction.options.getString('status') || 'all';
    
    const query = statusFilter !== 'all' ? { status: statusFilter } : {};
    
    const orders = await Order.find(query)
      .sort('-createdAt')
      .limit(limit)
      .populate('userId', 'username discordId')
      .populate('items.productId', 'name price');
    
    if (orders.length === 0) {
      return await interaction.editReply('該当する注文はありません。');
    }
    
    const embed = new EmbedBuilder()
      .setTitle('注文一覧')
      .setDescription(`最近の${orders.length}件の注文です。`)
      .setColor('#0099ff')
      .setTimestamp();
    
    let orderList = '';
    
    for (const order of orders) {
      const statusEmoji = this.getStatusEmoji(order.status);
      const orderDate = new Date(order.createdAt).toLocaleString('ja-JP');
      const orderIdShort = order._id.toString().substring(0, 8);
      
      orderList += `${statusEmoji} **#${orderIdShort}** - ${order.userId?.username || '不明なユーザー'}\n`;
      orderList += `　📅 ${orderDate} | 💰 ${order.totalPrice.toLocaleString()}円\n`;
      orderList += `　📦 ${order.items.length}個の商品\n\n`;
    }
    
    embed.setDescription(orderList);
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('ダッシュボードで管理')
          .setURL(`${process.env.DASHBOARD_URL}/orders`)
          .setStyle(ButtonStyle.Link)
          .setEmoji('🌐')
      );
    
    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  },
  
  // 注文詳細表示
  async handleInfoCommand(interaction) {
    const orderId = interaction.options.getString('order_id');
    
    const order = await Order.findById(orderId)
      .populate('userId', 'username discordId avatar')
      .populate('items.productId', 'name price emoji');
    
    if (!order) {
      return await interaction.editReply('注文が見つかりません。');
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`注文詳細 #${order._id.toString().substring(0, 8)}`)
      .setColor('#0099ff')
      .setTimestamp(new Date(order.createdAt));
    
    // ユーザー情報
    let userInfo = '不明なユーザー';
    if (order.userId) {
      userInfo = `${order.userId.username}`;
      if (order.userId.discordId) {
        userInfo += ` (<@${order.userId.discordId}>)`;
      }
      if (order.userId.avatar) {
        embed.setThumbnail(order.userId.avatar);
      }
    }
    
    embed.addFields(
      { name: 'ユーザー', value: userInfo, inline: true },
      { name: 'ステータス', value: `${this.getStatusEmoji(order.status)} ${this.getStatusText(order.status)}`, inline: true },
      { name: '注文日時', value: new Date(order.createdAt).toLocaleString('ja-JP'), inline: true }
    );
    
    // 注文アイテム
    let itemsList = '';
    for (const item of order.items) {
      const product = item.productId;
      if (product) {
        itemsList += `${product.emoji || '📦'} **${product.name}** x ${item.quantity}\n`;
        itemsList += `　💰 ${(product.price * item.quantity).toLocaleString()}円 (${product.price.toLocaleString()}円 x ${item.quantity})\n\n`;
      } else {
        itemsList += `📦 **不明な商品** x ${item.quantity}\n\n`;
      }
    }
    
    embed.addFields(
      { name: '注文内容', value: itemsList || '商品情報なし' },
      { name: '合計金額', value: `💰 ${order.totalPrice.toLocaleString()}円`, inline: true },
      { name: '注文ID', value: order._id.toString(), inline: true }
    );
    
    if (order.notes) {
      embed.addFields({ name: '備考', value: order.notes });
    }
    
    // ステータス変更用のセレクトメニュー
    const statusMenu = new StringSelectMenuBuilder()
      .setCustomId(`order_status_${order._id}`)
      .setPlaceholder('注文ステータスを変更')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('未処理')
          .setValue('pending')
          .setDescription('注文は確認待ち')
          .setEmoji('⏳'),
        new StringSelectMenuOptionBuilder()
          .setLabel('処理中')
          .setValue('processing')
          .setDescription('注文を処理中')
          .setEmoji('⚙️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('完了')
          .setValue('completed')
          .setDescription('注文処理完了')
          .setEmoji('✅'),
        new StringSelectMenuOptionBuilder()
          .setLabel('キャンセル')
          .setValue('cancelled')
          .setDescription('注文をキャンセル')
          .setEmoji('❌')
      ]);
    
    const row = new ActionRowBuilder().addComponents(statusMenu);
    
    const dashboardRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('ダッシュボードで管理')
          .setURL(`${process.env.DASHBOARD_URL}/orders/${order._id}`)
          .setStyle(ButtonStyle.Link)
          .setEmoji('🌐')
      );
    
    await interaction.editReply({
      embeds: [embed],
      components: [row, dashboardRow]
    });
  },
  
  // 注文ステータス更新
  async handleUpdateCommand(interaction) {
    const orderId = interaction.options.getString('order_id');
    const newStatus = interaction.options.getString('status');
    
    const order = await Order.findById(orderId).populate('userId', 'username discordId');
    
    if (!order) {
      return await interaction.editReply('注文が見つかりません。');
    }
    
    const oldStatus = order.status;
    order.status = newStatus;
    
    if (newStatus === 'completed' && order.status !== 'completed') {
      order.completedAt = new Date();
    }
    
    await order.save();
    
    logger.info(`注文ステータス更新: #${order._id.toString().substring(0, 8)} ${oldStatus} -> ${newStatus}`);
    
    const embed = new EmbedBuilder()
      .setTitle('注文ステータスを更新しました')
      .setDescription(`注文 #${order._id.toString().substring(0, 8)} のステータスを更新しました。`)
      .addFields(
        { name: '以前のステータス', value: `${this.getStatusEmoji(oldStatus)} ${this.getStatusText(oldStatus)}`, inline: true },
        { name: '新しいステータス', value: `${this.getStatusEmoji(newStatus)} ${this.getStatusText(newStatus)}`, inline: true },
        { name: 'ユーザー', value: order.userId ? `${order.userId.username}` : '不明なユーザー', inline: true }
      )
      .setColor('#00FF00')
      .setTimestamp();
    
    // DMでユーザーに通知
    if (order.userId?.discordId) {
      try {
        const user = await interaction.client.users.fetch(order.userId.discordId);
        if (user) {
          const userEmbed = new EmbedBuilder()
            .setTitle('注文ステータスが更新されました')
            .setDescription(`あなたの注文 #${order._id.toString().substring(0, 8)} のステータスが更新されました。`)
            .addFields(
              { name: '新しいステータス', value: `${this.getStatusEmoji(newStatus)} ${this.getStatusText(newStatus)}` },
              { name: '更新日時', value: new Date().toLocaleString('ja-JP') }
            )
            .setColor('#0099ff')
            .setTimestamp();
          
          await user.send({ embeds: [userEmbed] });
        }
      } catch (error) {
        logger.warn(`ユーザーへのDM送信エラー: ${error.message}`);
      }
    }
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('注文の詳細を見る')
          .setCustomId(`view_order_${order._id}`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔍'),
        new ButtonBuilder()
          .setLabel('ダッシュボードで管理')
          .setURL(`${process.env.DASHBOARD_URL}/orders/${order._id}`)
          .setStyle(ButtonStyle.Link)
          .setEmoji('🌐')
      );
    
    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  },
  
  // ヘルパー関数: ステータスに対応する絵文字を取得
  getStatusEmoji(status) {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '❓';
    }
  },
  
  // ヘルパー関数: ステータスのテキストを取得
  getStatusText(status) {
    switch (status) {
      case 'pending':
        return '未処理';
      case 'processing':
        return '処理中';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      default:
        return '不明';
    }
  }
}; 