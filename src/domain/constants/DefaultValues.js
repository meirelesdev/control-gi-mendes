/**
 * Constantes de Valores Padrão - Chef Finance
 * Centraliza todos os valores padrão para evitar números mágicos no código
 */

export const DEFAULT_VALUES = {
  // Taxas e Valores Padrão
  DAILY_RATE: 300.00,              // Diária padrão
  OVERTIME_RATE: 75.00,             // Taxa de hora extra / tempo de viagem
  KM_RATE: 0.90,                    // Taxa por quilômetro rodado
  TRAVEL_TIME_RATE: 75.00,          // Taxa por hora de viagem (mesma que hora extra)
  MAX_HOTEL_RATE: 280.00,           // Teto de reembolso de hotel
  
  // Prazos
  DEFAULT_REIMBURSEMENT_DAYS: 21,  // Dias padrão para reembolso após apresentação da NF
  
  // Limites de Validação
  MIN_YEAR: 2020,                   // Ano mínimo válido
  MAX_YEAR: 2100                    // Ano máximo válido
};

