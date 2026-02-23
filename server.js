const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const QRCode = require("qrcode");


console.log("Server file is running...");


const app = express();
const PORT = 5000;

app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"]
}));

app.use(express.json());

/* ================= MIDDLEWARE ================= */


// Increase request size limit (Prevent PayloadTooLargeError)
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

/* ================= IMAGE UPLOAD SETUP ================= */

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Allow uploads folder access
app.use("/uploads", express.static(uploadDir));

// Allow invoice folder access
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

/* ================= DATABASE ================= */

const dbPath = path.join(__dirname, "database.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Orders table with location
db.run(`
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT,
    name TEXT,
    phone TEXT,
    mangoType TEXT,
    weight TEXT,
    quantity INTEGER,
    distance REAL,
    deliveryCharge REAL,
    productTotal REAL,
    grandTotal REAL,
    date TEXT,
    latitude REAL,
    longitude REAL
)
`);

// Items table
db.run(`
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    stock INTEGER,
    offer TEXT,
    date_added TEXT,
    image TEXT
)
`);

/* ================= ROUTES ================= */

// Test route
app.get("/admin/orders", (req, res) => {
    res.send("Hapus Baag Backend Running 🥭");
});

// Get all orders
app.get("/orders", (req, res) => {
    db.all("SELECT * FROM orders ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

// Place order
app.post("/place-order", (req, res) => {

    console.log("New Order Received:", req.body); 

    const {
        name,
        phone,
        mangoType,
        weight,
        quantity,
        distance,
        deliveryCharge,
        productTotal,
        grandTotal,
        date,
        latitude,
        longitude
    } = req.body;

    const invoiceNumber = "HB-" + Date.now();

    db.run(`
        INSERT INTO orders 
        (invoice_number, name, phone, mangoType, weight, quantity, distance, deliveryCharge, productTotal, grandTotal, date, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [invoiceNumber, name, phone, mangoType, weight, quantity, distance, deliveryCharge, productTotal, grandTotal, date, latitude, longitude],
    function (err) {
        if (err) {
            console.error("DB Error:", err);
            return res.json({ message: "Database error" });
        }

        console.log("Order Saved with ID:", this.lastID); // ✅ extra log

        res.json({
            message: "Order placed successfully",
            orderId: this.lastID,
            invoiceNumber: invoiceNumber
        });
    });
});

/* ================= ITEMS ROUTES ================= */

// Add new item (WITH REAL IMAGE UPLOAD)
app.post("/add-item", upload.single("image"), (req, res) => {

    const { name, price, stock, offer, date_added } = req.body;

    if (!name || isNaN(price) || isNaN(stock)) {
        return res.status(400).json({ error: "Invalid item data" });
    }

    const imagePath = req.file ? "/uploads/" + req.file.filename : null;

    db.run(
        `INSERT INTO items (name, price, stock, offer, date_added, image)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, price, stock, offer, date_added, imagePath],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Item added successfully!", id: this.lastID });
        }
    );
});

// Get all items
app.get("/items", (req, res) => {
    db.all("SELECT * FROM items ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});



// ================= INVOICE ROUTE =================
app.get("/invoice/:id", async (req, res) => {

    const orderId = req.params.id;

    // 🔥 Fetch Real Order From SQLite
    db.get("SELECT * FROM orders WHERE id = ?", [orderId], async (err, order) => {

        if (err || !order) {
            return res.send("Invoice not found");
        }

        const doc = new PDFDocument({ margin: 40, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=HapusBaag-Invoice-${orderId}.pdf`
        );

        doc.pipe(res);

        const rupee = "Rs.";

        const productTotal = order.productTotal;
        const deliveryCharge = order.deliveryCharge;
        const gstRate = 0.05; // 5% GST example
        const gstAmount = productTotal * gstRate;
        const grandTotal = productTotal + deliveryCharge + gstAmount;

        // ================= LOGO =================
        if (fs.existsSync("./images/Hapus Logo.jpg")) {
            doc.image("./images/Hapus Logo.jpg", 40, 40, { width: 80 });
        }

        // ================= HEADER =================
        doc
            .fontSize(24)
            .fillColor("#1c8b63")
            .text("HAPUS BAAG", 150, 50);

        doc
            .fontSize(12)
            .fillColor("black")
            .text("Premium Organic Mango Supplier", 150)
            .text("GSTIN: 27ABCDE1234F1Z5", 150)
            .text("Email: support@hapusbaag.com", 150)
            .text("Phone: +91 9689376295", 150);

        doc.moveDown(2);

        // ================= INVOICE INFO =================
        doc.text(`Invoice No: HB-${order.id}`, { align: "right" });
        doc.text(`Invoice Date: ${order.date}`, { align: "right" });

        doc.moveDown();

        doc
            .fontSize(14)
            .fillColor("#1c8b63")
            .text("Bill To:");

        doc
            .fontSize(12)
            .fillColor("black")
            .text(`Name: ${order.name}`)
            .text(`Phone: ${order.phone}`)
            .text(`Address: ${order.address}`);

        doc.moveDown(2);

        // ================= TABLE HEADER =================
        const tableTop = doc.y;

        doc.rect(40, tableTop, 520, 25).stroke();
        doc
            .fontSize(11)
            .text("Mango Type", 45, tableTop + 8)
            .text("Weight", 160, tableTop + 8)
            .text("Qty", 230, tableTop + 8)
            .text("Distance", 290, tableTop + 8)
            .text("Product", 360, tableTop + 8)
            .text("Total", 450, tableTop + 8);

        const rowTop = tableTop + 30;

        doc.rect(40, rowTop - 5, 520, 25).stroke();

        doc
            .text(order.mangoType, 45, rowTop)
            .text(order.weight, 160, rowTop)
            .text(order.quantity, 230, rowTop)
            .text(order.distance + " KM", 290, rowTop)
            .text(`${rupee} ${order.productTotal}`, 360, rowTop)
            .text(`${rupee} ${order.grandTotal}`, 450, rowTop);

        doc.moveDown(4);

        // ================= TOTAL SECTION =================
        doc.moveDown(2);

        doc.text(`Product Total: ${rupee} ${productTotal}`, { align: "right" });
        doc.text(`Delivery Charge: ${rupee} ${deliveryCharge}`, { align: "right" });
        doc.text(`GST (5%): ${rupee} ${gstAmount.toFixed(2)}`, { align: "right" });

        doc.font("Helvetica-Bold");
        doc.text(`Grand Total: ${rupee} ${grandTotal.toFixed(2)}`, { align: "right" });

        doc.font("Helvetica");

        doc.moveDown(2);

        // ================= GOOGLE MAP LINK =================
        const mapLink = `https://www.google.com/maps?q=${order.latitude},${order.longitude}`;

        doc.fillColor("blue").text("View Delivery Location", {
            link: mapLink,
            underline: true
        });

        doc.moveDown(2);

        // ================= QR CODE =================
        const upiLink = `upi://pay?pa=9689376295@upi&pn=HapusBaag&am=${grandTotal.toFixed(2)}`;

        const qrImage = await QRCode.toDataURL(upiLink);
        const qrData = qrImage.replace(/^data:image\/png;base64,/, "");

        doc.image(Buffer.from(qrData, "base64"), 40, doc.y, { width: 120 });

        doc.moveDown(6);

        // ================= SIGNATURE =================
        doc
            .moveTo(400, doc.y)
            .lineTo(550, doc.y)
            .stroke();

        doc.text("Authorized Signature", 420);

        doc.moveDown(2);

        doc.fillColor("gray")
            .text("Thank you for ordering from Hapus Baag!", { align: "center" });

        doc.end();
    });
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
    console.log("Server running on http://localhost:" + PORT);
});
