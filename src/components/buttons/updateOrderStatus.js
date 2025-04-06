const logger = require('../../utils/logger');
const Order = require('../../models/Order');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  customId: 'update_order_status_',
  
  async execute(interaction) {
    try {
      // 管理者権限チェック
      if (!interaction.memberPermissions?.has('Administrator')) {
        return await interaction.reply({
          content: 'この操作を実行する権限がありません。',
          ephemeral: true
        });
      }
      
      // カスタムIDから注文IDとステータスを抽出
      const idParts = interaction.customId.split('_');
      const orderId = idParts[3];
      const newStatus = idParts[4];
      
      if (!orderId || !newStatus) {
        return await interaction.reply({
          content: '無効なリクエストです。',
          ephemeral: true
        });
      }
      
      // 注文情報を取得
      const order = await Order.findById(orderId).populate('userId', 'username discordId');
      
      if (!order) {
        return await interaction.reply({
          content: '注文が見つかりません。',
          ephemeral: true
        });
      }
      
      // ステータスに対応する絵文字とテキスト
      const statusEmoji = {
        pending: '⏳',
        processing: '⚙️',
        completed: '✅',
        cancelled: '❌'
      };
      
      const statusText = {
        pending: '未処理',
        processing: '処理中',
        completed: '完了',
        cancelled: 'キャンセル'
      };
      
      // 現在のステータスを保存
      const oldStatus = order.status;
      
      // ステータスが既に同じ場合
      if (oldStatus === newStatus) {
        return await interaction.reply({
          content: `注文は既に「${statusText[newStatus]}」の状態です。`,
          ephemeral: true
        });
      }
      
      // ステータスを更新
      order.status = newStatus;
      
      // 完了の場合は完了日時を設定
      if (newStatus === 'completed' && !order.completedAt) {
        order.completedAt = new Date();
      }
      
      await order.save();
      
      logger.info(`注文ステータス更新: #${order._id.toString().substring(0, 8)} ${oldStatus} -> ${newStatus} by ${interaction.user.tag}`);
      
      // 更新成功の埋め込みを作成
      const embed = new EmbedBuilder()
        .setTitle('注文ステータスを更新しました')
        .setDescription(`注文 #${order._id.toString().substring(0, 8)} のステータスを更新しました。`)
        .addFields(
          { name: '以前のステータス', value: `${statusEmoji[oldStatus] || '❓'} ${statusText[oldStatus] || '不明'}`, inline: true },
          { name: '新しいステータス', value: `${statusEmoji[newStatus] || '❓'} ${statusText[newStatus] || '不明'}`, inline: true },
          { name: 'ユーザー', value: order.userId ? `${order.userId.username}` : '不明なユーザー', inline: true }
        )
        .setColor('#00FF00')
        .setTimestamp();
      
      // 注文詳細ボタン
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`view_order_${order._id}`)
            .setLabel('注文詳細を表示')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔍'),
          new ButtonBuilder()
            .setLabel('ダッシュボードで管理')
            .setURL(`${process.env.DASHBOARD_URL}/orders/${order._id}`)
            .setStyle(ButtonStyle.Link)
            .setEmoji('🌐')
        );
      
      // DMでユーザーに通知（Discordユーザーが存在する場合）
      if (order.userId?.discordId) {
        try {
          const user = await interaction.client.users.fetch(order.userId.discordId);
          if (user) {
            const userEmbed = new EmbedBuilder()
              .setTitle('注文ステータスが更新されました')
              .setDescription(`あなたの注文 #${order._id.toString().substring(0, 8)} のステータスが更新されました。`)
              .addFields(
                { name: '新しいステータス', value: `${statusEmoji[newStatus] || '❓'} ${statusText[newStatus] || '不明'}` },
                { name: '更新日時', value: new Date().toLocaleString('ja-JP') }
              )
              .setColor('#0099ff')
              .setTimestamp();
            
            const userButtonRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId(`view_order_${order._id}`)
                  .setLabel('注文詳細を表示')
                  .setStyle(ButtonStyle.Primary)
                  .setEmoji('🔍'),
                new ButtonBuilder()
                  .setLabel('ダッシュボードで確認')
                  .setURL(`${process.env.DASHBOARD_URL}/orders/${order._id}`)
                  .setStyle(ButtonStyle.Link)
                  .setEmoji('🌐')
              );
            
            await user.send({
              embeds: [userEmbed],
              components: [userButtonRow]
            });
          }
        } catch (error) {
          logger.warn(`ユーザーへのDM送信エラー: ${error.message}`);
        }
      }
      
      await interaction.reply({
        embeds: [embed],
        components: [buttonRow],
        ephemeral: true
      });
      
    } catch (error) {
      logger.error(`注文ステータス更新エラー: ${error}`);
      await interaction.reply({
        content: `エラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 