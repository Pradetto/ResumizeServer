import { query } from "../util/database.js";

class Usage {
  constructor(
    user_id,
    prompt_tokens = 0,
    completion_tokens = 0,
    total_paid_tokens = 2500000,
    tokens_remaining,
    total_tokens_consumed
  ) {
    this.user_id = user_id;
    this.prompt_tokens = prompt_tokens;
    this.completion_tokens = completion_tokens;
    this.total_paid_tokens = total_paid_tokens;
    this.tokens_remaining = tokens_remaining;
    this.total_tokens_consumed = total_tokens_consumed;
  }

  publicData() {
    return {
      tokens_remaining: this.tokens_remaining,
      total_tokens_consumed: this.total_tokens_consumed,
    };
  }

  static createUsageTable = async () => {
    try {
      const tableExists = await query(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'usage'
    )
  `);

      if (!tableExists.rows[0].exists) {
        await query(
          `
    CREATE TABLE usage (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens_consumed INTEGER NOT NULL GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
      total_paid_tokens INTEGER NOT NULL DEFAULT 2500000,
      tokens_remaining INTEGER NOT NULL GENERATED ALWAYS AS (total_paid_tokens - prompt_tokens - completion_tokens) STORED,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `
        );
        console.log("Table created");
      }

      const triggerExists = await query(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'update_usage'
    )
  `);

      if (!triggerExists.rows[0].exists) {
        await query(`
        CREATE OR REPLACE FUNCTION update_usage()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at := NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_usage
        BEFORE UPDATE OF prompt_tokens, completion_tokens, total_tokens_consumed, tokens_remaining
        ON usage
        FOR EACH ROW
        EXECUTE FUNCTION update_usage();
    `);
      }
    } catch (err) {
      console.error("Error creating usage table", err);
      throw err;
    }
  };

  static async create(user_id, total_paid_tokens = 2500000) {
    try {
      const result = await query(
        `
        INSERT INTO usage (user_id, total_paid_tokens)
        VALUES ($1, $2)
        RETURNING *;
      `,
        [user_id, total_paid_tokens]
      );

      return result.rows[0];
    } catch (err) {
      console.error("Error creating usage record", err);
      throw err;
    }
  }

  static async findByUserId(user_id) {
    try {
      const result = await query(
        `
        SELECT *
        FROM usage
        WHERE user_id = $1
        `,
        [user_id]
      );

      const usageData = result.rows[0];

      if (!usageData) {
        throw new Error("Contact information not found");
      }

      if (result.rows.length > 0) {
        return new Usage(
          usageData.user_id,
          usageData.prompt_tokens,
          usageData.completion_tokens,
          usageData.total_paid_tokens,
          usageData.tokens_remaining,
          usageData.total_tokens_consumed
        );
      }
    } catch (err) {
      console.error("Error fetching usage by user_id", err);
      throw err;
    }
  }

  async update(fields) {
    const updateFields = Object.entries(fields)
      .map(
        ([key, value]) =>
          `${key} = ${typeof value === "string" ? `'${value}'` : value}`
      )
      .join(", ");

    try {
      const result = await query(
        `
        UPDATE usage
        SET ${updateFields}
        WHERE user_id = $1
        RETURNING *;
      `,
        [this.user_id]
      );

      const updatedUsage = result.rows[0];
      this.prompt_tokens = updatedUsage.prompt_tokens;
      this.completion_tokens = updatedUsage.completion_tokens;
      this.total_paid_tokens = updatedUsage.total_paid_tokens;
      this.tokens_remaining = updatedUsage.tokens_remaining;
      this.total_tokens_consumed = updatedUsage.total_tokens_consumed;
      return updatedUsage;
    } catch (err) {
      console.error("Error updating usage record", err);
      throw err;
    }
  }
}

export default Usage;
