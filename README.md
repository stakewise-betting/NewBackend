NewBackend/
├── config/ # Configuration-related files
│ ├── config.js # App-wide constants and environment configurations
│ ├── emailTemplate.js # Email body templates for notifications
│ └── nodemailer.js # NodeMailer setup for sending emails
│
├── controllers/ # Handles logic for routes (MVC - Controller part)
│ ├── adminController.js # Admin-related functionalities
│ ├── authController.js # Handles user authentication (login, signup)
│ ├── eventController.js # Logic for event-related actions
│ ├── notificationController.js # Handles notifications (create, get, update)
│ ├── userController.js # General user data handling
│ └── userUpdateController.js # Specific logic for updating user profiles
│
├── middleware/ # Middleware functions for request handling
│ └── userAuth.js # Middleware for authenticating users (JWT check, etc.)
│
├── models/ # MongoDB schemas and models
│ ├── comment.js # Comment model/schema
│ ├── event.js # Event model/schema
│ ├── notification.js # Notification model/schema
│ └── userModel.js # User model/schema
│
├── node_modules/ # Installed node.js dependencies
│ └── (default node modules)
│
├── routes/ # API route handlers
│ ├── authRoutes.js # Routes for login, signup, etc.
│ ├── commentRoutes.js # Routes for comment-related endpoints
│ ├── eventRoutes.js # Routes for event-related endpoints
│ ├── notificationRoutes.js # Routes for managing notifications
│ ├── reportRoutes.js # Routes for handling reports (possibly admin/moderation)
│ ├── userRoutes.js # Routes for user data (get, update, delete)
│ └── userUpdateRoutes.js # Routes specific to updating user info
│
├── services/ # Utility services used by controllers
│ ├── blockchainService.js # Blockchain-related logic (e.g. voting, logging)
│ └── websocketService.js # Real-time communication setup (WebSockets)
│
├── .env # Environment variables (API keys, DB URIs, secrets)
├── .gitignore # Specifies which files/folders to ignore in Git
├── app.js # Express app initialization and middleware setup
├── betting_report.pdf # A reference file or sample output (not part of backend logic)
├── package-lock.json # Lock file for npm dependencies (auto-generated)
├── package.json # Project metadata and dependency list
└── server.js # Entry point of the application; starts the server
