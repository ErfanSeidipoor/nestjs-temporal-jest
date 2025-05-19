# NestJS Temporal Jest Project

This project demonstrates the integration of Temporal workflow engine with NestJS framework, using TypeScript and including Jest for testing.

## Description

This project showcases how to implement workflow orchestration using Temporal.io within a NestJS application. It includes examples of different types of workflows, activities, and signals, with a PostgreSQL database for persistence and Elasticsearch for search capabilities.

## Main Packages

- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications
- **Temporal.io**: A workflow engine for orchestrating distributed services and processes
- **TypeORM**: An ORM that can run in Node.js and supports both TypeScript and JavaScript
- **PostgreSQL**: The primary database for storing workflow states and application data
- **Elasticsearch**: Used for workflow search and indexing
- **Jest**: Testing framework for unit and integration tests

## Workflows

### 1. Say Hello To User

- **Type**: `say-hello-to-user`
- **Description**: Basic workflow that says hello to a user
- **Queries**: None
- **Signals**: None

### 2. Say Hello To User After Two Minutes

- **Type**: `say-hello-to-user-after-two-mins`
- **Description**: Delayed greeting workflow with a two-minute timer
- **Queries**: None
- **Signals**: None

### 3. Say Hello To User Every One Minute

- **Type**: `say-hello-to-user-every-one-min`
- **Description**: Recurring workflow that sends greetings every minute
- **Queries**: State queries
- **Signals**: None

### 4. Say Hello To User With Trigger

- **Type**: `say-hello-to-user-with-trigger`
- **Description**: Workflow that waits for a trigger signal
- **Queries**: State queries
- **Signals**: Trigger signal

### 5. Say Hello To User With Trigger And Change Name

- **Type**: `say-hello-to-user-with-trigger-and-change-name`
- **Description**: Workflow that can update the user's name via signal
- **Queries**: State queries
- **Signals**: `sayHelloAndChangeName`

## Activities

### Log Activity

- State change logging
- Workflow status tracking

### User Activity

- User-related operations and notifications

## API Endpoints

### Workflow Management

- `POST /workflow/say-hello-to-user` - Start basic hello workflow
- `POST /workflow/say-hello-to-user-after-two-mins` - Start delayed hello workflow
- `POST /workflow/say-hello-to-user-every-one-min` - Start recurring hello workflow
- `POST /workflow/say-hello-to-user-with-trigger` - Start trigger-based workflow
- `POST /workflow/say-hello-to-user-with-trigger-and-change-name` - Start name-changeable workflow

### Workflow Control

- `PUT /workflow/:workflowId/terminate` - Terminate a workflow
- `PUT /workflow/:workflowId/cancel` - Cancel a workflow
- `GET /workflow` - List workflows with optional filters
- `POST /workflow/:workflowId/signal` - Send signal to workflow
- `POST /workflow/:workflowId/sayHelloAndChangeName` - Update name in workflow
- `GET /workflow/say-hello-to-user-with-trigger/:workflowId/getState` - Get workflow state

## Running with Docker Compose

1. Clone the repository
2. Navigate to the project directory
3. Run the following command:

```bash
docker-compose -f docker-compose/docker-compose.yaml up -d
```

This will start the following services:

- Temporal Server
- PostgreSQL
- Elasticsearch
- Temporal Admin Tools
- Temporal Web UI (available at http://localhost:8098)

## Environment Variables

### Required Variables

```env
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_TASK_QUEUE=default
POSTGRES_DB_USERNAME=root
POSTGRES_DB_PASSWORD=password
POSTGRES_DB_HOST=localhost
POSTGRES_DB_DATABASE=nestjs-temporal-jest
POSTGRES_DB_PORT=45432
```
