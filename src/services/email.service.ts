// Ported from nodejs-backend/src/services/email.service.ts
import nodemailer from 'nodemailer';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    private async getTransporter(): Promise<nodemailer.Transporter> {
        if (this.transporter) return this.transporter;

        if (process.env.SMTP_HOST) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        }

        return this.transporter;
    }

    async sendMail(to: string, subject: string, html: string) {
        const transport = await this.getTransporter();
        const info = await transport.sendMail({
            from: process.env.SMTP_FROM || '"ShopDEV" <noreply@shopdev.com>',
            to,
            subject,
            html,
        });

        if (!process.env.SMTP_HOST) {
            console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return info;
    }

    async sendOrderConfirmation(to: string, orderId: string, total: number) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Order Confirmed! 🎉</h2>
        <p>Your order <strong>#${orderId.slice(-8)}</strong> has been placed successfully.</p>
        <p style="font-size: 18px;">Total: <strong>$${total.toFixed(2)}</strong></p>
        <p>We'll notify you when your order ships.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">ShopDEV — Thank you for your purchase!</p>
      </div>
    `;
        return this.sendMail(to, `Order Confirmed #${orderId.slice(-8)}`, html);
    }

    async sendShippingUpdate(to: string, orderId: string, status: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Order Update 📦</h2>
        <p>Your order <strong>#${orderId.slice(-8)}</strong> status has been updated.</p>
        <p style="font-size: 16px;">New Status: <strong style="color: #4caf50;">${status.toUpperCase()}</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">ShopDEV — Thank you for your purchase!</p>
      </div>
    `;
        return this.sendMail(to, `Order #${orderId.slice(-8)} — ${status}`, html);
    }

    async sendPasswordReset(to: string, resetToken: string) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Password Reset 🔒</h2>
        <p>You requested a password reset. Click the button below to set a new password.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #1976d2; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `;
        return this.sendMail(to, 'Password Reset — ShopDEV', html);
    }

    async sendWelcome(to: string, name: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to ShopDEV! 🎊</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account has been created. Start exploring products and enjoy shopping!</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: #1976d2; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Start Shopping
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">ShopDEV Team</p>
      </div>
    `;
        return this.sendMail(to, 'Welcome to ShopDEV!', html);
    }

    async sendCancellation(to: string, orderId: string, reason: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Order Cancelled ❌</h2>
        <p>Your order <strong>#${orderId.slice(-8)}</strong> has been cancelled.</p>
        <p style="font-size: 16px;">Reason: <strong>${reason}</strong></p>
        <p>If you have any questions, please contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">ShopDEV — We're sorry to see this order go.</p>
      </div>
    `;
        return this.sendMail(to, `Order Cancelled #${orderId.slice(-8)}`, html);
    }
}

export default new EmailService();
