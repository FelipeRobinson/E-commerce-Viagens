-- =====================================================================
-- DDL MySQL 8.0.16+ - Sistema de atendimento e vendas de pacotes de viagem
-- =====================================================================

DROP DATABASE IF EXISTS oceanun;
CREATE DATABASE oceanun
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
USE oceanun;

-- ---------------------------------------------------------------------
-- USUARIO (RF11, RF12)
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    nome              VARCHAR(150)  NOT NULL,
    cpf               CHAR(11)      NOT NULL,
    email             VARCHAR(150)  NOT NULL,
    senha_hash        VARCHAR(255)  NOT NULL,
    idade             TINYINT UNSIGNED NOT NULL,
    telefone          VARCHAR(20)   NOT NULL,
    endereco          VARCHAR(255)  NOT NULL,
    perfil            ENUM('Atendente','Gestor') NOT NULL,
    status            ENUM('ativa','bloqueada')  NOT NULL DEFAULT 'ativa',
    tentativas_falhas TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_cpf   UNIQUE (cpf),
    CONSTRAINT uq_usuario_email UNIQUE (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TOKEN_REDEFINICAO (RF12 - redefinicao de senha com token de uso unico)
-- ---------------------------------------------------------------------
CREATE TABLE token_redefinicao (
    id_token    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_usuario  INT UNSIGNED NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expira_em   DATETIME     NOT NULL,
    usado       BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id_token),
    CONSTRAINT uq_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_token_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ETAPA_FUNIL (RF15)
-- ---------------------------------------------------------------------
CREATE TABLE etapa_funil (
    id_etapa  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome      VARCHAR(50)  NOT NULL,
    ordem     TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (id_etapa),
    CONSTRAINT uq_etapa_nome  UNIQUE (nome),
    CONSTRAINT uq_etapa_ordem UNIQUE (ordem)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CLIENTE (RF03, RF13, RF17)
-- ---------------------------------------------------------------------
CREATE TABLE cliente (
    id_cliente             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome                   VARCHAR(150) NOT NULL,
    cpf                    CHAR(11)     NOT NULL,
    email                  VARCHAR(150) NOT NULL,
    telefone               VARCHAR(20)  NOT NULL,
    endereco               VARCHAR(255) NOT NULL,
    canal_comunicacao      ENUM('WhatsApp','Instagram','TikTok') NOT NULL,
    id_etapa               INT UNSIGNED NOT NULL,
    id_usuario_alteracao   INT UNSIGNED NULL,
    data_ultima_alteracao  DATETIME     NULL,
    PRIMARY KEY (id_cliente),
    CONSTRAINT uq_cliente_cpf UNIQUE (cpf),
    CONSTRAINT fk_cliente_etapa
        FOREIGN KEY (id_etapa) REFERENCES etapa_funil (id_etapa)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cliente_usuario_alteracao
        FOREIGN KEY (id_usuario_alteracao) REFERENCES usuario (id_usuario)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_cliente_nome (nome),
    INDEX idx_cliente_etapa (id_etapa)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- DESTINO
-- ---------------------------------------------------------------------
CREATE TABLE destino (
    id_destino  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_destino),
    CONSTRAINT uq_destino_nome UNIQUE (nome)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- INTERESSE_DESTINO (N:N cliente x destino - filtro do RF13)
-- ---------------------------------------------------------------------
CREATE TABLE interesse_destino (
    id_cliente  INT UNSIGNED NOT NULL,
    id_destino  INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_cliente, id_destino),
    CONSTRAINT fk_interesse_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_interesse_destino
        FOREIGN KEY (id_destino) REFERENCES destino (id_destino)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- PACOTE
-- ---------------------------------------------------------------------
CREATE TABLE pacote (
    id_pacote   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    id_destino  INT UNSIGNED  NOT NULL,
    nome        VARCHAR(150)  NOT NULL,
    preco       DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_pacote),
    CONSTRAINT ck_pacote_preco CHECK (preco >= 0),
    CONSTRAINT fk_pacote_destino
        FOREIGN KEY (id_destino) REFERENCES destino (id_destino)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TAREFA (RF14, RF16)
-- ---------------------------------------------------------------------
CREATE TABLE tarefa (
    id_tarefa     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    descricao     VARCHAR(500) NOT NULL,
    prazo_limite  DATE         NOT NULL,
    concluida     BOOLEAN      NOT NULL DEFAULT FALSE,
    id_cliente    INT UNSIGNED NOT NULL,
    id_usuario    INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_tarefa),
    CONSTRAINT fk_tarefa_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tarefa_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_tarefa_usuario_prazo (id_usuario, prazo_limite)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- HISTORICO (RF13, RF14, RF15, RF17)
-- ---------------------------------------------------------------------
CREATE TABLE historico (
    id_historico  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_cliente    INT UNSIGNED NOT NULL,
    id_usuario    INT UNSIGNED NOT NULL,
    id_tarefa     INT UNSIGNED NULL,
    tipo_evento   VARCHAR(50)  NOT NULL,
    descricao     VARCHAR(500) NULL,
    data_hora     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_historico),
    CONSTRAINT fk_historico_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_historico_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_historico_tarefa
        FOREIGN KEY (id_tarefa) REFERENCES tarefa (id_tarefa)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_historico_cliente_data (id_cliente, data_hora)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VENDA (RF09)
-- ---------------------------------------------------------------------
CREATE TABLE venda (
    id_venda     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    id_cliente   INT UNSIGNED  NOT NULL,
    id_usuario   INT UNSIGNED  NOT NULL,
    id_pacote    INT UNSIGNED  NOT NULL,
    data_venda   DATE          NOT NULL,
    valor_total  DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_venda),
    CONSTRAINT ck_venda_valor CHECK (valor_total >= 0),
    CONSTRAINT fk_venda_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_venda_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_venda_pacote
        FOREIGN KEY (id_pacote) REFERENCES pacote (id_pacote)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_venda_data (data_venda)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- COMISSAO (RF09) - 1:1 com venda
-- ---------------------------------------------------------------------
CREATE TABLE comissao (
    id_comissao  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    id_venda     INT UNSIGNED  NOT NULL,
    id_usuario   INT UNSIGNED  NOT NULL,
    percentual   DECIMAL(5,2)  NOT NULL,
    valor        DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_comissao),
    CONSTRAINT uq_comissao_venda UNIQUE (id_venda),
    CONSTRAINT ck_comissao_percentual CHECK (percentual BETWEEN 0 AND 100),
    CONSTRAINT ck_comissao_valor CHECK (valor >= 0),
    CONSTRAINT fk_comissao_venda
        FOREIGN KEY (id_venda) REFERENCES venda (id_venda)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comissao_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Dados iniciais: etapas do funil (exemplos do RF15)
-- ---------------------------------------------------------------------
INSERT INTO etapa_funil (nome, ordem) VALUES
    ('Prospecção', 1),
    ('Orçamento',  2),
    ('Fechamento', 3);
