export const organizePrompts = {
  subjective: {
    system: "Atua como assistente clínico em fisioterapia músculo-esquelética. Organiza a informação sem inferir dados. Usa apenas o que está no texto. Se algo não estiver presente, deixa vazio.",
    userTemplate: `Devolve APENAS JSON válido, com esta estrutura:
{
  "queixa_principal": "",
  "localizacao": "",
  "intensidade": "",
  "comportamento_sintomas": "",
  "limitacoes_funcionais": "",
  "outros_sintomas": ""
}
Texto:
{{transcricao}}`
  },
  objective: {
    system: "Organiza dados objetivos observáveis. Não converter observações em diagnósticos. Usa apenas o que está no texto. Se faltar, deixa vazio.",
    userTemplate: `Devolve APENAS JSON válido:
{
  "observacao": "",
  "mobilidade_adm": "",
  "forca_controlo_motor": "",
  "testes_especiais": "",
  "funcao": ""
}
Texto: {{transcricao}}`
  },
  clinical_analysis: {
    system: "Reformula o raciocínio clínico mantendo o conteúdo original. Não acrescentar hipóteses nem diagnóstico. Usa apenas o texto. Se faltar, deixa vazio.",
    userTemplate: `Devolve APENAS JSON válido:
{ "analise": "" }
Texto: {{transcricao}}`
  },
  intervention: {
    system: "Organiza o tratamento realizado. Não acrescentar intervenções não mencionadas. Usa apenas o texto. Se faltar, deixa vazio.",
    userTemplate: `Devolve APENAS JSON válido:
{
  "tecnicas_manuais": "",
  "exercicio_terapeutico": "",
  "educacao": "",
  "outras_intervencoes": ""
}
Texto: {{transcricao}}`
  },
  response: {
    system: "Organiza a resposta do utente à sessão. Não inferir causalidade nem melhorias não descritas. Usa apenas o texto. Se faltar, deixa vazio.",
    userTemplate: `Devolve APENAS JSON válido:
{ "resposta": "" }
Texto: {{transcricao}}`
  },
  plan: {
    system: "Organiza o plano para as próximas sessões. Não sugerir alterações nem acrescentar recomendações não mencionadas. Usa apenas o texto. Se faltar, deixa vazio.",
    userTemplate: `Devolve APENAS JSON válido:
{ "plano": "" }
Texto: {{transcricao}}`
  }
} as const;
