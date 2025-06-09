const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
const mammoth = require("mammoth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Constants
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Ensure required directories exist
if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 1. Generate and save the filled doc
app.post("/generate-agreement", (req, res) => {
    const {
        city_code,
        facility_code,
        name,
        facility_name,
        facility_address,
        city,
        doctor_name,
        hospital,
        count,
        charge,
        mob
    } = req.body;

    try {
        const templatePath = path.join(TEMPLATES_DIR, "mathura.docx");
        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render({
            city_code,
            facility_code,
            name,
            facility_name,
            facility_address,
            city,
            doctor_name,
            hospital,
            count,
            charge,
            mob
        });

        const buffer = doc.getZip().generate({ type: "nodebuffer" });

        // Save the file for preview
        const outputPath = path.join(PUBLIC_DIR, "filled-agreement.docx");
        fs.writeFileSync(outputPath, buffer);

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", "attachment; filename=filled-agreement.docx");
        res.send(buffer);
    } catch (error) {
        console.error("DOCXTEMPLATER ERROR", error);
        res.status(500).send({ error: error.message });
    }
});

// 2. Preview the most recent filled doc
app.get("/preview-doc", async (req, res) => {
    try {
        const filePath = path.join(PUBLIC_DIR, "filled-agreement.docx");
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.convertToHtml({ buffer });
        res.send(`
            <html>
                <head>
                    <title>Preview</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                            line-height: 1.6;
                        }
                    </style>
                </head>
                <body>
                    ${result.value}
                </body>
            </html>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error reading filled DOCX file");
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 