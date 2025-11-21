import mongodb from "mongodb";
import dotenv from "dotenv"

dotenv.config()

const uri = process.env.URI;
const MongoClient = mongodb.MongoClient;

let client;
let dbPromise;

export default class UserDao {
    static async connectDB() {
        if (dbPromise) return dbPromise;

        dbPromise = (async () => {
            if (!client) {
                client = new MongoClient(uri, {
                    maxPoolSize: 100,
                    serverSelectionTimeoutMS: 10000,
                });
                await client.connect();
                console.log("MongoDB connected successfully!");
            }
            const database = client.db("Smart_Route");
            console.log("Connected to DB:", database.databaseName);
            return database;
        })();

        return dbPromise;
    }

    static async closeDB() {
        if (client) {
            await client.close();
            client = null;
            dbPromise = null;
            console.log("MongoDB connection closed.");
        }
    }

    static async uploadTrip(route, fuel, accomodation){
        try {
            const db = await this.connectDB()
            const collection = db.collection("Trips")
            return await collection.insertOne({route, fuel, accomodation})
        } catch (error) {
            console.log("Log error: ", error)
            return null
        }
    }
}