import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Otp.css';
import axios from "axios";
import { useLocation } from 'react-router-dom';

const Otp = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const location = useLocation();
  const { type, userData } = location.state || {};
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
  if (!type || !userData) {
    navigate('/login');
  }
}, [type, userData, navigate]);

useEffect(() => {
  if (resendTimer > 0) {
    const timer = setTimeout(() => {
      setResendTimer(resendTimer - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [resendTimer]);


  useEffect(() => {
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    
    // Focus the last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  const otpValue = otp.join('');

  if (otpValue.length !== 6) {
    alert("Please enter complete 6-digit OTP");
    return;
  }

  setIsVerifying(true);

   try {
  let response;

  if (type === "register") {
    response = await axios.post("/api/auth/register/verify-otp", {
      name: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role.toUpperCase(),
      otp: otpValue
    });

    if (response.data === "Registration successful") {
      if (userData?.role) {
        localStorage.setItem("role", String(userData.role).toLowerCase());
      }
      localStorage.setItem("medvaultProfile", JSON.stringify(userData));
      alert("Registration successful!");
      navigate("/login");
    } else {
      alert(response.data);
    }

  } else if (type === "login") {
    response = await axios.post("/api/auth/login/verify-otp", {
      email: userData.email,
      otp: otpValue
    });

    if (response.data?.token) {
  localStorage.setItem("token", response.data.token);
  localStorage.setItem("role", String(response.data.role || "").toLowerCase());
  localStorage.setItem("userName", response.data.name || "");
  localStorage.setItem("userEmail", response.data.email || userData.email || "");
  navigate("/dashboard");
} else {
  alert("Login failed");
}
  } else if (type === "reset") {
    response = await axios.post("/api/auth/forgot-password/verify-otp", {
      email: userData.email,
      otp: otpValue
    });

    if (response.data === "OTP verified") {
      localStorage.setItem("resetEmail", userData.email);
      navigate("/set-password", {
        state: {
          email: userData.email
        }
      });
    } else {
      alert(response.data);
    }
  }

} catch (error) {
  console.error("OTP verification failed:", error.response?.data || error.message);
  alert(error.response?.data || "Invalid OTP");

  // 🔥 Clear OTP fields
  setOtp(['', '', '', '', '', '']);
  inputRefs.current[0]?.focus();
}finally {
    setIsVerifying(false); // 🔥 THIS FIXES YOUR ISSUE
  }

 }


  const handleResend = async () => {
  try {

    setIsVerifying(true);

    if (type === "register") {
      await axios.post("/api/auth/register/request-otp", {
        email: userData.email
      });
    } 
    else if (type === "login") {
      await axios.post("/api/auth/login/resend-otp", {
        email: userData.email
      });
    } 
    else if (type === "reset") {
      await axios.post("/api/auth/forgot-password/request-otp", {
        email: userData.email
      });
    }

    alert("OTP sent successfully!");
    setResendTimer(30);

    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();

  } catch (error) {
    console.error("Resend OTP failed:", error.response?.data || error.message);
    alert(error.response?.data || "Failed to resend OTP");
  } finally {
    setIsVerifying(false);
  }
};


  return (
    <div className="otp-container">
      <div className="medical-bg">
        <div className="pulse-circle"></div>
        <div className="pulse-circle"></div>
      </div>

      <div className="otp-card">
        <div className="otp-header">
          <div className="verification-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="otp-title">Verify Your Email</h1>
          <p className="otp-subtitle">
            We've sent a 6-digit verification code to your email.
            <br />
            Please enter it below to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                disabled={isVerifying}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className={`verify-btn ${isVerifying ? 'verifying' : ''}`}
            disabled={otp.some(d => !d) || isVerifying}
          >
            {isVerifying ? (
              <>
                <div className="spinner"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Continue</span>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>

          <div className="otp-footer">
            <p>Didn't receive the code?</p>
            <button
  type="button"
  onClick={handleResend}
  disabled={resendTimer > 0}
  className="resend-btn"
>
  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
</button>

          </div>
        </form>

        <div className="security-note">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Your data is protected with end-to-end encryption</span>
        </div>
      </div>
    </div>
  );
};

export default Otp;
