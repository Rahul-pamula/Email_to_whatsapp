<div align="center">
  <h1>✉️ Email_To_Telebot</h1>
  <p><b>Your Personal AI Email Assistant. 100% Private.</b></p>
  <p>Built with <strong>Supabase</strong>, <strong>Groq Llama-3</strong>, and <strong>React Three Fiber</strong>.</p>
</div>

<br/>

## 🚀 Overview
**Email_To_Telebot** is a completely private, self-hosted AI agent that reads your emails, summarizes the important ones using ultra-fast Llama-3 AI, and delivers them instantly to your Telegram app.

Unlike other SaaS products, this operates on a **Zero-Trust Architecture**. We do not host your backend, we cannot read your emails, and we do not store your API keys. The entire backend lives on your personal **Supabase** cloud instance.

---

## ✨ Features
- 🧠 **AI Summarization:** Uses Groq's Llama-3 to rapidly summarize long email threads into concise, readable paragraphs.
- 📱 **Interactive Telegram Bot:** Get instant push notifications for important emails. Interact with the bot to mute senders, block spam, or edit preferences directly from the chat.
- 🔒 **Zero-Trust BYOC (Bring Your Own Cloud):** The code runs 100% in your Supabase project. Secrets are encrypted in Supabase Vault.
- 🎨 **Beautiful Web Deployment Wizard:** A client-side, browser-only React app featuring 3D Three.js graphics that automates the deployment of the backend to your Supabase via the Management API.

---

## 🛠️ How to Deploy (In 60 Seconds)

You do not need to use the terminal to deploy this bot! We have built a fully automated static Deployment Wizard.

1. Go to the live deployment portal: [**https://rahul-pamula.github.io/Email_to_telebot/**](https://rahul-pamula.github.io/Email_to_telebot/)
2. Follow the 3-step wizard.
3. Provide your **Supabase Management Token**, **Groq API Key**, and **Telegram Bot Token**.
4. The wizard will automatically provision your database tables, upload your secrets to Vault, and deploy the Deno Edge Functions directly to your cloud.

---

## 💻 Tech Stack
### Backend (Runs in your Supabase)
* **Deno Edge Functions:** Serverless functions that handle incoming Telegram webhooks.
* **pg_cron:** Postgres extension used to poll your inbox every 5 minutes in the background.
* **pg_net:** Postgres extension used to trigger the edge functions asynchronously.
* **Supabase Vault:** Securely stores your IMAP passwords and API keys using pgsodium encryption.

### Frontend (Static BYOC Portal)
* **Vite & React TS:** Blazing fast static site generation.
* **Three.js & React Three Fiber:** Interactive 3D graphics (the floating envelope).
* **Framer Motion:** Smooth glassmorphic UI transitions.
* **GitHub Pages:** CI/CD via GitHub Actions for 100% free static hosting.

---

## 🖥️ Local Development

If you want to contribute to the beautiful 3D landing page:

```bash
# Clone the repository
git clone https://github.com/Rahul-pamula/Email_to_telebot.git

# Go to the web folder
cd Email_to_telebot/web

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Visit `http://localhost:5173` to view the 3D BYOC Wizard in your browser.

---

## 🛡️ Privacy & Security
This project is fully open source. The deployment web-app communicates strictly with the official `api.supabase.com` endpoints. Open your browser's Network tab to verify that no data is ever sent to a third-party analytics or tracking server.
