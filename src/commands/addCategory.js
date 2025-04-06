const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle
} = require('discord.js');
const logger = require('../utils/logger');
const Category = require('../models/Category');
const channelManager = require('../utils/channelManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add_category')
    .setDescription('新しいカテゴリーを追加します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
      option.setName('name')
        .setDescription('カテゴリー名')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('emoji')
        .setDescription('カテゴリーに使用する絵文字')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('description')
        .setDescription('カテゴリーの説明')
        .setRequired(false))
    .addIntegerOption(option => 
      option.setName('order')
        .setDescription('表示順序（小さいほど上に表示）')
        .setRequired(false)),
  
  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      // コマンドオプションから値を取得
      const name = interaction.options.getString('name');
      const emoji = interaction.options.getString('emoji') || '📦';
      const description = interaction.options.getString('description') || '';
      const displayOrder = interaction.options.getInteger('order') || 0;
      
      // 同じ名前のカテゴリーがないか確認
      const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existingCategory) {
        return await interaction.editReply(`同名のカテゴリー「${name}」は既に存在します。`);
      }
      
      // カテゴリーオブジェクトの作成
      const category = new Category({
        name,
        emoji,
        description,
        displayOrder,
        isVisible: true
      });
      
      // カテゴリーの保存
      await category.save();
      logger.info(`新カテゴリーを追加しました: ${name} (ID: ${category._id})`);
      
      // Discordカテゴリーチャンネルの作成
      const categoryChannel = await channelManager.createOrGetCategoryChannel(interaction.guild, category);
      
      // カテゴリー概要の設定
      await channelManager.setupCategoryOverview(interaction.guild, categoryChannel, category);
      
      // 確認メッセージの送信
      const embed = new EmbedBuilder()
        .setTitle('カテゴリーが追加されました')
        .setDescription(`${emoji} **${name}** カテゴリーが正常に追加されました。`)
        .addFields(
          { name: '説明', value: description || '（説明はありません）', inline: false },
          { name: '表示順序', value: displayOrder.toString(), inline: true },
          { name: 'カテゴリーID', value: category._id.toString(), inline: true },
          { name: 'チャンネルID', value: categoryChannel.id, inline: true }
        )
        .setColor('#00FF00')
        .setTimestamp();
      
      // ダッシュボードへのリンクボタン
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('カテゴリーを編集')
            .setCustomId(`edit_category_${category._id}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✏️'),
          new ButtonBuilder()
            .setLabel('商品を追加')
            .setCustomId(`add_product_to_${category._id}`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('➕'),
          new ButtonBuilder()
            .setLabel('ダッシュボードで管理')
            .setURL(`${process.env.DASHBOARD_URL}/categories/${category._id}`)
            .setStyle(ButtonStyle.Link)
            .setEmoji('🌐')
        );
      
      await interaction.editReply({ 
        content: 'カテゴリーの追加が完了しました！',
        embeds: [embed],
        components: [row]
      });
    } catch (error) {
      logger.error(`カテゴリー追加エラー: ${error}`);
      await interaction.editReply({
        content: `カテゴリーの追加中にエラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 