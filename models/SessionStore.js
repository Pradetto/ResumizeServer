import { query } from "../util/database.js";

export const createSessionTable = async () => {
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
    }
    console.log("Session table created");
  } catch (err) {
    console.error("Error creating session table", err);
    throw err;
  }
};

// import { query } from "../util/database.js";
// import expressSession from "express-session";

// class SessionStore extends expressSession.Store {
//   constructor() {
//     super();
//     this.ensureSessionTable();
//   }

//   async ensureSessionTable() {
// try {
// const result = await query(`
//   SELECT EXISTS (
//     SELECT 1
//     FROM pg_tables
//     WHERE schemaname = 'public'
//     AND tablename = 'session'
//   )
// `);

// if (!result.rows[0].exists) {
//   await query(`
//     CREATE TABLE session (
//       sid varchar NOT NULL COLLATE "default",
//       sess json NOT NULL,
//       expire timestamp(6) with time zone NOT NULL
//     )
//     WITH (OIDS=FALSE);

//     ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
//     CREATE INDEX idx_session_expire ON session(expire);
//   `);

//         console.log("Session table created");
//       }
//     } catch (err) {
//       console.error("Error creating session table", err);
//       throw err;
//     }
//   }

//   async get(sid) {
//     try {
//       // console.log("SessionStore.get called with sid:", sid);
//       const result = await query(
//         `
//         SELECT sess
//         FROM session
//         WHERE sid = $1
//         AND expire > NOW()
//       `,
//         [sid]
//       );
//       // console.log("Here is the result from get", result.rows[0].sess);
//       if (result.rows.length > 0) {
//         return result.rows[0].sess;
//       } else {
//         return null;
//       }
//     } catch (err) {
//       console.error("Error getting session from database", err);
//       throw err;
//     }
//   }

//   async set(sid, sess, maxAge) {
//     try {
//       const result = await query(
//         "INSERT INTO session (sid, sess, expire) VALUES ($1, $2, $3) ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = $3",
//         [sid, JSON.stringify(sess), sess.cookie._expires]
//       );
//       console.log("Session set:", result.rowCount > 0);
//       return result.rowCount > 0;
//     } catch (err) {
//       console.error("Error setting session in database", err);
//       throw err;
//     }
//   }

//   async destroy(sid) {
//     try {
//       console.log("SessionStore.destroy called with sid:", sid);
//       const result = await query(
//         `
//         DELETE FROM session
//         WHERE sid = $1
//       `,
//         [sid]
//       );
//       console.log("here is the result of the delete", result);
//       console.log("Session destroyed:", result.rowCount > 0);
//       return result.rowCount > 0;
//     } catch (err) {
//       console.error("Error destroying session in database", err);
//       throw err;
//     }
//   }

//   async touch(sid, sess) {
//     try {
//       const now = new Date();
//       const expireTime = new Date(sess._expires);

//       // Check if session is expired
//       if (expireTime <= now) {
//         return false;
//       }

//       // Calculate new expiration time based on original maxAge
//       const maxAge = sess.originalMaxAge;
//       const newExpireTime = new Date(now.getTime() + maxAge);

//       const result = await query(
//         `
//         UPDATE session
//         SET expire = $1
//         WHERE sid = $2
//         AND expire > NOW()
//       `,
//         [newExpireTime, sid]
//       );

//       return result.rowCount > 0;
//     } catch (err) {
//       console.error("Error touching session in database", err);
//       throw err;
//     }
//   }
// }

// export default SessionStore;
