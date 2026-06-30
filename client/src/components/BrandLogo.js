import LOGO_URL from "../assets/logos/ai-chatbot-official-logo.png";

const BRAND_NAME = "AI Based Chatbot for Student Support";

const BrandLogo = ({
  className = "",
  imageClassName = "",
  variant = "icon",
  size = "medium",
  as: Component = "div",
  ...props
}) => {
  const showText = variant === "full";
  const classNames = [
    "brand-logo",
    `brand-logo--${variant}`,
    `brand-logo--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classNames} aria-label={BRAND_NAME} {...props}>
      <img
        src={LOGO_URL}
        alt=""
        aria-hidden="true"
        className={imageClassName}
        width="256"
        height="256"
      />
      {showText && <span>{BRAND_NAME}</span>}
    </Component>
  );
};

export { BRAND_NAME, LOGO_URL };
export default BrandLogo;
