import { Hero3D } from './components/Hero3D';
import { DeployWizard } from './components/DeployWizard';
import { Code, ArrowDown, Database, Key, CheckCircle } from 'lucide-react';

function App() {
  const scrollToWizard = () => {
    document.getElementById('deploy-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Navigation */}
      <nav className="container nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-glass)' }}>
        <h1 className="signature-logo" style={{ margin: 0 }}>Email_To_Telebot</h1>
        <a href="https://github.com/Rahul-pamula/Email_to_telebot" target="_blank" rel="noreferrer" className="btn btn-secondary nav-btn" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <Code size={16} /> <span className="nav-text">View Source</span>
        </a>
      </nav>

      {/* Hero Section */}
      <section className="container hero-section">
        <div className="hero-grid">
          <div className="hero-text">
            <div style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--primary-glow)', color: 'var(--primary-supa)', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '16px' }}>
              Open Source & Self-Hosted
            </div>
            <h1 style={{ fontSize: '4.5rem', marginBottom: '24px', color: 'var(--text-main)' }}>
              Your AI Assistant.<br/>
              <span className="text-gradient">100% Private.</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '500px', marginBottom: '40px' }}>
              Stop drowning in emails. Get Groq AI-powered summaries delivered instantly to your Telegram via your personal cloud.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={scrollToWizard} className="btn btn-primary" style={{ padding: '16px 32px' }}>
                Deploy Now <ArrowDown size={20} />
              </button>
            </div>
          </div>
          <div className="hero-canvas" style={{ background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%)', borderRadius: '50%' }}>
            <Hero3D />
          </div>
        </div>
      </section>

      {/* Features Section (Bento Grid) */}
      <section className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '16px' }}>Zero-Trust Architecture</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 80px' }}>
          You own the data. You own the code. We just provide the engine.
        </p>

        <div className="bento-grid">
          {/* Feature 1 */}
          <div className="bento-box">
            <img src={`${import.meta.env.BASE_URL}ai_summarization.png`} alt="AI Summarization" className="bento-feature-img" />
            <div className="bento-content">
              <h3>Groq Llama-3 AI</h3>
              <p>Every incoming email is parsed by Llama-3 at lightning speed. It intelligently filters spam and generates concise summaries.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bento-box">
            <img src={`${import.meta.env.BASE_URL}telegram_delivery.png`} alt="Telegram Delivery" className="bento-feature-img" />
            <div className="bento-content">
              <h3 style={{color: 'var(--primary-tele)'}}>Instant Delivery</h3>
              <p>Summaries are pushed immediately to your private Telegram Bot. Mute senders or interact directly from the chat.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bento-box">
            <img src={`${import.meta.env.BASE_URL}zero_trust.png`} alt="Zero Trust Architecture" className="bento-feature-img" />
            <div className="bento-content">
              <h3 style={{color: 'var(--primary-supa)'}}>Bring Your Own Cloud</h3>
              <p>The code runs entirely inside your personal Supabase project. We have absolutely zero access to your emails or API keys.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Documentation Section */}
      <section style={{ padding: '120px 24px', background: '#ffffff', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>What is "Bring Your Own Cloud"?</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto 60px', lineHeight: 1.8, textAlign: 'left' }}>
            <p style={{ marginBottom: '16px' }}>
              Normally, self-hosting requires cloning GitHub repositories, managing servers, and running complex terminal commands. We use a modern concept called <strong>Bring Your Own Cloud (BYOC)</strong>. We provide the user interface, but you provide the empty server.
            </p>
            <p>
              When you enter your credentials below, our website acts like an <strong>invisible robot</strong>. It uses the official Supabase Management API to remotely create your database tables, upload your encrypted keys, and push the backend AI code directly to your servers. Once deployed, the code runs 100% privately on your infrastructure.
            </p>
          </div>
          
          <div className="doc-grid">
            <div className="bento-box" style={{ padding: '32px' }}>
              <div style={{ background: 'var(--bg-base)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <Database size={24} color="var(--primary-supa)" />
              </div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: 8 }}>1. Gather Your Keys</h4>
              <p style={{ color: 'var(--text-muted)' }}>You will need a free <b>Supabase</b> project, a <b>Groq</b> API key for the AI, and a <b>Telegram</b> Bot token from @BotFather.</p>
            </div>
            
            <div className="bento-box" style={{ padding: '32px' }}>
              <div style={{ background: 'var(--bg-base)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <Key size={24} color="var(--text-main)" />
              </div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: 8 }}>2. Paste Credentials</h4>
              <p style={{ color: 'var(--text-muted)' }}>Provide your Supabase Management Token and API keys in the deployment wizard below. Your keys never touch our servers.</p>
            </div>
            
            <div className="bento-box" style={{ padding: '32px', background: 'var(--text-main)', color: 'white' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <CheckCircle size={24} color="#10b981" />
              </div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: 8, color: 'white' }}>3. Auto-Deploy</h4>
              <p style={{ color: '#94a3b8' }}>The browser pushes the SQL tables, Edge Functions, and encrypted secrets directly to your personal cloud. Done in 60s.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Wizard Section */}
      <section id="deploy-section" style={{ padding: '120px 24px', background: 'linear-gradient(180deg, transparent, #e2e8f0)' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '16px' }}>Deploy Your Bot</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Ready? Provide your API keys below to begin the automated setup.
          </p>
        </div>
        <DeployWizard />
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: '#ffffff' }}>
        <p>100% Open Source. Built for Privacy.</p>
      </footer>
    </div>
  );
}

export default App;
