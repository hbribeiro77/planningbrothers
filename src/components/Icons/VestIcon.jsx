import React from 'react';

// Componente SVG do Colete que aceita cores como props
const VestIcon = ({ 
  mainColor = '#2e8b57', // Cor principal (default verde DPE)
  darkColor = '#1e6e3c', // Cor escura (default verde escuro)
  style = {}, // Permite passar estilos de posicionamento/tamanho
  ...props // Outras props SVG como width, height se necessário
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 600 400" 
    style={style} 
    {...props}
  >
    {/* Parte esquerda do colete - Usa mainColor */}
    <path d="M100 50 L70 150 L70 350 L160 350 L160 50 Z" 
          fill={mainColor} stroke="#000000" strokeWidth="2"/>
    
    {/* Parte direita do colete - Usa mainColor */}
    <path d="M500 50 L530 150 L530 350 L440 350 L440 50 Z" 
          fill={mainColor} stroke="#000000" strokeWidth="2"/>
    
    {/* Gola esquerda - Usa mainColor */}
    <path d="M100 50 L160 80 L160 50" stroke="#000000" strokeWidth="2" fill={mainColor}/>
    
    {/* Gola direita - Usa mainColor */}
    <path d="M500 50 L440 80 L440 50" stroke="#000000" strokeWidth="2" fill={mainColor}/>
    
    {/* Cavas (aberturas para os braços) - Usa darkColor */}
    <path d="M100 50 L70 150 C80 160, 90 170, 110 155 L130 100 L100 50" 
          fill={darkColor} stroke="#000000" strokeWidth="2"/>
    <path d="M500 50 L530 150 C520 160, 510 170, 490 155 L470 100 L500 50" 
          fill={darkColor} stroke="#000000" strokeWidth="2"/>
    
    {/* Casas dos botões (lado esquerdo) - Usa darkColor */}
    <rect x="145" y="115" width="15" height="10" rx="5" fill={darkColor} stroke="#000000" strokeWidth="1"/>
    <rect x="145" y="175" width="15" height="10" rx="5" fill={darkColor} stroke="#000000" strokeWidth="1"/>
    <rect x="145" y="235" width="15" height="10" rx="5" fill={darkColor} stroke="#000000" strokeWidth="1"/>
    <rect x="145" y="295" width="15" height="10" rx="5" fill={darkColor} stroke="#000000" strokeWidth="1"/>
    
    {/* Botões (lado direito) - Mantém cor original */}
    <circle cx="455" cy="120" r="5" fill="#b8860b" stroke="#000000" strokeWidth="1"/>
    <circle cx="455" cy="180" r="5" fill="#b8860b" stroke="#000000" strokeWidth="1"/>
    <circle cx="455" cy="240" r="5" fill="#b8860b" stroke="#000000" strokeWidth="1"/>
    <circle cx="455" cy="300" r="5" fill="#b8860b" stroke="#000000" strokeWidth="1"/>
    
    {/* Detalhes de costura - Mantém cor original */}
    <path d="M80 130 L140 130" stroke="#000000" strokeWidth="1" strokeDasharray="2,2"/>
    <path d="M460 130 L520 130" stroke="#000000" strokeWidth="1" strokeDasharray="2,2"/>
    <path d="M90 300 L150 300" stroke="#000000" strokeWidth="1" strokeDasharray="2,2"/>
    <path d="M450 300 L510 300" stroke="#000000" strokeWidth="1" strokeDasharray="2,2"/>
  </svg>
);

export default VestIcon; 