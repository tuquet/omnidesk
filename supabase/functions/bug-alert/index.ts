import "@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    // Kiểm tra xem có phải là sự kiện INSERT từ bảng e2e_logs không
    if (payload.type === 'INSERT' && payload.table === 'e2e_logs') {
      const record = payload.record;
      
      // Chỉ gửi thông báo nếu status là error hoặc fail
      if (record.status !== 'error' && record.status !== 'fail') {
        return new Response('Not an error, skipping', { status: 200 });
      }

      // Lấy cấu hình Bot từ biến môi trường
      const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
      const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

      if (!botToken || !chatId) {
        console.warn('⚠️ Telegram config missing (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID). Alert would be:', record);
        return new Response('Telegram config missing, logged to console instead.', { status: 200 });
      }

      // Format tin nhắn cảnh báo
      const message = `🚨 *E2E Bug Alert*\n\n*Workflow:* ${record.workflow_name}\n*Status:* ${record.status}\n*Error:* ${record.error_message || 'Unknown error'}\n*Time:* ${new Date(record.created_at).toLocaleString()}`;

      // Gọi API Telegram
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        console.error('Failed to send Telegram message:', await response.text());
        return new Response('Failed to send Telegram message', { status: 500 });
      }

      return new Response('Alert sent successfully', { status: 200 });
    }

    return new Response('Ignored', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(String(error), { status: 500 });
  }
});
