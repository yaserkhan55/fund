export const verifyEmailOtp = async (req, res) => {
    try {
      const { email, otp } = req.body;
  
      const validOtp = await EmailOtp.findOne({ email, otp });
  
      if (!validOtp)
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired OTP" });
  
      let user = await User.findOne({ email });
  
      if (!user) {
        user = await User.create({
          name: email.split("@")[0],
          email,
        });
      }
  
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
  
      // Delete OTP after verification
      await EmailOtp.deleteOne({ email });
  
      return res.json({
        success: true,
        message: "Login success",
        token,
        user,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Verification error",
        error: err.message,
      });
    }
  };
  