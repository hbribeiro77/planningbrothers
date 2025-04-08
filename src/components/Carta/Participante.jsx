import React from 'react';
import { Paper, Text, Badge, useMantineTheme, Tooltip } from '@mantine/core';
import { IconEye, IconSkull } from '@tabler/icons-react';
import { LifeBar } from '../GameElements/LifeBar';
// Importar constantes e o novo ícone
import { ITEMS_DATA, KEYBOARD_ID } from '@/constants/itemsData';
// Importar o componente de ícone diretamente aqui
import VestIcon from '../Icons/VestIcon';

// Definir o mapeamento de componentes visuais aqui, onde ele é usado
const AVATAR_COMPONENTS = {
    VestIcon: VestIcon,
    // Adicionar outros mapeamentos se usar mais componentes visuais
};

// Helper Refatorado: Formata stats consolidados (Arma + Acessórios)
function formatConsolidatedBonus(equippedAccessories, weaponId) { 
  const parts = [];
  let weaponDescription = null;
  let accessoryDescription = null;

  // --- Stats Base da Arma ---
  let baseAtkFixed = 0;
  let baseAtkDice = null;
  let baseCrit = 0;
  const weaponData = ITEMS_DATA[weaponId];
  if (weaponData && weaponData.type === 'weapon') {
    baseAtkFixed = weaponData.baseDamageFixed || 0;
    baseAtkDice = weaponData.baseDamageDice; // Pode ser null
    baseCrit = weaponData.criticalChance || 0;
  }

  // --- Bônus Totais dos Acessórios ---
  let totalAccAtkFixed = 0;
  let totalAccAtkDice = [];
  let totalAccDefFixed = 0;
  let totalAccDefDice = [];
  let highestDodge = 0;

  (equippedAccessories || []).forEach(itemId => {
    const itemData = ITEMS_DATA[itemId];
    if (itemData && itemData.type === 'accessory') {
      totalAccAtkFixed += itemData.attackBonusFixed || 0;
      if (itemData.attackBonusDice) totalAccAtkDice.push(itemData.attackBonusDice);
      totalAccDefFixed += itemData.defenseFixed || 0;
      if (itemData.defenseDice) totalAccDefDice.push(itemData.defenseDice);
      if (itemData.dodgeChance && itemData.dodgeChance > highestDodge) {
        highestDodge = itemData.dodgeChance;
      }
    }
  });

  // --- Montar String de Ataque Consolidado ---
  let attackString = '';
  const finalAtkFixed = baseAtkFixed + totalAccAtkFixed;
  const finalAtkDice = [baseAtkDice, ...totalAccAtkDice].filter(Boolean); // Junta dados da arma e acessórios
  
  if (finalAtkFixed > 0) {
      attackString += finalAtkFixed;
  }
  if (finalAtkDice.length > 0) {
      if (attackString) attackString += ' + '; // Adiciona separador se já tinha fixo
      attackString += finalAtkDice.join(' + ');
  }
  if (attackString) {
      parts.push(`Ataque: ${attackString}`);
  }

  // --- Montar String de Defesa Consolidada ---
  let defenseString = '';
  if (totalAccDefFixed > 0) {
      defenseString += `+${totalAccDefFixed}`;
  }
  if (totalAccDefDice.length > 0) {
      if (defenseString) defenseString += ' + ';
      defenseString += totalAccDefDice.join(' + ');
  }
  if (defenseString) {
       parts.push(`Defesa: ${defenseString}`);
  }

  // --- Adicionar Crítico e Esquiva ---
  if (baseCrit > 0) {
    parts.push(`Crítico: ${baseCrit * 100}%`);
  }
  if (highestDodge > 0) {
    parts.push(`Esquiva: ${highestDodge * 100}%`);
  }

  // --- Texto Final ---
  if (parts.length === 0) {
      return 'Nenhum bônus ativo.';
  }
  return parts.join(', '); // Separa os stats consolidados com vírgula
}

export default function CartaParticipante({ 
  participante,
  revelarVotos = false,
}) {
  console.log(`[CartaParticipante] Recebeu participante ${participante?.nome}:`, participante);

  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';

  const {
    id,
    nome,
    jaVotou = false,
    valorVotado = null,
    isModerador = false,
    isObservador = false,
    life = 100,
    maxLife = 100,
    inventory = [],
    equippedAccessories = []
  } = participante || {};

  const consolidatedBonusText = formatConsolidatedBonus(equippedAccessories, KEYBOARD_ID);
  
  const isDead = life <= 0;

  return (
    <Paper
      shadow="sm"
      p="xs"
      radius="md"
      withBorder
      className="carta-participante"
      data-id={id}
      data-user-id={id}
      data-votou={jaVotou}
      data-observador={isObservador}
      style={{
        width: 'clamp(45px, 3.5vw, 60px)',
        height: 'clamp(68px, 5vw, 80px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: isObservador 
          ? (isDark ? '#1f3b2c' : '#f0ffee')
          : (jaVotou 
              ? (isDark ? '#1c3f5f' : '#e7f5ff')
              : (isDark ? theme.colors.dark.card[0] : theme.white)),
        borderColor: isObservador 
          ? (isDark ? '#2d5640' : '#20c997')
          : (jaVotou 
              ? (isDark ? '#2b5580' : '#228be6')
              : undefined),
        transition: 'all 0.3s ease',
        opacity: isObservador ? 0.85 : 1,
        minHeight: 'clamp(68px, 5vw, 80px)',
        overflow: 'visible',
      }}
    >
      {!isObservador && <LifeBar currentLife={life} maxLife={maxLife} avatarId={id} />}

      {/* Renderização dinâmica de MÚLTIPLOS acessórios */}
      {equippedAccessories.map(accessoryId => {
        const itemData = ITEMS_DATA[accessoryId];
        const visualConfig = itemData?.avatarVisual;
        if (!visualConfig) return null; // Pula se não houver config visual
        
        // Retorna o elemento visual para este acessório
        return (
          <React.Fragment key={accessoryId}> {/* Usar Fragment com key */}
            {/* Caso 1: Componente React */} 
            {visualConfig.type === 'component' && visualConfig.componentName && AVATAR_COMPONENTS[visualConfig.componentName] && (
              React.createElement(AVATAR_COMPONENTS[visualConfig.componentName], {
                ...(visualConfig.props || {}),
                style: visualConfig.style 
              })
            )}

            {/* Caso 2: Imagem SVG */} 
            {visualConfig.type === 'svg' && visualConfig.path && (
              <img
                src={visualConfig.path}
                alt={itemData?.name || 'Acessório'}
                style={visualConfig.style}
              />
            )}
          </React.Fragment>
        );
      })}

      {isModerador && (
        <Badge 
          size="xs" 
          color="blue" 
          radius="sm" 
          style={{ position: 'absolute', top: 2, right: 2, zIndex: 2 }}
        >
          M
        </Badge>
      )}
      
      {isObservador && (
        <Badge 
          size="xs" 
          color="teal" 
          radius="sm" 
          style={{ position: 'absolute', top: 2, left: 2, zIndex: 2 }}
          leftSection={<IconEye size={10} />}
        >
          O
        </Badge>
      )}
      
      {isDead && (
        <IconSkull 
          size={14} 
          style={{
            position: 'absolute',
            bottom: 3,
            right: 3,
            color: theme.colors.red[7],
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))',
            zIndex: 2
          }}
        />
      )}
      
      {/* Tooltip AGORA envolve APENAS o nome */}
      <Tooltip 
        label={consolidatedBonusText}
        position="top" // Mudar para 'top' pode ficar melhor aqui
        withArrow
        openDelay={500}
        multiline
        w={200}
        disabled={isObservador} // Desabilitado para observadores
      >
        <Text 
          fw={500} 
          ta="center" 
          size="xs" 
          style={{ 
            marginBottom: 5, 
            fontSize: '0.75rem',
            position: 'relative',
            zIndex: 3,
            cursor: 'help', // Adiciona cursor de ajuda para indicar interatividade
          }}
        >
          {nome}
        </Text>
      </Tooltip>
      
      {jaVotou && revelarVotos && !isObservador && (
        <Text fw={700} size="md" c={isDark ? 'blue.4' : 'blue'} style={{ position: 'relative', zIndex: 3 }}>
          {valorVotado === "?" ? "?" : valorVotado}
        </Text>
      )}
      
      {jaVotou && !revelarVotos && !isObservador && (
        <Text size="xs" c="dimmed" style={{ fontSize: '0.75rem', position: 'relative', zIndex: 3 }}>
          Votou
        </Text>
      )}
      
      {!jaVotou && !isObservador && (
        <Text size="xs" c="dimmed" style={{ fontSize: '0.75rem', position: 'relative', zIndex: 3 }}>
          ...
        </Text>
      )}
      
      {isObservador && (
        <IconEye size={16} color={isDark ? '#2d5640' : '#20c997'} style={{ opacity: 0.7, position: 'relative', zIndex: 3 }} />
      )}
    </Paper>
  );
} 