const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "MERN Job Board API",
    version: "1.0.0",
    description: "Role-based Job Board API for Admin, Employer, and Job Seeker",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const options = {
  swaggerDefinition,
  // Include route annotations from both classic and modular route files.
  apis: ["./src/routes/*.js", "./src/modules/**/*.routes.js"],
};

module.exports = swaggerJSDoc(options);
