'use client';

import { useState, useEffect } from 'react';
import { Button, TextInput, Stack, Title, Group, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';

// Chave para armazenar o nome no localStorage
export const LOCALSTORAGE_NOME_KEY = 'planningBrothersNome';

/**
 * Componente de formulário de entrada reutilizável
 * @param {Object} props - Propriedades do componente
 * @param {string} props.titulo - Título exibido no topo do formulário
 * @param {string} [props.codigoSalaFixo] - Se fornecido, bloqueia o campo de código da sala com este valor
 * @param {boolean} [props.mostrarCriarSala=true] - Se deve mostrar a opção de criar nova sala
 * @param {boolean} [props.mostrarEntrarSala=true] - Se deve mostrar a opção de entrar em sala existente
 * @param {string} [props.textoBotaoEntrar="Entrar em Sala Existente"] - Texto do botão de entrar
 * @param {string} [props.textoBotaoCriar="Criar Nova Sala"] - Texto do botão de criar
 * @param {string} [props.nomeInicial=""] - Valor inicial do campo nome
 * @param {Function} [props.onSalvarNome] - Callback chamado quando o nome é definido
 */
export default function FormularioEntrada({
  titulo = "Entre no Planning Poker",
  codigoSalaFixo,
  mostrarCriarSala = true,
  mostrarEntrarSala = true,
  textoBotaoEntrar = "Entrar em Sala Existente",
  textoBotaoCriar = "Criar Nova Sala",
  nomeInicial = "",
  onSalvarNome
}) {
  const router = useRouter();
  const [nome, setNome] = useState(nomeInicial);
  const [codigoSala, setCodigoSala] = useState(codigoSalaFixo || '');
  const [validando, setValidando] = useState(false);

  // Se o código da sala for fixo, desabilita edição
  const codigoReadOnly = !!codigoSalaFixo;
  
  // Gera código aleatório para sala
  const gerarCodigoAleatorio = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Salva o nome no localStorage
  const salvarNome = (nome) => {
    localStorage.setItem(LOCALSTORAGE_NOME_KEY, nome);
    if (onSalvarNome) onSalvarNome(nome);
  };

  // Criar nova sala
  const criarNovaSala = () => {
    if (!nome) return;
    
    setValidando(true);
    salvarNome(nome);
    
    // Gerar código aleatório para a sala
    const novoCodigo = gerarCodigoAleatorio();
    
    // Redirecionar para a sala sem parâmetros de convite
    setTimeout(() => {
      router.push(`/sala/${novoCodigo}`);
    }, 500);
  };
  
  // Entrar em sala existente
  const entrarEmSala = () => {
    const codigo = codigoSalaFixo || codigoSala;
    if (!nome || !codigo) return;
    
    setValidando(true);
    salvarNome(nome);
    
    // Redirecionar para a sala existente com nome na URL
    setTimeout(() => {
      // Se estamos entrando em uma sala existente (não criando), adiciona o parâmetro convite
      const params = new URLSearchParams();
      params.append('nome', nome);
      // Só adiciona o parâmetro convite se não estamos em um link de convite (codigoSalaFixo)
      if (!codigoSalaFixo && codigoSala) {
        params.append('convite', 'true');
      }
      router.push(`/sala/${codigo}?${params.toString()}`);
    }, 500);
  };

  // Se temos apenas a opção de entrar e o código já está fixo, podemos submeter com Enter no campo de nome
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && nome && (!mostrarEntrarSala || codigoSalaFixo || codigoSala)) {
      if (mostrarCriarSala && !codigoSala && !codigoSalaFixo) {
        criarNovaSala();
      } else {
        entrarEmSala();
      }
    }
  };

  return (
    <Stack>
      <Title order={3} ta="center">
        {titulo}
      </Title>
      
      <TextInput
        label="Seu nome"
        placeholder="Digite seu nome"
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyPress={handleKeyPress}
        data-autofocus
      />
      
      {mostrarCriarSala && (
        <>
          <Group grow>
            <Button 
              color="blue" 
              onClick={criarNovaSala} 
              loading={validando}
              disabled={!nome}
            >
              {textoBotaoCriar}
            </Button>
          </Group>
          
          {mostrarEntrarSala && (
            <Text ta="center" fw={500} mt="md">
              ou
            </Text>
          )}
        </>
      )}
      
      {mostrarEntrarSala && (
        <>
          <TextInput
            label="Código da sala"
            placeholder="Digite o código da sala"
            value={codigoSala}
            onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
            readOnly={codigoReadOnly}
            onKeyPress={handleKeyPress}
          />
          
          <Button
            variant="light"
            onClick={entrarEmSala}
            loading={validando}
            disabled={!nome || !(codigoSalaFixo || codigoSala)}
          >
            {textoBotaoEntrar}
          </Button>
        </>
      )}
    </Stack>
  );
} 