import { FaArrowRight } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const pageFlow = [
  "/",
  "/home",
  "/about",
  "/contact",
  "/login",
  "/register",
  "/forget-password",
  "/verify",
  "/change-password",
  "/logout",
];

const NextButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const normalizedPath = location.pathname === "/welcome" ? "/" : location.pathname;
  const currentIndex = pageFlow.indexOf(normalizedPath);

  if (
    normalizedPath.startsWith("/admin") ||
    normalizedPath === "/search" ||
    normalizedPath === "/forget-password" ||
    normalizedPath === "/verify" ||
    normalizedPath === "/change-password"
  ) {
    return null;
  }

  const nextPath =
    currentIndex >= 0 && currentIndex < pageFlow.length - 1
      ? pageFlow[currentIndex + 1]
      : pageFlow[0];

  return (
    <button
      type="button"
      className="site-next-button"
      onClick={() => navigate(nextPath)}
      aria-label="Go to next page"
      title="Next"
    >
      <FaArrowRight />
    </button>
  );
};

export default NextButton;
