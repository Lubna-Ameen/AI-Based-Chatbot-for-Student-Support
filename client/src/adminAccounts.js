const ADMIN_PASSWORD_STORAGE_KEY = "ai_student_support_admin_passwords";
const ADMIN_SESSION_STORAGE_KEY = "ai_student_support_admin_session";

const ADMIN_ACCOUNTS = [
  {
    email: "admin@studentsupport.ai",
    defaultPassword: "Admin@12345",
  },
  {
    email: "support.admin@studentsupport.ai",
    defaultPassword: "Support@12345",
  },
];

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const getAdminStorageKey = (email) => normalizeEmail(email);

const getStoredPasswords = () => {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
};

const getAdminAccount = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return ADMIN_ACCOUNTS.find(
    (account) => normalizeEmail(account.email) === normalizedEmail
  );
};

const isAdminEmail = (email) => Boolean(getAdminAccount(email));

const getAdminPassword = (email) => {
  const account = getAdminAccount(email);

  if (!account) {
    return null;
  }

  const storedPasswords = getStoredPasswords();
  const storageKey = getAdminStorageKey(account.email);

  return (
    storedPasswords[storageKey] ||
    storedPasswords[account.email] ||
    account.defaultPassword
  );
};

const setAdminPassword = (email, password) => {
  const account = getAdminAccount(email);

  if (!account) {
    return false;
  }

  const storedPasswords = getStoredPasswords();
  const storageKey = getAdminStorageKey(account.email);

  localStorage.setItem(
    ADMIN_PASSWORD_STORAGE_KEY,
    JSON.stringify({
      ...storedPasswords,
      [storageKey]: password,
    })
  );

  return true;
};

const validateAdminLogin = (email, password) => {
  if (!isAdminEmail(email)) {
    return {
      success: false,
      message: "This email is not authorized as an admin.",
    };
  }

  if (getAdminPassword(email) !== password) {
    return {
      success: false,
      message: "Invalid admin password.",
    };
  }

  return {
    success: true,
    message: "",
  };
};

const setAdminSession = (email) => {
  const account = getAdminAccount(email);

  if (!account) {
    return false;
  }

  localStorage.setItem(
    ADMIN_SESSION_STORAGE_KEY,
    JSON.stringify({
      email: normalizeEmail(account.email),
      loggedInAt: new Date().toISOString(),
    })
  );
  sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, normalizeEmail(account.email));

  return true;
};

const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  localStorage.removeItem("adminLoggedIn");
  sessionStorage.removeItem("adminLoggedIn");
  localStorage.removeItem("adminEmail");
  sessionStorage.removeItem("adminEmail");
};

export {
  ADMIN_ACCOUNTS,
  clearAdminSession,
  getAdminAccount,
  isAdminEmail,
  normalizeEmail,
  setAdminSession,
  setAdminPassword,
  validateAdminLogin,
};
