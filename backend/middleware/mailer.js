import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendAccountEmail = async (userEmail, nama_lengkap, nis, password) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Kode 16 digit, bukan password email biasa
    },
  });

  // const mailOptions = {
  //   from: `"Admin Portal Tryout TKA" <${process.env.EMAIL_USER}>`,
  //   to: userEmail,
  //   subject: "Akun Login Tryout TKA",
  //   html: `
  //     <div style="font-family: sans-serif; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px;">
  //       <h2 style="color: #059669;">Halo, Peserta Tryout! 👋</h2>
  //       <p>Akun kamu telah berhasil dibuat. Berikut adalah detail login untuk masuk ke dashboard:</p>
  //       <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
  //         <p><strong>Username (NISN):</strong> ${nis}</p>
  //         <p><strong>Password:</strong> ${password}</p>
  //       </div>
  //       <p>Silakan login melalui website resmi kami di https://smadipotryout.my.id</p>
  //       <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
  //       <small style="color: #6b7280;">Jika kamu merasa tidak mendaftar, abaikan email ini.</small>
  //     </div>
  //   `,
  // };
  // return transporter.sendMail(mailOptions);

  const mailOptions = {
    from: `"Portal Try Out TKA" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Konfirmasi Akun & Grup Koordinasi Try Out TKA 🚀",
    html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; color: #1e293b;">
      <h2 style="color: #059669; text-align: center; margin-bottom: 20px;">Selamat, Pendaftaran Berhasil! 🎉</h2>
      
      <p>Halo, <strong>${nama_lengkap}</strong>.</p>
      <p>Akun kamu sudah aktif dan siap digunakan untuk simulasi ujian. Berikut adalah detail login kamu:</p>
      
      <div style="background: #f0fdf4; border: 1px dashed #10b981; padding: 15px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Username (NISN):</strong> <span style="color: #059669;">${nis}</span></p>
        <p style="margin: 5px 0;"><strong>Password:</strong> <span style="color: #059669;">${password}</span></p>
      </div>

      <div style="margin-top: 30px;">
        <p style="font-weight: bold; margin-bottom: 10px;">Langkah Selanjutnya:</p>
        
        <div style="margin-bottom: 15px;">
          <a href="https://smadipotryout.my.id" 
             style="display: block; text-align: center; background: #059669; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold;">
             🌐 Masuk ke Dashboard Ujian
          </a>
        </div>

        <div style="margin-bottom: 25px;">
          <a href="https://chat.whatsapp.com/KtqrCTGatsIJ9EY38EyLQW" 
             style="display: block; text-align: center; background: #25d366; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold;">
             💬 Gabung Grup Koordinasi Siswa
          </a>
          <p style="font-size: 11px; color: #64748b; margin-top: 5px; text-align: center;">
            *Wajib join grup agar tidak ketinggalan info jadwal dan teknis.
          </p>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
      
      <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
        Build with 💙 by <strong>SMA Diponegoro Tulungagung</strong><br/>
        Jl. Jaksa Agung Suprapto No. 8, Kampungdalem, Kec. Tulungagung, Kab. Tulungagung, Jawa Timur<br/>
        <br/>
        <em style="font-size: 10px;">Email ini dikirim otomatis oleh sistem, mohon tidak membalas.</em>
      </p>
    </div>
  `,
  };

  return transporter.sendMail(mailOptions);
};

export default sendAccountEmail;
