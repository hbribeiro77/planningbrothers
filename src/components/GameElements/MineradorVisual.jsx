import { useEffect, useState } from 'react';
import { Tooltip, Text } from '@mantine/core';
import { ITEMS_DATA, BITCOIN_MINER_ID } from '@/constants/itemsData';

const UPGRADES = ['firewall_minerador', 'antivirus_minerador', 'placa_video_minerador'];

/**
 * Minerador ao lado do card (à direita). É um alvo: os outros atacam clicando nele,
 * e o dono conserta clicando (+2 de vida por clique). O clique é tratado no KeyboardThrower.
 * Zerou a vida: contagem até explodir (e matar o dono), a menos que ele conserte a tempo.
 */
export function MineradorVisual({ participante, souDono }) {
  const minerData = ITEMS_DATA[BITCOIN_MINER_ID];
  const visual = minerData.avatarVisual;
  const max = participante.minerador?.max || minerData.minerLife || 80;
  const vida = participante.minerador?.vida ?? max;
  const restanteServidor = participante.minerador?.contagemRestanteMs;
  const explodiu = !!participante.minerador?.explodiu;
  const quebrado = vida <= 0;
  const danificado = vida < max;
  const fumacando = !quebrado && vida <= max / 2;
  const upgrades = UPGRADES.filter(id => participante.inventory?.includes(id)).map(id => ITEMS_DATA[id].name);

  // Contagem local a partir do tempo restante que o servidor mandou
  const [fimContagem, setFimContagem] = useState(null);
  const [, tick] = useState(0);
  useEffect(() => {
    setFimContagem(typeof restanteServidor === 'number' && quebrado && !explodiu ? Date.now() + restanteServidor : null);
  }, [restanteServidor, quebrado, explodiu]);
  useEffect(() => {
    if (!fimContagem) return;
    const id = setInterval(() => tick(t => t + 1), 200);
    return () => clearInterval(id);
  }, [fimContagem]);
  const segundos = fimContagem ? Math.max(0, Math.ceil((fimContagem - Date.now()) / 1000)) : null;
  const emContagem = segundos !== null;

  const dica = souDono
    ? (emContagem ? 'VAI EXPLODIR! Clique pra consertar!' : danificado ? 'Clique para consertar (+2 por clique)' : 'Seu minerador')
    : (quebrado ? 'Minerador quebrado' : 'Clique para atacar o minerador');

  const classes = [
    'minerador-alvo',
    quebrado && 'minerador-quebrado',
    emContagem && 'minerador-contagem',
    explodiu && 'minerador-explodiu',
    souDono && 'minerador-meu',
  ].filter(Boolean).join(' ');

  return (
    <>
    <Tooltip
      label={(
        <>
          <Text size="xs" fw={700}>Minerador · {vida}/{max}{quebrado ? ' (quebrado)' : ''}</Text>
          {upgrades.length > 0 && <Text size="xs">Upgrades: {upgrades.join(', ')}</Text>}
          <Text size="xs" c="dimmed">{dica}</Text>
        </>
      )}
      position="top"
      withArrow
      openDelay={300}
      multiline
      w={200}
    >
      <div
        className={classes}
        data-owner-id={participante.id}
        style={{ ...visual.style, cursor: souDono ? (danificado ? 'pointer' : 'default') : 'crosshair' }}
      >
        <img src={visual.path} alt="Minerador" style={{ width: '100%', height: 'auto', display: 'block' }} draggable={false} />

        {fumacando && (
          <div className="minerador-fumaca">
            <span /><span /><span />
          </div>
        )}

        {/* Quebrado: muita fumaça */}
        {quebrado && !explodiu && (
          <div className="minerador-fumaca minerador-fumaca-muita">
            <span /><span /><span /><span /><span /><span /><span />
          </div>
        )}

        {emContagem && <div className="minerador-contador">{segundos}</div>}

        {souDono && danificado && !explodiu && (
          <div className={`minerador-dica${emContagem ? ' minerador-dica-urgente' : ''}`}>
            {emContagem ? 'VAI EXPLODIR! Clique pra consertar!' : 'Clique para consertar'}
          </div>
        )}
      </div>
    </Tooltip>
        {/* Vida na mesma altura da barra do jogador (posicionada em relação ao card) */}
        {danificado && !explodiu && (
          <div className="minerador-vida">
            <div
              className="minerador-vida-fill"
              style={{
                width: `${(vida / max) * 100}%`,
                background: vida > max / 2 ? '#40c057' : vida > max / 4 ? '#fab005' : '#fa5252',
              }}
            />
          </div>
        )}

    </>
  );
}
