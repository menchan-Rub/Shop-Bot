const logger = require('../../utils/logger');
const Order = require('../../models/Order');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  customId: 'view_order_',
  
  async execute(interaction) {
    try {
      // カスタムIDから注文IDを抽出
      const orderId = interaction.customId.split('_')[2];
      
      if (!orderId) {
        return await interaction.reply({
          content: '無効なリクエストです。',
          ephemeral: true
        });
      }
      
      // 注文情報を取得
      const order = await Order.findById(orderId)
        .populate('userId', 'username discordId avatar')
        .populate('items.productId', 'name price emoji');
      
      if (!order) {
        return await interaction.reply({
          content: '注文が見つかりません。',
          ephemeral: true
        });
      }
      
      // 権限チェック：管理者か本人のみ閲覧可能
      const isAdmin = interaction.memberPermissions?.has('Administrator');
      const isOwner = order.userId?.discordId === interaction.user.id;
      
      if (!isAdmin && !isOwner) {
        return await interaction.reply({
          content: 'この注文の詳細を表示する権限がありません。',
          ephemeral: true
        });
      }
      
      // ステータスに対応する絵文字
      const statusEmoji = {
        pending: '⏳',
        processing: '⚙️',
        completed: '✅',
        cancelled: '❌'
      };
      
      // ステータステキスト
      const statusText = {
        pending: '未処理',
        processing: '処理中',
        completed: '完了',
        cancelled: 'キャンセル'
      };
      
      // 注文詳細の埋め込みを作成
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
        { name: 'ステータス', value: `${statusEmoji[order.status] || '❓'} ${statusText[order.status] || '不明'}`, inline: true },
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
      
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('ダッシュボードで確認')
            .setURL(`${process.env.DASHBOARD_URL}/orders/${order._id}`)
            .setStyle(ButtonStyle.Link)
            .setEmoji('🌐')
        );
      
      // 管理者の場合、ステータス更新ボタンを追加
      if (isAdmin) {
        const statusRow = new ActionRowBuilder();
        
        if (order.status !== 'processing') {
          statusRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`update_order_status_${order._id}_processing`)
              .setLabel('処理中にする')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('⚙️')
          );
        }
        
        if (order.status !== 'completed') {
          statusRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`update_order_status_${order._id}_completed`)
              .setLabel('完了にする')
              .setStyle(ButtonStyle.Success)
              .setEmoji('✅')
          );
        }
        
        if (order.status !== 'cancelled') {
          statusRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`update_order_status_${order._id}_cancelled`)
              .setLabel('キャンセルする')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('❌')
          );
        }
        
        await interaction.reply({
          embeds: [embed],
          components: [statusRow, buttonRow],
          ephemeral: true
        });
      } else {
        // 一般ユーザーには基本情報のみ
        await interaction.reply({
          embeds: [embed],
          components: [buttonRow],
          ephemeral: true
        });
      }
      
    } catch (error) {
      logger.error(`注文詳細表示エラー: ${error}`);
      await interaction.reply({
        content: `エラーが発生しました: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 