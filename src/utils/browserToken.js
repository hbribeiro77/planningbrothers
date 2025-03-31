// Chave para armazenar o token no localStorage
const LOCALSTORAGE_TOKEN_KEY = 'planningBrothersToken';

// Função para obter o nome do navegador
export function getBrowserName() {
  const userAgent = window.navigator.userAgent;
  let browserName;

  if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox";
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    browserName = "Opera";
  } else if (userAgent.indexOf("Trident") > -1) {
    browserName = "Internet Explorer";
  } else if (userAgent.indexOf("Edge") > -1) {
    browserName = "Edge";
  } else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Safari";
  } else {
    browserName = "Unknown";
  }

  return browserName;
}

// Função para gerar um token aleatório
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Função para obter ou criar um token para o browser atual
export function getOrCreateToken() {
  const browserName = getBrowserName();
  let token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
  
  if (!token) {
    token = generateToken();
    localStorage.setItem(LOCALSTORAGE_TOKEN_KEY, token);
  }
  
  return {
    token,
    browserName
  };
}

// Função para limpar o token
export function clearToken() {
  localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
} 