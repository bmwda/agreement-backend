const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require('body-parser');
const { TEMPLATES_DIR, PUBLIC_DIR } = require('./config/constants');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', documentRoutes);

// Health check endpoint
app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 