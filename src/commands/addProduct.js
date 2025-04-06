const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const logger = require('../utils/logger');
const Product = require('../models/Product');
const Category = require('../models/Category');
const channelManager = require('../utils/channelManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add_product')
    .setDescription('新しい商品を追加します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
      option.setName('name')
        .setDescription('商品名')
        .setRequired(true))
    .addNumberOption(option => 
      option.setName('price')
        .setDescription('商品価格')
        .setRequired(true)
        .setMinValue(0))
    .addStringOption(option => 
      option.setName('description')
        .setDescription('商品の説明')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('category')
        .setDescription('商品のカテゴリーID')
        .setRequired(true)
        .setAutocomplete(true))
    .addNumberOption(option => 
      option.setName('stock')
        .setDescription('在庫数')
        .setRequired(true)
        .setMinValue(0))
    .addStringOption(option => 
      option.setName('emoji')
        .setDescription('商品に使用する絵文字')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('image')
        .setDescription('商品画像のURL')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('status')
        .setDescription('商品のステータス')
        .setRequired(false)
        .addChoices(
          { name: '販売中', value: 'available' },
          { name: '非表示', value: 'hidden' },
          { name: '在庫切れ', value: 'out_of_stock' },
          { name: '予約受付中', value: 'pre_order' }
        )),
  
  async autocomplete(interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      
      if (focusedOption.name === 'category') {
        // カテゴリー一覧を取得
        const categories = await Category.find().sort('name');
        
        // 入力値に基づいてフィルタリング
        const filtered = categories.filter(category => 
          category.name.toLowerCase().includes(focusedOption.value.toLowerCase()));
        
        // 最大25件まで
        await interaction.respond(
          filtered.slice(0, 25).map(category => ({
            name: `${category.emoji} ${category.name}`,
            value: category._id.toString()
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
      
      // コマンドオプションから値を取得
      const name = interaction.options.getString('name');
      const price = interaction.options.getNumber('price');
      const description = interaction.options.getString('description');
      const categoryId = interaction.options.getString('category');
      const stock = interaction.options.getNumber('stock');
      const emoji = interaction.options.getString('emoji') || '📦';
      const imageUrl = interaction.options.getString('image');
      const status = interaction.options.getString('status') || 'available';
      
      // カテゴリーの存在確認
      const category = await Category.findById(categoryId);
      if (!category) {
        return await interaction.editReply('指定されたカテゴリーが見つかりません。');
      }
      
      // 商品オブジェクトの作成
      const product = new Product({
        name,
        price,
        description,
        category: categoryId,
        stock,
        emoji,
        status,
        images: imageUrl ? [imageUrl] : []
      });
      
      // 商品の保存
      await product.save();
      logger.info(`新商品を追加しました: ${name} (ID: ${product._id})`);
      
      // Discordチャンネルとメッセージの設定
      await channelManager.setupProductChannel(interaction.guild, product);
      
      // 確認メッセージの送信
      const embed = new EmbedBuilder()
        .setTitle('商品が追加されました')
        .setDescription(`${emoji} **${name}** が正常に追加されました。`)
        .addFields(
          { name: '価格', value: `¥${price.toLocaleString()}`, inline: true },
          { name: '在庫', value: `${stock} 個`, inline: true },
          { name: 'カテゴリー', value: `${category.emoji} ${category.name}`, inline: true },
          { name: 'ステータス', value: product.getStatusText(), inline: true },
          { name: '商品ID', value: product._id.toString(), inline: true }
        )
        .setColor('#00FF00')
        .setTimestamp();
        
      if (imageUrl) {
        embed.setImage(imageUrl);
      }
      
      // ダッシュボードへのリンクボタン
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('商品を編集')
            .setCustomId(`edit_product_${product._id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✏️'),
          new ButtonBuilder()
            .setLabel('商品チャンネルを見る')
            .setCustomId(`view_channel_${product.channelId}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔍'),
          new ButtonBuilder()
            .setLabel('ダッシュボードで管理')
            .setURL(`${process.env.DASHBOARD_URL}/products/${product._id}`)
            .setStyle(ButtonStyle.Link)
            .setEmoji('🌐')
        );
      
      await interaction.editReply({ 
        content: '商品の追加が完了しました！',
        embeds: [embed],
        components: [row]
      });
    } catch (error) {
      logger.error(`商品追加エラー: ${error}`);
      await interaction.editReply({
        content: `商品の追加中にエラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 