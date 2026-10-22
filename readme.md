# Oceanun - E-commerce de Viagens

Repositório de controle e gestão documental do segundo trabalho das disciplinas de **Engenharia de Software 2** e **Projeto Integrador 2**.

O **Oceanun** é um sistema para uma agência de viagens que reúne funcionalidades de comércio eletrônico — consulta de catálogo, carrinho, checkout e pagamento — e ferramentas internas para atendimento, gestão de clientes, acompanhamento de pedidos e análise de vendas.

---

## Acessar o projeto

O site está hospedado no GitHub Pages:

[![Acessar o site — Oceanun](https://img.shields.io/badge/Acessar%20o%20site-Oceanun-0077B6?style=for-the-badge)](https://feliperobinson.github.io/E-commerce-Viagens/Website/index.html)

---

## Sobre o projeto

O sistema atende dois contextos principais:

### Para clientes
- Consultar quartos, hospedagens e pacotes de viagem, com fotos, descrições, preços e disponibilidade.
- Adicionar vários pacotes ao carrinho e acompanhar o subtotal.
- Criar e gerenciar o próprio cadastro, com validação dos dados.
- Conferir o resumo da compra no checkout, incluindo taxas e descontos aplicáveis.
- Realizar o pagamento por meio de integração com uma API de pagamento.
- Receber por e-mail a confirmação da reserva, o voucher, o código localizador e o comprovante em PDF após a aprovação do pagamento.

### Para a equipe da agência
- Administrar o catálogo de viagens, pacotes e hospedagens e atualizar preços, incluindo tarifas sazonais.
- Gerenciar pedidos e acompanhar seus status: **Aguardando Pagamento**, **Confirmado** ou **Cancelado**.
- Consultar clientes, seus dados e o histórico de atendimento.
- Cadastrar e atualizar clientes, registrar tarefas e lembretes e acompanhar o atendimento por fases do funil de vendas.
- Receber alertas sobre tarefas vencidas ou com vencimento no dia.
- Consultar relatórios de vendas, destinos mais procurados, faturamento bruto e comissões — funcionalidade restrita ao perfil **Gestor**.

O sistema interno utiliza autenticação por e-mail e senha e controle de acesso por perfil. Os perfis previstos são **Atendente** e **Gestor**. O cadastro de colaboradores e os relatórios de vendas são recursos restritos ao Gestor.

---

## Estrutura do repositório

```text
E-commerce-Viagens/
├── Interface/       # Protótipos e telas do sistema
├── MER/             # Modelo Entidade-Relacionamento
├── UML/             # Diagramas UML (casos de uso, classes etc.)
├── Website/         # Código-fonte do site
├── Oceanun.docx     # Documento principal do projeto
└── readme.md
```

| Pasta / arquivo | Conteúdo |
|---|---|
| `Interface` | Design e protótipos das telas |
| `MER` | Modelagem do banco de dados |
| `UML` | Diagramas de apoio à análise e ao projeto |
| `Website` | Implementação do site |
| `Oceanun.docx` | Documento principal com a especificação do projeto |

---

## Modelo de dados (resumo)

O modelo Entidade-Relacionamento documenta as principais estruturas de dados do sistema, incluindo:

| Entidade | Descrição |
|---|---|
| `usuario` | Colaboradores da agência, com perfil `Atendente` ou `Gestor` e controle de bloqueio de conta |
| `token_redefinicao` | Tokens de uso único e com validade para redefinição de senha |
| `etapa_funil` | Etapas do funil de vendas |
| `cliente` | Clientes, com CPF único, etapa atual do funil e registro da última alteração |
| `destino` | Destinos de viagem |
| `interesse_destino` | Relação N:N entre clientes e destinos desejados |
| `pacote` | Pacotes de viagem vinculados a um destino |
| `tarefa` | Tarefas e lembretes vinculados a um cliente e a um usuário responsável |
| `historico` | Histórico de atendimento de cada cliente |
| `venda` | Vendas realizadas, associando cliente, atendente e pacote |
| `comissao` | Comissão gerada por cada venda (relação 1:1) |

Consulte a pasta `MER` para visualizar o modelo completo.

---

## Requisitos funcionais

Os requisitos funcionais estão organizados em dois grupos: funcionalidades de e-commerce (RF01–RF08 e RF10) e funcionalidades de gestão interna (RF09 e RF11–RF17).

| Código | Requisito | Resumo |
|---|---|---|
| RF01 | Consultar Catálogo | Filtrar e visualizar quartos, hospedagens e pacotes disponíveis, com fotos, descrições, preços e disponibilidade em tempo real. |
| RF02 | Gestão do Carrinho | Selecionar múltiplos pacotes, armazená-los no carrinho e calcular o subtotal dinamicamente. |
| RF03 | Gerenciar Cadastro | Criar, consultar, atualizar e excluir o próprio perfil, validando nome, CPF, e-mail e telefone e apresentando alertas para dados inválidos ou incompletos. |
| RF04 | Realizar Checkout | Consolidar os itens do carrinho, calcular o total com taxas, impostos e descontos aplicáveis e exibir o resumo antes do pagamento. |
| RF05 | Integrar com Pagamento | Enviar a transação à API de pagamento e tratar sucesso ou falha. Em caso de falha, permitir até três novas tentativas antes de cancelar a transação. |
| RF06 | Emitir Confirmação | Após a aprovação do pagamento, enviar e-mail com voucher da reserva, código localizador e comprovante detalhado em PDF. |
| RF07 | Administrar Inventário | Permitir que o administrador cadastre, altere e remova viagens, pacotes e hospedagens do catálogo. |
| RF08 | Atualizar Preços | Permitir a alteração dos preços, incluindo tarifas dinâmicas ou sazonais. |
| RF09 | Gerar Relatórios e Análise de Vendas | Exclusivo do Gestor. Gerar relatórios por período, destinos mais procurados, faturamento bruto e comissões, com gráficos e exportação em CSV e PDF. |
| RF10 | Gestão de Pedidos | Gerenciar reservas e seus status — Aguardando Pagamento, Confirmado ou Cancelado — mantendo o histórico das alterações. |
| RF11 | Gestão de Cadastro de Usuários | Permitir que o Gestor cadastre colaboradores com perfil Atendente ou Gestor, validando os dados e garantindo a unicidade de CPF e e-mail. As senhas são armazenadas como hash. |
| RF12 | Autenticação e Controle de Acesso | Autenticar por e-mail e senha, bloquear a conta após cinco falhas consecutivas e oferecer redefinição de senha por link com token de uso único e expiração. Restringir recursos conforme o perfil. |
| RF13 | Consulta de Clientes | Pesquisar clientes por nome, CPF e destino desejado, com resultados paginados e acesso ao perfil completo e ao histórico de atendimento. |
| RF14 | Criação de Tarefas e Lembretes | Criar tarefas com descrição, prazo, cliente vinculado e usuário responsável. Rejeitar datas anteriores à data corrente e associar a tarefa ao histórico do cliente. |
| RF15 | Acompanhamento por Fases de Atendimento | Exibir clientes e tarefas em um painel Kanban organizado por fases do funil, permitindo mudanças de fase registradas no histórico. |
| RF16 | Notificação de Prazos | Após o login, exibir um resumo das tarefas do usuário vencidas ou com vencimento no dia, caso existam pendências. |
| RF17 | Cadastro e Atualização de Clientes pelo Atendente | Permitir que usuários internos cadastrem e editem clientes, validando o CPF e sua unicidade, preservando os dados em caso de falha e registrando o usuário e a data/hora das alterações bem-sucedidas. |

### Regras e comportamentos relevantes

- **Acesso por perfil:** o cadastro de colaboradores (RF11) e os relatórios de vendas (RF09) são restritos ao Gestor.
- **Segurança de credenciais:** a autenticação utiliza hash de senha; após a quinta falha consecutiva, a conta é bloqueada e a redefinição de senha é oferecida por token de uso único com prazo de expiração.
- **Pagamento:** o sistema permite até três novas tentativas em caso de falha no pagamento antes de cancelar a transação.
- **Integridade dos dados:** CPF e e-mail de colaboradores devem ser únicos; o CPF dos clientes também é validado e sua unicidade é verificada no cadastro e na edição.
- **Relatórios:** quando não houver vendas no período selecionado, o sistema deve informar que nenhuma venda foi localizada e manter os indicadores zerados. O módulo é de visualização e não substitui a planilha financeira da agência.

---

## Como navegar pela documentação

1. Leia o `Oceanun.docx` para entender o escopo e os requisitos do projeto.
2. Consulte a pasta `UML` para visualizar os diagramas de análise e projeto.
3. Acesse a pasta `MER` para entender a estrutura do banco de dados.
4. Confira a pasta `Interface` para visualizar as telas planejadas.
5. Explore a pasta `Website` para consultar a implementação do site.

---

## Integrantes

| Nome | GitHub |
|---|---|
| Gabriel Barbosa | [github.com/gabriel15vitor](https://github.com/gabriel15vitor) |
| Felipe Robinson | [github.com/feliperobinson](https://github.com/feliperobinson) |
| Kevin Wu | [github.com/Kevinwu0310](https://github.com/Kevinwu0310) |
| Matheus Silva | [github.com/Matheus-57](https://github.com/Matheus-57) |
| Geiza Morais | [github.com/m0ra1s](https://github.com/m0ra1s) |

---

## Contexto acadêmico

Projeto desenvolvido para as disciplinas de **Engenharia de Software 2** e **Projeto Integrador 2**.
