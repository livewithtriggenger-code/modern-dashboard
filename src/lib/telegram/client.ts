export class TelegramClient {
  constructor(private token: string) {}

  async setWebhook(url: string, secretToken?: string) {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret_token: secretToken }),
    });
    return res.json();
  }

  async sendMessage(chatId: string, text: string) {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.json();
  }
}
