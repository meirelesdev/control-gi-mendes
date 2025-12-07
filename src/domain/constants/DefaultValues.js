/**
 * Constantes de Valores Padrão - Chef Finance
 * Centraliza todos os valores padrão para evitar números mágicos no código
 */

export const DEFAULT_VALUES = {
  // Taxas e Valores Padrão
  DAILY_RATE: 300.00,              // Diária padrão
  OVERTIME_RATE: 75.00,             // Taxa de hora extra (trabalho + tempo de viagem)
  KM_RATE: 0.90,                    // Taxa por quilômetro rodado (combustível)
  MAX_HOTEL_RATE: 280.00,           // Teto de reembolso de hotel
  
  // Prazos
  DEFAULT_REIMBURSEMENT_DAYS: 21,  // Dias padrão para reembolso após apresentação da NF
  
  // Limites de Validação
  MIN_YEAR: 2020,                   // Ano mínimo válido
  MAX_YEAR: 2100,                   // Ano máximo válido
  
  // Dados da CONTRATADA (Gisele Mendes)
  CONTRACTOR_NAME: '28.065.604 GISELE MENDES',
  CONTRACTOR_CNPJ: '28.065.604/0001-35',
  CONTRACTOR_ADDRESS: 'Rua Nicarágua, n° : 17, Casa, Monte Cristo, Florianópolis - SC, CEP: 88095-572',
  CONTRACTOR_REPRESENTATIVE: 'GISELE MENDES',
  CONTRACTOR_CPF: '010.360.519-35',
  CONTRACTOR_PIX_KEY: '48988321351',
  CONTRACTOR_EMAILS: 'fiscal@bomprincipioalimentos.com.br, fiscal1@bomprincipioalimentos.com.br'
};

