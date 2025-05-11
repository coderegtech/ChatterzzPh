const Button = ({ onPress, bwith, bgColor, textSize, textColor, children }) => {
  return (
    <div
      onClick={onPress}
      className={`${bwith || "w-full"} ${
        bgColor || "bg-blue-500"
      } rounded-lg px-6 py-2 text-center`}
    >
      <p className={`${textColor || "text-white"} text-base font-medium`}>
        {children}
      </p>
    </div>
  );
};

export default Button;
