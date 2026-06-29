import { Hero3D } from './components/Hero3D';
import { DeployWizard } from './components/DeployWizard';
import { Code, ArrowDown } from 'lucide-react';

function App() {
  const scrollToWizard = () => {
    document.getElementById('deploy-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Navigation */}
      <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-glass)' }}>
        <h1 className="text-gradient signature-logo" style={{ margin: 0 }}>Email_To_Telebot</h1>
        <a href="https://github.com/Rahul-pamula/Email_to_telebot" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <Code size={16} /> View Source
        </a>
      </nav>

      {/* Hero Section */}
      <section className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 style={{ fontSize: '4rem', marginBottom: '24px' }}>
              Your Personal AI Assistant.<br/>
              <span className="text-gradient">100% Private.</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '500px', marginBottom: '40px' }}>
              Stop drowning in emails. Get AI-powered summaries of your most important messages delivered instantly to your Telegram.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={scrollToWizard} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                Deploy Now <ArrowDown size={20} />
              </button>
            </div>
          </div>
          <div style={{ height: '600px' }}>
            <Hero3D />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '16px' }}>How It Works</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 80px' }}>
          Built with cutting-edge AI and a Zero-Trust architecture so your data never leaves your control.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
          {/* Feature 1 */}
          <div className="glass-panel feature-card">
            <img src="/ai_summarization.png" alt="AI Summarization" className="feature-img" />
            <div className="feature-content">
              <h3>Groq Llama-3 AI</h3>
              <p>Every incoming email is parsed and classified by Llama-3 at lightning speed. It intelligently filters out spam and generates a concise summary of only what matters.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel feature-card">
            <img src="/telegram_delivery.png" alt="Telegram Delivery" className="feature-img" />
            <div className="feature-content">
              <h3>Instant Delivery</h3>
              <p>Summaries are pushed immediately to your private Telegram Bot. You can snooze senders, block spam, or mark VIPs interactively right from the chat interface.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel feature-card">
            <img src="/zero_trust.png" alt="Zero Trust Architecture" className="feature-img" />
            <div className="feature-content">
              <h3>Zero-Trust Security</h3>
              <p>Bring Your Own Cloud (BYOC). This code runs entirely inside your personal Supabase project. We have absolutely zero access to your emails or API keys.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Wizard Section */}
      <section id="deploy-section" style={{ padding: '120px 24px', background: 'linear-gradient(180deg, transparent, rgba(62, 207, 142, 0.05))' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '16px' }}>Deploy Your Bot</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Provide your API keys below. This browser will connect directly to the Supabase Management API to provision your backend automatically.
          </p>
        </div>
        <DeployWizard />
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)' }}>
        <p>100% Open Source. Built for Privacy.</p>
      </footer>
    </div>
  );
}

export default App;
