const ADMIN_ACCOUNTS = [
  { email: "admin@studentsupport.ai" },
  { email: "support.admin@studentsupport.ai" },
];

const isAdminEmail = (email = "") =>
  ADMIN_ACCOUNTS.some((account) => account.email === email.trim().toLowerCase());

const clearLegacyAdminCredentials = () => {
  localStorage.removeItem("ai_student_support_admin_passwords");
  localStorage.removeItem("ai_student_support_admin_session");
  sessionStorage.removeItem("ai_student_support_admin_session");
  localStorage.removeItem("adminLoggedIn");
  sessionStorage.removeItem("adminLoggedIn");
  localStorage.removeItem("adminEmail");
  sessionStorage.removeItem("adminEmail");
};

export { ADMIN_ACCOUNTS, clearLegacyAdminCredentials, isAdminEmail };
