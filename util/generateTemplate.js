export const generateTempalte = (
  userFirstname,
  userLastname,
  userEmail,
  userPhone,
  userAddress1,
  userAddress2,
  userAddress3,
  company_name,
  role_name,
  render_employer = false,
  paragraphs,
  hiring_manager = "",
  email = "",
  phone = "",
  address = ""
) => {
  const templateData = {
    user: {
      firstname: userFirstname,
      lastname: userLastname,
      email: userEmail,
      phone: userPhone,
      address1: userAddress1,
      address2: userAddress2,
      address3: userAddress3,
    },
    date: new Date().toLocaleDateString(),
    default_name: "Hiring Manager",
    render_employer: render_employer,
    required_employer: {
      company_name: company_name,
      role: role_name,
    },
    employer: {
      hiring_manager: hiring_manager,
      email: email,
      phone: phone,
      address: address,
    },
    content: paragraphs,
  };
  return templateData;
};
