const nodemailer = require("nodemailer");
const db = require("../config/db");

// ============ CONFIGURATION EMAIL ============

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ============ ENVOI EMAIL ============

exports.sendEmail = async (email, subject, html) => {
  if (!process.env.EMAIL_USER) {
    console.warn("⚠️  Email non configuré (EMAIL_USER manquant)");
    return { success: false, message: "Email non configuré" };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error.message);
    return { success: false, error: error.message };
  }
};

// ============ ENVOI SMS (Twilio) ============

const twilio = require("twilio");

const twilioClient = process.env.TWILIO_ACCOUNT_SID
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

exports.sendSMS = async (phone, message) => {
  if (!twilioClient) {
    console.warn("⚠️  SMS non configuré (TWILIO_* manquant)");
    return { success: false, message: "SMS non configuré" };
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi SMS:", error.message);
    return { success: false, error: error.message };
  }
};

// ============ NOTIFICATIONS AUTOMATIQUES ============

/**
 * Notifier client que son ticket est appelé
 */
exports.notifyTicketCalled = async (ticketId, io) => {
  try {
    const [[ticket]] = await db.query(
      `SELECT t.*, s.name as service_name, s.prefix
       FROM tickets t 
       JOIN services s ON t.service_id = s.id
       WHERE t.id = ?`,
      [ticketId]
    );

    if (!ticket) return;

    const subject = `Votre ticket ${ticket.number} est appelé!`;
    const html = `
      <h2>Votre tour est arrivé!</h2>
      <p>Service: <strong>${ticket.service_name}</strong></p>
      <p>Numéro: <strong>${ticket.number}</strong></p>
      <p>Guichet: <strong>${ticket.counter || "À confirmer"}</strong></p>
      <p>⏱️ Veuillez vous présenter immédiatement</p>
    `;

    const smsMessage = `BANQUE: Votre ticket ${ticket.number} est appelé! Service: ${ticket.service_name}. Guichet: ${ticket.counter || "À confirmer"}`;

    // Email
    if (ticket.email) {
      await exports.sendEmail(ticket.email, subject, html);
      await db.query(
        `INSERT INTO notifications (ticket_id, type, status, message) 
         VALUES (?, 'email', 'sent', ?)`,
        [ticketId, subject]
      );
    }

    // SMS
    if (ticket.phone) {
      await exports.sendSMS(ticket.phone, smsMessage);
      await db.query(
        `INSERT INTO notifications (ticket_id, type, status, message) 
         VALUES (?, 'sms', 'sent', ?)`,
        [ticketId, smsMessage]
      );
    }

    // Notification push via WebSocket
    io.to(`customer_${ticket.id}`).emit("ticket:called", {
      ticket_number: ticket.number,
      counter: ticket.counter,
      service: ticket.service_name,
    });

  } catch (error) {
    console.error("Erreur notification appelé:", error);
  }
};

/**
 * Notifier client de temps d'attente estimé
 */
exports.notifyEstimatedWait = async (ticketId, estimatedMinutes, io) => {
  try {
    const [[ticket]] = await db.query(
      "SELECT * FROM tickets WHERE id=?",
      [ticketId]
    );

    if (!ticket || !ticket.email) return;

    const subject = "Estimation temps d'attente";
    const html = `
      <h2>Estimation de votre attente</h2>
      <p>Ticket: <strong>${ticket.number}</strong></p>
      <p>Temps estimé: <strong>${estimatedMinutes} minutes</strong></p>
      <p>💡 Vous pouvez quitter et nous reviendrez quand votre tour approche</p>
    `;

    await exports.sendEmail(ticket.email, subject, html);

  } catch (error) {
    console.error("Erreur notification attente:", error);
  }
};

/**
 * Notifier agent qu'un ticket l'est assigné
 */
exports.notifyAgentAssignment = async (ticketId, agentId, io) => {
  try {
    const [[ticket]] = await db.query(
      "SELECT * FROM tickets WHERE id=?",
      [ticketId]
    );

    if (!ticket) return;

    io.to(`agent_${agentId}`).emit("ticket:assigned_to_you", {
      ticket_id: ticketId,
      ticket_number: ticket.number,
      customer_type: ticket.customer_type,
      visit_purpose: ticket.visit_purpose,
      priority: "URGENT" in ["urgent", "vip"].includes(ticket.customer_type) ? "🔴 URGENT" : "",
    });

  } catch (error) {
    console.error("Erreur notification agent:", error);
  }
};

/**
 * Notifier client de son absence
 */
exports.notifyNoShow = async (ticketId, io) => {
  try {
    const [[ticket]] = await db.query(
      "SELECT * FROM tickets WHERE id=?",
      [ticketId]
    );

    if (!ticket || !ticket.email) return;

    const subject = "Vous avez manqué votre rendez-vous";
    const html = `
      <h2>Rendez-vous manqué</h2>
      <p>Ticket: <strong>${ticket.number}</strong></p>
      <p>⚠️ Vous n'avez pas répondu à l'appel de votre numéro.</p>
      <p>Pour reprendre un rendez-vous, veuillez vous présenter à l'accueil.</p>
    `;

    await exports.sendEmail(ticket.email, subject, html);

    // SMS
    if (ticket.phone) {
      const smsMessage = `BANQUE: Ticket ${ticket.number} annulé (absence). Veuillez vous présenter à l'accueil pour nouveau rendez-vous.`;
      await exports.sendSMS(ticket.phone, smsMessage);
    }

  } catch (error) {
    console.error("Erreur notification absence:", error);
  }
};

/**
 * Demander feedback du client
 */
exports.requestFeedback = async (ticketId, io) => {
  try {
    const [[ticket]] = await db.query(
      `SELECT t.*, s.name as service_name
       FROM tickets t 
       JOIN services s ON t.service_id = s.id
       WHERE t.id=?`,
      [ticketId]
    );

    if (!ticket || !ticket.email) return;

    const subject = "Votre avis nous interesse! 📋";
    const feedbackLink = `${process.env.FRONTEND_URL}/feedback/${ticket.id}`;

    const html = `
      <h2>Merci d'avoir utilisé nos services</h2>
      <p>Ticket: ${ticket.number}</p>
      <p>Votre avis nous aidera à améliorer nos services.</p>
      <p><a href="${feedbackLink}" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Donner votre avis</a></p>
      <p style="font-size:12px;color:#666;">Ou copiez ce lien: ${feedbackLink}</p>
    `;

    await exports.sendEmail(ticket.email, subject, html);

  } catch (error) {
    console.error("Erreur demande feedback:", error);
  }
};

/**
 * Alerter admin si queue trop longue
 */
exports.alertLongQueue = async (serviceId, queueLength, io) => {
  try {
    if (queueLength < 10) return; // Seuil d'alerte

    const [[service, users]] = await db.query(
      `SELECT s.id, s.name FROM services s WHERE s.id=?;
       SELECT id, email FROM users WHERE role='admin'`,
      [serviceId]
    );

    if (!service || !users.length) return;

    const subject = `⚠️ Queue très longue - ${service[0].name}`;
    const html = `
      <h2>Alerte Queue Longue</h2>
      <p>Service: <strong>${service[0].name}</strong></p>
      <p>Tickets en attente: <strong>${queueLength}</strong></p>
      <p>Action recommandée: Vérifier les effectifs ou réduire services</p>
    `;

    for (const admin of users) {
      await exports.sendEmail(admin.email, subject, html);
    }

    io.to("admin").emit("alert:long_queue", { service_id: serviceId, queue_length: queueLength });

  } catch (error) {
    console.error("Erreur alerte queue:", error);
  }
};

/**
 * Nettoyage automatique - Notifier clients sur notification en attente
 */
exports.processPendingNotifications = async (io) => {
  try {
    const [pending] = await db.query(
      `SELECT * FROM notifications WHERE status='pending' 
       AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
       LIMIT 50`
    );

    for (const notif of pending) {
      const result = notif.type === "email"
        ? await exports.sendEmail(notif.recipient_email, notif.subject, notif.message)
        : await exports.sendSMS(notif.recipient_phone, notif.message);

      if (result.success) {
        await db.query(
          "UPDATE notifications SET status='sent', sent_at=NOW() WHERE id=?",
          [notif.id]
        );
      } else {
        await db.query(
          "UPDATE notifications SET status='failed' WHERE id=?",
          [notif.id]
        );
      }
    }
  } catch (error) {
    console.error("Erreur traitement notifications:", error);
  }
};

module.exports = exports;
