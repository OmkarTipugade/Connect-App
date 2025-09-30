import useLoginStore from "../../store/UseLoginStore";
import useUserStore from "../../store/UseUserStore";
import useThemeStore from "../../store/themeStore";
import contries from "../../utils/countries";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import logo from "../../assets/connect-logo.png";
import Spinner from "../../utils/Spinner";
import {
  sendOtp,
  updateUserProfile,
  verifyOtp,
} from "../../services/user.service";
import { toast } from "react-toastify";
import { FaArrowLeft, FaChevronDown } from "react-icons/fa";
const avatars = [
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe",
];

const Login = () => {
  const { step, setStep, userPhoneData, setUserPhoneData, resetLoginState } =
    useLoginStore();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();

  const [phoneno, setPhoneno] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(contries[0]);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [about, setAbout] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const ProgressBar = () => (
    <div
      className={`w-full bg-gray-200 rounded-full h-2 mb-4 ${
        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
      }`}
    >
      <div
        className="bg-red-500 h-full rounded-full duration-500 ease-in-out"
        style={{ width: `${(step / 3) * 100}%` }}
      />
    </div>
  );

  const onLoginSubmit = async () => {
    try {
      setLoading(true);
      if (email) {
        const response = await sendOtp(null, null, email);
        if (response.status === "success") {
          toast.success("OTP sent on your email");
          setUserPhoneData({ email });
          setStep(2);
        }
      } else {
        const response = await sendOtp(phoneno, selectedCountry.dialCode, null);
        if (response.status === "success") {
          toast.success("OTP sent on your phone number");
          setUserPhoneData({ phoneno, phoneSuffix: selectedCountry.dialCode });
          setStep(2);
        }
      }
    } catch (error) {
      console.log("Error when send otp", error?.message);
      setError(error?.message || "Failed to send otp");
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async () => {
    try {
      setError("");
      setLoading(true);
      if (!userPhoneData) {
        throw new Error("Phone number or email is Missing");
      }
      const OTP = otp.join("");
      let response;
      if (userPhoneData?.email) {
        response = await verifyOtp(OTP, null, null, userPhoneData.email);
      } else {
        response = await verifyOtp(
          OTP,
          userPhoneData.phoneno,
          userPhoneData.phoneSuffix
        );
      }
      if (response.status == "success") {
        toast.success("OTP is verified");
        const user = response.data?.user;
        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Wellcome back on Connect");
          navigate("/");
          resetLoginState();
        } else {
          setStep(3);
        }
      }
    } catch (error) {
      console.log("Error when verity otp", error?.message);
      setError(error?.message || "Failed to verify otp");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("agreed", data.agreed);
      if (profilePicture) {
        formData.append("media", profilePicture);
      } else {
        formData.append("media", selectedAvatar);
      }

      await updateUserProfile(formData);
      toast.success("Wellcome back on Connect");
      navigate("/");
      resetLoginState();
    } catch (error) {
      console.log("Error when update user profile", error?.message);
      setError(error?.message || "Failed to update user profile");
    } finally {
      setLoading(false);
    }
  };

  const hadleOtpInputBoxChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // allow only single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(new Array(6).fill(""));
    setError(null);
  };
  //validation schema
  const loginValidationSchema = yup
    .object()
    .shape({
      phoneno: yup
        .string()
        .nullable()
        .notRequired()
        .matches(/^[0-9]+$/, "Phone number must be only digits")
        .min(10, "Phone number must be at least 10 digits")
        .max(14, "Phone number must be at most 14 digits")
        .transform((value, originalValue) =>
          originalValue.trim() === "" ? null : value
        ),
      email: yup
        .string()
        .nullable()
        .notRequired()
        .email("Invalid email address, please enter valid email")
        .transform((value, originalValue) =>
          originalValue.trim() === "" ? null : value
        ),
    })
    .test(
      "emailOrPhone",
      "Either email or phone number is required",
      (value) => {
        return !!(value.phoneno || value.email);
      }
    );

  const otpValidationSchema = yup.object().shape({
    otp: yup.array().of(
      yup
        .string()
        .length(6, "OTP must be 6 digit")
        .required("OTP is required")
        .matches(/^[0-9]$/, "OTP must be a digit")
    ),
  });

  const profilesetupValidationSchema = yup.object().shape({
    username: yup.string().required("Username is required"),
    agreed: yup.boolean().oneOf([true], "You must agree to the terms"),
    name: yup.string().required("Name is required"),
    about: yup.string().max(100, "About must be at most 100 characters"),
  });

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  });

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm({
    resolver: yupResolver(otpValidationSchema),
  });

  const {
    register: profilesetupRegister,
    handleSubmit: handleProfilesetupSubmit,
    formState: { errors: profilesetupErrors },
    watch,
  } = useForm({
    resolver: yupResolver(profilesetupValidationSchema),
  });
  const filteredCountries = contries.filter((country) =>
    country.name
      .toLowerCase()
      .includes(
        searchTerm.toLowerCase() || country.dialCode.includes(searchTerm)
      )
  );
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`flex flex-col items-center justify-center p-6 md:p-8 rounded-lg shadow-md ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        } w-full max-w-md`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="w-24 h-24 flex items-center justify-center mb-8"
        >
          <img src={logo} alt="logo" className="w-16 h-16 rounded-xl" />
        </motion.div>

        <h1
          className={`text-2xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          } `}
        >
          Connect App
        </h1>
        <ProgressBar />
        {error && <p className={`text-red-500 text-sm mb-4`}>{error}</p>}

        {/* step 1 */}
        {step === 1 && (
          <form
            onSubmit={handleLoginSubmit(onLoginSubmit)}
            className={`space-y-4`}
          >
            <p
              className={`text-sm ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } `}
            >
              Enter your Phone Number:
            </p>
            <div className="relative">
              <div className="flex">
                <div className="relative w-1/3">
                  <button
                    type="button"
                    className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm text-center font-medium ${
                      theme === "dark" ? "bg-gray-700" : "bg-white"
                    } rounded-s-lg border hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200`}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <span className="flex justify-center items-center">
                      {selectedCountry.flag} {selectedCountry.dialCode}
                    </span>
                    <FaChevronDown className="w-4 h-4" />
                  </button>
                  {showDropdown && (
                    <div
                      className={`absolute z-10 bg-white rounded-b-lg shadow-lg ${
                        theme === "dark"
                          ? "bg-gray-700 border border-gray-600"
                          : "bg-white border border-gray-200"
                      } border rounded-md shadow-lg max-h-60 overflow-auto`}
                    >
                      <div
                        className={`sticky top-0 ${
                          theme === "dark" ? "bg-gray-700" : "bg-white"
                        } p-2`}
                      >
                        <input
                          type="text"
                          placeholder="Search countries..."
                          onChange={(e) => setSearchTerm(e.target.value)}
                          value={searchTerm}
                          className={`w-full px-2 py-1 border ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-200"
                          } rounded-md text-sm focus:outline-none focus:ring-red-500 focus:right-2`}
                        />
                      </div>
                      {filteredCountries.map((country) => (
                        <button
                          key={country.alpha2}
                          type="button"
                          className={`w-full text-left px-2 py-1 ${
                            theme === "dark"
                              ? "hover:bg-gray-600"
                              : "hover:bg-gray-200"
                          } focus:outline-none focus:bg-gray-100`}
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowDropdown(!showDropdown);
                          }}
                        >
                          {country.flag} {country.dialCode} {country.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  {...loginRegister("phoneno")}
                  value={phoneno}
                  placeholder="Phone Number"
                  onChange={(e) => setPhoneno(e.target.value)}
                  className={`w-2/3 px-4 py-2 border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  } rounded-md focus:outline-none focus:ring-red-500 focus:right-2 ${
                    loginErrors.phoneno && "border-red-500"
                  }`}
                />
              </div>
              {loginErrors.phoneno && (
                <p className="text-red-500 text-xs">
                  {loginErrors.phoneno.message}
                </p>
              )}
            </div>

            {/* Divide with OR */}
            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-200" />
              <span className="mx-2 text-gray-400 text-sm font-medium">OR</span>
              <div className="flex-grow h-px bg-gray-200" />
            </div>

            {/* Email input */}
            <div>
              <input
                type="email"
                {...loginRegister("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`w-full px-4 py-2 border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                } rounded-md focus:outline-none focus:ring-red-500 focus:right-2 ${
                  loginErrors.email && "border-red-500"
                }`}
              />
              {loginErrors.email && (
                <p className="text-red-500 text-xs">
                  {loginErrors.email.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              {loading ? <Spinner /> : "Get OTP"}
            </button>
          </form>
        )}

        {/* step 2 */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
            <p
              className={`text-sm ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } `}
            >
              Please enter the 6-digit OTP sent to your{" "}
              {userPhoneData ? userPhoneData.phoneSuffix : "email "}{" "}
              {userPhoneData.phoneno && userPhoneData?.phoneno}
            </p>
            <div className="flex justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  maxLength={1}
                  onChange={(e) =>
                    hadleOtpInputBoxChange(index, e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      const prevInput = document.getElementById(
                        `otp-${index - 1}`
                      );
                      if (prevInput) prevInput.focus();
                    }
                  }}
                  className="w-12 h-12 text-center border rounded-md"
                />
              ))}
            </div>

            {otpErrors.otp && (
              <p className="text-red-500 text-xs">{otpErrors.otp.message}</p>
            )}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              {loading ? <Spinner /> : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className={`w-full mt-2 ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-700"
              } py-2 rounded-md transition flex items-center justify-center`}
            >
              <FaArrowLeft className="mr-2" />
              Go Back
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
