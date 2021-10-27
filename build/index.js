"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = express_1.default();
// json is the default content-type for POST requests
app.use(express_1.default.json());
app.use(cors_1.default());
const users = [
    {
        "name": "John Smith",
        "email": "john.smith@fake.com"
    },
    {
        "name": "Matthew Jones",
        "email": "matthew.jones@fake.com"
    },
    {
        "name": "Jane Doe",
        "email": "jane.doe@fake.com"
    }
];
app.post('/', (req, res) => {
    let filteredUsers = users;
    const searchQuery = req.query.q;
    if (req.query.q) {
        filteredUsers = users.filter((u) => u.name.includes(searchQuery) || u.email.includes(searchQuery));
    }
    res.send({
        results: filteredUsers
    });
});
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`connect-service: listening on port ${port}!`);
});
// Exports for testing purposes.
module.exports = app;
