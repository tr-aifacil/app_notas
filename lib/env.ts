/**
 * Retorna o valor de uma variável de ambiente obrigatória.
 * Lança um erro claro se a variável não estiver configurada,
 * em vez de falhar silenciosamente mais tarde.
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória não configurada: "${key}". Verifica o ficheiro .env.local.`
    );
  }
  return value;
}

/**
 * URL pública base da app para redirects de autenticação.
 * Em produção deve ser definida por NEXT_PUBLIC_APP_URL.
 * Em desenvolvimento permite fallback para a origin atual do browser.
 */
export function getPublicAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");

  if (appUrl) {
    return appUrl;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  throw new Error(
    'Variável de ambiente obrigatória não configurada: "NEXT_PUBLIC_APP_URL".'
  );
}
