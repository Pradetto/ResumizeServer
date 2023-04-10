import { query } from "../util/database.js";

class Session {
  static createSessionTable = async () => {
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
              expire timestamp(6) with time zone NOT NULL
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
  };
}
export default Session;
