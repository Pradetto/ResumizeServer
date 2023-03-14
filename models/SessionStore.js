import { query } from "../util/database.js";
import expressSession from "express-session";

class SessionStore extends expressSession.Store {
  constructor() {
    super();
    this.ensureSessionTable();
  }
  async ensureSessionTable() {
    try {
      const result = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'session'
        )
      `);

      if (!result.rows[0].exists) {
        await query(`
          CREATE TABLE session (
            sid varchar NOT NULL COLLATE "default",
            sess json NOT NULL,
            expire timestamp(6) NOT NULL
          )
          WITH (OIDS=FALSE);

          ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
          CREATE INDEX idx_session_expire ON session(expire);
        `);

        console.log("Session table created");
      }
    } catch (err) {
      console.error("Error creating session table", err);
      throw err;
    }
  }

  async get(sid) {
    const result = await query(
      `
      SELECT sess
      FROM session
      WHERE sid = $1
      AND expire > NOW()
    `,
      [sid]
    );

    if (result.rows.length > 0) {
      return JSON.parse(result.rows[0].sess);
    } else {
      return null;
    }
  }

  async set(sid, sess, maxAge) {
    const result = await query(
      `
      INSERT INTO session (sid, sess, expire)
      VALUES ($1, $2, NOW() + INTERVAL '${maxAge} seconds')
      ON CONFLICT (sid)
      DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire
    `,
      [sid, JSON.stringify(sess)]
    );

    return result.rowCount > 0;
  }

  async destroy(sid) {
    const result = await query(
      `
      DELETE FROM session
      WHERE sid = $1
    `,
      [sid]
    );

    return result.rowCount > 0;
  }

  async touch(sid, sess, maxAge) {
    const result = await query(
      `
      UPDATE session
      SET expire = NOW() + INTERVAL '${maxAge} seconds'
      WHERE sid = $1
      AND sess = $2
      AND expire > NOW()
    `,
      [sid, JSON.stringify(sess)]
    );

    return result.rowCount > 0;
  }
}

export default SessionStore;
