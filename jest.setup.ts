// jest.setup.ts

// Load environment variables before tests run
import dotenv from "dotenv";

// Load the `.env` file, or any specific env file
dotenv.config({ path: "./.env" });
