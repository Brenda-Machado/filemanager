# File Manager - Teste para Dev Junior Pixel Breeders

Aplicação web full-stack para upload, listagem, download e exclusão de arquivos com controle de acesso por usuário autenticado.

Desenvolvimento:
- Frontend: React + TypeScript + Vite;
- Backend: Python + FastAPI;
- Banco de Dados: SQLite via SQLAlchemy2;
- Armazenamento de arquivos: Filesystem local (`backend/uploads/`);
- Autenticação: JWT (Bearer token) + bcrypt.

## Funcionalidades implementadas

- Cadastro e login com email e senha;
- Sessão persistida via JWT no localStorage;
- Acesso restrito: cada usuário vê e opera apenas seus próprios arquivos
- Upload de arquivos com barra de progresso;
- Validação de tipo e tamanho no frontend e no backend;
- Listagem de arquivos com nome, tamanho e data de upload;
- Notificação de erros;
- Download com streaming;
- Exclusão (soft delete) com confirmação.

## Funcionalidades não implementadas (extras)

- Links compartilháveis;
- Preview de imagens;
- Implementação de cache;
- Uso de MinIO ou S3.


## Execução local

Pré-requisito [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados.

```bash
docker compose up --build
```

Aguarde o build e acesse http://localhost:5173.

Para encerrar:

```bash
docker compose down
```

Os arquivos enviados ficam em `backend/uploads/` e o banco em `backend/filemanager.db`, ambos persistidos no host via volume. Os dados sobrevivem ao restart do container.

## Descrição da arquitetura

## Arquitetura

```
filemanager/
├── docker-compose.yml
│
├── backend/                      # Serviço Python
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                   # Entrypoint: app FastAPI, CORS, routers
│   ├── database.py               # Engine SQLAlchemy + sessão + get_db
│   ├── models.py                 # ORM: User, FileRecord
│   ├── schemas.py                # Pydantic: validação de entrada e saída
│   ├── auth.py                   # bcrypt, JWT, dependência get_current_user
│   ├── routers/
│   │   ├── auth.py               # POST /auth/register  POST /auth/login
│   │   └── files.py              # CRUD de arquivos
│   └── uploads/                  # Arquivos enviados (criado automaticamente)
│
└── frontend/                     # Serviço React
    ├── Dockerfile
    ├── index.html
    ├── src/
    │   ├── main.tsx              # Entrypoint React
    │   ├── App.tsx               # Roteamento e proteção de rotas
    │   ├── api/
    │   │   ├── client.ts         # Instância Axios com interceptors de auth
    │   │   ├── auth.ts           # register(), login()
    │   │   └── files.ts          # list(), upload(), download(), delete()
    │   ├── context/
    │   │   └── AuthContext.tsx   # Estado global de autenticação
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   └── DashboardPage.tsx
    │   ├── components/
    │   │   ├── UploadZone.tsx    # Drag-and-drop com barra de progresso
    │   │   └── FileList.tsx      # Listagem com download e delete inline
    │   └── utils/
    │       ├── error.ts          # Extração de mensagem de erro da API
    │       └── format.ts         # formatBytes, formatDate, mimeIcon
    └── package.json
```

## Decisões técnicas

### Banco de dados — SQLite
Escolhido por não exigir nenhum serviço externo, o que simplifica tanto o setup local quanto o Docker.

### Autenticação — JWT stateless
O token é gerado no login, armazenado no `localStorage` do browser e enviado como `Bearer` em cada requisição. O backend valida a assinatura sem consultar o banco a cada request, o que mantém os endpoints leves. Validade de 24 horas.

### Hashing de senhas — bcrypt 
O projeto usa a biblioteca `bcrypt` especificamente para o hash das senhas, oferecendo segurança maior. Outra coisa é que ele possui a característica de senhas iguais terem hashes diferentes. 

### Armazenamento — Filesystem local
Arquivos salvos em `backend/uploads/` para simplificar a aplicação, com nomes baseados em UUID para evitar colisões e não expor o nome original no filesystem. 

### Download com streaming
O endpoint de download usa `StreamingResponse` com leitura em chunks de 64 KB via `aiofiles`. O uso de memória no servidor é constante independente do tamanho do arquivo.

### Exclusão — física + soft delete
O arquivo é removido do disco imediatamente. O registro no banco recebe `deleted = True`, preservando o histórico sem deixar arquivos órfãos no storage.

### Controle de acesso
Toda operação de arquivo verifica `record.owner_id == current_user.id` no backend antes de executar. Tentativas de acessar arquivos de outros usuários retornam `403 Forbidden`.

### Validação de upload
A extensão é validada no frontend antes de enviar, pois evita tráfego desnecessário. O backend revalida extensão e tipo MIME independentemente, nenhuma validação do cliente é confiada como definitiva.

## Screenshots

![Login Page](LoginPage.png)

![Upload Page](UploadPage.png)

## Uso de IA

A aplicação utilizou a IA Claude Sonnet 4.5, que auxiliou com a organização dos componentes e folders e a testagem da autenticação de usuários. Assim como ajustes/solução de bugs da interface gráfica, criação de padrão quadriculado e logo. Organização visual da arquitetura no README.md.
