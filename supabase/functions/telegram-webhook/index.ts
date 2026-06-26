import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

serve(async (req) => {
  try {
    const body = await req.json();
    
    // Nếu tin nhắn không chứa text, bỏ qua
    if (!body.message || !body.message.text) {
      return new Response('OK', { status: 200 });
    }

    const chatId = body.message.chat.id;
    const text = body.message.text.trim();

    // Xác thực bảo mật: Chỉ cho phép xử lý lệnh từ đúng Group Chat của team
    const ALLOWED_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    if (ALLOWED_CHAT_ID && chatId.toString() !== ALLOWED_CHAT_ID) {
      console.log(`Bỏ qua tin nhắn từ Chat ID lạ: ${chatId}`);
      return new Response('OK', { status: 200 });
    }

    // Xử lý lệnh /fix_bug
    if (text.startsWith('/fix_bug')) {
      const parts = text.split(' ');
      if (parts.length < 2) {
        await sendMessage(chatId, "⚠️ Vui lòng cung cấp ID. Cú pháp: `/fix_bug <bug_id>`");
        return new Response('OK');
      }

      const bugId = parts[1];

      // Update Database
      const { data, error } = await supabase
        .from('automa_bugs')
        .update({ status: 'in_progress' })
        .eq('id', bugId)
        .select()
        .single();

      if (error || !data) {
        await sendMessage(chatId, `❌ Lỗi: Không tìm thấy bug với ID \`${bugId}\` hoặc ID không hợp lệ.`);
      } else {
        await sendMessage(chatId, `✅ Đã ghi nhận lệnh fix bug!\nTrạng thái lỗi **${data.title}** đã chuyển sang \`in_progress\`.\nĐang khởi động Agent AI để xử lý...`);
        
        // Tương lai: Gọi một Webhook HTTP Request tới n8n / CI-CD pipeline để đánh thức AI Agent nhảy vào fix code.
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Internal Error', { status: 500 });
  }
})

// Hàm gửi tin nhắn phản hồi về Telegram
async function sendMessage(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}
