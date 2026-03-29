/**
 * TaskSentinel — Google Apps Script Monitor
 *
 * Setup:
 * 1. Create a new Google Apps Script project at script.google.com
 * 2. Paste this code into Code.gs
 * 3. Go to Project Settings → Script Properties
 * 4. Add: MONITOR_API_KEY = (your key from backend .env)
 * 5. Add: API_BASE = https://your-railway-app.up.railway.app/api
 * 6. Add: ALERT_EMAIL = your-email@gmail.com
 * 7. Create two time-driven triggers:
 *    - runMonitoringSweep → every 10 minutes
 *    - checkHealth → every 1 hour
 */

const CONFIG = {
  get API_BASE() {
    return PropertiesService.getScriptProperties().getProperty("API_BASE");
  },
  get API_KEY() {
    return PropertiesService.getScriptProperties().getProperty("MONITOR_API_KEY");
  },
  get ALERT_EMAIL() {
    return PropertiesService.getScriptProperties().getProperty("ALERT_EMAIL");
  },
};

/**
 * Main monitoring sweep — runs every 10 minutes.
 * Calls the backend to recalculate all task risk levels.
 * Sends email alerts if any tasks just turned critical (red).
 */
function runMonitoringSweep() {
  const options = {
    method: "post",
    headers: {
      "X-Monitor-Key": CONFIG.API_KEY,
      "Content-Type": "application/json",
    },
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(
      CONFIG.API_BASE + "/monitoring/sweep",
      options
    );
    const code = response.getResponseCode();
    const body = JSON.parse(response.getContentText());

    if (code === 200) {
      Logger.log(
        `Sweep complete: ${body.tasks_checked} checked, ${body.risks_changed} changed`
      );

      // Send email alerts for newly critical tasks
      if (body.email_alerts && body.email_alerts.length > 0) {
        sendAlertEmail(body.email_alerts);
      }
    } else {
      Logger.log(`Sweep failed: ${code} — ${response.getContentText()}`);
      sendErrorEmail("Sweep failed", `Status: ${code}\n${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log("Error calling sweep: " + e.message);
    sendErrorEmail("Sweep error", e.message);
  }
}

/**
 * Health check — runs every 1 hour.
 * Sends an email if the backend is unreachable.
 */
function checkHealth() {
  try {
    const response = UrlFetchApp.fetch(CONFIG.API_BASE + "/monitoring/health", {
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() !== 200) {
      sendErrorEmail(
        "Health check failed",
        `Status: ${response.getResponseCode()}\n${response.getContentText()}`
      );
    } else {
      Logger.log("Health check passed");
    }
  } catch (e) {
    sendErrorEmail("Backend unreachable", e.message);
  }
}

/**
 * Send email alert for critical tasks.
 */
function sendAlertEmail(alerts) {
  if (!CONFIG.ALERT_EMAIL) return;

  const subject = `TaskSentinel Alert: ${alerts.length} task(s) need attention`;
  const lines = alerts.map((a) => {
    let line = `• ${a.task_title} — ${a.reason}`;
    if (a.deadline) {
      line += ` (deadline: ${new Date(a.deadline).toLocaleString()})`;
    }
    return line;
  });

  const body = [
    "The following tasks have been flagged as critical:\n",
    ...lines,
    "\n—\nTaskSentinel Automated Monitor",
  ].join("\n");

  MailApp.sendEmail(CONFIG.ALERT_EMAIL, subject, body);
  Logger.log(`Alert email sent to ${CONFIG.ALERT_EMAIL} for ${alerts.length} tasks`);
}

/**
 * Send error notification email.
 */
function sendErrorEmail(title, details) {
  if (!CONFIG.ALERT_EMAIL) return;

  MailApp.sendEmail(
    CONFIG.ALERT_EMAIL,
    `TaskSentinel Error: ${title}`,
    `An error occurred in TaskSentinel monitoring:\n\n${details}\n\n—\nTaskSentinel Automated Monitor`
  );
}
