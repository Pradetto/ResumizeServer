import { query } from "../util/database.js";
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";

class User {
  constructor(id, firstname, lastname, email, password, tokens = []) {
    this.id = id;
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.password = password;
    this.tokens = tokens;
  }

  publicData() {
    return {
      id: this.id,
      firstname: this.firstname,
      lastname: this.lastname,
      email: this.email,
    };
  }

  static async createUserTable() {
    try {
      const tableExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'users'
      )
    `);

      if (!tableExists.rows[0].exists) {
        await query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          firstname TEXT NOT NULL,
          lastname TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          tokens JSONB DEFAULT '[]'::JSONB CHECK (jsonb_array_length(tokens) <= 5),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      }

      const triggerExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_users'
      )
    `);

      if (!triggerExists.rows[0].exists) {
        await query(`
        CREATE OR REPLACE FUNCTION update_users()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at := NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_users
        BEFORE UPDATE OF firstname, lastname, email, password
        ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_users();
      `);
      }
    } catch (err) {
      console.error("Error creating users table", err);
      throw err;
    }
  }

  static async create(data) {
    const { firstname, lastname, email, password } = data;

    // Validate email with regex
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate password with regex
    // - At least 8 characters long
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one digit
    // - At least one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error(
        "Password must be at least 8 characters long, with at least one uppercase letter, one lowercase letter, one digit, and one special character"
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        `
      INSERT INTO users (firstname,lastname,email,password)
      VALUES ($1,$2,$3,$4)
      RETURNING id, firstname,lastname,email
      `,
        [firstname, lastname, email, hashedPassword]
      );
      const user = result.rows[0];

      // ensure it is user.password instead of hashed password
      return new User(
        user.id,
        user.firstname,
        user.lastname,
        user.email,
        user.password
      ).publicData();
    } catch (err) {
      console.error("error creating user", err, email);

      if (err.code === "23505") {
        // Unique violation
        throw new Error("User already exists with this email");
      } else {
        throw new Error("Error creating user");
      }
    }
  }

  // Audit this do i need this or replace with findbyId do findBY email or ID and do WHERE id = $1 OR email = $2
  static async findByIdOrEmail(id = null, email = null) {
    try {
      const result = await query(
        `
        SELECT *
        FROM users
        WHERE id = $1 OR email = $2
        `,
        [id, email]
      );

      const user = result.rows[0];

      if (!user) {
        throw new Error("User not found");
      }

      return new User(
        user.id,
        user.firstname,
        user.lastname,
        user.email,
        user.password,
        user.tokens
      );
    } catch (err) {
      console.error("error finding user by email", err, email);
    }
  }

  static async findByCredentials(email, password) {
    if (!email || !password) {
      throw new Error("All fields msut be filled");
    }

    const user = await User.findByIdOrEmail(undefined, email);

    if (!user) {
      throw new Error("Credentials do not match");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error("Credentials do not match");
    }

    return user.publicData();
  }

  async updateName(firstname, lastname) {
    try {
      await query(
        `
        UPDATE users
        SET firstname = $1, lastname = $2
        WHERE id = $3
        `,
        [firstname, lastname, this.id]
      );
    } catch (err) {
      console.error("error updating user's name", err, this.email);
      throw err;
    }
  }

  async updateEmail(email) {
    // Validate email with regex
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
    try {
      await query(
        `
        UPDATE users
        SET email = $1
        WHERE id = $2
        `[(email, this.id)]
      );
    } catch (err) {
      console.error("error updating user's email", err, this.email);
    }
  }

  async updatePassword(newPassword) {
    // Validate password with regex
    // - At least 8 characters long
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one digit
    // - At least one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error(
        "Password must be at least 8 characters long, with at least one uppercase letter, one lowercase letter, one digit, and one special character"
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await query(
        `
        UPDATE users
        SET password = $1
        WHERE id = $2
        `,
        [hashedPassword, this.id]
      );
    } catch (err) {
      console.error("error updating user's password", err, this.email);
    }
  }

  async updateTokens() {
    try {
      await query(
        `
      UPDATE users
      SET tokens = $1
      WHERE id = $2
    `,
        [JSON.stringify(this.tokens), this.id]
      );
    } catch (err) {
      console.error("Error updating user's tokens", err, this.email);
    }
  }

  static async generateAuthToken(email) {
    const maxTokens = 5;
    const user = await User.findByIdOrEmail(undefined, email);

    if (!user) {
      throw new Error("User not found");
    }

    const timestamp = new Date().getTime();
    const token = jwt.sign({ id: user.id, timestamp }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    if (user.tokens && user.tokens.length > 0) {
      user.tokens = user.tokens.filter((t) => {
        try {
          const decoded = jwt.verify(t.token, process.env.JWT_SECRET);
          return true;
        } catch (e) {
          return false;
        }
      });
    }

    if (user.tokens.length >= maxTokens) {
      user.tokens.shift();
    }

    user.tokens.push({ token });
    await user.updateTokens();

    return token;
  }
}

export default User;

/* HERE IS WHEN I REMOVED JWT  */
// import jwt from "jsonwebtoken";

// , tokens = []

// this.tokens = tokens;

// tokens JSONB DEFAULT '[]'::JSONB CHECK (jsonb_array_length(tokens) <= 5),

//   static async generateAuthToken(email) {
//   const maxTokens = 5;
//   const user = await User.findByIdOrEmail(undefined, email);
//   const timestamp = new Date().getTime();
//   const token = jwt.sign({ id: user.id, timestamp }, process.env.JWT_SECRET, {
//     expiresIn: "5m",
//   });

//   if (user.tokens && user.tokens.length > 0) {
//     user.tokens = user.tokens.filter((t) => {
//       try {
//         const decoded = jwt.verify(t.token, process.env.JWT_SECRET);
//         return true;
//       } catch (e) {
//         return false;
//       }
//     });
//   }

//   if (user.tokens.length >= maxTokens) {
//     user.tokens.shift();
//   }

//   user.tokens.push({ token });
//   await user.update();

//   return token;
// }
