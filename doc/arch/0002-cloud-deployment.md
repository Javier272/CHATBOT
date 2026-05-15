# 0002 - Cloud Deployment and Infrastructure as Code

## Status

Accepted

## Context

The Oracle Java Bot project includes a Spring Boot backend, a React web dashboard, database persistence, and integrations with external platforms such as Telegram and DeepSeek API. The system also includes Terraform files that define Oracle Cloud Infrastructure resources such as API Gateway, container infrastructure, repositories, database resources, and storage.

The project needs a deployment approach that can be repeated, documented, and maintained by the team. It should also support future improvements without requiring manual recreation of cloud resources.

## Decision

We will use Oracle Cloud Infrastructure as the target cloud platform and Terraform as the infrastructure as code tool for defining cloud resources.

The Spring Boot backend is designed to be containerized using Docker and deployed in a cloud runtime environment. The database is represented as an Oracle Database resource. The React frontend is represented as a separate web dashboard that communicates with the backend through HTTP APIs.

Terraform will be used to document and provision infrastructure resources instead of relying only on manual cloud configuration.

## Consequences

This decision improves deployability because the infrastructure can be recreated and reviewed from code. It also improves maintainability because cloud resources are documented in version control together with the application code.

Using Oracle Cloud Infrastructure aligns the deployment model with the project context and the Oracle partner/customer framing of the challenge.

The main tradeoff is that the team needs to understand and maintain Terraform files, Docker configuration, and cloud deployment settings. This adds some operational complexity, but it is acceptable because the project already includes infrastructure files and cloud deployment is part of the expected architecture.

## Alternatives Considered

A fully manual deployment was considered, but it would be harder to reproduce and document.

A local-only deployment was also considered, but it would not represent the target production architecture of the system and would not take advantage of the existing Terraform and Oracle Cloud configuration.

Using another cloud provider was not selected because the project is already oriented toward Oracle Cloud Infrastructure.

## Related Quality Attributes

Deployability, maintainability, scalability, reliability, and portability.