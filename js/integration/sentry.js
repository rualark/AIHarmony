import {enableKeys} from "../ui/commands.js";
import {environment, pageLoadTime, urlNoParams, mgen_login, mgen_name} from "../core/remote.js";
import {debugError} from "../core/debug.js";
import {state2url} from "../state/state.js";

window.showReportDialog = function(eventId) {
  try {
    enableKeys(false);
  } catch (e) {
    console.log(e);
  }
  console.log(eventId);
  Sentry.showReportDialog({eventId: eventId, user: {email: mgen_login, name: mgen_name}});
};

class Feedback extends Error {};

window.submitSentryUserFeedback = function(message){
  Sentry.captureMessage(message);
}

Sentry.init({
  dsn: 'https://ad05883cb9534743b6ca504ece76bba6@sentry.io/1894684',
  environment: environment,
  beforeSend(event, hint) {
    // Check if it is an exception, and if so, show the report dialog
    let now = new Date();
    if (event.exception && !debugError && (now - pageLoadTime > 5000)) {
      alertify.error(`Problem occured and was reported to site administrator. <a style='color: white' href=# onclick='window.showReportDialog("${event.event_id}"); return false;'><b><u>Сlick here</u></b></a> to add details and track this issue.`, 45);
    }
    // Send only in production environment
    if (event.exception && !environment.startsWith('prod')) {
      console.warn('Will not send error to sentry in environment', environment);
      return null;
    }
    try {
      event.breadcrumbs.push({
        timestamp: new Date(),
        category: 'state',
        message: urlNoParams() + '?state=' + state2url(),
        level: Sentry.Severity.Info
      });
    }
    catch (e) {
      console.log(e);
    }
    return event;
  }
});

if (mgen_login) {
  Sentry.configureScope((scope) => {
    scope.setUser({
      "email": mgen_login
    });
  });
}
