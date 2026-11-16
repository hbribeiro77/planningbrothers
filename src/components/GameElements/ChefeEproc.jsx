import { useEffect, useState } from 'react';

/**
 * O chefe EPROC na mesa: um robô com cabeça de monitor que fica andando.
 * Estado vem do servidor (bossSpawned/bossUpdate/bossHit...). Clicar nele é tratado no KeyboardThrower.
 *
 * Estrutura: .chefe-eproc (fora) anda pela mesa; .chefe-entrada faz a chegada (uma vez só);
 * .chefe-inner (dentro) balança, treme com os golpes e faz a saída.
 * Assim uma animação não atropela a outra.
 */
export function ChefeEproc({ socket }) {
  const [chefe, setChefe] = useState(null); // { bossId, vida, max, fase, travadoAteLocal, travaTipo, motivo }
  const [, tick] = useState(0);
  const [saindo, setSaindo] = useState(null); // 'derrotado' | 'caiu'

  useEffect(() => {
    if (!socket) return;
    const aplicarEstado = (s) => setChefe(prev => ({
      ...(prev?.bossId === s.bossId ? prev : {}),
      bossId: s.bossId, vida: s.vida, max: s.max, fase: s.fase, motivo: s.motivo,
      travadoAteLocal: Date.now() + (s.travadoMs || 0), travaTipo: s.travaTipo,
    }));
    const onSpawn = (s) => { setSaindo(null); aplicarEstado(s); };
    const onHit = ({ bossId, vida, max }) => setChefe(prev => (prev?.bossId === bossId ? { ...prev, vida, max } : prev));
    const sair = (tipo) => ({ bossId }) => {
      setSaindo(tipo);
      setTimeout(() => setChefe(prev => (prev?.bossId === bossId ? null : prev)), 1400);
    };
    const onDefeated = sair('derrotado');
    const onCrashed = sair('caiu');
    socket.on('bossSpawned', onSpawn);
    socket.on('bossUpdate', aplicarEstado);
    socket.on('bossHit', onHit);
    socket.on('bossDefeated', onDefeated);
    socket.on('bossCrashed', onCrashed);
    const onRemoved = sair('caiu');
    socket.on('bossRemoved', onRemoved);
    return () => {
      socket.off('bossSpawned', onSpawn);
      socket.off('bossUpdate', aplicarEstado);
      socket.off('bossHit', onHit);
      socket.off('bossDefeated', onDefeated);
      socket.off('bossCrashed', onCrashed);
      socket.off('bossRemoved', onRemoved);
    };
  }, [socket]);

  // Re-render enquanto estiver travado (pra saber quando destravou)
  useEffect(() => {
    if (!chefe || saindo) return;
    const id = setInterval(() => tick(t => t + 1), 300);
    return () => clearInterval(id);
  }, [chefe?.bossId, saindo]);

  if (!chefe) return null;
  const agora = Date.now();
  const vidaPct = Math.max(0, (chefe.vida / chefe.max) * 100);
  const travado = !saindo && agora < chefe.travadoAteLocal ? chefe.travaTipo : null;

  // Fumaça conforme apanha: 0 (nada) → 4 (preta, quase destruído)
  const fumaca = vidaPct > 80 ? 0 : vidaPct > 60 ? 1 : vidaPct > 40 ? 2 : vidaPct > 20 ? 3 : 4;

  const externo = ['chefe-eproc', (travado || saindo) && 'chefe-parado', saindo && 'chefe-saindo'].filter(Boolean).join(' ');
  const interno = [
    'chefe-inner',
    chefe.fase === 2 && 'chefe-fase2',
    travado && 'chefe-travado',
    saindo === 'derrotado' && 'chefe-derrotado',
    saindo === 'caiu' && 'chefe-caiu',
  ].filter(Boolean).join(' ');

  return (
    <div className={externo} data-boss-id={chefe.bossId} title="EPROC — clique pra atacar!">
      <div className="chefe-entrada">
      <div className={interno}>
        <div className="chefe-nome">
          EPROC {chefe.fase === 2 && <span className="chefe-fase-tag">INSTÁVEL</span>}
        </div>
        <div className="chefe-corpo">
          <img src="/images/game-objects/eproc.svg" alt="EPROC" draggable={false} />
          {fumaca > 0 && !saindo && (
            <div className={`chefe-fumaca chefe-fumaca-${fumaca}`}>
              {Array.from({ length: 2 + fumaca * 2 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
            </div>
          )}
          <div className="chefe-boot">BOOT...</div>
          {travado === 'carregando' && <div className="chefe-status">⏳ Carregando...</div>}
          {travado === 'foradoar' && <div className="chefe-status chefe-status-off">🔌 Fora do ar</div>}
          {saindo === 'caiu' && <div className="chefe-status chefe-status-off">💤 Caiu sozinho</div>}
        </div>
        <div className="chefe-barra chefe-barra-vida" title={`Vida ${chefe.vida}/${chefe.max}`}>
          <div style={{ width: `${vidaPct}%` }} />
          <span>{chefe.vida}/{chefe.max}</span>
        </div>
      </div>
      </div>
    </div>
  );
}
