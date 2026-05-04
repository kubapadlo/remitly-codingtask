import express from "express";
import { AppDataSource } from "./data-source";
import router from "./routes/routes";

const app = express();
app.use(express.json());
app.use("/", router);

app.post("/chaos", (req, res) => process.exit(1));

const start = async () => {
    while (true) {
        try {
            await AppDataSource.initialize();
            console.log("Data Source initialized!");
            break;
        } catch (err) {
            console.log("Waiting for DB...", err);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    const PORT = process.env.PORT ?? 3000;
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
};

start();