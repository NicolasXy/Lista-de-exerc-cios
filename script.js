/* ==========================================================
   Painel de Estações — script.js
   Implementa os 6 sistemas descritos na prática, usando
   estrutura de decisão (if/else e switch), comandos de
   repetição (for/while) e funções em todas as estações.
   ========================================================== */

/* ---------- utilidades gerais ---------- */

function byId(id) {
  return document.getElementById(id);
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Verifica se um código já existe numa lista, percorrendo com FOR (repetição)
function codigoJaExiste(lista, campo, codigo) {
  for (let i = 0; i < lista.length; i++) {
    if (lista[i][campo].toLowerCase() === String(codigo).toLowerCase()) {
      return true;
    }
  }
  return false;
}

// Monta um "card" de estatística para o relatório
function statCard(label, value, sub) {
  return `<div class="stat">
      <span class="stat-label">${label}</span>
      <div class="stat-value">${value}${sub ? `<small>${sub}</small>` : ''}</div>
    </div>`;
}

function subtitle(text) {
  return `<div class="report-subtitle">${text}</div>`;
}

function setError(id, msg) {
  byId(id).textContent = msg || '';
}

function toggleEmptyMessage(tableId, emptyId, count) {
  byId(emptyId).style.display = count > 0 ? 'none' : 'block';
}

/* ==========================================================
   NAV MOBILE
   ========================================================== */
(function initNav() {
  const toggle = byId('navToggle');
  const nav = byId('stationNav');
  toggle.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  const links = nav.querySelectorAll('.station-link');
  for (let i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function () {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }
})();

/* ==========================================================
   SIS-01 — FRETE
   ========================================================== */
(function estacaoFrete() {
  const pedidos = [];
  let precoLitro = null;

  byId('ex1-config-btn').addEventListener('click', function () {
    const valor = parseFloat(byId('ex1-litro').value);
    const status = byId('ex1-config-status');
    if (isNaN(valor) || valor <= 0) {
      status.textContent = 'Informe um preço de combustível válido.';
      status.classList.remove('ok');
      return;
    }
    precoLitro = valor;
    status.textContent = `Preço do litro aplicado: ${formatBRL(precoLitro)} — pode cadastrar pedidos.`;
    status.classList.add('ok');
  });

  // Retorna o preço por peça de acordo com a região (decisão: switch)
  function precoPorRegiao(regiao) {
    switch (regiao) {
      case '1': return 1.20;
      case '2': return 1.30;
      case '3': return 1.50;
      default: return 0;
    }
  }

  function nomeRegiao(regiao) {
    switch (regiao) {
      case '1': return 'Sudeste';
      case '2': return 'Sul';
      case '3': return 'Centro-Oeste';
      default: return '—';
    }
  }

  // Calcula o custo das peças aplicando desconto de 12% no excedente (decisão: if/else)
  function custoPecas(qtd, precoUnit) {
    if (qtd <= 1000) {
      return qtd * precoUnit;
    } else {
      const dentro = 1000 * precoUnit;
      const excedente = (qtd - 1000) * precoUnit * 0.88; // 12% de desconto
      return dentro + excedente;
    }
  }

  byId('ex1-form').addEventListener('submit', function (e) {
    e.preventDefault();
    setError('ex1-error', '');

    if (precoLitro === null) {
      setError('ex1-error', 'Aplique a configuração (preço do combustível) antes de lançar pedidos.');
      return;
    }

    const codigo = byId('ex1-codigo').value.trim();
    const regiao = byId('ex1-regiao').value;
    const distancia = parseFloat(byId('ex1-distancia').value);
    const qtd = parseInt(byId('ex1-qtd').value, 10);
    const rastreio = byId('ex1-rastreio').checked;

    if (!codigo || isNaN(distancia) || isNaN(qtd) || qtd <= 0 || distancia < 0) {
      setError('ex1-error', 'Preencha todos os campos corretamente.');
      return;
    }
    if (codigoJaExiste(pedidos, 'codigo', codigo)) {
      setError('ex1-error', `O código "${codigo}" já foi utilizado.`);
      return;
    }

    const precoUnit = precoPorRegiao(regiao);
    const valorPecas = custoPecas(qtd, precoUnit);
    const valorKm = distancia * precoLitro;
    const valorRastreio = rastreio ? 200 : 0;
    const total = valorPecas + valorKm + valorRastreio;

    pedidos.push({ codigo, regiao, distancia, qtd, rastreio, total });
    renderTabelaFrete();
    this.reset();
  });

  function renderTabelaFrete() {
    const tbody = byId('ex1-table').querySelector('tbody');
    tbody.innerHTML = '';
    for (let i = 0; i < pedidos.length; i++) {
      const p = pedidos[i];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.codigo}</td><td>${nomeRegiao(p.regiao)}</td>
        <td>${p.distancia} km</td><td>${p.qtd}</td>
        <td>${p.rastreio ? 'Sim' : 'Não'}</td><td>${formatBRL(p.total)}</td>`;
      tbody.appendChild(tr);
    }
    toggleEmptyMessage('ex1-table', 'ex1-empty', pedidos.length);
  }

  byId('ex1-report-btn').addEventListener('click', function () {
    const box = byId('ex1-report');
    if (pedidos.length === 0) {
      box.innerHTML = '';
      return;
    }

    let somaTotal = 0;
    const totalPorRegiao = {};
    let maisCaro = pedidos[0];
    let maisBarato = pedidos[0];

    // Percorre todos os pedidos com FOR para consolidar o relatório
    for (let i = 0; i < pedidos.length; i++) {
      const p = pedidos[i];
      somaTotal += p.total;

      const chaveRegiao = nomeRegiao(p.regiao);
      if (totalPorRegiao[chaveRegiao] === undefined) {
        totalPorRegiao[chaveRegiao] = 0;
      }
      totalPorRegiao[chaveRegiao] += p.total;

      if (p.total > maisCaro.total) maisCaro = p;
      if (p.total < maisBarato.total) maisBarato = p;
    }

    const media = somaTotal / pedidos.length;

    let html = '<div class="report-grid">';
    html += statCard('Total de pedidos', pedidos.length);
    html += statCard('Valor médio por pedido', formatBRL(media));
    html += statCard('Pedido mais caro', maisCaro.codigo, formatBRL(maisCaro.total));
    html += statCard('Pedido mais barato', maisBarato.codigo, formatBRL(maisBarato.total));
    html += '</div>';

    html += subtitle('Valor total acumulado por região');
    html += '<div class="report-grid">';
    for (const regiao in totalPorRegiao) {
      html += statCard(regiao, formatBRL(totalPorRegiao[regiao]));
    }
    html += '</div>';

    box.innerHTML = html;
  });
})();

/* ==========================================================
   SIS-02 — FOLHA DE PAGAMENTO
   ========================================================== */
(function estacaoFolha() {
  const funcionarios = [];
  let salarioMinimo = null;

  byId('ex2-config-btn').addEventListener('click', function () {
    const valor = parseFloat(byId('ex2-salmin').value);
    const status = byId('ex2-config-status');
    if (isNaN(valor) || valor <= 0) {
      status.textContent = 'Informe um salário mínimo válido.';
      status.classList.remove('ok');
      return;
    }
    salarioMinimo = valor;
    status.textContent = `Salário mínimo aplicado: ${formatBRL(salarioMinimo)} — pode cadastrar funcionários.`;
    status.classList.add('ok');
  });

  // Percentual da hora trabalhada conforme categoria + turno (decisão: switch aninhado)
  function percentualHora(categoria, turno) {
    switch (categoria) {
      case 'F':
        switch (turno) {
          case 'M': return 0.10;
          case 'V': return 0.15;
          case 'N': return 0.20;
        }
        break;
      case 'G':
        switch (turno) {
          case 'M': return 0.30;
          case 'V': return 0.35;
          case 'N': return 0.40;
        }
        break;
    }
    return 0;
  }

  // Percentual do auxílio-alimentação de acordo com faixa salarial (decisão: if/else if)
  function percentualAuxilio(salarioInicial) {
    if (salarioInicial <= 800) {
      return 0.25;
    } else if (salarioInicial <= 1200) {
      return 0.20;
    } else {
      return 0.15;
    }
  }

  // Percentual de bônus por desempenho (decisão: if/else if)
  function percentualBonus(nota) {
    if (nota >= 9) {
      return 0.10;
    } else if (nota >= 7) {
      return 0.05;
    } else if (nota >= 5) {
      return 0.02;
    } else {
      return 0;
    }
  }

  byId('ex2-form').addEventListener('submit', function (e) {
    e.preventDefault();
    setError('ex2-error', '');

    if (salarioMinimo === null) {
      setError('ex2-error', 'Aplique a configuração (salário mínimo) antes de cadastrar.');
      return;
    }

    const codigo = byId('ex2-codigo').value.trim();
    const horas = parseFloat(byId('ex2-horas').value);
    const categoria = byId('ex2-categoria').value;
    const turno = byId('ex2-turno').value;
    const nota = parseFloat(byId('ex2-nota').value);

    if (!codigo || isNaN(horas) || horas < 0 || isNaN(nota) || nota < 0 || nota > 10) {
      setError('ex2-error', 'Preencha todos os campos corretamente (nota entre 0 e 10).');
      return;
    }
    if (codigoJaExiste(funcionarios, 'codigo', codigo)) {
      setError('ex2-error', `O código "${codigo}" já foi utilizado.`);
      return;
    }

    const percHora = percentualHora(categoria, turno);
    const salarioInicial = horas * (percHora * salarioMinimo);
    const auxAlimentacao = salarioInicial * percentualAuxilio(salarioInicial);
    const bonusPerc = percentualBonus(nota);
    const bonus = salarioInicial * bonusPerc;
    const salarioFinal = salarioInicial + auxAlimentacao + bonus;

    funcionarios.push({ codigo, categoria, turno, nota, salarioInicial, salarioFinal, bonusPerc });
    renderTabelaFolha();
    this.reset();
  });

  function renderTabelaFolha() {
    const tbody = byId('ex2-table').querySelector('tbody');
    tbody.innerHTML = '';
    for (let i = 0; i < funcionarios.length; i++) {
      const f = funcionarios[i];
      const tr = document.createElement('tr');
      const categoriaTxt = f.categoria === 'F' ? 'Operacional' : 'Gerente';
      tr.innerHTML = `<td>${f.codigo}</td><td>${categoriaTxt}</td><td>${f.turno}</td>
        <td>${f.nota.toFixed(1)}</td><td>${formatBRL(f.salarioInicial)}</td>
        <td>${formatBRL(f.salarioFinal)}</td>`;
      tbody.appendChild(tr);
    }
    toggleEmptyMessage('ex2-table', 'ex2-empty', funcionarios.length);
  }

  byId('ex2-report-btn').addEventListener('click', function () {
    const box = byId('ex2-report');
    if (funcionarios.length === 0) {
      box.innerHTML = '';
      return;
    }

    let somaGeral = 0;
    let somaF = 0, qtdF = 0, somaG = 0, qtdG = 0;
    let maior = funcionarios[0];
    let menor = funcionarios[0];
    const faixasBonus = { 10: 0, 5: 0, 2: 0, 0: 0 };

    for (let i = 0; i < funcionarios.length; i++) {
      const f = funcionarios[i];
      somaGeral += f.salarioFinal;

      if (f.categoria === 'F') {
        somaF += f.salarioFinal;
        qtdF++;
      } else {
        somaG += f.salarioFinal;
        qtdG++;
      }

      if (f.salarioFinal > maior.salarioFinal) maior = f;
      if (f.salarioFinal < menor.salarioFinal) menor = f;

      const chaveFaixa = Math.round(f.bonusPerc * 100);
      if (faixasBonus[chaveFaixa] === undefined) faixasBonus[chaveFaixa] = 0;
      faixasBonus[chaveFaixa]++;
    }

    const categoriaTxt = (c) => (c === 'F' ? 'Operacional' : 'Gerente');

    let html = '<div class="report-grid">';
    html += statCard('Funcionários cadastrados', funcionarios.length);
    html += statCard('Média salarial geral', formatBRL(somaGeral / funcionarios.length));
    html += statCard('Média — Operacionais', qtdF ? formatBRL(somaF / qtdF) : '—');
    html += statCard('Média — Gerentes', qtdG ? formatBRL(somaG / qtdG) : '—');
    html += '</div>';

    html += subtitle('Extremos salariais');
    html += '<div class="report-grid">';
    html += statCard('Maior salário final', maior.codigo,
      `${categoriaTxt(maior.categoria)} · turno ${maior.turno} · ${formatBRL(maior.salarioFinal)}`);
    html += statCard('Menor salário final', menor.codigo,
      `${categoriaTxt(menor.categoria)} · turno ${menor.turno} · ${formatBRL(menor.salarioFinal)}`);
    html += '</div>';

    html += subtitle('Distribuição de bônus por desempenho');
    html += '<div class="report-grid">';
    html += statCard('Bônus de 10%', faixasBonus[10] || 0);
    html += statCard('Bônus de 5%', faixasBonus[5] || 0);
    html += statCard('Bônus de 2%', faixasBonus[2] || 0);
    html += statCard('Sem bônus', faixasBonus[0] || 0);
    html += '</div>';

    box.innerHTML = html;
  });
})();

/* ==========================================================
   SIS-03 — PRODUÇÃO E ESTOQUE
   ========================================================== */
(function estacaoProducao() {
  const ordens = [];

  function nomeTipo(tipo) {
    switch (tipo) {
      case '1': return 'Padrão';
      case '2': return 'Premium';
      case '3': return 'Sob encomenda';
      default: return '—';
    }
  }

  // Ajusta o custo unitário de acordo com o tipo de produto (decisão: switch)
  function custoAjustado(tipo, custoBase) {
    switch (tipo) {
      case '1': return custoBase;
      case '2': return custoBase * 1.10;
      case '3': return custoBase * 1.20;
      default: return custoBase;
    }
  }

  // Classifica o alerta de estoque (decisão: if/else if)
  function alertaEstoque(estoqueFinal) {
    if (estoqueFinal > 5000) {
      return { classe: 'alerta alto', css: 'alert-high' };
    } else if (estoqueFinal < 500) {
      return { classe: 'alerta crítico', css: 'alert-crit' };
    } else {
      return { classe: 'normal', css: '' };
    }
  }

  byId('ex3-form').addEventListener('submit', function (e) {
    e.preventDefault();
    setError('ex3-error', '');

    const codigo = byId('ex3-codigo').value.trim();
    const produto = byId('ex3-produto').value.trim();
    const tipo = byId('ex3-tipo').value;
    const qtdProd = parseInt(byId('ex3-qtdprod').value, 10);
    const custoBase = parseFloat(byId('ex3-custo').value);
    const estInicial = parseInt(byId('ex3-estinicial').value, 10);

    if (!codigo || !produto || isNaN(qtdProd) || qtdProd <= 0 ||
        isNaN(custoBase) || custoBase < 0 || isNaN(estInicial) || estInicial < 0) {
      setError('ex3-error', 'Preencha todos os campos corretamente.');
      return;
    }
    if (codigoJaExiste(ordens, 'codigo', codigo)) {
      setError('ex3-error', `O código de ordem "${codigo}" já foi utilizado.`);
      return;
    }

    const estoqueFinal = estInicial + qtdProd;
    const unitAjustado = custoAjustado(tipo, custoBase);
    const custoTotal = qtdProd * unitAjustado;
    const alerta = alertaEstoque(estoqueFinal);

    ordens.push({ codigo, produto, tipo, estoqueFinal, custoTotal, alerta });
    renderTabelaProducao();
    this.reset();
  });

  function renderTabelaProducao() {
    const tbody = byId('ex3-table').querySelector('tbody');
    tbody.innerHTML = '';
    for (let i = 0; i < ordens.length; i++) {
      const o = ordens[i];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${o.codigo}</td><td>${o.produto}</td><td>${nomeTipo(o.tipo)}</td>
        <td>${o.estoqueFinal}</td><td class="${o.alerta.css}">${o.alerta.classe}</td>
        <td>${formatBRL(o.custoTotal)}</td>`;
      tbody.appendChild(tr);
    }
    toggleEmptyMessage('ex3-table', 'ex3-empty', ordens.length);
  }

  byId('ex3-report-btn').addEventListener('click', function () {
    const box = byId('ex3-report');
    if (ordens.length === 0) {
      box.innerHTML = '';
      return;
    }

    const estoquePorTipo = {};
    let somaCusto = 0;
    let maiorCusto = ordens[0];
    let menorCusto = ordens[0];
    let qtdAlto = 0, qtdCritico = 0;
    const porProduto = {};

    for (let i = 0; i < ordens.length; i++) {
      const o = ordens[i];
      const tipoNome = nomeTipo(o.tipo);

      if (estoquePorTipo[tipoNome] === undefined) estoquePorTipo[tipoNome] = 0;
      estoquePorTipo[tipoNome] += o.estoqueFinal;

      somaCusto += o.custoTotal;

      if (o.custoTotal > maiorCusto.custoTotal) maiorCusto = o;
      if (o.custoTotal < menorCusto.custoTotal) menorCusto = o;

      if (o.alerta.css === 'alert-high') qtdAlto++;
      if (o.alerta.css === 'alert-crit') qtdCritico++;

      if (porProduto[o.produto] === undefined) {
        porProduto[o.produto] = { estoque: 0, investido: 0 };
      }
      porProduto[o.produto].estoque += o.estoqueFinal;
      porProduto[o.produto].investido += o.custoTotal;
    }

    let html = '<div class="report-grid">';
    html += statCard('Total de ordens', ordens.length);
    html += statCard('Média de custo por ordem', formatBRL(somaCusto / ordens.length));
    html += statCard('Maior custo total', maiorCusto.codigo, formatBRL(maiorCusto.custoTotal));
    html += statCard('Menor custo total', menorCusto.codigo, formatBRL(menorCusto.custoTotal));
    html += statCard('Alertas de estoque alto', qtdAlto);
    html += statCard('Alertas de estoque crítico', qtdCritico);
    html += '</div>';

    html += subtitle('Estoque final por tipo de produto');
    html += '<div class="report-grid">';
    for (const tipo in estoquePorTipo) {
      html += statCard(tipo, `${estoquePorTipo[tipo]} un.`);
    }
    html += '</div>';

    html += subtitle('Consolidado por código de produto');
    html += '<div class="report-grid">';
    for (const cod in porProduto) {
      html += statCard(cod, `${porProduto[cod].estoque} un.`, `Investido: ${formatBRL(porProduto[cod].investido)}`);
    }
    html += '</div>';

    box.innerHTML = html;
  });
})();

/* ==========================================================
   SIS-04 — RESERVAS DE HOTEL
   ========================================================== */
(function estacaoHotel() {
  const reservas = [];
  let diariaBase = null;
  let valorCafe = null;

  byId('ex4-config-btn').addEventListener('click', function () {
    const diaria = parseFloat(byId('ex4-diaria').value);
    const cafe = parseFloat(byId('ex4-cafe').value);
    const status = byId('ex4-config-status');
    if (isNaN(diaria) || diaria <= 0 || isNaN(cafe) || cafe < 0) {
      status.textContent = 'Informe valores válidos para diária e café da manhã.';
      status.classList.remove('ok');
      return;
    }
    diariaBase = diaria;
    valorCafe = cafe;
    status.textContent = `Diária base ${formatBRL(diariaBase)} · café ${formatBRL(valorCafe)} aplicados.`;
    status.classList.add('ok');
  });

  function nomeTipoQuarto(t) {
    switch (t) {
      case 'S': return 'Standard';
      case 'L': return 'Luxo';
      case 'P': return 'Premium';
      default: return '—';
    }
  }
  function nomeTemporada(t) {
    switch (t) {
      case 'B': return 'Baixa';
      case 'A': return 'Alta';
      case 'F': return 'Feriado';
      default: return '—';
    }
  }

  // Multiplicador do tipo de quarto (decisão: switch)
  function multiplicadorTipo(tipo) {
    switch (tipo) {
      case 'S': return 1.00;
      case 'L': return 1.50;
      case 'P': return 2.00;
      default: return 1.00;
    }
  }

  // Acréscimo por temporada (decisão: switch)
  function acrescimoTemporada(temporada) {
    switch (temporada) {
      case 'B': return 0;
      case 'A': return 0.25;
      case 'F': return 0.40;
      default: return 0;
    }
  }

  byId('ex4-form').addEventListener('submit', function (e) {
    e.preventDefault();
    setError('ex4-error', '');

    if (diariaBase === null) {
      setError('ex4-error', 'Aplique a configuração (diária e café) antes de lançar reservas.');
      return;
    }

    const codigo = byId('ex4-codigo').value.trim();
    const tipo = byId('ex4-tipo').value;
    const temporada = byId('ex4-temporada').value;
    const diarias = parseInt(byId('ex4-diarias').value, 10);
    const hospedes = parseInt(byId('ex4-hospedes').value, 10);
    const cafeIncluso = byId('ex4-incluicafe').checked;

    if (!codigo || isNaN(diarias) || diarias <= 0 || isNaN(hospedes) || hospedes <= 0) {
      setError('ex4-error', 'Preencha todos os campos corretamente.');
      return;
    }
    if (codigoJaExiste(reservas, 'codigo', codigo)) {
      setError('ex4-error', `O código de reserva "${codigo}" já foi utilizado.`);
      return;
    }

    const diariaAjustada = diariaBase * multiplicadorTipo(tipo);
    const diariaFinal = diariaAjustada * (1 + acrescimoTemporada(temporada));
    const cafeTotal = cafeIncluso ? valorCafe * hospedes * diarias : 0;
    const valorTotal = diariaFinal * diarias + cafeTotal;

    reservas.push({ codigo, tipo, temporada, diarias, hospedes, cafeIncluso, valorTotal });
    renderTabelaHotel();
    this.reset();
  });

  function renderTabelaHotel() {
    const tbody = byId('ex4-table').querySelector('tbody');
    tbody.innerHTML = '';
    for (let i = 0; i < reservas.length; i++) {
      const r = reservas[i];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.codigo}</td><td>${nomeTipoQuarto(r.tipo)}</td><td>${nomeTemporada(r.temporada)}</td>
        <td>${r.diarias}</td><td>${r.hospedes}</td><td>${formatBRL(r.valorTotal)}</td>`;
      tbody.appendChild(tr);
    }
    toggleEmptyMessage('ex4-table', 'ex4-empty', reservas.length);
  }

  byId('ex4-report-btn').addEventListener('click', function () {
    const box = byId('ex4-report');
    if (reservas.length === 0) {
      box.innerHTML = '';
      return;
    }

    let somaTotal = 0;
    const totalPorTipo = { Standard: 0, Luxo: 0, Premium: 0 };
    const totalPorTemporada = { Baixa: 0, Alta: 0, Feriado: 0 };
    let maisCara = reservas[0];
    let maisBarata = reservas[0];
    let comCafe = 0, semCafe = 0;
    let ocupacaoTotal = 0;
    let hospedesTotal = 0;

    for (let i = 0; i < reservas.length; i++) {
      const r = reservas[i];
      somaTotal += r.valorTotal;
      totalPorTipo[nomeTipoQuarto(r.tipo)] += r.valorTotal;
      totalPorTemporada[nomeTemporada(r.temporada)] += r.valorTotal;

      if (r.valorTotal > maisCara.valorTotal) maisCara = r;
      if (r.valorTotal < maisBarata.valorTotal) maisBarata = r;

      if (r.cafeIncluso) comCafe++; else semCafe++;

      ocupacaoTotal += r.diarias * r.hospedes;
      hospedesTotal += r.hospedes;
    }

    let html = '<div class="report-grid">';
    html += statCard('Total de reservas', reservas.length);
    html += statCard('Valor médio por reserva', formatBRL(somaTotal / reservas.length));
    html += statCard('Ocupação total (diárias × hóspedes)', ocupacaoTotal);
    html += statCard('Valor médio por hóspede', formatBRL(somaTotal / hospedesTotal));
    html += '</div>';

    html += subtitle('Extremos de valor');
    html += '<div class="report-grid">';
    html += statCard('Reserva mais cara', maisCara.codigo,
      `${nomeTipoQuarto(maisCara.tipo)} · ${nomeTemporada(maisCara.temporada)} · ${maisCara.hospedes} hóspede(s) · ${formatBRL(maisCara.valorTotal)}`);
    html += statCard('Reserva mais barata', maisBarata.codigo,
      `${nomeTipoQuarto(maisBarata.tipo)} · ${nomeTemporada(maisBarata.temporada)} · ${maisBarata.hospedes} hóspede(s) · ${formatBRL(maisBarata.valorTotal)}`);
    html += statCard('Reservas com café incluso', comCafe);
    html += statCard('Reservas sem café', semCafe);
    html += '</div>';

    html += subtitle('Valor total por tipo de quarto');
    html += '<div class="report-grid">';
    for (const tipo in totalPorTipo) html += statCard(tipo, formatBRL(totalPorTipo[tipo]));
    html += '</div>';

    html += subtitle('Valor total por temporada');
    html += '<div class="report-grid">';
    for (const temp in totalPorTemporada) html += statCard(temp, formatBRL(totalPorTemporada[temp]));
    html += '</div>';

    box.innerHTML = html;
  });
})();

/* ==========================================================
   SIS-05 — TREINOS ESPORTIVOS
   ========================================================== */
(function estacaoTreinos() {
  const treinos = [];
  let cargaMaxima = null;

  byId('ex5-config-btn').addEventListener('click', function () {
    const valor = parseFloat(byId('ex5-cargamax').value);
    const status = byId('ex5-config-status');
    if (isNaN(valor) || valor <= 0) {
      status.textContent = 'Informe uma carga máxima válida.';
      status.classList.remove('ok');
      return;
    }
    cargaMaxima = valor;
    status.textContent = `Carga máxima semanal aplicada: ${cargaMaxima} pontos.`;
    status.classList.add('ok');
  });

  function nomePosicao(p) {
    switch (p) {
      case 'G': return 'Goleiro';
      case 'Z': return 'Zagueiro';
      case 'M': return 'Meio-campo';
      case 'A': return 'Atacante';
      default: return '—';
    }
  }
  function nomeTipoTreino(t) {
    switch (t) {
      case 'F': return 'Físico';
      case 'T': return 'Técnico';
      case 'E': return 'Estratégico';
      default: return '—';
    }
  }

  // Multiplicador de carga por tipo de treino (decisão: switch)
  function multiplicadorTipoTreino(tipo) {
    switch (tipo) {
      case 'F': return 1.5;
      case 'T': return 1.2;
      case 'E': return 1.0;
      default: return 1.0;
    }
  }

  // Valida intensidade dentro do intervalo permitido usando WHILE (repetição)
  function intensidadeValida(intensidade) {
    let i = 1;
    let valido = false;
    while (i <= 10) {
      if (i === intensidade) {
        valido = true;
        break;
      }
      i++;
    }
    return valido;
  }

  byId('ex5-form').addEventListener('submit', function (e) {
    e.preventDefault();
    setError('ex5-error', '');

    if (cargaMaxima === null) {
      setError('ex5-error', 'Aplique a configuração (carga máxima semanal) antes de cadastrar treinos.');
      return;
    }

    const codigo = byId('ex5-codigo').value.trim();
    const jogador = byId('ex5-jogador').value.trim();
    const posicao = byId('ex5-posicao').value;
    const tipo = byId('ex5-tipo').value;
    const duracao = parseFloat(byId('ex5-duracao').value);
    const intensidade = parseInt(byId('ex5-intensidade').value, 10);

    if (!codigo || !jogador || isNaN(duracao) || duracao <= 0 || isNaN(intensidade)) {
      setError('ex5-error', 'Preencha todos os campos corretamente.');
      return;
    }
    if (!intensidadeValida(intensidade)) {
      setError('ex5-error', 'A intensidade deve ser um número inteiro entre 1 e 10.');
      return;
    }
    if (codigoJaExiste(treinos, 'codigo', codigo)) {
      setError('ex5-error', `O código de treino "${codigo}" já foi utilizado.`);
      return;
    }

    const carga = (duracao / 10) * intensidade * multiplicadorTipoTreino(tipo);

    treinos.push({ codigo, jogador, posicao, tipo, carga });
    renderTabelaTreinos();
    this.reset();
  });

  function renderTabelaTreinos() {
    const tbody = byId('ex5-table').querySelector('tbody');
    tbody.innerHTML = '';
    for (let i = 0; i < treinos.length; i++) {
      const t = treinos[i];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${t.codigo}</td><td>${t.jogador}</td><td>${nomePosicao(t.posicao)}</td>
        <td>${nomeTipoTreino(t.tipo)}</td><td>${t.carga.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    }
    toggleEmptyMessage('ex5-table', 'ex5-empty', treinos.length);
  }

  byId('ex5-report-btn').addEventListener('click', function () {
    const box = byId('ex5-report');
    if (treinos.length === 0) {
      box.innerHTML = '';
      return;
    }

    const porJogador = {};
    const somaPorTipo = { Físico: 0, Técnico: 0, Estratégico: 0 };
    const qtdPorTipo = { Físico: 0, Técnico: 0, Estratégico: 0 };
    const porPosicao = {};

    for (let i = 0; i < treinos.length; i++) {
      const t = treinos[i];

      if (porJogador[t.jogador] === undefined) {
        porJogador[t.jogador] = { carga: 0, qtd: 0, posicao: t.posicao };
      }
      porJogador[t.jogador].carga += t.carga;
      porJogador[t.jogador].qtd++;

      const tipoNome = nomeTipoTreino(t.tipo);
      somaPorTipo[tipoNome] += t.carga;
      qtdPorTipo[tipoNome]++;

      const posNome = nomePosicao(t.posicao);
      if (porPosicao[posNome] === undefined) porPosicao[posNome] = { qtd: 0, carga: 0 };
      porPosicao[posNome].qtd++;
      porPosicao[posNome].carga += t.carga;
    }

    let maiorNome = null, menorNome = null, qtdRisco = 0;
    for (const nome in porJogador) {
      const j = porJogador[nome];
      if (maiorNome === null || j.carga > porJogador[maiorNome].carga) maiorNome = nome;
      if (menorNome === null || j.carga < porJogador[menorNome].carga) menorNome = nome;
      if (j.carga > cargaMaxima) qtdRisco++;
    }

    let html = '<div class="report-grid">';
    html += statCard('Total de treinos', treinos.length);
    html += statCard('Jogadores com risco de lesão', qtdRisco, `Limite: ${cargaMaxima} pts/semana`);
    html += statCard('Jogador com maior carga', maiorNome,
      `${nomePosicao(porJogador[maiorNome].posicao)} · ${porJogador[maiorNome].qtd} treino(s) · ${porJogador[maiorNome].carga.toFixed(2)} pts`);
    html += statCard('Jogador com menor carga', menorNome,
      `${nomePosicao(porJogador[menorNome].posicao)} · ${porJogador[menorNome].qtd} treino(s) · ${porJogador[menorNome].carga.toFixed(2)} pts`);
    html += '</div>';

    html += subtitle('Carga semanal por jogador');
    html += '<div class="report-grid">';
    for (const nome in porJogador) {
      html += statCard(nome, `${porJogador[nome].carga.toFixed(2)} pts`, `${porJogador[nome].qtd} treino(s)`);
    }
    html += '</div>';

    html += subtitle('Carga média por tipo de treino');
    html += '<div class="report-grid">';
    for (const tipo in somaPorTipo) {
      const media = qtdPorTipo[tipo] ? somaPorTipo[tipo] / qtdPorTipo[tipo] : 0;
      html += statCard(tipo, media.toFixed(2));
    }
    html += '</div>';

    html += subtitle('Total de treinos e carga média por posição');
    html += '<div class="report-grid">';
    for (const pos in porPosicao) {
      html += statCard(pos, `${porPosicao[pos].qtd} treino(s)`, `Média: ${(porPosicao[pos].carga / porPosicao[pos].qtd).toFixed(2)} pts`);
    }
    html += '</div>';

    box.innerHTML = html;
  });
})();

/* ==========================================================
   SIS-06 — VENDAS, COMISSÕES E METAS
   ========================================================== */
(function estacaoVendas() {
  const vendas = [];
  let meta = null;
  let percBase = null;

  byId('ex6-config-btn').addEventListener('click', function () {
    const metaValor = parseFloat(byId('ex6-meta').value);
    const perc = parseFloat(byId('ex6-percbase').value);
    const status = byId('ex6-config-status');
    if (isNaN(metaValor) || metaValor <= 0 || isNaN(perc) || perc < 0) {
      status.textContent = 'Informe meta e percentual base válidos.';
      status.classList.remove('ok');
      return;
    }
    meta = metaValor;
    percBase = perc / 100;
    status.textContent = `Meta ${formatBRL(meta)} · comissão base ${perc}% aplicadas.`;
    status.classList.add('ok');
  });

  function nomeRegiaoLoja(r) {
    switch (r) {
      case '1': return 'Norte';
      case '2': return 'Nordeste';
      case '3': return 'Sudeste';
      case '4': return 'Sul';
      default: return '—';
    }
  }

  // Bônus percentual por tipo de cliente (decisão: if/else)
  function bonusTipoCliente(tipo) {
    if (tipo === 'PF') {
      return 0.02;
    } else {
      return 0.03;
    }
  }

  // Bônus percentual por região da loja (decisão: switch)
  function bonusRegiao(regiao) {
    switch (regiao) {
      case '1': // Norte
      case '2': // Nordeste
        return 0.01;
      case '3': // Sudeste
        return 0;
      case '4': // Sul
        return 0.005;
      default:
        return 0;
    }
  }

  byId('ex6-form').addEventListener('submit', function (e) {
    e.preventDefault();
    setError('ex6-error', '');

    if (meta === null) {
      setError('ex6-error', 'Aplique a configuração (meta e comissão base) antes de lançar vendas.');
      return;
    }

    const codigo = byId('ex6-codigo').value.trim();
    const vendedor = byId('ex6-vendedor').value.trim();
    const regiao = byId('ex6-regiao').value;
    const valorVenda = parseFloat(byId('ex6-valor').value);
    const tipoCliente = byId('ex6-cliente').value;

    if (!codigo || !vendedor || isNaN(valorVenda) || valorVenda <= 0) {
      setError('ex6-error', 'Preencha todos os campos corretamente.');
      return;
    }
    if (codigoJaExiste(vendas, 'codigo', codigo)) {
      setError('ex6-error', `O código de venda "${codigo}" já foi utilizado.`);
      return;
    }

    const comissaoBase = valorVenda * percBase;
    const bonusCliente = valorVenda * bonusTipoCliente(tipoCliente);
    const bonusReg = valorVenda * bonusRegiao(regiao);
    const comissaoTotal = comissaoBase + bonusCliente + bonusReg;

    vendas.push({ codigo, vendedor, regiao, valorVenda, tipoCliente, comissaoTotal });
    renderTabelaVendas();
    this.reset();
  });

  function renderTabelaVendas() {
    const tbody = byId('ex6-table').querySelector('tbody');
    tbody.innerHTML = '';
    for (let i = 0; i < vendas.length; i++) {
      const v = vendas[i];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${v.codigo}</td><td>${v.vendedor}</td><td>${nomeRegiaoLoja(v.regiao)}</td>
        <td>${v.tipoCliente}</td><td>${formatBRL(v.valorVenda)}</td><td>${formatBRL(v.comissaoTotal)}</td>`;
      tbody.appendChild(tr);
    }
    toggleEmptyMessage('ex6-table', 'ex6-empty', vendas.length);
  }

  byId('ex6-report-btn').addEventListener('click', function () {
    const box = byId('ex6-report');
    if (vendas.length === 0) {
      box.innerHTML = '';
      return;
    }

    const totalPorRegiao = { Norte: 0, Nordeste: 0, Sudeste: 0, Sul: 0 };
    const totalPorCliente = { PF: 0, PJ: 0 };
    const porVendedor = {};
    let somaComissao = 0;
    const comissaoPorRegiaoSoma = { Norte: 0, Nordeste: 0, Sudeste: 0, Sul: 0 };
    const comissaoPorRegiaoQtd = { Norte: 0, Nordeste: 0, Sudeste: 0, Sul: 0 };

    for (let i = 0; i < vendas.length; i++) {
      const v = vendas[i];
      const regNome = nomeRegiaoLoja(v.regiao);

      totalPorRegiao[regNome] += v.valorVenda;
      totalPorCliente[v.tipoCliente] += v.valorVenda;
      somaComissao += v.comissaoTotal;

      comissaoPorRegiaoSoma[regNome] += v.comissaoTotal;
      comissaoPorRegiaoQtd[regNome]++;

      if (porVendedor[v.vendedor] === undefined) {
        porVendedor[v.vendedor] = { totalVendido: 0, comissao: 0 };
      }
      porVendedor[v.vendedor].totalVendido += v.valorVenda;
      porVendedor[v.vendedor].comissao += v.comissaoTotal;
    }

    let melhorVendas = null, melhorComissao = null, qtdBateuMeta = 0;
    for (const vend in porVendedor) {
      const dados = porVendedor[vend];
      if (melhorVendas === null || dados.totalVendido > porVendedor[melhorVendas].totalVendido) melhorVendas = vend;
      if (melhorComissao === null || dados.comissao > porVendedor[melhorComissao].comissao) melhorComissao = vend;
      if (dados.totalVendido >= meta) qtdBateuMeta++;
    }

    let html = '<div class="report-grid">';
    html += statCard('Total de vendas registradas', vendas.length);
    html += statCard('Comissão média geral', formatBRL(somaComissao / vendas.length));
    html += statCard('Vendedores que bateram a meta', qtdBateuMeta, `Meta: ${formatBRL(meta)}`);
    html += '</div>';

    html += subtitle('Destaques por vendedor');
    html += '<div class="report-grid">';
    html += statCard('Maior valor total vendido', melhorVendas, formatBRL(porVendedor[melhorVendas].totalVendido));
    html += statCard('Maior comissão total', melhorComissao, formatBRL(porVendedor[melhorComissao].comissao));
    html += '</div>';

    html += subtitle('Valor total vendido por região');
    html += '<div class="report-grid">';
    for (const r in totalPorRegiao) html += statCard(r, formatBRL(totalPorRegiao[r]));
    html += '</div>';

    html += subtitle('Valor total vendido por tipo de cliente');
    html += '<div class="report-grid">';
    html += statCard('Pessoa Física', formatBRL(totalPorCliente.PF));
    html += statCard('Pessoa Jurídica', formatBRL(totalPorCliente.PJ));
    html += '</div>';

    html += subtitle('Comissão média por região');
    html += '<div class="report-grid">';
    for (const r in comissaoPorRegiaoSoma) {
      const qtd = comissaoPorRegiaoQtd[r];
      html += statCard(r, qtd ? formatBRL(comissaoPorRegiaoSoma[r] / qtd) : '—', qtd ? `${qtd} venda(s)` : 'sem vendas');
    }
    html += '</div>';

    box.innerHTML = html;
  });
})();
