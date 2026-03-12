const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// простой API для формы контакта
app.post("/api/contact", (req, res) => {
    const { name, email, message } = req.body;
    console.log("Новая заявка:", req.body);
    res.json({ status: "success" });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));