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
    {/* Parte esquerda do colete - x=160 movido para x=200 */}
    <path d="M100 50 L70 150 L70 350 L200 350 L200 50 Z" 
          fill={mainColor} stroke="#000000" strokeWidth="2"/>
    
    {/* Parte direita do colete - x=440 movido para x=400 */}
    <path d="M500 50 L530 150 L530 350 L400 350 L400 50 Z" 
          fill={mainColor} stroke="#000000" strokeWidth="2"/>
    
    {/* Gola esquerda - x=160 movido para x=200 */}
    <path d="M100 50 L200 80 L200 50" stroke="#000000" strokeWidth="2" fill={mainColor}/>
    
    {/* Gola direita - x=440 movido para x=400 */}
    <path d="M500 50 L400 80 L400 50" stroke="#000000" strokeWidth="2" fill={mainColor}/>
    
    {/* Cavas (aberturas para os braços) - Não precisam mudar */}
    <path d="M100 50 L70 150 C80 160, 90 170, 110 155 L130 100 L100 50" 
          fill={darkColor} stroke="#000000" strokeWidth="2"/>
    <path d="M500 50 L530 150 C520 160, 510 170, 490 155 L470 100 L500 50" 
          fill={darkColor} stroke="#000000" strokeWidth="2"/>
    
    {/* Casas dos botões (lado esquerdo) - x=145 movido para x=185 */}
    <rect x="185" y="115" width="15" height="10" rx="5" fill={darkColor} stroke="#000000" strokeWidth="1"/>
    <rect x="185" y="175" width="15" height="10" rx="5" fill={darkColor} stroke="#000000" strokeWidth="1"/>
    <rect x="185" y="235" width="15" height="10" rx="5" fill={darkColor} stroke="#000000" strokeWidth="1"/>
    <rect x="185" y="295" width="15" height="10" rx="5" fill={darkColor} stroke="#000000" strokeWidth="1"/>
    
    {/* Botões (lado direito) - cx=455 movido para cx=415 */}
    <circle cx="415" cy="120" r="5" fill="#b8860b" stroke="#000000" strokeWidth="1"/>
    <circle cx="415" cy="180" r="5" fill="#b8860b" stroke="#000000" strokeWidth="1"/>
    <circle cx="415" cy="240" r="5" fill="#b8860b" stroke="#000000" strokeWidth="1"/>
    <circle cx="415" cy="300" r="5" fill="#b8860b" stroke="#000000" strokeWidth="1"/>
    
    {/* Detalhes de costura - Pontos X ajustados */}
    <path d="M80 130 L180 130" stroke="#000000" strokeWidth="1" strokeDasharray="2,2"/>
    <path d="M420 130 L520 130" stroke="#000000" strokeWidth="1" strokeDasharray="2,2"/>
    <path d="M90 300 L190 300" stroke="#000000" strokeWidth="1" strokeDasharray="2,2"/>
    <path d="M410 300 L510 300" stroke="#000000" strokeWidth="1" strokeDasharray="2,2"/>
  </svg>
);

export default VestIcon; 