import crypto from 'crypto';
export class OrderOtpService {
    session;
    constructor(session) {
        this.session = session;
    }
    generateOTP(length = 6) {
        return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
    }
    sendOTP({ email }) {
        const otp = this.generateOTP();
        const expirationTime = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
        // Store OTP and expiration in session
        this.session.OrderOTP = otp;
        this.session.OrderotpExpiration = expirationTime;
        this.session.OrderEmail = email;
        console.log(`Generated OTP: ${otp}`); // For testing. Replace with actual sending logic in production
        return otp;
    }
    validateOTP(inputOtp, email) {
        const { OrderOTP, OrderotpExpiration, OrderEmail } = this.session;
        if (OrderEmail !== email) {
            return { success: false, message: "OTP not requested for this email" };
        }
        if (!OrderOTP || !OrderotpExpiration) {
            return { success: false, message: "OTP not requested or expired" };
        }
        if (Date.now() > OrderotpExpiration) {
            this.clearOTP();
            return { success: false, message: "OTP expired" };
        }
        if (OrderOTP !== inputOtp) {
            return { success: false, message: "Invalid OTP" };
        }
        this.clearOTP();
        return { success: true, message: "OTP verified successfully" };
    }
    clearOTP() {
        this.session.OrderOTP = undefined;
        this.session.OrderotpExpiration = undefined;
        this.session.OrderEmail = undefined;
    }
}
