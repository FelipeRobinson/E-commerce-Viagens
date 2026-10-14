# Oceanun — E-commerce de Viagens

Repositório de controle e gestão documental do segundo trabalho da disciplina de **Engenharia de Software 2** e **Projeto Integrador 2**.

O projeto trata do **Oceanun**, uma agência de viagens, e reúne a documentação e os artefatos de análise, modelagem e interface do sistema de vendas de pacotes de viagem.

---

## Acessar o projeto

O projeto está hospedado no github pages com acesso:

[![Acessar o site](https://img.shields.io/badge/Acessar%20o%20site-Oceanun-0077B6?style=for-the-badge)](https://feliperobinson.github.io/E-commerce-Viagens/Website/index.html)

---

## Sobre o projeto

O sistema é uma ferramenta interna da agência, usada por **atendentes** e **gestores** para:

- cadastrar e consultar clientes;
- criar tarefas e lembretes vinculados aos clientes;
- acompanhar o atendimento por fases do funil de vendas (Prospecção, Orçamento e Fechamento);
- receber notificações de prazos vencidos ou que vencem no dia;
- analisar vendas e comissões por período (acesso restrito a gestores).

O acesso é controlado por autenticação (e-mail e senha) e por perfil de usuário (`Atendente` ou `Gestor`).

---

## Estrutura do repositório

```
E-commerce-Viagens/
├── Interface/     # Protótipos e telas do sistema
├── MER/           # Modelo Entidade-Relacionamento
├── UML/           # Diagramas UML (casos de uso, classes etc.)
├── Website/       # Código-fonte do site
├── Oceanun.docx   # Documento principal do projeto
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

O MER do Oceanun é composto por 11 entidades:

| Entidade | Descrição |
|---|---|
| `usuario` | Colaboradores da agência, com perfil `Atendente` ou `Gestor` e controle de bloqueio de conta |
| `token_redefinicao` | Tokens de uso único, com validade, para redefinição de senha |
| `etapa_funil` | Etapas do funil de vendas |
| `cliente` | Clientes, com CPF único, etapa atual do funil e registro da última alteração |
| `destino` | Destinos de viagem |
| `interesse_destino` | Relação N:N entre clientes e destinos desejados |
| `pacote` | Pacotes de viagem, vinculados a um destino |
| `tarefa` | Tarefas e lembretes, ligados a um cliente e a um usuário responsável |
| `historico` | Histórico de atendimento de cada cliente |
| `venda` | Vendas realizadas (cliente, atendente e pacote) |
| `comissao` | Comissão gerada por cada venda (relação 1:1) |

---

## Requisitos funcionais

| Código | Requisito |
|---|---|
| RF01 | Gestão de cadastro de usuários |
| RF02 | Autenticação e controle de acesso |
| RF03 | Cadastro de clientes |
| RF04 | Consulta de clientes |
| RF05 | Atualização de dados do cliente |
| RF06 | Criação de tarefas e lembretes |
| RF07 | Acompanhamento por fases do atendimento |
| RF08 | Notificação de prazos |
| RF09 | Análise de vendas |

---

## Como navegar pela documentação

1. Leia o `Oceanun.docx` para entender o escopo e os requisitos.
2. Consulte a pasta `UML` para ver os diagramas de análise.
3. Veja a pasta `MER` para entender a estrutura do banco de dados.
4. Confira a pasta `Interface` para visualizar as telas planejadas.
5. A pasta `Website` contém a implementação.

---

## Integrantes

| Nome | GitHub |
|---|---|
|Gabriel Barbosa | github.com/gabriel15vitor |
|Felipe Robinson | github.com/feliperobinson |
|Kevin Wu        | github.com/Kevinwu0310    |
|Matheus Silva   | github.com/Matheus-57     |

---

## Contexto acadêmico

Trabalho desenvolvido para a disciplina de **Engenharia de Software 2** e **Projeto Integrador 2**.