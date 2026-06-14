workspace "Oracle Java Bot Architecture" "C4 architecture model for the Oracle Java Bot project." {

    model {
        user = person "User" "Person who manages and consults tasks through the web dashboard or Telegram bot."
        teamMember = person "Team Member" "Developer or project member who uses the system to track tasks and productivity."

        telegram = softwareSystem "Telegram" "External messaging platform used by users to interact with the bot."
        gemini = softwareSystem "Gemini API" "External AI service used to generate or support chatbot responses."
        oci = softwareSystem "Oracle Cloud Infrastructure" "Cloud platform used to deploy infrastructure and application services."

        oracleJavaBot = softwareSystem "Oracle Java Bot" "Task management and productivity visibility system using a Telegram bot, React dashboard, Spring Boot backend, and Oracle Cloud services." {
            
            reactApp = container "React Web Dashboard" "Web interface for viewing tasks, completed tasks, total tasks, and productivity indicators." "React / Vite"

            springBootApp = container "Spring Boot Backend" "Backend service that exposes APIs, handles business logic, authentication, bot interactions, and persistence." "Java / Spring Boot" {
                webControllers = component "Web Controllers" "Expose HTTP endpoints used by the React dashboard." "Spring MVC REST Controllers" {
                    url "https://github.com/Javier272/CHATBOT/blob/main/docs/diagrams/web-controllers.puml"
                }

                botController = component "Telegram Bot Controller" "Receives and processes Telegram bot interactions." "Spring Boot Controller" {
                    url "https://github.com/Javier272/CHATBOT/blob/main/docs/diagrams/telegram-bot-controller.puml"
                }

                taskService = component "Task Service" "Contains business logic for creating, updating, completing, and retrieving tasks." "Spring Service" {
                    url "https://github.com/Javier272/CHATBOT/blob/main/docs/diagrams/task-service.puml"
                }

                userService = component "User Service" "Contains business logic for loading, creating, updating, and deleting users." "Spring Service" {
                    url "https://github.com/Javier272/CHATBOT/blob/main/docs/diagrams/user-service.puml"
                }

                aiService = component "AI Service" "Connects to the external Gemini API to support AI-based responses." "Spring Service" {
                    url "https://github.com/Javier272/CHATBOT/blob/main/docs/diagrams/ai-service.puml"
                }

                securityComponent = component "Security Component" "Manages authentication, authorization, and access control concerns." "Spring Security" {
                    url "https://github.com/Javier272/CHATBOT/blob/main/docs/diagrams/security-component.puml"
                }

                repositoryComponent = component "Repository Layer" "Provides data access for task, user, and domain entities." "Spring Data JPA Repository" {
                    url "https://github.com/Javier272/CHATBOT/blob/main/docs/diagrams/repository-layer.puml"
                }
            }

            database = container "Oracle Database" "Stores users, tasks, completed tasks, and application data." "Oracle Database"

            terraform = container "Terraform Infrastructure Configuration" "Infrastructure as code used to define cloud resources such as API Gateway, database, repositories, and container infrastructure." "Terraform"
        }

        user -> reactApp "Uses to manage and consult tasks"
        user -> telegram "Sends commands and messages"
        teamMember -> reactApp "Uses to monitor productivity and task progress"

        telegram -> springBootApp "Sends bot updates and commands"
        reactApp -> springBootApp "Calls backend APIs using HTTP/JSON"
        springBootApp -> database "Reads and writes application data using JPA/JDBC"
        springBootApp -> gemini "Requests AI-generated responses"
        terraform -> oci "Defines and provisions cloud infrastructure"
        oci -> springBootApp "Runs backend service"
        oci -> database "Hosts or manages database resources"

        webControllers -> taskService "Delegates task operations"
        webControllers -> repositoryComponent "Reads task and user data for HTTP responses"
        webControllers -> aiService "Requests AI analysis for dashboard endpoints"
        botController -> taskService "Executes task operations requested from Telegram"
        botController -> userService "Loads users for Telegram task assignment"
        botController -> aiService "Delegates AI-assisted bot responses"
        taskService -> repositoryComponent "Uses repositories to access data"
        userService -> repositoryComponent "Uses repositories to access user data"
        webControllers -> securityComponent "Validates authenticated access"
        repositoryComponent -> database "Persists and retrieves data"
        aiService -> gemini "Calls external AI API"

        deploymentEnvironment "Production" {
            deploymentNode "Oracle Cloud Infrastructure" "Cloud environment" "OCI" {
                deploymentNode "Container / Compute Runtime" "Runtime environment for backend services" "Docker / OCI Compute or OKE" {
                    backendInstance = containerInstance springBootApp
                }

                deploymentNode "Database Service" "Managed or provisioned database service" "Oracle Database" {
                    databaseInstance = containerInstance database
                }

                deploymentNode "Static Web Hosting" "Environment used to serve the web dashboard" "Web server / static hosting" {
                    frontendInstance = containerInstance reactApp
                }
            }

            deploymentNode "External Services" "Third-party platforms used by the system" {
                telegramInstance = softwareSystemInstance telegram
                geminiInstance = softwareSystemInstance gemini
            }
        }
    }

    views {
        systemLandscape "SystemLandscape" {
            include *
            autolayout lr
            title "System Landscape - Oracle Java Bot"
        }

        systemContext oracleJavaBot "SystemContext" {
            include *
            autolayout lr
            title "System Context - Oracle Java Bot"
        }

        container oracleJavaBot "Containers" {
            include *
            autolayout lr
            title "Container Diagram - Oracle Java Bot"
        }

        component springBootApp "BackendComponents" {
            include *
            autolayout lr
            title "Component Diagram - Spring Boot Backend"
        }

        deployment oracleJavaBot "Production" "Deployment" {
            include *
            autolayout lr
            title "Deployment Diagram - Production Environment"
        }

        dynamic oracleJavaBot "DynamicTaskConsultation" "User consults completed tasks from the dashboard" {
            user -> reactApp "Opens the dashboard"
            reactApp -> springBootApp "Requests completed tasks"
            springBootApp -> securityComponent "Validates the request"
            springBootApp -> taskService "Requests completed task data"
            taskService -> repositoryComponent "Queries completed tasks"
            repositoryComponent -> database "Reads task records"
            database -> repositoryComponent "Returns task records"
            repositoryComponent -> taskService "Returns completed tasks"
            taskService -> springBootApp "Returns processed task information"
            springBootApp -> reactApp "Responds with completed task data"
            reactApp -> user "Displays completed tasks"
            autolayout lr
            title "Dynamic Diagram - Consult Completed Tasks"
        }

        dynamic oracleJavaBot "DynamicTelegramTaskFlow" "User interacts with the Telegram bot to manage a task" {
            user -> telegram "Sends a task command"
            telegram -> springBootApp "Forwards bot update"
            springBootApp -> botController "Routes Telegram update"
            botController -> taskService "Executes task operation"
            taskService -> repositoryComponent "Persists task changes"
            repositoryComponent -> database "Writes task data"
            database -> repositoryComponent "Confirms persistence"
            repositoryComponent -> taskService "Returns operation result"
            taskService -> botController "Returns response message"
            botController -> telegram "Sends bot response"
            telegram -> user "Displays confirmation"
            autolayout lr
            title "Dynamic Diagram - Telegram Task Management"
        }

        styles {
            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }

            element "Software System" {
                background #1168bd
                color #ffffff
            }

            element "Container" {
                background #438dd5
                color #ffffff
            }

            element "Component" {
                background #85bbf0
                color #000000
            }

            element "Database" {
                shape cylinder
            }

            element "External" {
                background #999999
                color #ffffff
            }
        }
    }
}
