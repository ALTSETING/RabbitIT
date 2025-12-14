import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    name,
    age,
    phone,
    email,
    course,
    comment
  } = req.body;

  const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, 
  },
});


  try {
    await transporter.sendMail({
      from: `"Rabbit IT" <${process.env.EMAIL_USER}>`,
      to: "student.online@rabbit.academy",
      subject: "🐇 Нова ОНЛАЙН-заявка — Rabbit IT",
      html: `
        <h2>Нова онлайн-заявка</h2>
        <p><b>Імʼя:</b> ${name}</p>
        <p><b>Вік:</b> ${age}</p>
        <p><b>Телефон:</b> ${phone}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Курс:</b> ${course}</p>
        <p><b>Коментар:</b><br>${comment || "-"}</p>
      `,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
}
