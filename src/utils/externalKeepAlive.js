/**
 * Serviço externo para manter o servidor ativo
 * Útil para plataformas que hibernam aplicações (Heroku, Render, etc.)
 */

class ExternalKeepAlive {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    this.interval = options.interval || 3 * 60 * 1000; // ✅ 3 minutos (bem menor que 15min do Render)
    this.enabled = options.enabled !== false;
    this.intervalId = null;
    
    console.log('🚀 ExternalKeepAlive inicializado:', {
      serverUrl: this.serverUrl,
      interval: this.interval / 1000 + 's',
      enabled: this.enabled
    });
  }

  async ping() {
    if (!this.enabled) return;

    try {
      const response = await fetch(`${this.serverUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💚 Keep-alive ping successful:', data.timestamp);
        return true;
      } else {
        console.warn('⚠️ Keep-alive ping failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Keep-alive ping error:', error.message);
      return false;
    }
  }

  start() {
    if (!this.enabled || this.intervalId) return;

    console.log('🟢 Iniciando keep-alive externo...');
    
    // Ping inicial
    this.ping();
    
    // Agendar pings regulares
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.interval);
  }

  stop() {
    if (this.intervalId) {
      console.log('🛑 Parando keep-alive externo...');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Método estático para uso simples
  static create(options) {
    const keepAlive = new ExternalKeepAlive(options);
    keepAlive.start();
    return keepAlive;
  }
}

// ✅ Auto-inicializar em produção (apenas no cliente)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Aguardar 30s após carregamento da página para não interferir com inicialização
  setTimeout(() => {
    ExternalKeepAlive.create({
      interval: 3 * 60 * 1000, // ✅ 3 minutos (bem menor que 15min do Render)
      enabled: true
    });
  }, 30000);
}

export { ExternalKeepAlive };
