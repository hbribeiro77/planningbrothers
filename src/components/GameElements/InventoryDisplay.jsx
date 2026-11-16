import React, { useState, useEffect, useRef } from 'react';
import { Stack, Group, Text, Tooltip, ActionIcon, Divider, Box, Indicator, Progress } from '@mantine/core';
import { IconKeyboard, IconShirt, IconStar, IconMask, IconBook, IconMedal, IconCurrencyBitcoin, IconBuildingBank, IconBook2, IconKeyboardShow, IconRubberStamp, IconBurger, IconBottle } from '@tabler/icons-react';
import Note7Icon from '@/components/Icons/Note7Icon';
import { usePvpStatus } from '@/contexts/PvpContext';
import { COLETE_DPE_ID, COLETE_BLUE_ID, ITEMS_DATA, KEYBOARD_ID } from '@/constants/itemsData';
import { AnimationService } from '@/services/AnimationService';

// Mapa de ícones para acessórios
const accessoryIconMap = {
  IconShirt: IconShirt,
  IconKeyboard: IconKeyboard,
  IconStar: IconStar,
  IconMask: IconMask,
  IconBook: IconBook,
  IconMedal: IconMedal,
  IconCurrencyBitcoin: IconCurrencyBitcoin,
  IconBook2: IconBook2,
  IconKeyboardShow: IconKeyboardShow,
  IconRubberStamp: IconRubberStamp,
  Note7Icon: Note7Icon,
  IconBurger: IconBurger,
  IconBottle: IconBottle,
  // Adicionar outros mapeamentos aqui conforme necessário
};

// Helper para formatar atributos do item para o Tooltip
function formatItemAttributes(itemData) {
  if (!itemData) return '';
  const attributes = [];
  // Arma
  if (itemData.baseDamageFixed) attributes.push(`Dano Fixo: ${itemData.baseDamageFixed}`);
  if (itemData.baseDamageDice) attributes.push(`Dano Dado: ${itemData.baseDamageDice}`);
  if (itemData.criticalChance) attributes.push(`Crítico: ${itemData.criticalChance * 100}%`);
  if (itemData.type === 'weapon' && itemData.cooldownMs >= 1000) attributes.push(`Recarga: ${itemData.cooldownMs / 1000}s`);
  if (itemData.autoFire) attributes.push('Automática');
  // Contra-ataque / consumível
  if (itemData.counterChance) attributes.push(`Chance: ${itemData.counterChance * 100}%`);
  if (itemData.counterDice) attributes.push(`Dano: ${itemData.counterDice}`);
  if (itemData.bombDice) attributes.push(`Explosão: ${itemData.bombDice}`);
  if (itemData.bombLife) attributes.push(`Vida do celular: ${itemData.bombLife}`);
  if (itemData.healAmount) attributes.push(`Cura: +${itemData.healAmount}`);
  // Acessório
  if (itemData.attackBonusFixed) attributes.push(`Atq Fixo: +${itemData.attackBonusFixed}`);
  if (itemData.attackBonusDice) attributes.push(`Atq Dado: +${itemData.attackBonusDice}`);
  if (itemData.defenseFixed) attributes.push(`Def Fixo: +${itemData.defenseFixed}`);
  if (itemData.defenseDice) attributes.push(`Def Dado: +${itemData.defenseDice}`);
  if (itemData.dodgeChance) attributes.push(`Esquiva: ${itemData.dodgeChance * 100}%`);
  // Bônus de Chance
  if (itemData.criticalChanceBonus) attributes.push(`Bônus Crítico: +${itemData.criticalChanceBonus * 100}%`);
  if (itemData.dodgeChanceBonus) attributes.push(`Bônus Esquiva: +${itemData.dodgeChanceBonus * 100}%`);
  // Multiplicador de Score
  if (itemData.scoreMultiplier && itemData.scoreMultiplier !== 1) attributes.push(`Ganhos: ${itemData.scoreMultiplier}x`);
  
  // Adiciona a descrição principal se houver e outros atributos também
  let tooltipLabel = itemData.name || 'Item Desconhecido';
  if (itemData.description) {
    tooltipLabel += `\n${itemData.description}`; // Usa \n para quebra de linha no tooltip
  }
  // Junta os atributos formatados, se houver
  if (attributes.length > 0) {
      tooltipLabel += `\n(${attributes.join(', ')})`;
  }
  return tooltipLabel;
}

// Ícone de um item: SVG próprio ou ícone do Tabler
function ItemIcon({ itemData, color, size = 20 }) {
  // Ícone de traço tem prioridade (é o padrão visual do inventário); SVG só se o item não tiver um
  const Icone = accessoryIconMap[itemData?.iconName];
  if (Icone) return <Icone size={size} color={color} />;
  if (itemData?.iconSvgPath) {
    return <img src={itemData.iconSvgPath} alt={itemData.name} style={{ width: size, height: size }} />;
  }
  return <Text size="xs" c="dimmed">?</Text>;
}

// Hint dos ícones do inventário: aparece ao passar o mouse e some assim que clica
// (só volta depois de tirar o mouse e passar de novo).
function Dica({ children, label, w = 220, openDelay = 300 }) {
  const [aberto, setAberto] = useState(false);
  const timer = useRef(null);
  const entrar = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAberto(true), openDelay);
  };
  const fechar = () => {
    clearTimeout(timer.current);
    setAberto(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Tooltip label={label} opened={aberto} multiline w={w}>
      <div style={{ display: 'inline-flex' }} onMouseEnter={entrar} onMouseLeave={fechar} onPointerDown={fechar}>
        {children}
      </div>
    </Tooltip>
  );
}

// Barrinha de progresso da carga no cartório (o servidor manda quanto falta)
function CartorioProgress({ recarga }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!recarga) return;
    const fim = Date.now() + recarga.restanteMs;
    const tick = () => setPct(Math.max(0, Math.min(100, 100 - ((fim - Date.now()) / recarga.duracaoMs) * 100)));
    tick();
    const t = setInterval(tick, 100);
    return () => clearInterval(t);
  }, [recarga?.restanteMs, recarga?.duracaoMs]);
  return <Progress value={pct} size="sm" w={34} color={recarga?.eprocFora ? 'red' : 'blue'} />;
}

export function InventoryDisplay({
  currentUser,
  onToggleEquip,
  onSelectWeapon,
  onUseItem,
  onReloadWeapon,
  onSelectCounter
}) {
  const { pvpStatus } = usePvpStatus();

  const armaSelecionada = currentUser?.selectedWeapon || KEYBOARD_ID;
  const armasDisponiveis = [
    KEYBOARD_ID,
    ...(currentUser?.inventory || []).filter(id => id !== KEYBOARD_ID && ITEMS_DATA[id]?.type === 'weapon'),
  ];
  const consumiveis = Object.entries(currentUser?.consumables || {})
    .filter(([id, qtd]) => qtd > 0 && ITEMS_DATA[id]?.type === 'consumable');
  const contraAtaques = Object.entries(currentUser?.consumables || {})
    .filter(([id, qtd]) => qtd > 0 && ITEMS_DATA[id]?.type === 'counter');
  const vida = typeof currentUser?.life === 'number' ? currentUser.life : 100;
  const userAccessories = currentUser?.inventory?.filter(itemId => ITEMS_DATA[itemId]?.type === 'accessory') || [];
  const equippedAccessories = currentUser?.equippedAccessories || [];

  const isAccessoryClickable = (itemId) =>
    ITEMS_DATA[itemId]?.type === 'accessory' && userAccessories.includes(itemId);

  const handleSelecionarArma = (armaId) => {
    if (armaId !== armaSelecionada && onSelectWeapon) onSelectWeapon(armaId);
  };

  return (
    <Box>
      {/* Seções sempre na mesma linha; quem tem muitos ícones (acessórios) quebra dentro da própria coluna */}
      <Group align="flex-start" gap="sm" wrap="nowrap" justify="flex-start">
        <Stack align="center" spacing="xs">
          <Text size="sm" weight={500} c="dimmed">Arma:</Text>
          <Group position="center" spacing="xs">
            {armasDisponiveis.map((armaId) => {
              const armaData = ITEMS_DATA[armaId];
              const selecionada = armaSelecionada === armaId;
              const tooltipLabel = pvpStatus
                ? formatItemAttributes(armaData)
                : "Seleção desativada (Modo PVP desligado)";

              // Arma com munição: mostra contador, botão de cartório e progresso da carga
              if (armaData?.ammo) {
                const municao = currentUser?.ammo?.[armaId] ?? 0;
                const recarga = currentUser?.recargas?.[armaId];
                const vazia = municao <= 0;

                if (recarga) {
                  return (
                    <Dica
                      key={armaId}
                      label={<Text size="xs">{recarga.eprocFora ? 'Eproc tá fora! A carga vai demorar o dobro.' : 'Fazendo carga no cartório... (dá pra usar outra arma enquanto isso)'}</Text>}
                      multiline
                      w={220}
                    >
                      <Stack gap={2} align="center">
                        <ActionIcon variant="light" color="gray" size="lg" style={{ opacity: 0.6, cursor: 'wait' }}>
                          <IconBuildingBank size={20} />
                        </ActionIcon>
                        <CartorioProgress recarga={recarga} />
                      </Stack>
                    </Dica>
                  );
                }

                if (vazia) {
                  return (
                    <Dica key={armaId} label={<Text size="xs">Acabaram os processos. Fazer carga no cartório!</Text>} multiline w={220}>
                      <Stack gap={2} align="center">
                        <ActionIcon
                          variant="light"
                          color="gray"
                          size="lg"
                          disabled={!pvpStatus}
                          onClick={() => onReloadWeapon && onReloadWeapon(armaId)}
                          aria-label="Fazer carga no cartório"
                        >
                          <IconBuildingBank size={20} />
                        </ActionIcon>
                        <Text size="10px" c="red" fw={700} lh={1}>Fazer carga</Text>
                      </Stack>
                    </Dica>
                  );
                }

                return (
                  <Dica key={armaId} label={<Text size="xs">{tooltipLabel}</Text>} openDelay={300} multiline w={220}>
                    <Stack gap={2} align="center">
                      <ActionIcon
                        variant={selecionada ? 'filled' : 'light'}
                        color={selecionada ? 'blue' : 'gray'}
                        size="lg"
                        onClick={() => handleSelecionarArma(armaId)}
                        disabled={!pvpStatus}
                      >
                        <ItemIcon itemData={armaData} />
                      </ActionIcon>
                      <Text size="10px" c={municao <= 5 ? 'red' : 'dimmed'} fw={700} lh={1}>{municao}/{armaData.ammo}</Text>
                    </Stack>
                  </Dica>
                );
              }

              // Sem munição: infinito (alinha com as armas que mostram "25/25")
              return (
                <Dica
                  key={armaId}
                  label={<Text size="xs">{tooltipLabel}</Text>}
                  openDelay={300}
                  multiline
                  w={220}
                >
                  <Stack gap={2} align="center">
                    <ActionIcon
                      variant={selecionada ? 'filled' : 'light'}
                      color={selecionada ? 'blue' : 'gray'}
                      size="lg"
                      onClick={() => handleSelecionarArma(armaId)}
                      disabled={!pvpStatus}
                    >
                      {armaId === KEYBOARD_ID
                        ? <IconKeyboard size={20} />
                        : <ItemIcon itemData={armaData} />}
                    </ActionIcon>
                    {/* O glifo ∞ é pequeno nas fontes: maior, mas com a mesma altura de linha do "25/25" */}
                    <Text size="18px" c="dimmed" fw={700} style={{ lineHeight: '10px' }}>∞</Text>
                  </Stack>
                </Dica>
              );
            })}
          </Group>
        </Stack>

        {consumiveis.length > 0 && (
          <>
            <Divider orientation="vertical" />
            <Stack align="center" spacing="xs">
              <Text size="sm" weight={500} c="dimmed">Lanches:</Text>
              <Group position="center" spacing="xs">
                {consumiveis.map(([itemId, qtd]) => {
                  const itemData = ITEMS_DATA[itemId];
                  const morto = vida <= 0;
                  const envenenado = currentUser?.envenenado;
                  const curaEnjoo = itemData.curesPoisonAfter && envenenado;
                  const cheio = itemData.healAmount && vida >= 100 && !curaEnjoo;
                  const motivo = morto ? 'Morto não come!'
                    : curaEnjoo ? `Passando mal! Beba pra curar (${envenenado.aguas || 0}/${itemData.curesPoisonAfter})`
                    : cheio ? 'Vida cheia' : 'Clique para usar';
                  return (
                    <Dica
                      key={itemId}
                      label={<Text size="xs">{`${formatItemAttributes(itemData)}\n${motivo}`}</Text>}
                      openDelay={300}
                      multiline
                      w={220}
                    >
                      <Indicator label={qtd} size={16} color="red" offset={4}>
                        <ActionIcon
                          variant="light"
                          color="gray"
                          size="lg"
                          onClick={(e) => {
                            // Não dá pra usar agora: explica em cima do próprio item (e faz barulho) em vez de só bloquear
                            if (morto || cheio) {
                              const aviso = morto ? '💀 Morto não come!'
                                : itemData.curesPoisonAfter ? 'Já tô hidratado! 💧' : 'Tô cheio! Não cabe mais nada 🫃';
                              AnimationService.showFloatingTextOver(e.currentTarget, aviso, 'damage-dead-attack', 1400);
                              AnimationService.sfx(morto ? 'negado' : 'cheio');
                              return;
                            }
                            onUseItem && onUseItem(itemId);
                          }}
                          style={morto || cheio ? { opacity: 0.5 } : undefined}
                        >
                          <ItemIcon itemData={itemData} color={itemData.iconColor} />
                        </ActionIcon>
                      </Indicator>
                    </Dica>
                  );
                })}
              </Group>
            </Stack>
          </>
        )}

        {contraAtaques.length > 0 && (
          <>
            <Divider orientation="vertical" />
            <Stack align="center" spacing="xs">
              <Text size="sm" weight={500} c="dimmed">Counters:</Text>
              <Group position="center" spacing="xs">
                {contraAtaques.map(([itemId, qtd]) => {
                  const itemData = ITEMS_DATA[itemId];
                  const ativo = currentUser?.selectedCounter === itemId;
                  return (
                    <Dica
                      key={itemId}
                      label={(
                        <>
                          <Text size="xs" fw={700}>{itemData.name} · {qtd} {qtd === 1 ? 'restante' : 'restantes'}</Text>
                          <Text size="xs">{itemData.resumo || itemData.description}</Text>
                          {itemData.piada && <Text size="xs" fs="italic" c="dimmed">{itemData.piada}</Text>}
                        </>
                      )}
                      openDelay={300}
                      multiline
                      w={220}
                    >
                      <Indicator label={qtd} size={16} color="red" offset={4}>
                        <ActionIcon
                          variant={ativo ? 'filled' : 'outline'}
                          color={ativo ? 'blue' : 'gray'}
                          size="lg"
                          onClick={() => !ativo && onSelectCounter && onSelectCounter(itemId)}
                        >
                          <ItemIcon itemData={itemData} color={itemData.iconFixedColor || (ativo ? '#fff' : itemData.iconColor)} />
                        </ActionIcon>
                      </Indicator>
                    </Dica>
                  );
                })}
              </Group>
            </Stack>
          </>
        )}

        <Divider orientation="vertical" />

        <Stack style={{ minWidth: 0, flex: '0 1 auto' }} align="center" spacing="xs">
          <Text size="sm" weight={500} c="dimmed">Acessórios:</Text>
          {/* Uma linha só; quebra apenas se a tela não tiver espaço */}
          <Group justify="center" align="flex-start" gap="xs" wrap="wrap" style={{ minHeight: 34 }}>
            {userAccessories.map((itemId) => {
              const itemData = ITEMS_DATA[itemId];
              if (!itemData) return null;
              
              // Formata o label do Tooltip para o acessório
              const tooltipLabel = formatItemAttributes(itemData);
              
              const isSelected = equippedAccessories.includes(itemId);
              
              const isClickable = isAccessoryClickable(itemId);
              
              const iconRenderColor = isSelected ? '#fff' : itemData.iconColor || 'gray';
              
              // <<< Usar mapa para obter o componente de ícone
              const AccessoryIconComponent = accessoryIconMap[itemData.iconName];
              
              return (
                <Dica 
                  key={itemId} 
                  label={<Text size="xs">{tooltipLabel}</Text>}
                  openDelay={300}
                  multiline // Permite múltiplas linhas
                  w={220} // Define uma largura
                >
                  <ActionIcon
                    variant={isSelected ? 'filled' : 'outline'} 
                    color={isSelected ? 'blue' : 'gray'}
                    size="lg"
                    disabled={!isClickable}
                    onClick={() => isClickable && onToggleEquip(itemId)}
                  >
                    {
                      itemData.iconSvgPath ? (
                        // <<< Renderizar IMG se houver caminho SVG
                        <img 
                          src={itemData.iconSvgPath}
                          alt={itemData.name || itemId} 
                          style={{ 
                            width: 20, // Ajustar tamanho para ActionIcon
                            height: 20, 
                            // Adicionar filtro? (considerar fundo do ActionIcon)
                            // filter: isSelected ? 'brightness(0) invert(1)' : (theme.colorScheme === 'dark' ? 'invert(1)' : 'none'),
                          }}
                        />
                      ) : (
                        // <<< Lógica anterior com accessoryIconMap se NÃO houver SVG
                        (() => {
                          const AccessoryIconComponent = accessoryIconMap[itemData.iconName];
                          return AccessoryIconComponent && <AccessoryIconComponent size={20} color={iconRenderColor} />;
                        })()
                      )
                    }
                    {/* Placeholder se não encontrar SVG nem Ícone Mapeado */}
                    {!itemData.iconSvgPath && !accessoryIconMap[itemData.iconName] && itemData.iconName && (
                      <Text size="xs" c="dimmed">?</Text>
                    )}
                  </ActionIcon>
                </Dica>
              );
            })}
            {userAccessories.length === 0 && (
              <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>Nenhum</Text>
            )}
          </Group>
        </Stack>
      </Group>
    </Box>
  );
} 