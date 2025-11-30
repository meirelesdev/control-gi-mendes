/**
 * Entidade de Domínio: Configuração
 * Armazena configurações do sistema (taxas, valores padrão)
 */
class Configuracao {
  constructor() {
    this.precoKm = 0.90;
    this.precoHoraViagem = 75.00;
    this.updatedAt = new Date().toISOString();
  }

  static criar() {
    return new Configuracao();
  }

  atualizar(precoKm, precoHoraViagem) {
    if (precoKm !== undefined && precoKm !== null) {
      this.precoKm = parseFloat(precoKm);
    }
    if (precoHoraViagem !== undefined && precoHoraViagem !== null) {
      this.precoHoraViagem = parseFloat(precoHoraViagem);
    }
    this.updatedAt = new Date().toISOString();
  }

  calcularValorKm(distancia) {
    return distancia * this.precoKm;
  }

  calcularValorTempoViagem(horas) {
    return horas * this.precoHoraViagem;
  }
}

