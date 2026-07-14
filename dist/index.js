"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const cors_1 = __importDefault(require("cors"));
const uri = process.env.MONGODB_URI;
const port = process.env.PORT;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
let JWKS;
let jwtVerify;
async function initAuth() {
    const jose = await import("jose-cjs");
    jwtVerify = jose.jwtVerify;
    JWKS = jose.createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));
}
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        res.status(401).json({ msg: "unauthorized" });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ msg: "unauthorized" });
        return;
    }
    try {
        const { payload } = await jwtVerify(token, JWKS);
        req.user = payload;
        next();
    }
    catch (error) {
        res.status(401).json({ msg: "unauthorized" });
    }
};
exports.verifyToken = verifyToken;
async function run() {
    try {
        await initAuth();
        const database = client.db("habitly");
        const habitCollections = database.collection("habits");
        app.post("/habit", exports.verifyToken, async (req, res) => {
            try {
                const data = {
                    ...req.body,
                    createdAt: new Date(),
                };
                const result = await habitCollections.insertOne(data);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.get("/habit", async (req, res) => {
            try {
                const result = await habitCollections
                    .find()
                    .sort({ createdAt: -1 })
                    .toArray();
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.delete("/habit/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const result = await habitCollections.deleteOne({
                    _id: new mongodb_1.ObjectId(id),
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);
app.get("/", (req, res) => {
    res.send("Server is running");
});
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
