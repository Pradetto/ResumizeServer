import { query } from "../util/database.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

class User {
  constrcutor(id, firstname, lastname, email, password, role = "user") {
    this.id = id;
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  static async createUserTable() {
    try {
      await query(
        `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          firstname TEXT NOT NULL,
          lastname TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          tokens TEXT[] DEFAULT '{}'::TEXT[] CHECK (array_length(tokens, 1) <= 5),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() ON UPDATE NOW()
      )`
      );
    } catch (err) {
      console.error("Error creating users table", err);
      throw err;
    }
  }

  static async create(data) {
    const { firstname, lastname, email, password } = data;
  }
}
