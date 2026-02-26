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
