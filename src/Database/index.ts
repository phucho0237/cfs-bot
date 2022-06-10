import { MongoClient } from "mongodb";
import { Collection } from "./collection";
import "dotenv/config";

const mongo: MongoClient = new MongoClient(
  process.env.MONGODB_URL || "mongodb://localhost:27017"
);
mongo.connect().then(() => console.log("Connected to MongoDB!"));

const mongoCollection = mongo.db().collection("cfs");
const db = new Collection(mongoCollection, mongo.startSession());

const getCfsCount = async (): Promise<number> => {
  return await db
    .all()
    .then(
      (confessions) =>
        confessions.filter((el: { ID: string; data: Confession[] }) =>
          el.ID.startsWith("confession")
        ).length
    );
};

const pushCfs = async (confession: Confession): Promise<void> => {
  const cfsCount = await getCfsCount();
  await db.set(`confession-#${cfsCount + 1}`, confession);
};

const getCfs = async (messageID: string): Promise<Confession> => {
  const all = await db.all();
  const cfs = all.find(
    (el: { ID: string; data: Confession }) =>
      el.data.reviewMessageID == messageID || el.data.messageID == messageID
  );

  return cfs.data;
};

const updateCfs = async (confession: Confession): Promise<void> => {
  await db.set(`confession-#${confession.id}`, confession);
};

export { getCfsCount, pushCfs, getCfs, updateCfs };

export interface Confession {
  id: number;
  content: string;
  reviewMessageID: string;
  author: string;
  createdAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  status: "Pending" | "Approved" | "Rejected";
  messageID: string | null;
  threadID: string | null;
}
