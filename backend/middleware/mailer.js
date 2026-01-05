import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendAccountEmail = async (userEmail, nis, password) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Kode 16 digit, bukan password email biasa
    },
  });

  const mailOptions = {
    from: `"Admin Portal Tryout TKA" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Akun Login Tryout TKA",
    html: `
      <div style="font-family: sans-serif; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px;">
        <h2 style="color: #059669;">Halo, Peserta Tryout! 👋</h2>
        <p>Akun kamu telah berhasil dibuat. Berikut adalah detail login untuk masuk ke dashboard:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Username (NISN):</strong> ${nis}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>Silakan login melalui website resmi kami di https://smadipotryout.my.id</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <small style="color: #6b7280;">Jika kamu merasa tidak mendaftar, abaikan email ini.</small>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export default sendAccountEmail;
