const clearMessages = (ctx) => {
  if (ctx.session.messages_for_delete?.length) {
    ctx.session.messages_for_delete.forEach(async (message_id) => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, message_id);
      } catch (error) {
        // console.error();
      }
    });
    ctx.session.messages_for_delete = [];
  }
};

module.exports = { clearMessages };
