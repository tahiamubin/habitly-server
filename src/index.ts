import "dotenv/config";

import express, { NextFunction, Request, Response } from "express";
import {
  MongoClient,
  ServerApiVersion,
  Collection,
  Db,
  ObjectId,
} from "mongodb";
import cors from "cors";
import type { JWTPayload } from "jose-cjs";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const uri = process.env.MONGODB_URI as string;
const port = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

interface Habit {
  category: string;
  description: string;
  name: string;
  target: string;
  createdAt: Date;
}

let JWKS: ReturnType<typeof import("jose-cjs").createRemoteJWKSet>;
let jwtVerify: typeof import("jose-cjs").jwtVerify;


async function initAuth() {
  const jose = await import("jose-cjs");
  jwtVerify = jose.jwtVerify;
  JWKS = jose.createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
  } catch (error) {
    res.status(401).json({ msg: "unauthorized" });
  }
};

async function run() {
  try {
    await initAuth();

    const database: Db = client.db("habitly");
    const habitCollections: Collection<Habit> =
      database.collection<Habit>("habits");

    app.post("/habit", verifyToken, async (req: Request, res: Response) => {
      try {
        const data: Habit = {
          ...req.body,
          createdAt: new Date(),
        };
        const result = await habitCollections.insertOne(data);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/habit", async (req: Request, res: Response) => {
      try {
        const result = await habitCollections
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.delete("/habit/:id", async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const result = await habitCollections.deleteOne({
          _id: new ObjectId(id as string),
        });
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});