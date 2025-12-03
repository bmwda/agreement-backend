const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const mammoth = require('mammoth');
const { TEMPLATES_DIR, PUBLIC_DIR, CITY_OPTIONS, REQUIRED_FIELDS } = require('../config/constants');
const numberToWords = require('../utils/numberToWords');
const { log } = require('console');
const ImageModule = require('docxtemplater-image-module-free');

// Generate agreement document
router.post("/generate-agreement", (req, res) => {
    console.log("received docs ")
    if (!req.body) {
        return res.status(400).json({ error: "Request body is missing" });
    }

    let {
        facility_code,
        name,
        facility_name,
        facility_address,
        city,
        doctor_name,
        hospital,
        count,
        charge,
        mob,
        hasNotaryOrStamp,
        start_date,
        end_date
        ,hasGST
    } = req.body;

    // Extract date, month, year from start_date
    let date = '', month = '', year = '', month_name = '', month_name_caps = '';
    if (start_date) {
        const d = new Date(start_date);
        if (!isNaN(d)) {
            date = d.getDate().toString().padStart(2, '0');
            month = (d.getMonth() + 1).toString().padStart(2, '0');
            year = d.getFullYear().toString();
            month_name = d.toLocaleString('default', { month: 'long' });
            month_name_caps = month_name.toUpperCase();
        }
    }

    // Convert date format from YYYY-MM-DD to DD-MM-YYYY
    let formattedStartDate = '';
    let formattedEndDate = '';
    
    if (start_date) {
        const d = new Date(start_date);
        if (!isNaN(d)) {
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear().toString();
            formattedStartDate = `${day}-${month}-${year}`;
        }
    }
    
    if (end_date) {
        const d = new Date(end_date);
        if (!isNaN(d)) {
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear().toString();
            formattedEndDate = `${day}-${month}-${year}`;
        }
    }

    // Convert charge to words
    let chargeInWords = numberToWords(parseInt(charge));
    let chargeWithGST = charge;
    let chargeWithGSTInWords = chargeInWords;

    if (hasGST) {
        // Calculate 5% GST
        chargeWithGST = Math.round(parseInt(charge) * 1.05);
        chargeWithGSTInWords = numberToWords(chargeWithGST) + " including 5% GST";
    }

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter(field => !req.body[field]);
    const city_code = CITY_OPTIONS.find(option => option.name === city)?.code;
    
    if (missingFields.length > 0) {
        return res.status(400).json({ 
            error: "Missing required fields", 
            fields: missingFields 
        });
    }

    try {
        // Select template based on city and notary/stamp requirement
        let templateFileName;
        const kashganjCities = ['kasganj', 'sambhal', 'badaun', 'narota'];
        const aighCities = ['aligarh', 'hathras'];
        const cityLower = city.toLowerCase();

        if (cityLower === 'aligarh') {
            templateFileName = hasNotaryOrStamp ? 'aligarh_notary.docx' : 'aligarh.docx';
        } else if (cityLower === 'mathura') {
            templateFileName = hasNotaryOrStamp ? 'mathura_notary.docx' : 'mathura.docx';
        } else if (cityLower === 'hathras') {
            templateFileName = hasNotaryOrStamp ? 'hathras_notary.docx' : 'hathras.docx';
        } else {
            throw new Error("Unsupported city. Only Aligarh, Mathura, and Hathras are allowed.");
        }
        
        const templatePath = path.join(TEMPLATES_DIR, templateFileName);
        
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ error: `Template file ${templateFileName} not found` });
        }

        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);
//    console.log(start_date,end_date)
        // Always add signature image from templates/mathurasign.png
        const signaturePath = path.join(TEMPLATES_DIR, 'mathurasign.png');
        // console.log(signaturePath);
        const imageModule = new ImageModule({
            centered: false,
            getImage: function(tagValue) {
                return fs.readFileSync(signaturePath);
            },
            getSize: function(img, tagValue, tagName) {
                return [150, 50]; // Adjust size as needed
            }
        });

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            modules: [imageModule]
        });
        if(hasGST){
            charge = charge +" + 5% GST"
            chargeInWords = chargeInWords + " and including 5% GST"
        }
        doc.render({
            hasGST: hasGST,
            city_code,
            facility_code,
            name,
            facility_name,
            facility_address,
            city,
            doctor_name,
            hospital,
            count,
            charge: hasGST ? chargeWithGST : charge,
            chargeInWords: hasGST ? chargeWithGSTInWords : chargeInWords,
            mob,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            date,
            month,
            year,
            month_name,
            month_name_caps,
            signature: true // Always trigger the image
        });
//    console.log(date,month,year,month_name)
        const buffer = doc.getZip().generate({ type: "nodebuffer" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename=agreement-${facility_code}-${name}.docx`);
        res.send(buffer);
    } catch (error) {
        console.error("DOCXTEMPLATER ERROR", error);
        res.status(500).json({ 
            error: "Failed to generate document",
            details: error.message 
        });
    }
});

// Preview document
router.get("/preview-doc", (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Test Preview</title>
                <style>
                    body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
                    .form-group { margin-bottom: 15px; }
                    label { display: block; margin-bottom: 5px; }
                    input { width: 100%; padding: 8px; margin-bottom: 10px; }
                    button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
                </style>
            </head>
            <body>
                <h2>Test Document Preview</h2>
                <form id="previewForm" onsubmit="previewDocument(event)">
                    <div class="form-group">
                        <label>Facility Code:</label>
                        <input type="text" name="facility_code" required>
                    </div>
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Facility Name:</label>
                        <input type="text" name="facility_name" required>
                    </div>
                    <div class="form-group">
                        <label>Facility Address:</label>
                        <input type="text" name="facility_address" required>
                    </div>
                    <div class="form-group">
                        <label>City:</label>
                        <input type="text" name="city" required>
                    </div>
                    <div class="form-group">
                        <label>Doctor Name:</label>
                        <input type="text" name="doctor_name" required>
                    </div>
                    <div class="form-group">
                        <label>Hospital:</label>
                        <input type="text" name="hospital" required>
                    </div>
                    <div class="form-group">
                        <label>Count:</label>
                        <input type="number" name="count" required>
                    </div>
                    <div class="form-group">
                        <label>Charge:</label>
                        <input type="number" name="charge" required>
                    </div>
                    <div class="form-group">
                        <label>Mobile:</label>
                        <input type="text" name="mob" required>
                    </div>
                    <div class="form-group">
                        <label>Start Date:</label>
                        <input type="date" name="start_date" required>
                    </div>
                    <div class="form-group">
                        <label>End Date:</label>
                        <input type="date" name="end_date" required>
                    </div>
                    <div class="form-group">
                        <label>Has Notary/Stamp:</label>
                        <input type="checkbox" name="hasNotaryOrStamp">
                    </div>
                    <div class="form-group">
                        <label>Has GST:</label>
                        <input type="checkbox" name="hasGST">
                    </div>
                    <button type="submit">Preview Document</button>
                </form>

                <script>
                    async function previewDocument(event) {
                        event.preventDefault();
                        const form = event.target;
                        const formData = new FormData(form);
                        const data = {};
                        formData.forEach((value, key) => {
                            data[key] = value;
                        });
                        
                        try {
                            const response = await fetch('/preview-doc', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(data)
                            });
                            
                            if (response.ok) {
                                const html = await response.text();
                                const newWindow = window.open('', '_blank');
                                newWindow.document.write(html);
                                newWindow.document.close();
                            } else {
                                const error = await response.json();
                                alert('Error: ' + (error.details || error.error || 'Failed to generate preview'));
                            }
                        } catch (error) {
                            alert('Error: ' + error.message);
                        }
                    }
                </script>
            </body>
        </html>
    `);
});

router.post("/preview-doc", async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: "Request body is missing" });
    }

    const {
        facility_code,
        name,
        facility_name,
        facility_address,
        city,
        doctor_name,
        hospital,
        count,
        charge,
        mob,
        hasNotaryOrStamp,
        start_date,
        end_date,
        hasGST
    } = req.body;

    // Extract date, month, year from start_date
    let date = '', month = '', year = '', month_name = '', month_name_caps = '';
    if (start_date) {
        const d = new Date(start_date);
        if (!isNaN(d)) {
            date = d.getDate().toString().padStart(2, '0');
            month = (d.getMonth() + 1).toString().padStart(2, '0');
            year = d.getFullYear().toString();
            month_name = d.toLocaleString('default', { month: 'long' });
            month_name_caps = month_name.toUpperCase();
        }
    }

    // Convert date format from YYYY-MM-DD to DD-MM-YYYY
    let formattedStartDate = '';
    let formattedEndDate = '';
    
    if (start_date) {
        const d = new Date(start_date);
        if (!isNaN(d)) {
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear().toString();
            formattedStartDate = `${day}-${month}-${year}`;
        }
    }
    
    if (end_date) {
        const d = new Date(end_date);
        if (!isNaN(d)) {
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear().toString();
            formattedEndDate = `${day}-${month}-${year}`;
        }
    }

    // Convert charge to words
    let chargeInWords = numberToWords(parseInt(charge));
    
    // Handle GST if applicable
    if(hasGST){
        charge = charge +" + 5% GST"
        chargeInWords = chargeInWords + " and additionally 5% GST"
    }

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter(field => !req.body[field]);
    const city_code = CITY_OPTIONS.find(option => option.name === city)?.code;
    
    if (missingFields.length > 0) {
        return res.status(400).json({ 
            error: "Missing required fields", 
            fields: missingFields 
        });
    }

    try {
        // Select template based on city and notary/stamp requirement
        let templateFileName;
        const kashganjCities = ['kasganj', 'sambhal', 'badaun', 'narota'];
        const aighCities = ['aligarh', 'hathras'];
        
        if (kashganjCities.includes(city.toLowerCase())) {
            templateFileName = 'kashganj.docx';
        } else if (aighCities.includes(city.toLowerCase())) {
            templateFileName = hasNotaryOrStamp ? 'aigh.docx' : 'aligh_not.docx';
        } else {
            templateFileName = hasNotaryOrStamp ? "aigh.docx" : "mathura.docx";
        }
        const templatePath = path.join(TEMPLATES_DIR, templateFileName);
        
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ error: `Template file ${templateFileName} not found` });
        }

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
            chargeInWords,
            mob,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            date,
            month,
            year,
            month_name,
            month_name_caps
        });

        const buffer = doc.getZip().generate({ type: "nodebuffer" });
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
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Document Preview</h2>
                    </div>
                    ${result.value}
                </body>
            </html>
        `);
    } catch (error) {
        console.error("Preview Error:", error);
        res.status(500).json({ 
            error: "Failed to generate preview",
            details: error.message 
        });
    }
});

module.exports = router;