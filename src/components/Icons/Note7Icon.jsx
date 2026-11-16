import { useId } from 'react';

/**
 * Ícone do Galaxy Note 7: celular com tela, câmera e botão home.
 * Tela, câmera e botão são "recortes" no corpo: aparece o fundo do botão por trás.
 * Assim ele segue o padrão dos outros ícones: preto quando inativo, branco no azul quando selecionado.
 */
export default function Note7Icon({ size = 20, color = 'currentColor', style, ...props }) {
  const mascara = `note7-recorte-${useId().replace(/:/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      {...props}
    >
      <defs>
        <mask id={mascara}>
          <rect width="24" height="24" fill="#fff" />
          {/* Tela */}
          <rect x="6.6" y="4.4" width="10.8" height="14.6" rx="0.4" fill="#000" />
          {/* Câmera e sensor */}
          <circle cx="14.6" cy="3" r="0.55" fill="#000" />
          <circle cx="16" cy="3" r="0.55" fill="#000" />
          {/* Botão home (contorno) */}
          <rect x="10" y="20" width="4" height="1.3" rx="0.65" fill="none" stroke="#000" strokeWidth="0.6" />
        </mask>
      </defs>
      <rect x="5" y="1.5" width="14" height="21" rx="2.4" fill={color} mask={`url(#${mascara})`} />
    </svg>
  );
}
