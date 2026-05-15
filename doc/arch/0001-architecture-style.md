# 0001 - Architecture Style Selection

## Status

Accepted

## Context

The Oracle Java Bot project needs to support task management and productivity visibility through more than one interaction channel. Users can interact with the system through a React web dashboard and through a Telegram bot. The application also needs a backend that centralizes business logic, persistence, authentication, and integrations with external services such as Telegram and DeepSeek API.

Because the project includes a frontend, backend, database, bot integration, and cloud deployment, the architecture must keep responsibilities separated and make the system easier to maintain, test, and evolve.

## Decision

We will use a combination of client-server architecture and layered architecture.

The client-server style is applied between the React web dashboard and the Spring Boot backend. The React application acts as the client, while the Spring Boot application acts as the server that exposes the main application functionality through APIs.

The layered architecture style is applied inside the Spring Boot backend. The backend is organized into controllers, services, repositories, models, security components, and configuration classes. Controllers handle incoming requests, services contain business logic, repositories manage data access, and the database stores persistent information.

This architecture style is also useful for the Telegram bot flow. Telegram acts as an external client channel, while the backend receives bot interactions, processes them through the service layer, and persists data through the repository layer.

## Consequences

This decision improves maintainability because each part of the system has a clear responsibility. Changes to the React interface should not require changes to database logic, and changes to persistence should not directly affect the user interface.

It also improves testability because backend components can be tested by layer. For example, task logic can be tested at the service level without requiring the React interface.

The main tradeoff is that the system requires more coordination between layers and components. API contracts between the frontend and backend must be kept consistent, and the backend must remain organized to avoid mixing controller, service, and repository responsibilities.

## Alternatives Considered

A monolithic architecture without clear internal layers was considered, but it would make the system harder to maintain as the project grows.

A microservices architecture was also considered, but it would add unnecessary operational complexity for the current project scope. The system does not currently require independent deployment of multiple backend services.

## Related Quality Attributes

Maintainability, modifiability, testability, and scalability.