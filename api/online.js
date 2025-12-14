import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, age, phone, email, course, comment } = req.body;

  try {
    await resend.emails.send({
      from: "Rabbit IT <noreply@rabbit.academy>",
      to: ["student.online@rabbit.academy"],
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
