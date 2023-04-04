import { query } from "../util/database.js";

class ContactInfo {
  constructor(
    user_id,
    street,
    apt,
    city,
    state,
    postalCode,
    country,
    phone,
    address
  ) {
    this.user_id = user_id;
    this.street = street;
    this.apt = apt;
    this.city = city;
    this.state = state;
    this.postalCode = postalCode;
    this.country = country;
    this.phone = phone;
    this.address = address;
  }

  publicData() {
    return {
      address: this.address,
      phone: this.phone,
    };
  }

  static async createContactInfoTable() {
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'contact_info'
        )
      `);

      if (!tableExists.rows[0].exists) {
        await query(`
          CREATE TABLE contact_info (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            street VARCHAR(255) NOT NULL,
            apt VARCHAR(50) DEFAULT '',
            city VARCHAR(50) NOT NULL,
            state VARCHAR(50) NOT NULL,
            postal_code VARCHAR(20) NOT NULL,
            country VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            address VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);
        console.log("contact_info table create");
      }

      const triggerExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'update_contact_info'
        )
      `);

      if (!triggerExists.rows[0].exists) {
        await query(`
          CREATE OR REPLACE FUNCTION update_contact_info()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at := NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER update_contact_info
          BEFORE UPDATE OF street, apt, city, state, postal_code, country, phone, address
          ON contact_info
          FOR EACH ROW
          EXECUTE FUNCTION update_contact_info();
        `);
      }
    } catch (err) {
      console.error("Error creating contact_info table", err);
      throw err;
    }
  }

  static async create(data) {
    const {
      user_id,
      street,
      apt,
      city,
      state,
      postalCode,
      country,
      phone,
      address,
    } = data;
    try {
      const result = await query(
        `
        INSERT INTO contact_info (user_id, street, apt, city, state, postal_code, country, phone, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id, street, apt, city, state, postal_code, country, phone, address
        `,
        [user_id, street, apt, city, state, postalCode, country, phone, address]
      );
      const contactInfo = result.rows[0];

      return new ContactInfo(
        contactInfo.id,
        contactInfo.user_id,
        contactInfo.street,
        contactInfo.apt,
        contactInfo.city,
        contactInfo.state,
        contactInfo.postal_code,
        contactInfo.country,
        contactInfo.phone,
        contactInfo.address
      );
    } catch (err) {
      console.error("error creating contact info", err);

      if (err.code === "23505") {
        // Unique violation
        throw new Error("Contact info already exists for this user");
      } else {
        throw new Error("Error creating contact info");
      }
    }
  }

  static async findByUserId(user_id) {
    try {
      const result = await query(
        `
        SELECT * FROM contact_info
        WHERE user_id = $1
        `,
        [user_id]
      );

      const contactInfo = result.rows[0];

      if (!contactInfo) {
        throw new Error("Contact information not found");
      }

      return new ContactInfo(
        contactInfo.user_id,
        contactInfo.street,
        contactInfo.apt,
        contactInfo.city,
        contactInfo.state,
        contactInfo.postal_code,
        contactInfo.country,
        contactInfo.phone,
        contactInfo.address
      );
    } catch (err) {
      console.error(
        "Error finding contact information by user ID",
        err,
        user_id
      );
      throw err;
    }
  }

  async update(data) {
    const fields = [];
    const values = [];
    let counter = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${counter}`);
      values.push(value);
      counter++;
    }

    values.push(this.user_id);

    try {
      await query(
        `
      UPDATE contact_info
      SET ${fields.join(", ")}
      WHERE user_id = $${counter}
      `,
        values
      );
    } catch (err) {
      console.error("Error updating contact information", err, this.user_id);
      throw err;
    }
  }
}

export default ContactInfo;
