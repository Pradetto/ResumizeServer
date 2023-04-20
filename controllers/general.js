import { query } from "../util/database.js";

const transformData = (rows) => {
  return rows.map((row) => {
    return {
      id: row.job_id,
      jobLink: row.job_link,
      companyName: row.company_name,
      position: row.role_name,
      description: row.job_description,
      resume_fileKey: row.resume_file_key,
      coverLetter_fileKey: row.cover_letter_file_key,
      contactInfoAvailable: row.hiring_manager !== null,
      hiringManager: row.hiring_manager,
      email: row.email,
      phone: row.phone,
      address: row.address,
    };
  });
};

export const filesController = async (req, res) => {
  const userId = req.session.user.id;

  const result = await query(
    `
    SELECT
        jobs.id as job_id,
        jobs.link as job_link,
        jobs.description as job_description,
        companies.company_name,
        roles.id as role_id,
        roles.role_name,
        resumes.file_key as resume_file_key,
        cover_letters.file_key as cover_letter_file_key,
        hiring_managers.hiring_manager,
        hiring_managers.address,
        hiring_managers.phone,
        hiring_managers.email
    FROM jobs
    LEFT JOIN companies ON jobs.company_id = companies.id
    LEFT JOIN roles ON jobs.role_id = roles.id
    LEFT JOIN job_resumes ON jobs.id = job_resumes.job_id
    LEFT JOIN resumes ON job_resumes.resume_id = resumes.id
    LEFT JOIN job_cover_letters ON jobs.id = job_cover_letters.job_id
    LEFT JOIN cover_letters ON job_cover_letters.cover_letter_id = cover_letters.id
    LEFT JOIN hiring_managers ON jobs.company_id = hiring_managers.company_id
    WHERE jobs.user_id = $1 AND jobs.is_draft = false
    ORDER BY jobs.updated_at DESC
    `,
    [userId]
  );
  const transformedData = transformData(result.rows);
  res.status(200).json(transformedData);
};
